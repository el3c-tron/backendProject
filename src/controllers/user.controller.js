import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/fileUpload.js"


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
    res.status(200).json(
        new ApiResponse(201,createdUser, "User Created Successfully")
    );

} );

export {register};