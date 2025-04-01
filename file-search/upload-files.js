import {deleteFile, fetchFile, fetchFileIds, uploadFile} from "./util.js";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const filename = '000-organisatorische.txt';
const path = resolve(scriptDirectory, '..', 'manual', filename);

// delete a previous upload
const existingFileIds = await fetchFileIds();
const fileIds = await deleteFile(existingFileIds, filename);
console.log(`deleted existing file ids: ${fileIds}`);

// upload
const response = await uploadFile(path);
console.log(`response: ${JSON.stringify(response, null, 2)}`);

// fetch status after a delay
setTimeout(async () => {
    const nextResponse = await fetchFile(response.id);
    console.log(`status update: ${nextResponse.status}`);
}, 100);
