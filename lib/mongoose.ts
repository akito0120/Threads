import mongoose from "mongoose";

let isConnected = false;

export async function connectToDB() {
    mongoose.set("strictQuery", true);

    if(!process.env.MONGODB_URL) return console.log("MongoDB_URL not found");
    if(isConnected) return console.log("Already connected to DB");

    try {
        await mongoose.connect(process.env.MONGODB_URL);
        isConnected = true;
        console.log("Connected to DB");
    }catch(error) {
        console.log(`Failed to connect: ${error}`);
    }
}