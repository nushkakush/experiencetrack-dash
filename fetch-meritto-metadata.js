import https from 'https';
import fs from 'fs';

// Meritto API credentials
const ACCESS_KEY = '79b6586cdd9c400b9e014e68368b31eb';
const SECRET_KEY = '7073a99d3efe4b0c9066e84e08d9916d';

// API endpoint
const API_URL = 'https://api.nopaperforms.io/lead/v1/getMetaData';

// Function to make API call
async function fetchMerittoMetadata() {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access-key': ACCESS_KEY,
        'secret-key': SECRET_KEY
      }
    };

    console.log('🔍 Fetching Meritto metadata...');
    console.log('📡 API URL:', API_URL);
    console.log('🔑 Access Key:', ACCESS_KEY);
    console.log('🔐 Secret Key:', SECRET_KEY.substring(0, 8) + '...');

    const req = https.request(API_URL, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ API Response received');
          console.log('📊 Status Code:', res.statusCode);
          console.log('📋 Response Headers:', res.headers);
          resolve(response);
        } catch (error) {
          console.error('❌ Error parsing JSON response:', error);
          console.log('📄 Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.end();
  });
}

// Main execution
async function main() {
  try {
    const metadata = await fetchMerittoMetadata();
    
    console.log('\n📊 MERITTO METADATA RESPONSE:');
    console.log('================================');
    console.log(JSON.stringify(metadata, null, 2));
    
    // Save to file
    const filename = `meritto-metadata-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(metadata, null, 2));
    console.log(`\n💾 Metadata saved to: ${filename}`);
    
  } catch (error) {
    console.error('❌ Failed to fetch metadata:', error);
    process.exit(1);
  }
}

main();
