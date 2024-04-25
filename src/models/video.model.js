import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema({

    videoFile: {
        type: String, // cloudinary url
        required: true
    },
    thumbmail: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number, // cloudinary
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },

}, {timestamps: true});

videoSchema.plugin(mongooseAggregatePaginate); // so we can use aggregation queries in mongoose

export const Video = mongoose.model("Video" , videoSchema);