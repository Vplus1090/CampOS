import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB, { disconnectDB } from './config/db.js';
import SkillGig from './models/SkillGig.js';
import MenuItem from './models/MenuItem.js';

dotenv.config();

const PORT = process.env.PORT || 5001;
const BASE_URL = `http://localhost:${PORT}/api`;

async function loginUser(email, password) {
  console.log(`\n🔑 Attempting login for ${email}...`);
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${res.statusText}`);
  }

  const data = await res.json();
  console.log(`✅ Login successful. Role: ${data.user.role}`);

  // Retrieve cookies to maintain state in subsequent requests
  let cookies = '';
  if (res.headers.getSetCookie) {
    cookies = res.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
  } else if (res.headers.get('set-cookie')) {
    cookies = res.headers.get('set-cookie').split(',').map(c => c.split(';')[0]).join('; ');
  }

  return { user: data.user, cookies };
}

async function runTests() {
  console.log('⚡ Starting CampOS Granular Role Separation Verification & Validation Test Suite ⚡');

  // Let's connect directly to MongoDB first to inspect schemas and assert DB properties
  console.log('\n📥 Connecting directly to Mongoose database to assert schemas...');
  await connectDB();
  console.log('✅ Database connected.');

  // Assert SkillGig schema properties
  const skillGigPaths = SkillGig.schema.paths;
  if (skillGigPaths.IsReported && skillGigPaths.ReportReason) {
    console.log('✅ DATABASE SCHEMAS MATCH: SkillGig model contains IsReported and ReportReason.');
  } else {
    throw new Error('❌ DATABASE SCHEMAS MISMATCH: SkillGig is missing IsReported or ReportReason fields.');
  }

  // Find or seed a test SkillGig for our reporting and moderation tests
  let targetGig = await SkillGig.findOne({ StudentName: { $ne: 'Student' } });
  if (!targetGig) {
    console.log('ℹ️ No existing non-owner SkillGig found. Seeding a temporary one...');
    targetGig = await SkillGig.create({
      StudentName: 'Kunal',
      SkillOffered: 'React Native builds',
      SkillWanted: 'Docker deployment',
      ContactInfo: 'chat_only_private'
    });
  }
  console.log(`👉 Target SkillGig selected: [ID: ${targetGig._id}] [StudentName: ${targetGig.StudentName}]`);

  // Start verifying API Endpoints
  try {
    // ──── TEST 1: STUDENT FLOWS ────
    console.log('\n─── [TEST 1] Student Role Verification ───');
    const studentSession = await loginUser('student@campos.local', 'Student@123');

    // Test 1a: Student reports a gig
    console.log(`\n🚩 Student [${studentSession.user.firstName}] is reporting listing [ID: ${targetGig._id}]...`);
    const reportRes = await fetch(`${BASE_URL}/skillgigs/${targetGig._id}/report`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': studentSession.cookies
      },
      body: JSON.stringify({ ReportReason: 'Inappropriate description content.' })
    });

    if (!reportRes.ok) {
      throw new Error(`Failed to report gig as student: ${await reportRes.text()}`);
    }
    const reportData = await reportRes.json();
    console.log('✅ Gig reported successfully:', reportData.message);

    // Assert reported status in Database directly
    const gigFromDb = await SkillGig.findById(targetGig._id);
    if (gigFromDb.IsReported === true && gigFromDb.ReportReason === 'Inappropriate description content.') {
      console.log('✅ DATABASE VERIFICATION: IsReported set to true, and ReportReason matches perfectly.');
    } else {
      throw new Error('❌ DATABASE VERIFICATION FAIL: Gig was not updated correctly in database.');
    }

    // Test 1b: Student attempts Super Admin Delete action (SHOULD BE FORBIDDEN)
    console.log(`\n🔒 Student is attempting to perform moderation DELETE on listing [ID: ${targetGig._id}] (EXPECTED FORBIDDEN)...`);
    const studentDeleteRes = await fetch(`${BASE_URL}/skillgigs/${targetGig._id}`, {
      method: 'DELETE',
      headers: { 'Cookie': studentSession.cookies }
    });
    if (studentDeleteRes.status === 403) {
      console.log('✅ SECURITY BORDER GUARD: Access correctly forbidden (HTTP 403 Forbidden).');
    } else {
      throw new Error(`❌ SECURITY BORDER GUARD FAILURE: Student was allowed or received status ${studentDeleteRes.status}`);
    }

    // ──── TEST 2: CANTEEN ADMIN FLOWS ────
    console.log('\n─── [TEST 2] Canteen Admin Role Verification ───');
    const canteenSession = await loginUser('canteen@campos.local', 'Canteen@123');

    // Test 2a: Create Menu Item
    console.log('\n🍔 Canteen Admin is creating a new specialty menu item...');
    const createRes = await fetch(`${BASE_URL}/canteen/menu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': canteenSession.cookies
      },
      body: JSON.stringify({
        Name: 'Test Paneer Tikka Wrap',
        Price: 120,
        Category: 'Starters',
        IsAvailable: true
      })
    });

    if (!createRes.ok) {
      throw new Error(`Failed to create canteen item: ${await createRes.text()}`);
    }
    const newItem = await createRes.json();
    console.log(`✅ Menu Item created successfully: [ID: ${newItem._id}] Name: "${newItem.Name}", Price: ₹${newItem.Price}`);

    // Test 2b: Update Price
    console.log(`\n✏️ Canteen Admin is editing price of item [ID: ${newItem._id}]...`);
    const updatePriceRes = await fetch(`${BASE_URL}/canteen/menu/${newItem._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': canteenSession.cookies
      },
      body: JSON.stringify({ Price: 135 })
    });

    if (!updatePriceRes.ok) {
      throw new Error(`Failed to update price: ${await updatePriceRes.text()}`);
    }
    const updatedItem = await updatePriceRes.json();
    console.log(`✅ Menu Item price updated: ₹${updatedItem.Price}`);

    // Test 2c: Toggle stock availability
    console.log(`\n🔄 Canteen Admin is toggling availability of item [ID: ${newItem._id}]...`);
    const toggleRes = await fetch(`${BASE_URL}/canteen/menu/${newItem._id}/toggle`, {
      method: 'PATCH',
      headers: { 'Cookie': canteenSession.cookies }
    });

    if (!toggleRes.ok) {
      throw new Error(`Failed to toggle availability: ${await toggleRes.text()}`);
    }
    const toggleData = await toggleRes.json();
    console.log(`✅ Menu Item availability toggled: InStock = ${toggleData.item.IsAvailable}`);

    // Test 2d: Canteen Admin attempts Super Admin Delete action on Skill Share (SHOULD BE FORBIDDEN)
    console.log(`\n🔒 Canteen Admin is attempting to moderate delete a Skill Listing (EXPECTED FORBIDDEN)...`);
    const canteenDeleteSkillRes = await fetch(`${BASE_URL}/skillgigs/${targetGig._id}`, {
      method: 'DELETE',
      headers: { 'Cookie': canteenSession.cookies }
    });
    if (canteenDeleteSkillRes.status === 403) {
      console.log('✅ SECURITY BORDER GUARD: Access correctly forbidden (HTTP 403 Forbidden).');
    } else {
      throw new Error(`❌ SECURITY BORDER GUARD FAILURE: Canteen Admin was allowed to delete or received status ${canteenDeleteSkillRes.status}`);
    }

    // ──── TEST 3: SUPER ADMIN FLOWS ────
    console.log('\n─── [TEST 3] Super Admin Role Verification ───');
    const adminSession = await loginUser('admin@campos.local', 'CampOS@Admin123');

    // Test 3a: Super Admin moderates (deletes) the reported SkillGig
    console.log(`\n🗑️ Super Admin is moderating (deleting) the reported listing [ID: ${targetGig._id}]...`);
    const adminDeleteRes = await fetch(`${BASE_URL}/skillgigs/${targetGig._id}`, {
      method: 'DELETE',
      headers: { 'Cookie': adminSession.cookies }
    });

    if (!adminDeleteRes.ok) {
      throw new Error(`Failed to delete listing as Super Admin: ${await adminDeleteRes.text()}`);
    }
    const adminDeleteData = await adminDeleteRes.json();
    console.log('✅ Listing moderated and removed successfully:', adminDeleteData.message);

    // Test 3b: Verify deletion directly in Database
    const deletedGig = await SkillGig.findById(targetGig._id);
    if (!deletedGig) {
      console.log('✅ DATABASE VERIFICATION: Listing is completely removed from the MongoDB.');
    } else {
      throw new Error('❌ DATABASE VERIFICATION FAIL: Listing still exists in database after Super Admin deletion.');
    }

    // Cleanup: Delete the test canteen menu item created
    console.log(`\n🗑️ Cleaning up: Canteen Admin is deleting test item [ID: ${newItem._id}]...`);
    const cleanMenuRes = await fetch(`${BASE_URL}/canteen/menu/${newItem._id}`, {
      method: 'DELETE',
      headers: { 'Cookie': canteenSession.cookies }
    });
    if (cleanMenuRes.ok) {
      console.log('✅ Cleanup finished successfully.');
    } else {
      console.log('⚠️ Warning: Cleanup failed to remove menu item');
    }

    console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY AND PASSED! ZERO ERRORS!');
    console.log('🚀 Role-Based Access Control and separation layers are operating perfectly!');
  } catch (err) {
    console.error('\n❌ VERIFICATION TEST SUITE FAILED!');
    console.error(err);
    process.exit(1);
  } finally {
    await disconnectDB();
    console.log('📥 Database disconnected. Execution complete.\n');
  }
}

runTests();
