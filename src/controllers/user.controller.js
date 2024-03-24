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

const changePassword= asyncHandler( async (req,res)=>{

    const{oldPassword,newPassword}= req.body;

    const user= await User.findById(req.user?._id);
    
    const isPasswordvalid= await user.isPasswordCorrect(oldPassword);
    if(!isPasswordvalid)
    {
        throw new ApiErrors(200,"Invalid old Password");
    }

    user.password=newPassword;
    await user.save({validateBeforeSave: false});

   return res
   .status(200)
   .json(
        new ApiResponse(200,{},"password changed successfuly")
    )

})

const getCurrentUser= asyncHandler( async (req,res)=>{
    return res
    .status(200)
    .json(
        new ApiResponse(200,req.user,"user fetched successfully")
        )
})

const UpdateUserDetail= asyncHandler (async (req,res)=>{
    const {Fullname,email}= req.body;

    if(!Fullname && !email)
    {
        throw new ApiErrors(400,"all fields are requrired");
    }

    const user= await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                Fullname,
                email:email
            }
        },
        { new:true}
        ).select("-password");

        return res.status(200)
        .json(new ApiResponse(200,user,"Account details updated successfully"));
})
const UpdateCoverImage= asyncHandler( async(req,res)=>{

    const CoverImageLocalPath= req.file?.path;

    if (!CoverImageLocalPath) {
        throw new ApiErrors(400, "CoverImage file is missing")
    }
    const coverImage= await uploadOnCloudinary(CoverImageLocalPath);
    if(!coverImage.url)
    {
        throw new ApiErrors(400,"Error while uploading  on cloudinary")
    }
    const imageToDelete= await User.findById(req.user._id).avatar;
    const user=await User.findByIdAndUpdate(
        req.user._id,
        { 
            $set:{
                  avatar:avatar.url
            }
        },
        {new:true}
        ).select("-password")

        await deleteFromCloudinary(imageToDelete);  // added by myself
        return res
        .status(200)
        .json(new ApiResponse(
            200,user,"CoverImage changed successfully"
        ))
})
const UpdateAvatar= asyncHandler( async(req,res)=>{

    const avatarLocalPath= req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiErrors(400, "Avatar file is missing")
    }

    const avatar= await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url)
    {
        throw new ApiErrors(400,"Error while uploading  on cloudinary")
    }
    const imageToDelete= await User.findById(req.user._id).avatar; // added by myself
    const user=await User.findByIdAndUpdate(
        req.user._id,
        { 
            $set:{
                  avatar:avatar.url
            }
        },
        {new:true}
        ).select("-password")
         await deleteFromCloudinary(imageToDelete);  // added by myself
    return res
    .status(200)
    .json(new ApiResponse(
        200,user,"avatar changed successfully"
    ))
})

const getUserChannelProfile= asyncHandler( async(req,res)=>{
    
    const {username}= req.params;
    if(!username?.trim())
    {
        throw new ApiErrors(400,"username is missing in the url")
    }

    const channel= await User.aggregate(
        [
            {
                $match:
                {
                    username:username?.toLowerCase()
                }
            },
            {
                $lookup:{
                    from:"subscriptions",  //db me small and plural ho jata hai
                    localField:"_id",
                    foreignField:"channel",
                    as:"subscribers"
                }
            },
            {
                $lookup:{
                    from:"subscriptions",  
                    localField:"_id",
                    foreignField:"Subscriber",
                    as:"subscribedTo"
                }
            },
            {
                $addFields:{
                    subscribersCount:{
                        $size:"$subscribers"
                    },
                    channelsSubscribedToCount:
                    {
                        $size:"$subscribedTo"
                    },
                    isSubscribed:{
                        $cond:{
                            if: {$in: [req.user?._id, "$subscribers.Subscriber"]},  //in to look in array as well as object
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project:{
                    username:1,
                    Fullname:1,
                    subscribersCount: 1,
                    channelsSubscribedToCount: 1,
                    isSubscribed: 1,
                    email:1,
                    avatar:1,
                    coverImage:1
                }
            }
        ]
    );

    if(!channel?.length)
    {
        throw new ApiErrors(404,"channel does not exists");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User channel fetched successfully")
    )
})
export { 
    registerUser,
    userLogin ,
    userLogout,
    refreshAccessToken,
    changePassword,getCurrentUser,UpdateUserDetail,
    UpdateAvatar,
    UpdateCoverImage,
    getUserChannelProfile
    
}