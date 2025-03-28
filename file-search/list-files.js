import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-testing'
});

const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;

const response = await openai.vectorStores.files.list(vectorStoreId);
console.log('response:', JSON.stringify(response, null, 2));
