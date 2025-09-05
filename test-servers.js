const http = require('http');

async function testServer(url, name) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`✅ ${name}: Status ${res.statusCode}`);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            console.log(`   Response: ${parsed.message || parsed.status || 'OK'}`);
          } catch (e) {
            console.log(`   Response received (HTML)`);
          }
        }
        resolve(true);
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${name}: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log(`⏰ ${name}: Timeout`);
      req.destroy();
      resolve(false);
    });
  });
}

async function runTests() {
  console.log('🚀 Testing server connectivity...\n');
  
  // Test backend
  await testServer('http://localhost:30006/health', 'Backend Server Health');
  
  // Test frontend (just check if it responds)
  await testServer('http://localhost:5173', 'Frontend Server');
  
  console.log('\n✨ Server tests completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Open http://localhost:5173 in your browser');
  console.log('2. Test login/registration');
  console.log('3. Test company selection (super admin)');
  console.log('4. Test support settings');
  console.log('5. Test widget functionality');
}

runTests().catch(console.error);
