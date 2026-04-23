import Escalation from '../models/Escalation.model.js';

export const getEscalations = async (req, res) => {
    try {
        const escalations = await Escalation.find({ resolved: false }).sort({ createdAt: -1 });
        res.status(200).json(escalations);
    } catch (error) {
        console.error('Error fetching escalations:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const resolveEscalation = async (req, res) => {
    try {
        const { id } = req.params;
        const escalation = await Escalation.findByIdAndUpdate(id, { resolved: true }, { new: true });
        
        if (!escalation) {
            return res.status(404).json({ message: 'Escalation not found' });
        }
        
        res.status(200).json(escalation);
    } catch (error) {
        console.error('Error resolving escalation:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
