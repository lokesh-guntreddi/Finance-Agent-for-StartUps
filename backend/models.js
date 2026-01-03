import mongoose from 'mongoose';

const salarySchema = new mongoose.Schema({
    employee: { type: String, required: true },
    amount: { type: Number, required: true },
    due_in_days: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

const billSchema = new mongoose.Schema({
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    due_in_days: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

const receivableSchema = new mongoose.Schema({
    client: { type: String, required: true },
    email: { type: String, required: true },
    amount: { type: Number, required: true },
    due_in_days: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

const memorySchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    clients: [String],
    strategy: String,
    action_taken: String,
    result: String,
    details: mongoose.Schema.Types.Mixed
});

const analysisResultSchema = new mongoose.Schema({
    risk_analysis: mongoose.Schema.Types.Mixed,
    sub_goal: mongoose.Schema.Types.Mixed,
    decision: mongoose.Schema.Types.Mixed,
    action_log: mongoose.Schema.Types.Mixed,
    memory_updates: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
});

export const Salary = mongoose.model('Salary', salarySchema);
export const Bill = mongoose.model('Bill', billSchema);
export const Receivable = mongoose.model('Receivable', receivableSchema);
export const Memory = mongoose.model('Memory', memorySchema);
export const AnalysisResult = mongoose.model('AnalysisResult', analysisResultSchema);
