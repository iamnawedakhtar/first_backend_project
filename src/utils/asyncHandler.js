// promise wala async handler

const asyncHandler =(requestHandler) =>{
    (req,res,next)=>{
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