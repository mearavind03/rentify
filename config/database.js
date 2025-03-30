import mongoose from 'mongoose';

let connected = false;

const connectDB = async () => {
  mongoose.set('strictQuery', true);

  // If the database is already connected, don't connect again
  if (connected) {
    console.log('MongoDB is already connected...');
    return;
  }

  // Connect to MongoDB
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    connected = true;
    console.log(`MongoDB connected successfully to ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Log more details about the error
    if (error.name === 'MongoServerSelectionError') {
      console.error('Could not connect to MongoDB server. Check your connection string and network.');
    }
    // Re-throw the error to handle it in the calling code
    throw error;
  }
};

export default connectDB;
