const axios = require('axios');

async function checkTests() {
  try {
    const response = await axios.get('http://localhost:3005/api/tests');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkTests();
