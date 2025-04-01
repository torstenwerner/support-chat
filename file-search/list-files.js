import OpenAI from 'openai';
import dotenv from 'dotenv';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const envFile = resolve(scriptDirectory, '..', '.env');
dotenv.config({path: envFile});
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-testing'
});

const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;

const storeResponse = await openai.vectorStores.files.list(vectorStoreId);
const fileIds = storeResponse.data.map(item => item.id);

const filenames = await Promise.all(fileIds.map(async fileId => {
    const fileResponse = await openai.files.retrieve(fileId);
    return fileResponse.filename;
}));
console.log(filenames);
