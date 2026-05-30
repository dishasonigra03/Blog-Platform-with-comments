const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`\n⚠️ MongoDB Connection Error: ${error.message}`);
    console.error('Please make sure local MongoDB is running (e.g. run "mongod" in a shell) or configure MONGODB_URI in your server/.env file to point to a MongoDB Atlas cloud instance.\n');
    // Keep server running so frontend requests don't fail with ECONNREFUSED
  }
};

module.exports = connectDB;
