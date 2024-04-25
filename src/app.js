import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

// CONFIGURATION FOR BACK-END and FRONT-END CONNECTION
app.use(cors({origin : process.env.CORS_ORIGIN , credentials : true}));

// INSTEAD OF USING BODY_PARSER  
app.use(express.json({limit : "16kb"}));

// FOR URL ENCODING
app.use(express.urlencoded({extended : true , limit : "16kb"}));

// FOR STATIC FILES (ex: PDF's , images , favicon etc.)
app.use(express.static("public"));

// FOR APPLING C.U.R.D OPERATIONS IN BROWSER's COOKIE
app.use(cookieParser());

export default app;