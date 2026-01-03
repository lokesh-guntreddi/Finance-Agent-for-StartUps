import mongoose from 'mongoose';

const analysisResultSchema = new mongoose.Schema({
    risk_analysis: mongoose.Schema.Types.Mixed,
    sub_goal: mongoose.Schema.Types.Mixed,
    decision: mongoose.Schema.Types.Mixed,
    action_log: mongoose.Schema.Types.Mixed,
    memory_updates: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
});

export const AnalysisResult = mongoose.model('AnalysisResult', analysisResultSchema);
