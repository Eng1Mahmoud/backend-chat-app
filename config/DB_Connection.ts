import { connect, ConnectOptions } from "mongoose";
// Cache the database connection
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;

  try {
    const url = process.env.DATABASE_URL as string;
    await connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as ConnectOptions);
    isConnected = true;
    console.log("✅ MongoDB connected");
  } catch (error) {
    isConnected = false;
    throw error;
  }
};

export { connectDB };
