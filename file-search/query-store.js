import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-testing'
});

const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;

const query = "Welche Änderungen gab es im letzten Update?";

const response = await openai.vectorStores.search(vectorStoreId, { query });
const files = response.body.data.map(item => ({ filename: item.filename, score: item.score }));
console.log(JSON.stringify(files, null, 2));
