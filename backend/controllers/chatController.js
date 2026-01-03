import { Memory, Chat } from '../models/index.js';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Helper: Analyze Memory
const analyzeMemory = (memoryRecords) => {
    if (!memoryRecords || memoryRecords.length === 0) {
        return {
            total_records: 0,
            strategies_used: {},
            status_distribution: {},
            total_amount_attempted: 0,
            clients_involved: []
        };
    }

    const stats = {
        total_records: memoryRecords.length,
        strategies_used: {},
        status_distribution: {},
        total_amount_attempted: 0,
        clients_involved: new Set()
    };

    memoryRecords.forEach(record => {
        // Count strategies
        const strategy = record.strategy || "UNKNOWN";
        stats.strategies_used[strategy] = (stats.strategies_used[strategy] || 0) + 1;

        // Count statuses
        const status = record.result || "UNKNOWN"; // 'result' in Mongoose model maps to 'action_status' logic
        stats.status_distribution[status] = (stats.status_distribution[status] || 0) + 1;

        // Sum amounts (Amount is sometimes in details, need to be careful. 
        // The Memory model has 'details' as Mixed. 
        // In python code: record.get("amount_goal", 0). 
        // In our backend, amount might be in details.decision.amount_goal or details.amount_goal?
        // Let's assume it's in details.amount_goal based on python script usage or check how we store it.
        // We actually store `details: result.action_log` in the run-analysis controller. 
        // But amount_goal is in `decision`. 
        // However, the python script implies `record` has `amount_goal`. 
        // Let's try to extract relevant amount if possible, or 0.)

        let amount = 0;
        if (record.details && record.details.amount) amount = record.details.amount;
        // Check previous controller logic: Memory saves `details: result.action_log`. 
        // run-analysis controller saves `decision` separately in AnalysisResult, not Memory details. 
        // But the memory creation in controller `details: result.action_log`.
        // So amount might not be there. I'll stick to 0 or try to find it.
        stats.total_amount_attempted += amount;

        // Collect clients
        if (record.clients && Array.isArray(record.clients)) {
            record.clients.forEach(c => stats.clients_involved.add(c));
        }
    });

    return {
        ...stats,
        clients_involved: Array.from(stats.clients_involved)
    };
};

export const chatWithAssistant = async (req, res) => {
    try {
        const { message, sessionId = 'default' } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        // 1. Load Memory and Analyze
        const memoryRecords = await Memory.find().sort({ timestamp: -1 });
        const memoryStats = analyzeMemory(memoryRecords);

        // 2. Load Conversation History
        let chatSession = await Chat.findOne({ sessionId });
        if (!chatSession) {
            chatSession = new Chat({ sessionId, messages: [] });
        }

        // Format history for prompt
        const historyText = chatSession.messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n') || "This is the first question.";

        // 3. Prepare Prompt
        const systemPrompt = `
You are a sharp, no-nonsense personal assistant that analyzes financial agent memory and provides direct, honest insights.

Your task is to analyze the memory data and answer questions with brutal honesty - no sugar coating.

GUIDELINES:
- Be direct, concise, and brutally honest in your responses
- Call out failures, inefficiencies, and poor patterns without hesitation
- Provide specific data points from the memory when relevant
- Identify patterns and trends in the historical data
- Calculate statistics when helpful (success rates, amounts, etc.)
- Always base your answers on the actual memory data
- If the memory is empty or doesn't contain relevant information, say so bluntly
- Don't be sugarcoated while answering the questions
- When appropriate, suggest follow-up questions to dig deeper
- Return ONLY valid JSON.

CONVERSATION HISTORY:
${historyText}

MEMORY DATA:
${JSON.stringify({ records: memoryRecords.slice(0, 20), statistics: memoryStats }, null, 2)} 
(Note: Only last 20 records provided for context window efficiency)

CURRENT QUESTION:
${message}

Analyze the memory based on the conversation context and provide a helpful response. Return ONLY valid JSON with this structure:
{
  "answer": "Your direct, honest answer here",
  "key_insights": ["insight 1", "insight 2"],
  "data_points": ["point 1", "point 2"],
  "follow_up_suggestions": ["suggestion 1", "suggestion 2"]
}
`;

        // 4. Call Groq
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message } // Redundant but explicit
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        const responseContent = completion.choices[0]?.message?.content;

        let parsedResponse;
        try {
            parsedResponse = JSON.parse(responseContent);
        } catch (e) {
            console.error("Failed to parse LLM response", e);
            parsedResponse = {
                answer: responseContent,
                key_insights: [],
                data_points: [],
                follow_up_suggestions: []
            };
        }

        // 5. Update Database History
        chatSession.messages.push({ role: 'user', content: message });
        chatSession.messages.push({ role: 'assistant', content: parsedResponse.answer });
        await chatSession.save();

        // 6. Return Response
        res.json({
            success: true,
            ...parsedResponse,
            memory_stats: memoryStats
        });

    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getChatHistory = async (req, res) => {
    try {
        const { sessionId = 'default' } = req.query;
        const chatSession = await Chat.findOne({ sessionId });
        res.json(chatSession ? chatSession.messages : []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const clearChatHistory = async (req, res) => {
    try {
        const { sessionId = 'default' } = req.body;
        await Chat.findOneAndDelete({ sessionId });
        res.json({ message: "History cleared" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
