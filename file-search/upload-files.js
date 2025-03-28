import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-testing'
});

const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;

const filename = "011-schutzschrift.md";
const fileContent = fs.createReadStream(`file-search/${filename}`);
const response01 = await openai.files.create({
    file: fileContent,
    purpose: "assistants",
});
const fileId = response01.id;
console.log('file uploaded with id:', fileId);

const response02 = await openai.vectorStores.files.create(vectorStoreId,
    {
        file_id: fileId,
    });
console.log('response02:', JSON.stringify(response02, null, 2));
