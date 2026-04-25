// packages/backend/src/config/db.ts
import mongoose from 'mongoose';

const connectDB = async () => {
    const uri = process.env.MONGO_URI;

    if (!uri || typeof uri !== 'string' || uri.trim().length === 0) {
        console.error(
            '\n[❌ DB] MONGO_URI is not set.\n' +
            '       Create packages/backend/.env and add:\n' +
            '         MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>\n' +
            '       (or mongodb://localhost:27017/omnicontent for a local server)\n'
        );
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(uri);
        console.log(`[✅ DB] MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[❌ DB] Connection failed: ${msg}`);
        process.exit(1);
    }
};

export default connectDB;
