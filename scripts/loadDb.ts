import {DataApiClient} from "@datastax/astra-db-ts";
import {PupeteerWebBaseLoader} from "langchain/document_loaders/web/puppeteer";
import OpenAI from "openai";
import {RecursiveCharacterTextSplitter} from "langchain/text_splitter";

import "dotenv/config";

const astraClient = new DataApiClient({
    applicationToken: process.env.ASTRA_DB_APPLICATION_TOKEN,
    databaseId: process.env.ASTRA_DB_ID,
    databaseRegion: process.env.ASTRA_DB_REGION,
});

const loader = new PupeteerWebBaseLoader("https://www.google.com");
const docs = await loader.load();

console.log(docs);