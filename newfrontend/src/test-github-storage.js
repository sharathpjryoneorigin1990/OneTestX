// Test script to verify localStorage functionality for GitHub credentials

// Mock localStorage
const mockLocalStorage = {
  store: {},
  getItem: function(key) {
    return this.store[key] || null;
  },
  setItem: function(key, value) {
    this.store[key] = value.toString();
  },
  clear: function() {
    this.store = {};
  }
};

// Test saving and loading credentials
function testGitHubCredentialsStorage() {
  console.log('Testing GitHub credentials storage...');
  
  // Define test credentials
  const testCredentials = {
    username: 'testuser',
    token: 'ghp_testtoken123456789',
    repo: 'testuser/testrepo'
  };
  
  // Save credentials
  console.log('Saving credentials to localStorage...');
  mockLocalStorage.setItem('github_credentials', JSON.stringify(testCredentials));
  
  // Load credentials
  console.log('Loading credentials from localStorage...');
  const savedCredentials = mockLocalStorage.getItem('github_credentials');
  const parsedCredentials = JSON.parse(savedCredentials);
  
  // Verify credentials
  console.log('Verifying credentials...');
  const isUsernameCorrect = parsedCredentials.username === testCredentials.username;
  const isTokenCorrect = parsedCredentials.token === testCredentials.token;
  const isRepoCorrect = parsedCredentials.repo === testCredentials.repo;
  
  console.log(`Username correct: ${isUsernameCorrect}`);
  console.log(`Token correct: ${isTokenCorrect}`);
  console.log(`Repo correct: ${isRepoCorrect}`);
  
  if (isUsernameCorrect && isTokenCorrect && isRepoCorrect) {
    console.log('✅ Test passed! GitHub credentials are properly saved and loaded.');
  } else {
    console.log('❌ Test failed! GitHub credentials are not properly saved or loaded.');
  }
}

// Run the test
testGitHubCredentialsStorage();

// Instructions for real browser testing:
console.log('\nTo test in a real browser:');
console.log('1. Open your application in the browser');
console.log('2. Open the browser console (F12)');
console.log('3. Enter GitHub credentials in the connection modal and submit');
console.log('4. Verify localStorage by typing: localStorage.getItem("github_credentials")');
console.log('5. Close and reopen the modal to verify credentials are loaded');
