const axios = require('axios');

const API_URL = 'http://localhost:8000';

async function testIntegration() {
    console.log('๐Ÿงช Testing FinLy MongoDB Integration...\n');

    try {
        // Test 1: Health Check
        console.log('1๏ธโƒฃ Testing Health Check...');
        const health = await axios.get(API_URL);
        console.log('โœ… Health:', health.data);

        // Test 2: Add Salary
        console.log('\n2๏ธโƒฃ Adding Salary...');
        const salary = await axios.post(`${API_URL}/api/salaries`, {
            employee: 'Test Employee',
            amount: 50000,
            due_in_days: 15
        });
        console.log('โœ… Salary Created:', salary.data);

        // Test 3: Add Bill
        console.log('\n3๏ธโƒฃ Adding Bill...');
        const bill = await axios.post(`${API_URL}/api/bills`, {
            type: 'AWS Server',
            amount: 10000,
            due_in_days: 10
        });
        console.log('โœ… Bill Created:', bill.data);

        // Test 4: Add Receivable
        console.log('\n4๏ธโƒฃ Adding Receivable...');
        const receivable = await axios.post(`${API_URL}/api/receivables`, {
            client: 'Acme Corp',
            email: 'acme@test.com',
            amount: 60000,
            due_in_days: 8
        });
        console.log('โœ… Receivable Created:', receivable.data);

        // Test 5: Run Analysis
        console.log('\n5๏ธโƒฃ Running Analysis...');
        const analysis = await axios.post(`${API_URL}/run-analysis`, {
            cash_balance: 150000,
            preferences: {
                dont_delay_salaries: true,
                avoid_vendor_damage: true
            }
        });
        console.log('โœ… Analysis Complete:');
        console.log('   Risk Score:', analysis.data.risk_analysis.risk_score);
        console.log('   Strategy:', analysis.data.decision.strategy);
        console.log('   Rationale:', analysis.data.decision.rationale);

        // Test 6: Get Latest Analysis
        console.log('\n6๏ธโƒฃ Fetching Latest Analysis...');
        const latest = await axios.get(`${API_URL}/api/analysis-results/latest`);
        console.log('โœ… Latest Analysis Retrieved');

        // Cleanup: Delete test data
        console.log('\n7๏ธโƒฃ Cleaning up...');
        await axios.delete(`${API_URL}/api/salaries/${salary.data._id}`);
        await axios.delete(`${API_URL}/api/bills/${bill.data._id}`);
        await axios.delete(`${API_URL}/api/receivables/${receivable.data._id}`);
        console.log('โœ… Cleanup Complete');

        console.log('\n๐ŸŽ‰ All tests passed! Integration is working perfectly!');

    } catch (error) {
        console.error('\nโŒ Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

testIntegration();
