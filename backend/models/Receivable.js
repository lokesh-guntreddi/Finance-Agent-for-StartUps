import mongoose from 'mongoose';

const receivableSchema = new mongoose.Schema({
    client: { type: String, required: true },
    email: { type: String, required: true },
    amount: { type: Number, required: true },
    due_in_days: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

export const Receivable = mongoose.model('Receivable', receivableSchema);
