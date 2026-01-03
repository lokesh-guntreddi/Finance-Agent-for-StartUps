import { Receivable } from '../models/index.js';

export const getReceivables = async (req, res) => {
    try {
        const receivables = await Receivable.find().sort({ createdAt: -1 });
        res.json(receivables);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createReceivable = async (req, res) => {
    try {
        const receivable = new Receivable(req.body);
        await receivable.save();
        res.status(201).json(receivable);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteReceivable = async (req, res) => {
    try {
        const receivable = await Receivable.findByIdAndDelete(req.params.id);
        if (!receivable) {
            return res.status(404).json({ error: 'Receivable not found' });
        }
        res.json({ message: 'Receivable deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
