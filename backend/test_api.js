/**
 * @file test_api.js
 * @description Automatic validation script to test backend API endpoints.
 * Simulates a full client interaction flow to ensure correct response payloads and DB writes.
 */

const axios = require('axios');

const API_URL = 'http://127.0.0.1:5001/api';

const runTests = async () => {
  console.log('🚀 Starting RoadReport Backend Integration Tests...');
  let token = '';
  let testReportId = '';

  const testUser = {
    name: 'Viva Student Test',
    email: `student_${Date.now()}@test.com`, // Unique email per run
    password: 'password123'
  };

  try {
    // 1. Test User Registration
    console.log('\nTesting POST /api/auth/register...');
    const regRes = await axios.post(`${API_URL}/auth/register`, testUser);
    if (regRes.status === 201 && regRes.data.success) {
      console.log('✅ User registered successfully!');
      token = regRes.data.data.token;
    } else {
      console.error('❌ User registration failed:', regRes.data);
      return;
    }

    // 2. Test User Login
    console.log('\nTesting POST /api/auth/login...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    if (loginRes.status === 200 && loginRes.data.success) {
      console.log('✅ User logged in successfully!');
    } else {
      console.error('❌ User login failed:', loginRes.data);
      return;
    }

    // 3. Test Profile Retrieval (Auth protected)
    console.log('\nTesting GET /api/auth/profile...');
    const profileRes = await axios.get(`${API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (profileRes.status === 200 && profileRes.data.success) {
      console.log(`✅ Profile retrieved! Name: ${profileRes.data.data.name}`);
    } else {
      console.error('❌ Profile retrieval failed:', profileRes.data);
      return;
    }

    // 4. Test Report Creation
    console.log('\nTesting POST /api/reports...');
    const testReport = {
      title: 'Pothole on Main Street Test',
      description: 'A deep pothole that is damaging car tires and causing minor traffic hazards.',
      category: 'pothole',
      severity: 'high',
      location: {
        latitude: 23.0225,
        longitude: 72.5714,
        address: 'Main Street Road, Near Town Hall, Gujarat, India'
      },
      media: ['https://res.cloudinary.com/demo/image/upload/sample.jpg']
    };

    const createRes = await axios.post(`${API_URL}/reports`, testReport, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (createRes.status === 201 && createRes.data.success) {
      console.log('✅ Civic report created successfully!');
      testReportId = createRes.data.data._id;
    } else {
      console.error('❌ Report creation failed:', createRes.data);
      return;
    }

    // 5. Test Get All Reports & Filters
    console.log('\nTesting GET /api/reports (with category filter)...');
    const getRes = await axios.get(`${API_URL}/reports?category=pothole`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (getRes.status === 200 && getRes.data.success) {
      console.log(`✅ Retrieved ${getRes.data.count} reports matching category: pothole`);
    } else {
      console.error('❌ Retrieve reports failed:', getRes.data);
      return;
    }

    // 6. Test Duplicate Detection Geolocation Filter
    console.log('\nTesting GET /api/reports?near=lat,lng&radius=50...');
    const dupRes = await axios.get(`${API_URL}/reports?category=pothole&near=23.0225,72.5714&radius=50`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (dupRes.status === 200 && dupRes.data.success) {
      console.log(`✅ Duplicate check succeeded! Found ${dupRes.data.data.length} similar reports near coordinates.`);
    } else {
      console.error('❌ Duplicate check filter failed:', dupRes.data);
      return;
    }

    // 7. Test Upvote Toggling
    console.log('\nTesting PATCH /api/reports/:id/upvote...');
    const upvoteRes = await axios.patch(`${API_URL}/reports/${testReportId}/upvote`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (upvoteRes.status === 200 && upvoteRes.data.success) {
      console.log(`✅ Report upvoted! Current upvote count: ${upvoteRes.data.upvotesCount}`);
    } else {
      console.error('❌ Upvote toggling failed:', upvoteRes.data);
      return;
    }

    // 8. Test Status Update
    console.log('\nTesting PATCH /api/reports/:id/status...');
    const statusRes = await axios.patch(`${API_URL}/reports/${testReportId}/status`, {
      status: 'under_review'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (statusRes.status === 200 && statusRes.data.success) {
      console.log(`✅ Report status updated successfully to: ${statusRes.data.data.status}`);
    } else {
      console.error('❌ Status update failed:', statusRes.data);
      return;
    }

    console.log('\n🎉 ALL BACKEND API INTEGRATION TESTS PASSED SUCCESSFULLY! 🌈');
  } catch (error) {
    console.error('\n❌ An error occurred during test execution:', error.message);
    if (error.response) {
      console.error('API Error Response Data:', error.response.data);
    }
  }
};

runTests();
