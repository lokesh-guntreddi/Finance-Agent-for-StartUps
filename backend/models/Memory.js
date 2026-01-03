import mongoose from 'mongoose';

const memorySchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    clients: [String],
    strategy: String,
    action_taken: String,
    result: String,
    details: mongoose.Schema.Types.Mixed
});

export const Memory = mongoose.model('Memory', memorySchema);
