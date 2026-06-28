// packages/backend/src/routes/voiceRoutes.ts
import { requireAuth } from '@clerk/express';
import express from 'express';
import VoiceProfile from '../models/voiceProfileModel';

const router = express.Router();

const MAX_SAMPLES = 5;
const MAX_SAMPLE_LENGTH = 4000;
const MAX_DESCRIPTION_LENGTH = 600;

// ─── Get the current user's brand-voice profile ───
router.get('/', requireAuth(), async (req: express.Request, res: express.Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const profile = await VoiceProfile.findOne({ userId });
        if (!profile) {
            return res.json({ samples: [], description: '', enabled: true });
        }
        res.json({ samples: profile.samples, description: profile.description, enabled: profile.enabled });
    } catch (error) {
        console.error('[voice] GET error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ─── Create or update the brand-voice profile ───
router.put('/', requireAuth(), async (req: express.Request, res: express.Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { samples, description, enabled } = req.body;

        // Validate & sanitize: trim, drop empties, cap count and length.
        const cleanSamples: string[] = Array.isArray(samples)
            ? samples
                .filter((s: unknown): s is string => typeof s === 'string')
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0)
                .slice(0, MAX_SAMPLES)
                .map((s: string) => s.slice(0, MAX_SAMPLE_LENGTH))
            : [];

        const cleanDescription = typeof description === 'string'
            ? description.trim().slice(0, MAX_DESCRIPTION_LENGTH)
            : '';

        const profile = await VoiceProfile.findOneAndUpdate(
            { userId },
            {
                samples: cleanSamples,
                description: cleanDescription,
                enabled: enabled !== false,
            },
            { upsert: true, new: true },
        );

        res.json({ samples: profile.samples, description: profile.description, enabled: profile.enabled });
    } catch (error) {
        console.error('[voice] PUT error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ─── Append a "winning" post to the brand-voice samples (close-the-loop) ───
router.post('/learn', requireAuth(), async (req: express.Request, res: express.Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const text = typeof req.body?.text === 'string'
            ? req.body.text.trim().slice(0, MAX_SAMPLE_LENGTH)
            : '';
        if (!text) return res.status(400).json({ message: 'text is required.' });

        const remove = req.body?.remove === true;
        const profile = await VoiceProfile.findOne({ userId });
        const existing: string[] = profile?.samples ?? [];

        // Remove a previously-added sample (undo a mistaken "add to voice").
        if (remove) {
            const nextSamples = existing.filter((s) => s.trim() !== text);
            const updated = await VoiceProfile.findOneAndUpdate(
                { userId },
                { samples: nextSamples },
                { upsert: true, new: true },
            );
            return res.json({ samples: updated.samples, description: updated.description, enabled: updated.enabled, removed: true });
        }

        // Skip duplicates.
        if (existing.some((s) => s.trim() === text)) {
            return res.json({ samples: existing, description: profile?.description ?? '', enabled: profile?.enabled ?? true, added: false });
        }

        // Append, keeping only the most recent MAX_SAMPLES.
        const nextSamples = [...existing, text].slice(-MAX_SAMPLES);

        const updated = await VoiceProfile.findOneAndUpdate(
            { userId },
            { samples: nextSamples, enabled: true },
            { upsert: true, new: true },
        );

        res.json({ samples: updated.samples, description: updated.description, enabled: updated.enabled, added: true });
    } catch (error) {
        console.error('[voice] LEARN error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
