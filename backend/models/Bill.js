import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    due_in_days: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

export const Bill = mongoose.model('Bill', billSchema);
