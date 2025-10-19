const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = 'mongodb://127.0.0.1:27017/murderMysteryDB';
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected to murderMysteryDB');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
