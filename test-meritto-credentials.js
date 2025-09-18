// Test script to verify Meritto API credentials
const testMerittoCredentials = async () => {
  // You'll need to replace these with your actual credentials
  const secretKey = '7073a99d3efe4b0c9066e84e08d9916d';
  const accessKey = '79b6586cdd9c400b9e014e68368b31eb';
  
  const testData = {
    email: 'test@example.com',
    mobile: '9999999999',
    search_criteria: 'email',
    name: 'Test User',
    enquiry: 'Test enquiry',
    question: 'Test question',
    specialization: 'Software Development',
    campus: 'Bangalore',
    course: 'Web Development',
    user_date: new Date().toLocaleDateString('en-GB')
  };

  try {
    console.log('🧪 Testing Meritto API credentials...');
    console.log('📋 Test data:', testData);
    
    const response = await fetch('https://api.nopaperforms.io/lead/v1/createOrUpdate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'secret-key': secretKey,
        'access-key': accessKey,
      },
      body: JSON.stringify(testData),
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📊 Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Credentials are working!');
    } else {
      console.log('❌ Credentials failed:', response.status, responseText);
    }
  } catch (error) {
    console.error('❌ Error testing credentials:', error);
  }
};

// Run the test
testMerittoCredentials();
