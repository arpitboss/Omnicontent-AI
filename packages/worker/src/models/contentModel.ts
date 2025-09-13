import mongoose from 'mongoose';

const wordEventSchema = new mongoose.Schema({
    word: String,
    start: Number,
    end: Number,
}, { _id: false });

const reformattedClipSchema = new mongoose.Schema({
    aspectRatio: { type: String, required: true },
    status: {
        type: String,
        enum: ['PENDING', 'PROCESSING', 'COMPLETE', 'FAILED'],
        default: 'PENDING'
    },
    url: { type: String },
}, { _id: true });

const transcriptSegmentSchema = new mongoose.Schema({
    timestamp: String,
    text: String,
}, { _id: false });

const clipSchema = new mongoose.Schema({
    title: String,
    summary: String,
    s3Url: String,
    wordEvents: [wordEventSchema],
    status: {
        type: String,
        enum: ['PENDING', 'READY', 'FAILED'],
        default: 'PENDING'
    },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
});

const contentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    sourceUrl: { type: String, required: true },
    status: {
        type: String,
        enum: ['PENDING', 'GENERATING_TEXT', 'GENERATING_VIDEOS', 'COMPLETE', 'FAILED'],
        default: 'PENDING',
    },
    generatedTitle: { type: String },
    summary: { type: String },
    generatedContent: { type: String },
    transcript: [transcriptSegmentSchema],
    linkedinPost: { type: String },
    twitterThread: [String],
    localSourcePath: { type: String },
    clips: [clipSchema],
    reformattedClips: [reformattedClipSchema],
    errorMessage: { type: String }
}, { timestamps: true });

const Content = mongoose.model('Content', contentSchema);

export default Content;