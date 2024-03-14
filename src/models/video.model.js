import mongoose,{Schema} from "mongoose";

import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const VideoSchema= new Schema({
    videoFile:{
        type:String,  //url cloudnary
        required:true
    },
    thumbnail:{
        type:String,  //url cloudnary
        required:true
    },
    title:{
        type:String,  
        required:true
    },
    discription:{
        type:String,  
        required:true
    },
    duration:{
        type:Number,  
        required:true
    },
    Views:{
        type:Number,  
        default:0,
    },
    IsPublished:{
        type:Boolean,  
        default:true
    },
    Owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    } 
},{timestamps:true})

VideoSchema.plugin(mongooseAggregatePaginate);  //this is to show that our project is going on next level bcoz we are using  aggregation pipline technique to write middlewares

export const Video= mongoose.model("Video", VideoSchema);