import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-testing'
});

const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;

const filename = "006-registration-no-postbox.md";

// delete a previous upload
const uploadedFiles = await openai.vectorStores.files.list(vectorStoreId);
for (const fileRef of uploadedFiles.data) {
    const metadata = await openai.files.retrieve(fileRef.id);
    if (metadata.filename === filename) {
        await openai.vectorStores.files.del(vectorStoreId, fileRef.id);
        await openai.files.del(fileRef.id);
        console.log(`Deleted existing file: ${fileRef.id}`);
    }
}

const fileContent = fs.createReadStream(`file-search/query/${filename}`);
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
console.log(`status: ${response02.status}`);
