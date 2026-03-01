import { DataAPIClient } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import OpenAI from "openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { generalLongevity } from "../app/trainingURLs/generalLongevity";
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
  for await (const url of urls) {
    const content = await scrapePage(url);
    const chunks = await splitter.splitText(content);
    for await (const chunk of chunks) {
      const embedding = await openai.embeddings.create({
        input: chunk,
        model: "text-embedding-3-small",
      });
      const vector = embedding.data[0].embedding;
      const res = await collection.insertOne({
        content: chunk,
      });
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

createCollection().then(() => loadSampleData());