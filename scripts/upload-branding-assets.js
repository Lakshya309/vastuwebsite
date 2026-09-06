const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || 'vastu-assets';

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.error("Error: Missing R2 credentials in .env file.");
  process.exit(1);
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const rootDir = path.resolve(__dirname, '..');

const assetsToUpload = [
  { localPath: 'public/logo.png', r2Key: 'branding/logo.png', contentType: 'image/png' },
  { localPath: 'public/manglam_plus.png', r2Key: 'branding/manglam_plus.png', contentType: 'image/png' },
  { localPath: 'public/manglam_plus_bg.jpg', r2Key: 'branding/manglam_plus_bg.jpg', contentType: 'image/jpeg' },
  { localPath: 'public/media/mangalamlogo.png', r2Key: 'branding/mangalamlogo.png', contentType: 'image/png' },
  { localPath: 'public/hero.mp4', r2Key: 'hero/hero.mp4', contentType: 'video/mp4' },
];

async function uploadAssets() {
  console.log(`Starting upload to R2 bucket: "${bucketName}"...\n`);
  const results = [];

  for (const asset of assetsToUpload) {
    const fullPath = path.join(rootDir, asset.localPath);
    if (!fs.existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(fullPath);
    const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);
    console.log(`Uploading [${asset.localPath}] (${fileSizeMB} MB) to R2 key: "${asset.r2Key}"...`);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: asset.r2Key,
        Body: fileBuffer,
        ContentType: asset.contentType,
      })
    );

    // 7 days presigned URL for immediate usage
    const presignedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: bucketName, Key: asset.r2Key }),
      { expiresIn: 604800 }
    );

    const directUrl = `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${asset.r2Key}`;

    results.push({
      asset: asset.localPath,
      key: asset.r2Key,
      directUrl,
      presignedUrl,
    });

    console.log(`✔ Success: ${asset.r2Key}\n`);
  }

  console.log("=================== UPLOAD SUMMARY ===================");
  results.forEach(res => {
    console.log(`\nLocal File:    ${res.asset}`);
    console.log(`R2 Key:        ${res.key}`);
    console.log(`Direct R2 URL: ${res.directUrl}`);
    console.log(`Presigned URL: ${res.presignedUrl}`);
  });
}

uploadAssets().catch(err => {
  console.error("Upload error:", err);
  process.exit(1);
});
