import mongoose ,{Schema} from "mongoose";
import { Jwt } from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema= new Schema({
   
    username:{
        typeof:String,
        required: true,
        lowercase:true,
        trim:true,
        index:true   // this is optimise search in db
    },
    Fullname:{
        typeof:String,
        required: true,
        trim:true,
        index:true
    },
    email:{
        typeof:String,
        required: true,
    },
    password:{
        typeof:String,
        required: [true, "password is required"]
    },
    Avatra:{
        typeof:String,  //cloudnary url
        required:true
    },
    CoverImage:{
        typeof:String,
    },
    WatchHistory:{
        typeof:mongoose.Schema.Types.ObjectId,
        ref:"Video",
        required:true,
    },
    refreshToken :{
        typeof:String
    }

},{timeseries:true})


userSchema.pre("save", async function(next){
    
    if(!this.isModified("password")) return next();  // if only password is modified

    this.password= bcrypt.hash(this.password, 10);
    next();
})

userSchema.methods.isPasswordCorrect= async function(password)  //definng custom methods on schema
{
     return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessTokens=function(){
    return Jwt.sign(
        {
             _id:this._id,
             email:this.email,
             username:this.username,
             Fullname:this.Fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
             expiresIN:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
};
userSchema.methods.generateRefreshTokens=function(){
    return Jwt.sign(
        {
             _id:this._id // bar bar refresh hota rahta to uske liye jada info.payload dene ki jrurat nhi
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
             expiresIN:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
};
export const User= mongoose.model("User",userSchema);