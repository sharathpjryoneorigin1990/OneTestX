// This script will help debug the test data loading

console.log('Test Console Debug - Script loaded');

async function checkTestData() {
  try {
    const apiUrl = '/api/tests';
    console.log('Fetching test data from:', apiUrl);
    
    // Make a direct fetch to the API endpoint
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Test data response:', {
      success: data.success,
      testCount: data.tests?.length || 0,
      categories: data.categories || [],
      sampleTest: data.tests?.[0] || 'No tests found',
      scanInfo: data.scanInfo || {}
    });
    
    return data;
  } catch (error) {
    console.error('Error fetching test data:', error);
    return { error: error.message };
  }
}

// Run the check when the page loads
console.log('Test Console Debug - Initializing...');
window.checkTestData = checkTestData;

// Execute immediately when script loads
console.log('Test Console Debug - Running initial check...');
checkTestData()
  .then(result => {
    console.log('Test data check completed:', {
      success: result?.success,
      testCount: result?.tests?.length || 0,
      hasError: !!result?.error
    });
  })
  .catch(error => {
    console.error('Error during test data check:', error);
  });
