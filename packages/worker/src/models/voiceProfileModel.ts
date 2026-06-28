// packages/worker/src/models/voiceProfileModel.ts
import mongoose from 'mongoose';

/**
 * A user's brand-voice profile (read by the worker at generation time). A few real
 * past posts (samples) plus an optional freeform style description are injected into
 * the Gemini prompt so the AI writes in the creator's voice, not generic AI copy.
 */
const voiceProfileSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    samples: { type: [String], default: [] },
    description: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
}, { timestamps: true });

const VoiceProfile = mongoose.model('VoiceProfile', voiceProfileSchema);

export default VoiceProfile;