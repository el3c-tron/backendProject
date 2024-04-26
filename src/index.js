import dotenv from 'dotenv';
import connectDB from "./db/index.js";
import {app} from './app.js';   

dotenv.config({path: './.env'});

// RETURNS PROMISE
connectDB()
    .then(() => {

        // ERROR HANDLING
        app.on("error", (error) => {
            console.log("Connection Prohibited ||| ", error);
        });
        
        // PORT LISTNING
        app.listen(process.env.PORT || 8000 , () => {
            console.log(`Server started successfull at : http://localhost:${process.env.PORT}`);
        });
    })
    .catch((error) => {
        console.log("MONGODB CONNECTION ERROR!!! " , error);
    });