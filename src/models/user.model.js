import mongoose from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema({
    
    watchHistory : [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    username : {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true 
    },
    email : {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullName : {
        type: String,
        require: true,
        trim: true,
        index: true
    },
    avatar : {
        type: String, // cloudinary url
        require: true,
    },
    coverImage : {
        type: String
    },
    password : {
        type: String,
        required: [true, "Password is required"]
    },
    refreshToken : {
        type: String
    },

}, {timestamps: true} );

// USING PRE HOOK IN MONGOOSE
userSchema.pre("save", async function(next) {
    
    if(this.isModified("password")) this.password = bcrypt.hash(this.password, 10);
    
    next();
});

//  COSTUME METHODS IN MONGOOSE
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            fullName: this.fullName,
            email: this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
   return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    ) 
}

export const User = mongoose.model("User" , userSchema);