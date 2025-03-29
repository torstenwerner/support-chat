import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-testing'
});

const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;

const query = "Was sind die neuesten beA-Nachrichten?";

const response = await openai.vectorStores.search(vectorStoreId, { query });
const averageScore = response.body.data.reduce((sum, item) => sum + item.score, 0) / response.body.data.length;
const files = response.body.data.map(item => ({
    filename: item.filename,
    score: item.score,
    relativeScore: item.score / averageScore
}));
console.log(JSON.stringify(files, null, 2));
// console.log(`average score: ${averageScore}`);
