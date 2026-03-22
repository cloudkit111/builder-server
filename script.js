import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import mime from "mime-types";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({});

const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "AKIAUVIGFTDBBC5742PF",
    secretAccessKey: "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",
  },
});

const PROJECT_ID = process.env.PROJECT_ID;

async function init() {
  console.log("Executing script.js");
  const outDirPath = path.join(__dirname, "output");

  const p = exec(`cd ${outDirPath} && npm install && npm run build`);

  p.stdout.on("data", function (data) {
    console.log(data.toString());
  });

  p.stdout.on("error", function (data) {
    console.log("Error:", data.toString());
  });

  p.on("close", async function () {
    console.log("Build complete");

    const distFolderPath = path.join(__dirname, "output", "dist");

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
      // read folder and upload on S3
      const command = new PutObjectCommand({
        Bucket: "cloudkit-outputs",
        Key: `__outputs/${PROJECT_ID}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath),
      });

      await s3Client.send(command);
      console.log("uploaded", filePath);
    }

    console.log("Done...");
  });
}
init();
