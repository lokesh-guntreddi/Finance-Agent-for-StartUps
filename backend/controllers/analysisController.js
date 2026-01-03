import { AnalysisResult, Salary, Bill, Receivable, Memory } from '../models/index.js';
import axios from 'axios';

export const getAnalysisResults = async (req, res) => {
    try {
        const results = await AnalysisResult.find().sort({ createdAt: -1 }).limit(50);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getLatestAnalysisResult = async (req, res) => {
    try {
        const result = await AnalysisResult.findOne().sort({ createdAt: -1 });
        res.json(result || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const runAnalysis = async (req, res) => {
    try {
        const { cash_balance: raw_cash, preferences } = req.body;
        const cash_balance = Number(raw_cash) || 0;

        console.log(`DEBUG: Received cash_balance from frontend: "${raw_cash}" -> converted to: ${cash_balance}`);

        // Fetch current data from MongoDB
        const salaries = await Salary.find();
        const fixed_bills = await Bill.find();
        const receivables = await Receivable.find();

        // Calculate financial metrics
        const total_inflow = receivables.reduce((sum, r) => sum + r.amount, 0);
        const total_outflow =
            salaries.reduce((sum, s) => sum + s.amount, 0) +
            fixed_bills.reduce((sum, b) => sum + b.amount, 0);

        const projected_balance = cash_balance - total_outflow;
        const liquidity_status = projected_balance >= 0 ? 'SURPLUS' : 'DEFICIT';
        const net_position = cash_balance + total_inflow - total_outflow;

        const initial_state = {
            cash_balance,
            salaries: salaries.map(s => ({
                employee: s.employee,
                amount: s.amount,
                due_in_days: s.due_in_days
            })),
            fixed_bills: fixed_bills.map(b => ({
                type: b.type,
                amount: b.amount,
                due_in_days: b.due_in_days
            })),
            receivables: receivables.map(r => ({
                client: r.client,
                email: r.email,
                amount: r.amount,
                due_in_days: r.due_in_days
            })),
            preferences: preferences || {
                dont_delay_salaries: true,
                avoid_vendor_damage: true
            },
            financial_metrics: {
                total_inflow,
                total_outflow,
                projected_balance,
                liquidity_status,
                net_position,
                burn_rate_coverage: total_outflow > 0 ? Math.round((cash_balance / total_outflow) * 100) / 100 : 999
            }
        };

        console.log(`🚀 Analysis Request Received`);
        console.log(`   💰 Cash Balance: ${cash_balance}`);
        console.log(`   📊 Net Position: ${net_position}`);
        console.log(`   📈 Salaries: ${salaries.length}, Bills: ${fixed_bills.length}, Receivables: ${receivables.length}`);

        // Call Python backend for agent logic (use 127.0.0.1 to avoid IPv6 issues)
        const PYTHON_BACKEND = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8001';
        console.log(`   🔗 Python Backend URL: ${PYTHON_BACKEND}`);

        try {
            console.log(`   ⏳ Calling Python backend...`);
            const response = await axios.post(`${PYTHON_BACKEND}/run-analysis`, initial_state, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 60000 // 5 second timeout
            });

            const result = response.data;
            console.log(`   ✅ Python backend responded successfully`);
            console.log(`   📋 Strategy: ${result.decision?.strategy}`);

            // Save analysis result to MongoDB
            const analysisResult = new AnalysisResult(result);
            await analysisResult.save();
            console.log(`   💾 Saved to MongoDB (ID: ${analysisResult._id})`);

            // Save memory updates if present
            if (result.action_log) {
                const memoryRecord = new Memory({
                    timestamp: new Date(),
                    clients: result.action_log.targets_processed
                        ? result.action_log.targets_processed.map(t => t.target)
                        : result.action_log.target ? [result.action_log.target] : [],
                    strategy: result.decision?.strategy,
                    action_taken: result.action_log.action_taken,
                    result: result.action_log.result?.status || 'COMPLETED',
                    details: result.action_log
                });
                await memoryRecord.save();
                console.log(`   💭 Memory saved`);
            }

            console.log(`   ✨ Returning result to frontend`);
            res.json(result);

        } catch (pythonError) {
            console.error('❌ Python backend error:', pythonError.message);
            if (pythonError.code) console.error(`   Error Code: ${pythonError.code}`);
            console.log('💡 Generating basic analysis without AI agents...');

            // Generate basic financial analysis when Python backend is down
            const fallbackResult = {
                risk_analysis: {
                    risk_score: liquidity_status === 'SURPLUS' ? 1 : projected_balance < 0 ? 8 : 5,
                    critical_window: receivables.length > 0 ? `${Math.min(...receivables.map(r => r.due_in_days))} days` : 'N/A',
                    dominant_risk: liquidity_status === 'SURPLUS' ? 'LOW' : 'LIQUIDITY_DEFICIT',
                    confidence: 'MEDIUM',
                    sub_goal: {
                        intent: liquidity_status === 'SURPLUS' ? 'MAINTAIN_LIQUIDITY' : 'COVER_DEFICIT',
                        required_amount: liquidity_status === 'SURPLUS' ? 0 : Math.abs(projected_balance),
                        deadline_days: liquidity_status === 'SURPLUS' ? 0 : 10,
                        reason: liquidity_status === 'SURPLUS'
                            ? `Cash ${cash_balance} covers Outflows. Projected Balance: ${projected_balance}.`
                            : `Cash is insufficient. Projected Balance: ${projected_balance}. Need to raise ${Math.abs(projected_balance)}.`
                    }
                },
                decision: {
                    strategy: liquidity_status === 'SURPLUS' ? 'MAINTAIN_STATUS_QUO' :
                        receivables.length > 0 ? 'COLLECT_RECEIVABLE' : 'DELAY_VENDOR_PAYMENT',
                    target: liquidity_status === 'SURPLUS' ? 'None' :
                        receivables.length > 0 ? receivables[0].client :
                            fixed_bills.length > 0 ? fixed_bills[0].type : 'None',
                    rationale: liquidity_status === 'SURPLUS'
                        ? `Cash balance of ${cash_balance} adequately covers upcoming obligations. No immediate action needed.`
                        : receivables.length > 0
                            ? `To cover the deficit of ${Math.abs(projected_balance)}, collecting receivable from ${receivables[0].client} (Amount: ${receivables[0].amount}, Due: ${receivables[0].due_in_days} days) is recommended.`
                            : fixed_bills.length > 0
                                ? `Consider negotiating payment terms with ${fixed_bills[0].type} to manage the deficit of ${Math.abs(projected_balance)}.`
                                : 'No immediate financial instruments available. Consider external funding.',
                    amount_goal: liquidity_status === 'SURPLUS' ? 0 : Math.abs(projected_balance),
                    execution_params: {
                        tone: liquidity_status === 'SURPLUS' ? 'NONE' : 'POLITE',
                        channel: liquidity_status === 'SURPLUS' ? 'NONE' : 'EMAIL'
                    }
                },
                sub_goal: {
                    intent: liquidity_status === 'SURPLUS' ? 'MAINTAIN_LIQUIDITY' : 'COVER_DEFICIT',
                    required_amount: liquidity_status === 'SURPLUS' ? 0 : Math.abs(projected_balance),
                    deadline_days: liquidity_status === 'SURPLUS' ? 0 : 10,
                    reason: liquidity_status === 'SURPLUS'
                        ? `Cash ${cash_balance} covers Outflows. Projected Balance: ${projected_balance}.`
                        : `Cash is insufficient. Projected Balance: ${projected_balance}.`
                },
                action_log: {
                    action_taken: 'NO_ACTION',
                    reason: 'Basic analysis mode (AI agents unavailable)',
                    result: {
                        status: 'ANALYSIS_COMPLETE'
                    }
                }
            };

            console.log(`   📋 Fallback Strategy: ${fallbackResult.decision.strategy}`);

            // Save fallback result to MongoDB
            const analysisResult = new AnalysisResult(fallbackResult);
            await analysisResult.save();
            console.log(`   💾 Fallback saved to MongoDB (ID: ${analysisResult._id})`);

            console.log(`   ✨ Returning fallback result to frontend`);
            res.json(fallbackResult);
        }

    } catch (error) {
        console.error('❌ CRITICAL Error in /run-analysis:', error.message);
        console.error('   Stack:', error.stack);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};
