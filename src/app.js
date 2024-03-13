import  express  from "express";
import cookieParser from "cookie-parser";
import cors from 'cors'


const app=express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}));

app.use(express.json({limit:"16kb"}))
// app.use(express.urlencoded({extended, limit:"16kb"}))
app.use(express.static("public"))

app.use(cookieParser())

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

//routes import 

import userRouter from "./routes/user.routes.js";

// app.use("/users",userRouter); //basic declaration
app.use("/api/v1/users",userRouter); // industry level practice

// http:localhost:/api/v1/users/register  ->this is how url will be generated
export { app };