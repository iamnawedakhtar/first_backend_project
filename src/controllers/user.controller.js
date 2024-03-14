import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiErrors } from "../utils/ApiErrros.js";
import { User } from "../models/user.model.js";
import { cloudinaryUpload } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"; 



const registerUser=asyncHandler(async(req,res)=>{
    // get user details from frontend 
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    // get user details from frontend ->req.body se using postman
    const {fullname,username,email,password}= req.body;
    console.log("email: ",email);

    // validation - not empty

    // if(password.trim()==="") 
    // throw new ApiErrors(400,"password is requried")   -> this is basic way to do validation 

    if(
        [fullname,username,password,email].some((fields)=> fields?.trim()==="")
    )
    {
        throw new ApiErrors(400,"All fields are requried");
    }

    // check if user already exists: username, email
    const exitedUser= await User.findOne({
        $or :[{username},{email}]   // ya to username ya email pahle se present ho 
    })

    if (exitedUser) {
        throw new ApiErrors(409,"User with username or email already exists")
    }

    // check for images, check for avatar
    const avtarLocalpath = req.files?.avatar[0]?.path;  //this gives local path as it is still on server
    const coverImageLocalpath = req.files?.coverImage[0]?.path;  
    
    if(!avtarLocalpath)
    {
        throw new ApiErrors(400,"Avatar file is required")
    }

    // upload them to cloudinary, avatar

     const avatar= await cloudinaryUpload(avtarLocalpath)
     const coverImage= await cloudinaryUpload(coverImageLocalpath)
     if(!avatar)
     {
        throw new ApiErrors(400,"Avatar is required")
     }


    // create user object - create entry in db

    const user=await User.create(
        {
            username:username.toLowerCase(),
            fullname,
            email,
            password,
            avatar:avatar.url,
            coverImage:coverImage?.url || "",
        }
    )

    //check for user creation

    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser)
    {
        throw new ApiErrors(500,"something went wrong while registering the user")
    }

     // return res
     return res.status(201).json(
       new ApiResponse(200,createdUser,"User registered successfully")
     )
})

export { registerUser }