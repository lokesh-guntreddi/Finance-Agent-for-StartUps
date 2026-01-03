import { Memory } from '../models/index.js';

export const getMemory = async (req, res) => {
    try {
        const memory = await Memory.find().sort({ timestamp: -1 });
        res.json(memory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createMemory = async (req, res) => {
    try {
        const memoryRecord = new Memory(req.body);
        await memoryRecord.save();
        res.status(201).json(memoryRecord);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
