import OpenAI from 'openai';
import dotenv from 'dotenv';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';
import {createReadStream, existsSync, readdirSync, readFileSync} from "node:fs";

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
    const storeResponse = openai.vectorStores.files.list(vectorStoreId);
    let ids = [];
    for await (const responseItem of storeResponse) {
        ids.push(responseItem.id);
    }
    return ids;
}

/**
 * Fetches the file by id and returns status, id, and filename.
 * @param {string} fileId the id of the file
 * @returns {Promise<{status: string, id: string, filename: string}>}
 */
export async function fetchFile(fileId) {
    try {
        const fileResponse = await openai.files.retrieve(fileId);
        return {
            status: fileResponse.status,
            id: fileId,
            filename: fileResponse.filename
        };
    } catch (e) {
        console.warn(`Could not retrieve file: ${fileId}`);
        return null;
    }
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
        if (existingFile == null) {
            await deleteFileFromStore(fileId);
            deletedFileIds.push(fileId);
        } else if (existingFile.filename === filename) {
            await deleteFileFromStore(fileId);
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
        if (existingFile == null) {
            await deleteFileFromStore(fileId);
            deletedFileIds.push(fileId);
        } else if (existingFile.filename.startsWith(prefix)) {
            await deleteFileFromStore(fileId);
            await openai.files.del(fileId);
            deletedFileIds.push(fileId);
        }
    }
    return deletedFileIds;
}

async function deleteFileFromStore(fileId) {
    try {
        return await openai.vectorStores.files.del(vectorStoreId, fileId);
    } catch (e) {
        console.warn(`Could not delete file from store: ${fileId}`);
        return null;
    }
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
    if (!existsSync("files")) {
        return {};
    }
    return readdirSync("files")
        .filter(filename => filename.startsWith("index-") && filename.endsWith(".json"))
        .map(filename => {
            const fileContent = readFileSync(`files/${filename}`, "utf8");
            return JSON.parse(fileContent);
        }).reduce((aggregatedJson, singleJson) => {
            return {...aggregatedJson, ...singleJson};
        }, {});
}

/**
 * Deletes all content of the vector store and the related files.
 * Logs some progress to the console.
 * @returns {Promise<void>}
 */
export async function emptyStore() {
    const storeResponse = openai.vectorStores.files.list(vectorStoreId);
    let step = 0;
    const fileIds = [];
    let promises = [];
    // empty the vector store first
    for await (const responseItem of storeResponse) {
        const fileId = responseItem.id;
        try {
            promises.push(openai.vectorStores.files.del(vectorStoreId, fileId));
        } catch (e) {
            console.warn(`Empty store step ${step}: could not delete file from store: ${fileId}`);
        }
        fileIds.push(fileId);
        if (step % 10 === 0) {
            await Promise.all(promises);
            promises = [];
            console.info(`Delete
                          from vector store step ${step}: done`);
        }
        step++;
    }
    await Promise.all(promises);
    promises = [];
    console.info(`Delete
                  from vector store step ${step}: done`);
    step = 0;

    const newStoreResponse = await openai.vectorStores.files.list(vectorStoreId);
    console.log(`Vector store data length: ${newStoreResponse.data.length}, has_more: ${newStoreResponse.has_more}`);

    // delete the actual files now
    for (const fileId of fileIds) {
        promises.push(openai.files.del(fileId)
            .catch(() => console.warn(`Empty store step ${step}: could not delete file: ${fileId}`)));
        if (step % 10 === 0) {
            await Promise.all(promises);
            promises = [];
            console.info(`Delete file step ${step}: done`);
        }
        step++;
    }
    await Promise.all(promises);
    console.info(`Delete
                  from file step step ${step}: done`);
}

export async function deleteAllFiles() {
    const filesResponse = openai.files.list();
    let step = 0;
    for await (const responseItem of filesResponse) {
        const fileId = responseItem.id;
        try {
            await openai.files.del(fileId);
        } catch (e) {
            console.warn(`Empty store step ${step}: could not delete file: ${fileId}`);
        }
        if (step % 10 === 0) {
            console.info(`Empty store step ${step}: done`);
        }
        step++;
    }
}
