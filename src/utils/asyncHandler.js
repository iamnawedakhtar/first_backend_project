// the asyncHandler utility simplifies error handling for asynchronous route handlers in Express.js applications by wrapping them in a middleware function that ensures any errors are caught and forwarded to the error-handling middleware. This promotes cleaner and more maintainable code by centralizing error handling logic.
// promise wala async handler

const asyncHandler =(requestHandler) =>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}

export { asyncHandler }

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// this is try catch wala async handler this can also be used for the same purpose
// const asyncHandler=(func)=> async(req,res,next)=>{
    
//     try {
         
//         await func(req,res,next);
//     } catch (error) {
//         res.status(err.code|| 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }
// export { asyncHandler };