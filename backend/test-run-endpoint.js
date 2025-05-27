const fetch = require('node-fetch');

async function testRunEndpoint() {
  const testData = {
    testPath: "tests/ui/smoke/login.smoke.test.js",
    env: "qa"
  };

  try {
    console.log('Sending test request to /api/tests/run...');
    const response = await fetch('http://localhost:3005/api/tests/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    
    if (response.ok) {
      console.log('Test executed successfully!');
      console.log('Results:', JSON.stringify(data.results || {}, null, 2));
      console.log('Output:', data.output?.substring(0, 500) + '...'); // Show first 500 chars
    } else {
      console.error('Error executing test:', data.error || 'Unknown error');
      console.error('Details:', data.details || 'No details provided');
    }
  } catch (error) {
    console.error('Failed to run test:', error);
  }
}

testRunEndpoint();
