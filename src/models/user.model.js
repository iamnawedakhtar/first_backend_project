import mongoose ,{Schema} from "mongoose";
import pkg from 'jsonwebtoken';
const { Jwt } = pkg;
import bcrypt from "bcryptjs"

const userSchema= new Schema({
   
    username:{
        type:String,
        required: true,
        lowercase:true,
        trim:true,
        index:true   // this is optimise search in db
    },
    Fullname:{
        type:String,
        required: true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required: true,
    },
    password:{
        type:String,
        required: [true, "password is required"]
    },
    avatar:{
        type:String,  //cloudnary url
        required:true
    },
    coverImage:{
        type:String,
    },
    WatchHistory:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video",
    },
    refreshToken :{
        type:String
    }

},{timeseries:true})


userSchema.pre("save", async function(next){
    
    if(!this.isModified("password")) return next();  // if only password is modified

    this.password= await bcrypt.hash(this.password, 10);
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
             _id:this._id // bar bar refresh hota rahta to uske liye jada info.payload dene ki jrurat nhi as compared to upr wala
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
             expiresIN:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
};
export const User= mongoose.model("User",userSchema);