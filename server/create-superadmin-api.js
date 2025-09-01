const axios = require('axios');

async function createSuperAdminViaAPI() {
  try {
    console.log('🔄 Creating superadmin user via API...');
    
    const userData = {
      email: 'superadmin@gmail.com',
      password: '123456',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin'
    };

    // Make API call to register endpoint
    const response = await axios.post('http://localhost:30020/api/auth/register', userData);
    
    if (response.data.success) {
      console.log('✅ Superadmin user created successfully!');
      console.log('\n🎉 Superadmin Setup Complete!');
      console.log('📧 Email: superadmin@gmail.com');
      console.log('🔑 Password: 123456');
      console.log('🔐 Role: super_admin');
      console.log('\n📋 User Details:');
      console.log(JSON.stringify(response.data.data.user, null, 2));
      console.log('\nYou can now login to the application using these credentials.');
    } else {
      console.log('❌ Failed to create user:', response.data.message);
    }

  } catch (error) {
    if (error.response) {
      // Server responded with error status
      console.log('❌ API Error:', error.response.data.message);
      if (error.response.status === 409) {
        console.log('\n⚠️  User already exists! Trying to login to verify...');
        
        try {
          const loginResponse = await axios.post('http://localhost:30020/api/auth/login', {
            email: 'superadmin@gmail.com',
            password: '123456'
          });
          
          if (loginResponse.data.success) {
            console.log('✅ Superadmin user already exists and credentials are correct!');
            console.log('\n🎉 Superadmin Ready!');
            console.log('📧 Email: superadmin@gmail.com');
            console.log('🔑 Password: 123456');
            console.log('🔐 Role: super_admin');
            console.log('\n📋 User Details:');
            console.log(JSON.stringify(loginResponse.data.data.user, null, 2));
          } else {
            console.log('❌ User exists but password is different. You may need to update it manually.');
          }
        } catch (loginError) {
          console.log('❌ Could not verify existing user:', loginError.response?.data?.message || loginError.message);
        }
      }
    } else if (error.request) {
      // Request was made but no response received
      console.log('❌ Server is not responding. Make sure the server is running on http://localhost:30020');
      console.log('💡 Start the server with: cd server && node src/index.js');
    } else {
      // Something else happened
      console.log('❌ Error:', error.message);
    }
  }
}

// Check if server is running first
async function checkServerStatus() {
  try {
    const response = await axios.get('http://localhost:30020/health');
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.log('❌ Server is not running on http://localhost:30020');
    console.log('💡 Please start the server first with: cd server && node src/index.js');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Superadmin Creation Script');
  console.log('================================\n');
  
  const serverRunning = await checkServerStatus();
  if (serverRunning) {
    await createSuperAdminViaAPI();
  }
}

if (require.main === module) {
  main();
}
