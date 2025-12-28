#!/usr/bin/env node
/**
 * Test script for iOS PWA push notifications
 * Tests the backend endpoints and simulates notification flow
 */

const API_BASE_URL = process.env.API_BASE_URL || 'https://vila-app-back.vercel.app';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, 'cyan');
  console.log('='.repeat(60));
}

function logResult(success, message) {
  const status = success ? '[PASS]' : '[FAIL]';
  const color = success ? 'green' : 'red';
  log(`${status}: ${message}`, color);
}

async function testHealthCheck() {
  logSection('1. Health Check');
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      logResult(true, `API is accessible at ${API_BASE_URL}`);
      console.log(`   Response:`, data);
      return true;
    } else {
      logResult(false, `API returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    logResult(false, `Failed to connect: ${error.message}`);
    return false;
  }
}

async function testRegisterToken(username, platform) {
  logSection(`2. Register Push Token (${platform})`);
  try {
    const token = `test-token-${platform}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const response = await fetch(`${API_BASE_URL}/push/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        token,
        platform,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      logResult(true, 'Token registered successfully');
      console.log(`   Token: ${token.substring(0, 50)}...`);
      return token;
    } else {
      const error = await response.text();
      logResult(false, `Registration failed: ${response.status}`);
      console.log(`   Error: ${error}`);
      return null;
    }
  } catch (error) {
    logResult(false, `Exception: ${error.message}`);
    return null;
  }
}

async function testSendNotification(username) {
  logSection(`3. Send Test Notification (to ${username})`);
  try {
    const response = await fetch(`${API_BASE_URL}/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '🧪 בדיקת התראות',
        body: `זוהי התראה בדיקה שנשלחה ב-${new Date().toLocaleString('he-IL')}`,
        username: username,
        data: {
          test: true,
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      logResult(true, 'Notification sent successfully');
      console.log(`   Response:`, data);
      console.log(`   Sent to ${data.sent || 0} device(s)`);
      return true;
    } else {
      const error = await response.text();
      logResult(false, `Sending failed: ${response.status}`);
      console.log(`   Error: ${error}`);
      return false;
    }
  } catch (error) {
    logResult(false, `Exception: ${error.message}`);
    return false;
  }
}

async function testChatMessage(username) {
  logSection('4. Create Test Chat Message');
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: 'System',
        content: `🧪 הודעה בדיקה - ${new Date().toLocaleTimeString('he-IL')}`,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      logResult(true, 'Test chat message created');
      console.log(`   Message ID: ${data.id}`);
      console.log(`   Content: ${data.content}`);
      return true;
    } else {
      const error = await response.text();
      logResult(false, `Failed to create message: ${response.status}`);
      console.log(`   Error: ${error}`);
      return false;
    }
  } catch (error) {
    logResult(false, `Exception: ${error.message}`);
    return false;
  }
}

async function testPollingSimulation(username) {
  logSection('5. Simulate Background Polling');
  log('   Simulating what the iOS PWA polling would do...', 'yellow');
  
  try {
    // Check for chat messages (what the polling function checks)
    const chatRes = await fetch(`${API_BASE_URL}/api/chat/messages?limit=1&order=created_at.desc`);
    if (chatRes.ok) {
      const messages = await chatRes.json();
      if (messages && messages.length > 0) {
        const latest = messages[0];
        logResult(true, `Found ${messages.length} message(s)`);
        console.log(`   Latest message: "${latest.content}" from ${latest.sender}`);
        console.log(`   Time: ${new Date(latest.created_at).toLocaleString('he-IL')}`);
        return true;
      } else {
        logResult(false, 'No messages found');
        return false;
      }
    } else {
      logResult(false, `Failed to fetch messages: ${chatRes.status}`);
      return false;
    }
  } catch (error) {
    logResult(false, `Exception: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  log('  iOS PWA PUSH NOTIFICATION TEST SUITE', 'cyan');
  console.log('='.repeat(60));
  log(`Testing API at: ${API_BASE_URL}`, 'blue');
  log(`Timestamp: ${new Date().toLocaleString('he-IL')}`, 'blue');
  
  const testUsername = process.argv[2] || 'test_user';
  log(`Using test username: ${testUsername}`, 'yellow');
  
  const results = [];
  
  // Test 1: Health check
  const healthOk = await testHealthCheck();
  results.push(['Health Check', healthOk]);
  
  if (!healthOk) {
    log('\n[ERROR] API is not accessible. Please check the API_BASE_URL.', 'red');
    process.exit(1);
  }
  
  // Test 2: Register web token
  const webToken = await testRegisterToken(testUsername, 'web');
  results.push(['Register Web Token', webToken !== null]);
  
  // Test 3: Send notification
  results.push(['Send Notification', await testSendNotification(testUsername)]);
  
  // Test 4: Create test chat message
  results.push(['Create Test Chat Message', await testChatMessage(testUsername)]);
  
  // Test 5: Simulate polling
  results.push(['Polling Simulation', await testPollingSimulation(testUsername)]);
  
  // Summary
  logSection('TEST SUMMARY');
  const passed = results.filter(([, result]) => result).length;
  const total = results.length;
  
  results.forEach(([name, result]) => {
    logResult(result, name);
  });
  
  console.log(`\nResults: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    log('\n[SUCCESS] All tests passed!', 'green');
    log('The iOS PWA should receive notifications when:', 'yellow');
    log('  1. App is open or in background', 'yellow');
    log('  2. Polling checks every 30 seconds (visible) or 2 minutes (hidden)', 'yellow');
    log('  3. New chat messages or maintenance tasks are detected', 'yellow');
    process.exit(0);
  } else {
    log(`\n[WARNING] ${total - passed} test(s) failed.`, 'yellow');
    process.exit(1);
  }
}

// Run tests
main().catch(error => {
  log(`\n[FATAL ERROR] ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

