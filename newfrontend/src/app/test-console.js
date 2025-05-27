// This script will help debug the test data loading

async function checkTestData() {
  try {
    console.log('Fetching test data from:', '/api/tests');
    
    // Make a direct fetch to the API endpoint
    const response = await fetch('/api/tests');
    
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
console.log('Test Console Debug - Loading...');
window.checkTestData = checkTestData;

// Execute immediately
checkTestData().then(result => {
  console.log('Test data check completed:', {
    success: result?.success,
    testCount: result?.tests?.length || 0,
    hasError: !!result?.error
  });
});
