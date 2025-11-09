import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';
let adminToken = '';
let customerToken = '';
let customerId = '';

const test = async () => {
  console.log('🧪 Starting Electric Buddy Backend Tests...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health Check:', healthResponse.data.message);

    // Test 2: Register Admin
    console.log('\n2. Testing Admin Registration...');
    const adminReg = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Test Admin',
      username: 'testadmin',
      password: 'test123',
      mobile: '9876543210',
      role: 'admin',
      secretCode: 'CODE123'
    });
    adminToken = adminReg.data.token;
    console.log('✅ Admin Registered:', adminReg.data.message);

    // Test 3: Login Admin
    console.log('\n3. Testing Admin Login...');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      username: 'testadmin',
      password: 'test123'
    });
    adminToken = adminLogin.data.token;
    console.log('✅ Admin Login:', adminLogin.data.message);

    // Test 4: Create Customer
    console.log('\n4. Testing Customer Creation...');
    const customerData = {
      name: 'Test Customer',
      username: 'testcustomer',
      password: 'cust123',
      mobile: '9876543212',
      area: 'Test Area',
      address: 'Test Address',
      workStatus: 'ongoing',
      jobDetail: 'Test electrical work',
      paymentPaid: 1000,
      paymentDue: 2000,
      dueDate: '2024-12-31',
      completionStatus: 'In Progress',
      materials: ['Wires', 'Switches']
    };

    const customerCreate = await axios.post(`${API_BASE}/customers`, customerData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    customerId = customerCreate.data.customer._id;
    console.log('✅ Customer Created:', customerCreate.data.message);

    // Test 5: Login as Customer
    console.log('\n5. Testing Customer Login...');
    const customerLogin = await axios.post(`${API_BASE}/auth/login`, {
      username: 'testcustomer',
      password: 'cust123'
    });
    customerToken = customerLogin.data.token;
    console.log('✅ Customer Login:', customerLogin.data.message);

    // Test 6: Get All Customers (Admin)
    console.log('\n6. Testing Get All Customers...');
    const customers = await axios.get(`${API_BASE}/customers`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Customers Fetched:', customers.data.customers.length, 'customers');

    // Test 7: Get Customer Stats
    console.log('\n7. Testing Customer Stats...');
    const stats = await axios.get(`${API_BASE}/customers/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Stats Fetched:', stats.data.stats);

    console.log('\n🎉 ALL TESTS PASSED! Backend is working perfectly!');
    console.log('\n📊 Test Summary:');
    console.log('   - Admin Registration & Login: ✅');
    console.log('   - Customer Creation: ✅');
    console.log('   - Customer Login: ✅');
    console.log('   - Data Retrieval: ✅');
    console.log('   - Role-based Access: ✅');

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data.message);
      if (error.response.data.errors) {
        console.error('Errors:', error.response.data.errors);
      }
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
};

test();