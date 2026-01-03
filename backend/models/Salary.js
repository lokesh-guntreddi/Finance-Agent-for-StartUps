import mongoose from 'mongoose';

const salarySchema = new mongoose.Schema({
    employee: { type: String, required: true },
    amount: { type: Number, required: true },
    due_in_days: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

export const Salary = mongoose.model('Salary', salarySchema);
