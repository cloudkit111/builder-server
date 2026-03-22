const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
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
    for (const filePath of distFolderContents) {
      // check whether filePath is a folder?
      if (fs.lstatSync(filePath).isDirectory()) continue;

      console.log("uploading...", filePath);
      // read folder and upload on S3
      const command = new PutObjectCommand({
        Bucket: "cloudkit-outputs",
        Key: `__outputs/${PROJECT_ID}/${filePath}`,
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
