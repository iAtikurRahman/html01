require("dotenv").config();
const mysql = require('mysql2/promise');
const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const exe_table_name = process.env.MYSQL_TABLE
const getMaxId = require('./maxid');

//connection with max attempts
async function connectToDB() {
    let connectionAttempts = 0;
    const maxAttempts = 7;
    let connection;
  
    while (connectionAttempts < maxAttempts) {
      try {
        connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            port: process.env.MYSQL_PORT,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE
        });
        console.log('Connected to MySQL database');
        return connection;
      } catch (error) {
        console.error('Error connecting to MySQL:', error);
        connectionAttempts++;
        if (connectionAttempts < maxAttempts) {
          console.log(`Retrying connection in 3 seconds... (Attempt ${connectionAttempts} of ${maxAttempts})`);
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } else {
          throw new Error('Failed to connect to MySQL after multiple attempts');
        }
      }
    }
  }

//start with file manual id
async function readStartIdFromFile() {
  try {
    const startId = fs.readFileSync('process.txt', 'utf8').trim();
    return parseInt(startId, 10) || 1; // If file is empty or doesn't contain a number, default to 1
  } catch (error) {
    console.error('Error reading start ID from file:', error);
    return 1; // Default to 1 in case of error
  }
}

async function updateProcessFile(maxId) {
  try {
    fs.writeFileSync('process.txt', `${maxId}`);
  } catch (error) {
    console.error('Error updating process.txt:', error);
  }
}

async function fetchImagesWithRetry(connection, startId, retryCount = 5) {
  let attempts = 0;
  let rows = [];

  while (attempts < retryCount) {
    try {
      const query = `SELECT id,image_path FROM ${exe_table_name} WHERE id >= ? ORDER BY id LIMIT 10`;
      [rows] = await connection.query(query, [startId]);
      break; // Break the loop if successful
    } catch (error) {
      attempts++;
      console.error(`Error fetching images (attempt ${attempts} of ${retryCount}):`, error);
      if (attempts < retryCount) {
        console.log('Retrying after 3 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } else {
        throw new Error('Failed to fetch images after multiple attempts');
      }
    }
  }

  return rows;
}

// Update corrupted images in the database
async function updateCorruptedImages(connection, corruptedIds) {
  if (corruptedIds.length === 0) return;
  const query = `UPDATE ${exe_table_name} SET is_corrupted = 1 WHERE id IN (${corruptedIds.join(',')})`;
  await connection.query(query);
  console.log('Updated corrupted images:', corruptedIds.length);
}

async function start() {
  let connection;
  try {
    connection = await connectToDB();
    
    

async function isCorrupted(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    
    // Use sharp to attempt to decode the image
    // await sharp(response.data).toFormat('jpeg').toBuffer();
    await sharp(response.data).metadata();
 
    // If no error is thrown, the image is not corrupted
    return false;
  } catch (error) {
    return true; // Error occurred, considering it corrupted
  }
}

    async function checkImagesBatch(connection, startId) {
      const results = await fetchImagesWithRetry(connection, startId);
      if (results.length === 0) return false;

      const maxId = Math.max(...results.map((row) => row.id));

      const imageUrls = results.map((row) => ({
        id: row.id,
        imageUrl: `https://office.land.gov.bd${row.image_path}`
      }));
      
      const corruptedId = [];
      
      for (const { id, imageUrl } of imageUrls) {
        if (await isCorrupted(imageUrl)) {
          corruptedId.push(id);
        }
      }
      await updateCorruptedImages(connection,corruptedId);

      await updateProcessFile(maxId);
      return true;
    }

    const startIdFromFile = await readStartIdFromFile();
    const endId = await getMaxId();; // Your specified EndID

    // Process images in batches of 10 until the EndID is reached or exceeded
    let currentStartId = startIdFromFile;
    while (currentStartId < endId && await checkImagesBatch(connection, currentStartId)) {
      currentStartId = await readStartIdFromFile();
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      connection.end();
    }
  }
}

start();




