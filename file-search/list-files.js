import {fetchFileIds, fetchFileName} from "./util.js";

const fileIds = await fetchFileIds();
const filenamePromises = fileIds.map(fileId => fetchFileName(fileId))
const filenames = await Promise.all(filenamePromises);
console.log(filenames);
