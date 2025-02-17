const aws = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const aws_s3_bucket = process.env.AWS_BUCKET_NAME;

const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_MINIO_ENDPOINT,
    s3ForcePathStyle: true,
});

// Define the local image path
const imagePath = 'D:/cat/pic.jpg';

// Read the image file
fs.readFile(imagePath, async (err, imageBuffer) => {
    if (err) {
        console.error('Error reading the image:', err);
        return;
    }

    const fileName = path.basename(imagePath);
    const uploadParams = {
        Bucket: aws_s3_bucket,
        Key: `feedimages/${fileName}_${Date.now()}.jpg`,
        Body: imageBuffer,
        ACL: 'public-read',
        ContentType: 'image/jpeg',
    };

    try {
        const s3UploadResponse = await s3.upload(uploadParams).promise();
        console.log('Uploaded Image URL:', s3UploadResponse.Location);
    } catch (uploadErr) {
        console.error('Upload failed:', uploadErr);
    }
});
