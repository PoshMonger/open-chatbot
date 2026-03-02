import { OpenAI } from "openai";
import { DataAPIClient } from "@datastax/astra-db-ts";

const {
  ASTRA_DB_KEYSPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
} = process.env;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const astraClient = new DataAPIClient();
const db = astraClient.db(ASTRA_API_ENDPOINT as string, {
  token: ASTRA_DB_APPLICATION_TOKEN as string,
});

function getTextFromMessage(msg: {
  content?: string;
  parts?: Array<{ type: string; text?: string }>;
}): string {
  if (typeof msg?.content === "string") return msg.content;
  const parts = msg?.parts ?? [];
  return parts
    .filter((p) => p.type === "text" && p.text != null)
    .map((p) => p.text)
    .join("");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const lastMsg = messages[messages.length - 1];
    const latestMessage = lastMsg ? getTextFromMessage(lastMsg) : "";

    if (!latestMessage?.trim()) {
      return new Response("Message required", { status: 400 });
    }

    let docContext = "";
    const embedding = await openai.embeddings.create({
      input: latestMessage,
      model: "text-embedding-3-small",
      encoding_format: "float",
    });

    try {
      const collection = await db.collection(ASTRA_DB_COLLECTION as string);
      const cursor = collection.find(
        {},
        {
          sort: { $vector: embedding.data[0].embedding },
          limit: 10,
        },
      );
      const documents = (await cursor.toArray()) as Array<{ content?: string }>;
      docContext = documents.map((doc) => doc.content ?? "").join("\n\n");
    } catch (error) {
      console.error("Astra vector search:", error);
      // continue without context rather than failing
    }

    const systemContent = `You are a helpful assistant. Answer based on the context below when relevant.

START CONTEXT
${docContext || "(No context retrieved)"}
END CONTEXT

QUESTION: ${latestMessage}`;

    const openAiMessages = messages
      .map(
        (msg: {
          role: string;
          content?: string;
          parts?: Array<{ type: string; text?: string }>;
        }) => ({
          role: msg.role as "user" | "assistant" | "system",
          content: getTextFromMessage(msg),
        }),
      )
      .filter((m: { content: string }) => m.content.length > 0);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemContent }, ...openAiMessages],
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of response) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) controller.enqueue(encoder.encode(text));
          }
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
