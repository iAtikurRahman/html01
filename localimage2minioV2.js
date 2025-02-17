const aws = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');
const mime = require('mime-types');

require('dotenv').config(); // Load environment variables if using a .env file

// Validate required environment variables
const requiredEnv = ['AWS_BUCKET_NAME', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_MINIO_ENDPOINT'];
requiredEnv.forEach((key) => {
    if (!process.env[key]) {
        console.error(`Missing required environment variable: ${key}`);
        process.exit(1);
    }
});

const aws_s3_bucket = process.env.AWS_BUCKET_NAME;

const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_MINIO_ENDPOINT,
    s3ForcePathStyle: true,
});

// Function to check if the S3 bucket exists
const checkBucketExists = async () => {
    try {
        await s3.headBucket({ Bucket: aws_s3_bucket }).promise();
        console.log(`✅ Bucket "${aws_s3_bucket}" exists.`);
    } catch (err) {
        console.error(`❌ Error: Bucket "${aws_s3_bucket}" does not exist or is inaccessible.`, err);
        process.exit(1);
    }
};

// Function to upload an image
const uploadImage = async (imagePath) => {
    try {
        // Ensure the file exists
        await fs.access(imagePath);

        // Read the image file
        const imageBuffer = await fs.readFile(imagePath);
        const fileName = path.basename(imagePath);
        const mimeType = mime.lookup(imagePath) || 'application/octet-stream';

        const uploadParams = {
            Bucket: aws_s3_bucket,
            Key: `feedimages/${fileName}_${Date.now()}`,
            Body: imageBuffer,
            ACL: 'public-read',
            ContentType: mimeType,
        };

        console.log('🚀 Uploading image to MinIO...');
        const s3UploadResponse = await s3.upload(uploadParams).promise();
        console.log('✅ Upload successful! Image URL:', s3UploadResponse.Location);
    } catch (err) {
        console.error('❌ Error:', err.message || err);
        process.exit(1);
    }
};

// Main function to execute upload
(async () => {
    await checkBucketExists();
    await uploadImage('Dd/cat/pic.jpg'); // Change to your actual image path
})();
