import mongoose from 'mongoose';
import {DB_NAME} from '../constants.js';

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\nDataBase Conneted : HOST : ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("\nMONGODB CONNECTION ERROR!!!" , error);
        process.exit(1)
    }
}

export default connectDB;