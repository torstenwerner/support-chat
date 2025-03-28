import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-testing'
});

const vector_store = await openai.vectorStores.create({
    name: "support-chat",
});

console.log('Vector store created with id:', vector_store.id);
