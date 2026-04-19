// Quick test to verify the API works
async function testAPI() {
  console.log('=== Testing Football Simulator API ===\n');

  try {
    // Test 1: Load teams JSON file
    console.log('Test 1: Loading teams JSON file...');
    const response = await fetch('http://localhost:5175/teams-data.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('✓ JSON loaded successfully');
    console.log(`  - ${data.teams.length} teams found`);
    console.log(`  - Teams: ${data.teams.map(t => `${t.name} (${t.year})`).join(', ')}`);

    // Test 2: Verify team structure
    console.log('\nTest 2: Verifying team structure...');
    const team = data.teams[0];
    if (!team.id || !team.name || !team.players) {
      throw new Error('Invalid team structure');
    }
    console.log('✓ Team structure valid');
    console.log(`  - First team: ${team.name}`);
    console.log(`  - Players: ${team.players.length}`);

    // Test 3: Check if app loads
    console.log('\nTest 3: Checking if React app loads...');
    const appResponse = await fetch('http://localhost:5175/');
    if (!appResponse.ok) {
      throw new Error(`HTTP ${appResponse.status}: ${appResponse.statusText}`);
    }
    console.log('✓ React app loads successfully');

    console.log('\n=== All tests passed! ===');
    console.log('\nNow:');
    console.log('1. Open http://localhost:5175/ in your browser');
    console.log('2. Open Developer Tools (F12)');
    console.log('3. Go to Console tab');
    console.log('4. Select two teams from the dropdowns');
    console.log('5. Click "Simulate Match"');
    console.log('6. Look for any error messages in the console');

  } catch (error) {
    console.error('✗ Test failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Check if we can reach the dev server
fetch('http://localhost:5175/')
  .then(() => testAPI())
  .catch(() => {
    console.error('✗ Cannot reach dev server at http://localhost:5175/');
    console.error('Make sure the Vite dev server is running: npm run dev');
    process.exit(1);
  });
