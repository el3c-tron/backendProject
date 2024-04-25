import {asyncHandler} from "../utils/asyncHandler.js"

const register = asyncHandler( (req, res) => {
    res.status(200).json({
        message: "ok"
    });
} );

export {register};