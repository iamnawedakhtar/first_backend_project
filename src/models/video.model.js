import mongoose,{Schema} from "mongoose";

import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const VideoSchema= new Schema({
    videoFile:{
        typeof:String,  //url cloudnary
        required:true
    },
    thumbnail:{
        typeof:String,  //url cloudnary
        required:true
    },
    title:{
        typeof:String,  
        required:true
    },
    discription:{
        typeof:String,  
        required:true
    },
    duration:{
        typeof:Number,  
        required:true
    },
    Views:{
        typeof:Number,  
        default:0,
    },
    IsPublished:{
        typeof:Boolean,  
        default:true
    },
    Owner:{
        typeof:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    } 
},{timestamps:true})

VideoSchema.plugin(mongooseAggregatePaginate);  //this is to show that our project is going on next level bcoz we are using  aggregation pipline technique to write middlewares

export const Video= mongoose.model("Video", VideoSchema);