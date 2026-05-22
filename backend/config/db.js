const mongoose = require('mongoose');
require('dns').setServers(['8.8.8.8', '8.8.4.4']); // Bypass blocked SRV lookups
const connectDB = async () => {
  const maxRetries = 3;
  let retries = 0;

  const attemptConnection = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        maxPoolSize: 10,
      });
      console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      retries++;
      if (retries < maxRetries) {
        console.log(`⚠ Connection attempt ${retries} failed. Retrying in 3 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        return attemptConnection();
      } else {
        throw error;
      }
    }
  };

  try {
    const conn = await attemptConnection();
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Drop old indexes if they exist (legacy index cleanup)
    try {
      const db = mongoose.connection.db;
      const legacyIndexes = ['productCode_1', 'productOEMCode_1', 'partNumber_1'];
      
      for (const indexName of legacyIndexes) {
        try {
          if (await db.collection('products').indexExists(indexName)) {
            await db.collection('products').dropIndex(indexName);
            console.log(`Dropped legacy ${indexName} index`);
          }
        } catch (err) {
          if (!err.message.includes('index not found')) {
            console.warn(`Warning dropping ${indexName}:`, err.message);
          }
        }
      }
    } catch (indexError) {
      console.warn('Warning during legacy index cleanup:', indexError.message);
    }
  } catch (error) {
    console.error('\n❌ MongoDB Connection Failed!');
    console.error(`Error: ${error.message}\n`);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('querySrv')) {
      console.error('FIX: Your MongoDB Atlas cluster is not accessible.');
      console.error('✓ Solution 1: Whitelist your IP in MongoDB Atlas');
      console.error('  - Go to: https://cloud.mongodb.com');
      console.error('  - Click: Network Access → IP Whitelist');
      console.error('  - Add your IP or use 0.0.0.0/0 for development');
      console.error('✓ Solution 2: Check if your cluster is running (not paused)');
      console.error('✓ Solution 3: Verify username/password are correct\n');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;
