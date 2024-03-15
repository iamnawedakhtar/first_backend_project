import { ApiErrors } from "../utils/ApiErrros.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT= asyncHandler(async (req,_,next)=>{

    try {
        const token= req.cookies?.AccessToken || req.header("Authorization")?.replace("Bearer ", "");

        if(!token)
        {
            throw new ApiErrors(200,"Unauthorized request")
        }

        const decodedToken= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const user= await User.findById(decodedToken?._id).select("-password -RefreshToken");
        if(!user)
        {
            throw new ApiErrors(200,"Invalid access Token")
        }
        req.user=user;
        next();
    } catch (error) {
         throw new ApiErrors(401,error?.message || "invalid token");
    }
})