import {fetchFile, fetchFileIds} from "./util.js";

const fileIds = await fetchFileIds();
const filenamePromises = fileIds.map(async fileId => {
    const file = await fetchFile(fileId);
    return file.filename;
})
const filenames = await Promise.all(filenamePromises);
console.log(filenames);
console.log(`${filenames.length} files found.`);
