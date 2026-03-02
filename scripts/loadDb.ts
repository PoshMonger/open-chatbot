import { DataAPIClient } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import OpenAI from "openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { generalLongevity } from "./trainingURLs/generalLongevity";
import "dotenv/config";
type SimilarityMetric = "cosine" | "dot_product" | "euclidean";
const {
  ASTRA_DB_KEYSPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
} = process.env;

//openai
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY as string,
});

//urls to scrape
let urls = generalLongevity;

//db
const astraClient = new DataAPIClient();
const db = astraClient.db(ASTRA_API_ENDPOINT as string, {
  token: ASTRA_DB_APPLICATION_TOKEN as string,
});

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

const EMBED_RETRIES = 3;
const EMBED_DELAY_MS = 800;
const EMBED_BATCH_SIZE = 25;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isOpenAIErr(
  err: unknown,
  code: string,
): err is { status?: number; code?: string; message?: string } {
  return (
    err != null &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code?: string }).code === code
  );
}
function getStatus(err: unknown): number | undefined {
  return err != null && typeof err === "object" && "status" in err
    ? (err as { status?: number }).status
    : undefined;
}

async function checkOpenAIAccess(): Promise<void> {
  try {
    await openai.embeddings.create({
      input: "ping",
      model: "text-embedding-3-small",
    });
    console.log("OpenAI: key OK, proceeding.");
  } catch (err: unknown) {
    if (isOpenAIErr(err, "invalid_api_key")) {
      console.error(
        "OpenAI: invalid API key. Check OPENAI_API_KEY in .env and create a key at https://platform.openai.com/api-keys",
      );
    } else if (isOpenAIErr(err, "insufficient_quota")) {
      console.error(
        "OpenAI: no quota. Use the same account/org that has credits: https://platform.openai.com/account/billing",
      );
    } else {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("OpenAI preflight failed:", msg);
    }
    process.exit(1);
  }
}

async function embedWithRetry(inputs: string[]): Promise<number[][]> {
  if (inputs.length === 0) return [];
  for (let attempt = 1; attempt <= EMBED_RETRIES; attempt++) {
    try {
      const res = await openai.embeddings.create({
        input: inputs,
        model: "text-embedding-3-small",
      });
      res.data.sort((a, b) => a.index - b.index);
      return res.data.map((d) => d.embedding);
    } catch (err: unknown) {
      const status = getStatus(err);
      const is429 = status === 429;
      const isQuota = isOpenAIErr(err, "insufficient_quota");
      if ((is429 || isQuota) && attempt < EMBED_RETRIES) {
        const wait = EMBED_DELAY_MS * Math.pow(2, attempt - 1);
        console.warn(
          `OpenAI 429/quota. Retry ${attempt}/${EMBED_RETRIES} in ${wait}ms...`,
        );
        await sleep(wait);
        continue;
      }
      if (isQuota) {
        console.error(
          "OpenAI quota exceeded. Same key as account with credits? https://platform.openai.com/account/billing",
        );
        process.exit(1);
      }
      throw err;
    }
  }
  throw new Error("Embedding failed after retries");
}

const createCollection = async (
  similarityMetric: SimilarityMetric = "dot_product",
) => {
  const res = await db.createCollection(ASTRA_DB_COLLECTION as string, {
    vector: {
      dimension: 1536,
      metric: similarityMetric,
    },
  });
};

const loadSampleData = async () => {
  const collection = await db.collection(ASTRA_DB_COLLECTION as string);
  for (const url of urls) {
    const content = await scrapePage(url);
    const chunks = await splitter.splitText(content);
    for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
      const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
      const vectors = await embedWithRetry(batch);
      for (let j = 0; j < batch.length; j++) {
        await collection.insertOne({
          content: batch[j],
          $vector: vectors[j],
        });
      }
      await sleep(EMBED_DELAY_MS);
    }
  }
};

const scrapePage = async (url: string) => {
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: {
      headless: true,
    },
    gotoOptions: {
      waitUntil: "domcontentloaded",
    },
    evaluate: async (page, browser) => {
      const result = await page.evaluate(() => document.body.innerHTML);
      await browser.close();
      return result;
    },
  });
  return (await loader.scrape())?.replace(/<[^>]*>?/gm, "");
};

checkOpenAIAccess()
  .then(() => createCollection())
  .then(() => loadSampleData())
  .then(() => console.log("Seed done."))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });