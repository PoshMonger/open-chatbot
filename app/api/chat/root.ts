import { OpenAI } from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
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
  namespace: ASTRA_DB_KEYSPACE as string,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1]?.content;

    let docContext = "";
    const embedding = await openai.embeddings.create({
      input: latestMessage,
      model: "text-embedding-3-small",
      encoding_format: "float",
    });
    try {
      const collection = await db.collection(ASTRA_DB_COLLECTION as string);
      const cursor = collection.find(null, {
        sort: {
          $vector: embedding.data[0].embedding,
        },
        limit: 10,
      });
      const documents = cursor.toArray();
      const docsMap = documents?.map((doc) => doc.text);
      docContext = JSON.stringify(docsMap);
    } catch (error) {
      console.error(error);
      return new Response("Internal Server Error", { status: 500 });
    }

    const template = {
      role: "system",
      content: `
        You are a helpful assistant that can answer questions about the following context:
        {context}
        The user's question is:
        {question}
        Answer the question based on the context.

        START CONTEXT
        ${docContext}
        END CONTEXT

        QUESTION: ${latestMessage}
        `,
    };

    const response = await open.chat.completions.create({
      model: "gpt-4",
      messages: [template, ...messages],
      stream: true,
    });
    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
