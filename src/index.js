// require('dotenv').config({path:"./env"}); 

import dotenv from "dotenv";
import DBconnect from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path:"./.env"
})


DBconnect()   // as dbconnect ek async fun hai to it will return a promise 
.then(()=>{
    app.listen(process.env.PORT|| 8000,()=>{
        console.log(`server is runnig on port ${process.env.PORT}`);
    });
})
.catch((err)=>
{
    console.log("db connection failed",err); 
}
)






















//below is one way of connecting to db ,here we have somewhat polluted our index file so now we will see another approach in whi

/*
import express  from "express";
const app=express();
(async()=>{
    try {
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
       app.on("error",(error)=>{
            console.log("error:",error);
            throw error;     
       })

       app.length(process.env.PORT,()=>{
        console.log(`app is running on port ${process.env.PORT}`);
        
       })
    } catch (error) {
        console.error("ERROR: ",error);
        throw error;
    }
})()  //this is an iffie ->immediatly invoked funtion

*/