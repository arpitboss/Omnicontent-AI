// packages/backend/src/models/voiceProfileModel.ts
import mongoose from 'mongoose';

/**
 * A user's brand-voice profile. A few of their real past posts (samples) plus an
 * optional freeform style description are injected into the generation prompt so the
 * AI writes in *their* voice instead of generic AI copy.
 */
const voiceProfileSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    samples: { type: [String], default: [] },
    description: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
}, { timestamps: true });

const VoiceProfile = mongoose.model('VoiceProfile', voiceProfileSchema);

export default VoiceProfile;