import { Salary } from '../models/index.js';

export const getSalaries = async (req, res) => {
    try {
        const salaries = await Salary.find().sort({ createdAt: -1 });
        res.json(salaries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createSalary = async (req, res) => {
    try {
        const salary = new Salary(req.body);
        await salary.save();
        res.status(201).json(salary);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteSalary = async (req, res) => {
    try {
        const salary = await Salary.findByIdAndDelete(req.params.id);
        if (!salary) {
            return res.status(404).json({ error: 'Salary not found' });
        }
        res.json({ message: 'Salary deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
