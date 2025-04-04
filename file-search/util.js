import OpenAI from 'openai';
import dotenv from 'dotenv';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';
import {createReadStream, readdirSync, readFileSync} from "node:fs";

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
 * Fetches the file by id and returns status, id, and filename.
 * @param {string} fileId the id of the file
 * @returns {Promise<{status: string, id: string, filename: string}>}
 */
export async function fetchFile(fileId) {
    const fileResponse = await openai.files.retrieve(fileId);
    return {
        status: fileResponse.status,
        id: fileId,
        filename: fileResponse.filename
    };
}

/**
 * Deletes existing files by filename from both the vector store and the file store
 * @param existingFileIds the list of existing file ids
 * @param filename the file to delete
 * @returns {Promise<string[]>} the ids of the deleted files
 */
export async function deleteFile(existingFileIds, filename) {
    let deletedFileIds = [];
    for (const fileId of existingFileIds) {
        const existingFile = await fetchFile(fileId);
        if (existingFile.filename === filename) {
            await openai.vectorStores.files.del(vectorStoreId, fileId);
            await openai.files.del(fileId);
            deletedFileIds.push(fileId);
        }
    }
    return deletedFileIds;
}

/**
 * Deletes existing files starting with filename from both the vector store and the file store
 * @param prefix the filename prefix
 * @returns {Promise<string[]>} the ids of the deleted files
 */
export async function deleteFilesStartingWith(prefix) {
    const existingFileIds = await fetchFileIds();
    let deletedFileIds = [];
    for (const fileId of existingFileIds) {
        const existingFile = await fetchFile(fileId);
        if (existingFile.filename.startsWith(prefix)) {
            await openai.vectorStores.files.del(vectorStoreId, fileId);
            await openai.files.del(fileId);
            deletedFileIds.push(fileId);
        }
    }
    return deletedFileIds;
}

/**
 * Uploads a file and returns the status, file id, and filename.
 * @param {string} path of the file to upload
 * @returns {Promise<{status: string, id: string, filename: string}>}
 */
export async function uploadFile(path) {
    const fileContent = createReadStream(path);
    const fileResponse = await openai.files.create({
        file: fileContent,
        purpose: "assistants",
    });
    const fileId = fileResponse.id;
    const storeResponse = await openai.vectorStores.files.create(vectorStoreId, {file_id: fileId});
    return {
        status: storeResponse.status,
        id: fileId,
        filename: fileResponse.filename
    };
}

/**
 * Searches in store.
 * @param {string} query
 * @returns {Promise<{id: string, filename: string, score: string}[]>}
 */
export async function search(query) {
    const response = await openai.vectorStores.search(vectorStoreId, {query});
    return response.data.map(item => ({
        id: item.file_id,
        filename: item.filename,
        score: item.score
    }));
}

/**
 * Aggregates the index-*.json files into one aggregated object.
 * @returns {object}
 */
export function fetchIndexes() {
    return readdirSync("files")
        .filter(filename => filename.startsWith("index-") && filename.endsWith(".json"))
        .map(filename => {
            const fileContent = readFileSync(`files/${filename}`, "utf8");
            return JSON.parse(fileContent);
        }).reduce((aggregatedJson, singleJson) => {
            return {...aggregatedJson, ...singleJson};
        }, {});
}
