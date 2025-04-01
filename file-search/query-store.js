import {search} from "./util.js";

const query = "Organisatorische und technische Voraussetzungen";

const files = await search(query)
console.log(JSON.stringify(files, null, 2));
