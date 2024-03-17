import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiErrors } from "../utils/ApiErrros.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"; 
import { verify } from "jsonwebtoken";
// import pkg from 'jsonwebtoken';
// const { Jwt } = pkg;
const generateAccessAndRefreshToken = async(userId) =>{
    try { 
        const user = await User.findById(userId)
        const AccessToken = user.generateAccessTokens()       
        const RefreshToken = user.generateRefreshTokens()

        user.RefreshToken = RefreshToken
        await user.save({ validateBeforeSave: false });

        return {AccessToken, RefreshToken}

    } catch (error) {
        throw new ApiErrors(500, error?.message || "Something went wrong while generating referesh and access token")
    }
}

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
    const {Fullname,username,email,password}= req.body;
    // console.log("email: ",email);

    // validation - not empty

    // if(password.trim()==="") 
    // throw new ApiErrors(400,"password is requried")   -> this is basic way to do validation 

    if(
        [Fullname,username,password,email].some((fields)=> fields?.trim()==="")
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
    
    // console.log(req.files);
    
    // check for images, check for avatar
    const avtarLocalpath = req.files?.avatar[0]?.path;  //this gives local path as it is still on server
    // const coverImageLocalpath = req.files?.coverImage[0]?.path; 

    let coverImageLocalpath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0) {
        coverImageLocalpath=req.files.coverImage[0].path;  
    }  
    if(!avtarLocalpath)
    {
        throw new ApiErrors(400,"Avatar file is required")
    }

    // upload them to cloudinary, avatar

     const avatar= await uploadOnCloudinary(avtarLocalpath)
     const coverImage= await uploadOnCloudinary(coverImageLocalpath) //-> if coverImageLocalpath nahi hoga to cloudinay error nhi throw karega sirf ek empty string rerturn kareg (good work clodinary)
     if(!avatar)
     {
        throw new ApiErrors(400,"Avatar is required")
     }
    // create user object - create entry in db

    const user=await User.create(
        {
            username:username.toLowerCase(),
            Fullname,
            email,
            password,
            avatar:avatar.url,
            coverImage:coverImage?.url || ""
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

const userLogin= asyncHandler(async(req,res)=>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {username,email,password}= req.body;
    
    if(!(username || email))
    {
        throw new ApiErrors(400,"username or email is required for login");
    }

    const user = await User.findOne({
        $or: [{username},{email}]     //dono mese koi ek bhi mil jaye to $is mongodb operators
    })

    if(!user)
    {
        throw new ApiErrors(404,"user not found ");
    }

    const isPasswordvalid= await user.isPasswordCorrect(password);

    if(!isPasswordvalid)
    {
        throw new ApiErrors(401,"invalid User credentials");
    }

    const { AccessToken, RefreshToken }=await generateAccessAndRefreshToken(user._id);

    // console.log(`Accesstoken: ${AccessToken} \n RefreshToken: ${RefreshToken}`);
    

    const LoggedInUser= await User.findById(user._id).select("-password -RefreshToken");

    const options={
          httpOnly:true,
          secure:true
    }
    return res
    .status(200)
    .cookie("AccessToken",AccessToken)
    .cookie("RefreshToken",RefreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:LoggedInUser,RefreshToken,options,
            },
            "User logged in successfully"   
        )
    )
})

const userLogout=asyncHandler( async(req,res)=>{
    // user to hai hi nhi isi liye hum likhte hai middle ware waha humne cookies 

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset :{ RefreshToken:1} // this removes the field from document
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
  }

  return res
  .status(200)
  .clearCookie("AccessToken",options)
  .clearCookie("RefreshToken",options)
  .json(new ApiResponse(200,{},"user logged out"));

})

const refreshAccessToken=asyncHandler(async(req,res)=>{

       const incomingRefreshToken=req.cookies.RefreshToken || req.body.RefreshToken;

       try {
           if(!incomingRefreshToken)
           {
            throw new ApiErrors(401,"Unauthorized Request");
           }
           const decodedRefreshToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
           
           const user= await User.findById(decodedRefreshToken?._id);
           
           if(!user)
           {
            throw new ApiErrors(401,"Invalid Refresh Token");
           }
    
           if(user?.RefreshToken!== incomingRefreshToken)
           {
            throw new ApiErrors(401,"Refresh Token is expired or used");
           }
    
           const {AccessToken,newRefreshToken}= await generateAccessAndRefreshToken(user._id);
    
           const options={
            httpOnly:true,
            secure:true
      }
    
      return res
      .status(200)
      .Cookie("AccessToken",AccessToken, options)
      .Cookie("RefreshToken",newRefreshToken, options)
      .json(
        new ApiResponse(
            200,
            {AccessToken,RefreshToken: newRefreshToken},
            "Access Tokne Refreshed"
            ));
} catch (error) {
    throw new ApiErrors(401, error?.message || "invalid refresh token")
}

})

export { 
    registerUser,
    userLogin ,
    userLogout,
    refreshAccessToken
}