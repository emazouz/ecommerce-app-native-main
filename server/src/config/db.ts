import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected");
    });
    await mongoose.connect(process.env.MONGODB_URI!, {
      family: 4,
      serverSelectionTimeoutMS: 10000,
    });
  } catch (error: any) {
    console.error("MongoDB connection failed:", error.message);
  }
};

export default connectDB;
