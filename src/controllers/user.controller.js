import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/fileUpload.js"
import jwt from "jsonwebtoken";
import mongoose from "mongoose"

const generateAccessTokenAndRefreshToken = async (userId) => {

    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});

        return {accessToken, refreshToken};
        
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens !!");
    }
    
}

const refreshAccessToken = asyncHandler( async (req, res) => {
    
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken) throw new ApiError(400, "Refresh Token Not Found !!");

    try{
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        if(!decodedToken) throw new ApiError(400, "Refresh Token is Invalid");
        
        const userId = decodedToken._id;
        
        const user = await User.findById(userId);
    
        if(!user) throw new ApiError(400, "Can't Find User With this Refresh Token");
    
        if(incomingRefreshToken !== user.refreshToken) throw new ApiError(400, "Refresh Token is expired or already used");
    
        const {accessToken, newRefreshToken} = await generateAccessTokenAndRefreshToken(user._id);
    
        const options = {
            httpOnly: true,
            secure: true
        };
    
        return res
                .status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", newRefreshToken, options)
                .json(new ApiResponse(
                    200, 
                    {accessToken, refreshToken: newRefreshToken},
                    "Access token refreshed"
            ));
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token !!")
    }

} )

const register = asyncHandler( async (req, res) => {

    // STEP 1 : get user detaiils from frontEnd
    const {username, fullName, email, password} = req.body;
    // console.log(`Email : ${email}`);
    // res.json(username);

    // STEP 2 : validate all fields (EMPTY or not)
    const isEmpty = [username, fullName, email, password].some( (field) => {
        if(field?.trim() === "") return true;
        return false;
    });

    if(isEmpty) throw new ApiError(400, "All fields are required !!");

    // STEP 3 : check for already existing user
    const existingUserEmail = await User.findOne({email});
    const existingUserUsername = await User.findOne({username});

    if(existingUserUsername) throw new ApiError(409, "Username already exists !!");
    if(existingUserEmail) throw new ApiError(409, "Email already exists !!");


    // STEP 4 : file path for avatar and coverImage
    const avatarLocalPath = req.files?.avatar[0]?.path;

    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
    {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath) throw new ApiError(400, "Avatar required !!");

    // STEP 5 : Upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar) throw new ApiError(400, "Avatar required !!");

    // STEP 6 : create an object for storing in database
    const user = await User.create(
        {
            username: username.toLowerCase(),
            fullName,
            email,
            password,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
        }
    );

    // STEP 7 : Check for user creation and deselection some fields
    const createdUser = await User.findById(user._id).select( "-password -refreshToken" );

    if(!createdUser) throw new ApiError(500, "User Creation Failed !!");

    // STEP 8 : Sending response using ApiResponse
    return res.status(200).json(
        new ApiResponse(201,createdUser, "User Created Successfully")
    );

} );

const login = asyncHandler( async (req, res) => {

    // STEP 1 : taking values from req.body
    const {email, username, password} = req.body;

    if(!email && !username) throw new ApiError(400, "username or email required !!");

    // STEP 2 : finding user in our database
    const user = await User.findOne({
        $or:[{email},{username}]
    });

    if(!user) throw new ApiError(400, "User doesn't exists");

    const passwordValidation = await user.isPasswordCorrect(password);

    if(!passwordValidation) throw new ApiError(400, "Wrong User Credentials");

    const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id);
    

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
            .status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",refreshToken,options)
            .json(
                new ApiResponse(
                    201,
                    {
                        user: loggedInUser, refreshToken, accessToken
                    },
                    "User LoggedIn Successfully"
                )
            );

} );

const logout = asyncHandler( async(req, res)=>{
    const userId = req.user._id;
    
    await User.findByIdAndUpdate(
        userId,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json( new ApiResponse(
                201,
                {},
                "User Successfully LoggedOut"
            ) );
} );

const changePassword = asyncHandler( async(req, res) => {
    const userId = req.user._id;
    const {oldPassword, newPassword} = req.body;

    if(!oldPassword && !newPassword) throw new ApiError(400, "All fields Required !!");

    const user = await User.findById(userId);

    if(!user) throw new ApiError(400, "User Not Found !!");
    
    const correctPassword = user.isPasswordCorrect(oldPassword);

    if(!correctPassword) throw new ApiError(400, "Incorrect Old Password !!");

    user.password = newPassword;

    user.save({validateBeforeSave: false});

    return res.status(200).json(new ApiResponse(200, {}, "Password Changed Successfully"));
    
} )

const getCurrentUser = asyncHandler( async(req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "Current User Found successfully !!"));
} )

const updateAvatar = asyncHandler( async(req, res) => {
    
    const userId = req.user._id;
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath) throw new ApiError(400, "Avatar not Found !!");

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url) throw new ApiError(500, "Error while Uploading on Cloudinary");

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-passowrd -refreshToken");

    return res.status(200).json(new ApiResponse(200, user, "Avatar Updated Successfully"));

} );

const updateCoverImage = asyncHandler( async(req, res) => {
    
    const userId = req.user._id;
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath) throw new ApiError(400, "coverImage not Found !!");

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url) throw new ApiError(500, "Error while Uploading on Cloudinary");

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-passowrd -refreshToken");

    return res.status(200).json(new ApiResponse(200, user, "coverImage Updated Successfully"));

} );

const getUserChannelProfile = asyncHandler( async(req, res) => {

    const username = req.params;

    if(!username) throw new ApiError(404, "Username not Found");

    const channelProfile = await User.aggregate([

        // Stage 1 : Match the username
        {
            $match: {
                username: "username"
            }
        },

        // Stage 2 : LookUp (Left Join) for finding all the subscribers
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },

        // Stage 3 : LookUp (Left Join) for finding all the channels the this channel subscribed to

        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },

        // Stage 4 : Adding some extra fields

        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },

        // Stage 5 : Sending only relevant information
        {
            $project: {
                username: 1,
                email: 1,
                fullName: 1,
                coverImage: 1,
                avatar: 1,
                subscriberCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1
            }
        } 

    ]);

    if(!channelProfile?.length) throw new ApiError(404, "Channel Niot Found");

    return res
            .status(200)
            .json(new ApiResponse(200, channelProfile[0], "Channel Found Successfully"));

} );

const getWatchHistory = asyncHandler( async(req, res) => {
    
    const user = await User.aggregate([
        {
            $match: new mongoose.Types.ObjectId(req.user._id)
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            form: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "owner"
                            }
                        }
                    }
                ]
            }
        }
    ]);

    return res
            .status(200)
            .json( new ApiResponse(200, user[0].watchHistory, "WatchHistory Fetched Successfully") );

} );

export {
    register, 
    login, 
    logout, 
    refreshAccessToken, 
    getCurrentUser, 
    changePassword, 
    updateAvatar, 
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
};