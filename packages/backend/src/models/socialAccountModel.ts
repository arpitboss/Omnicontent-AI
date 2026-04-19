import mongoose from 'mongoose';

const socialAccountSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    platform: {
        type: String,
        required: true,
        enum: ['linkedin', 'youtube'],
    },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, default: '' },
    expiresAt: { type: Date },
    profileName: { type: String, default: '' },
    profileImageUrl: { type: String, default: '' },
    platformUserId: { type: String, default: '' },
}, { timestamps: true });

// One account per user per platform
socialAccountSchema.index({ userId: 1, platform: 1 }, { unique: true });

const SocialAccount = mongoose.model('SocialAccount', socialAccountSchema);

export default SocialAccount;
