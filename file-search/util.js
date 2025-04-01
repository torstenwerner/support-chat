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

/**
 * Fetches all file ids of the vector store.
 * @returns {Promise<string[]>}
 */
export async function fetchFileIds() {
    const storeResponse = await openai.vectorStores.files.list(vectorStoreId);
    return storeResponse.data.map(item => item.id);
}

/**
 * Fetches the filename by id.
 * @param {string} fileId the id of the file
 * @returns {Promise<string>}
 */
export async function fetchFileName(fileId) {
    const fileResponse = await openai.files.retrieve(fileId);
    return fileResponse.filename;
}
