import mongoose from 'mongoose';

/**
 * Connects to MongoDB Atlas using the MONGO_URI from environment variables.
 * Uses async/await and logs success or failure clearly.
 * Called once at server startup from server.ts.
 */
const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error('MONGO_URI is not defined in environment variables.');
    }

    const conn = await mongoose.connect(mongoURI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ MongoDB Connection Error: ${error.message}`);
    } else {
      console.error('❌ Unknown MongoDB Connection Error');
    }
    process.exit(1); // Exit process with failure if DB fails to connect
  }
};

export default connectDB;
