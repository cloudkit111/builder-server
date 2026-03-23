import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import mime from "mime-types";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config({});

import Valkey from "ioredis";
import { json } from "stream/consumers";

const service_url = process.env.REDIS_CONNECTION_STRING;

console.log(service_url)

const publisher = new Valkey(service_url);

const publishlogs = (log) => {
  publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify({ log }));
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "AKIAUVIGFTDBO3JCYJEU",
    secretAccessKey: "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",
  },
});

const PROJECT_ID = process.env.PROJECT_ID;

async function init() {
  console.log("Executing script.js");
  publishlogs("🚀 Build Starting...");
  const outDirPath = path.join(__dirname, "output");

  publishlogs("📦 Installing dependencies...");
  const p = exec(`cd ${outDirPath} && npm install && npm run build`);

  p.stdout.on("data", function (data) {
    console.log(data.toString());
    publishlogs(data.toString());
  });

  p.stdout.on("error", function (data) {
    console.log("Error:", data.toString());
    publishlogs("Error" + data.toString());
  });

  p.on("close", async function () {
    console.log("Build complete");
    publishlogs("Build complete");

    const distFolderPath = path.join(__dirname, "output", "dist");

    publishlogs("Reading build files...");

    // Read and form array of all files inside the folder recursive true => subfolders
    const distFolderContents = fs.readdirSync(distFolderPath, {
      recursive: true,
    });

    // file by file iteration
    for (const file of distFolderContents) {
      const filePath = path.join(distFolderPath, file);
      // check whether filePath is a folder?
      if (fs.lstatSync(filePath).isDirectory()) continue;

      console.log("uploading...", filePath);
      publishlogs(`Uploading: ${file}`);
      // read folder and upload on S3
      const command = new PutObjectCommand({
        Bucket: "cloudkit-outputs",
        Key: `__outputs/${PROJECT_ID}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath),
      });

      await s3Client.send(command);
      console.log("uploaded", filePath);
      publishlogs(`Uploaded: ${file}`);
    }

    console.log("Done...");
    publishlogs("Deployment Complete!");
    process.exit(0);
  });
}
init();
