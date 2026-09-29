/**
 * Automated Test Runner for College Exam Timetable Management System
 * Executes all 10 tests specified in prompt + user profile tests
 */

import app from './server.js';
import http from 'http';

async function runTests() {
  console.log('--- STARTING COLLEGE EXAM TIMETABLE VALIDATION SUITE ---');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      process.exitCode = 1;
    }
  }

  const runId = Date.now();
  const adminEmail = `admin_${runId}@college.edu`;
  const studentAEmail = `student_a_${runId}@college.edu`;
  const studentBEmail = `student_b_${runId}@college.edu`;

  try {
    // ----------------------------------------------------
    // Test 1: Register and Login Admin
    // ----------------------------------------------------
    const adminRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Admin User',
        email: adminEmail,
        password: 'Admin@123',
        confirmPassword: 'Admin@123',
        role: 'admin'
      })
    });
    const adminRegData = await adminRegRes.json();
    assert(adminRegRes.status === 201 && adminRegData.user.role === 'admin', 'Test 1a: Admin registration');

    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: 'Admin@123',
        role: 'admin'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminLoginData.token, 'Test 1b: Admin login succeeds and returns JWT');
    const adminToken = adminLoginData.token;

    // ----------------------------------------------------
    // Test 2: Admin adds Java (3rd Year, Section A)
    // ----------------------------------------------------
    const addExam1Res = await fetch(`${baseUrl}/api/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        subject: 'Java Test',
        year: '3rd Year',
        section: 'A',
        examDate: '2026-10-10',
        examTime: '10:00 AM'
      })
    });
    const addExam1Data = await addExam1Res.json();
    assert(addExam1Res.status === 201 && addExam1Data.exam.subject === 'Java Test', 'Test 2: Admin adds Java exam (3rd Year, Section A)');
    const javaExamId = addExam1Data.exam._id || addExam1Data.exam.id;

    // ----------------------------------------------------
    // Test 3: Admin adds DBMS (3rd Year, Section A)
    // ----------------------------------------------------
    const addExam2Res = await fetch(`${baseUrl}/api/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        subject: 'DBMS Test',
        year: '3rd Year',
        section: 'A',
        examDate: '2026-10-12',
        examTime: '10:00 AM'
      })
    });
    const addExam2Data = await addExam2Res.json();
    assert(addExam2Res.status === 201 && addExam2Data.exam.subject === 'DBMS Test', 'Test 3: Admin adds DBMS exam (3rd Year, Section A)');

    // ----------------------------------------------------
    // Test 4: Admin adds Computer Networks (3rd Year, Section B)
    // ----------------------------------------------------
    const addExam3Res = await fetch(`${baseUrl}/api/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        subject: 'Computer Networks Test',
        year: '3rd Year',
        section: 'B',
        examDate: '2026-10-14',
        examTime: '10:00 AM'
      })
    });
    const addExam3Data = await addExam3Res.json();
    assert(addExam3Res.status === 201 && addExam3Data.exam.subject === 'Computer Networks Test', 'Test 4: Admin adds Computer Networks (3rd Year, Section B)');

    // ----------------------------------------------------
    // Test 5: Register Student A (3rd Year, Section A)
    // ----------------------------------------------------
    const studentARegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Student A Test',
        email: studentAEmail,
        password: 'Student@123',
        confirmPassword: 'Student@123',
        role: 'student',
        year: '3rd Year',
        section: 'A'
      })
    });
    const studentARegData = await studentARegRes.json();
    assert(studentARegRes.status === 201, 'Test 5a: Register Student A (3rd Year, Section A)');

    const studentALoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentAEmail,
        password: 'Student@123',
        role: 'student'
      })
    });
    const studentALoginData = await studentALoginRes.json();
    const studentAToken = studentALoginData.token;
    assert(studentALoginRes.status === 200 && studentAToken, 'Test 5b: Student A login succeeds');

    // Fetch exams as Student A: MUST see Java & DBMS, MUST NOT see Computer Networks
    const studentAExamsRes = await fetch(`${baseUrl}/api/exams`, {
      headers: { 'Authorization': `Bearer ${studentAToken}` }
    });
    const studentAExamsData = await studentAExamsRes.json();
    const aSubjects = studentAExamsData.exams.map(e => e.subject);
    const hasJava = aSubjects.includes('Java Test') || aSubjects.includes('Java');
    const hasDBMS = aSubjects.includes('DBMS Test') || aSubjects.includes('DBMS');
    const hasNetworks = aSubjects.includes('Computer Networks Test');
    assert(hasJava && hasDBMS && !hasNetworks, 'Test 5c: Student A only receives Java & DBMS, NOT Computer Networks');

    // ----------------------------------------------------
    // Test 6: Register Student B (3rd Year, Section B)
    // ----------------------------------------------------
    const studentBRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Student B Test',
        email: studentBEmail,
        password: 'Student@123',
        confirmPassword: 'Student@123',
        role: 'student',
        year: '3rd Year',
        section: 'B'
      })
    });
    assert(studentBRegRes.status === 201, 'Test 6a: Register Student B (3rd Year, Section B)');

    const studentBLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentBEmail,
        password: 'Student@123',
        role: 'student'
      })
    });
    const studentBLoginData = await studentBLoginRes.json();
    const studentBToken = studentBLoginData.token;
    assert(studentBLoginRes.status === 200 && studentBToken, 'Test 6b: Student B login succeeds');

    const studentBExamsRes = await fetch(`${baseUrl}/api/exams`, {
      headers: { 'Authorization': `Bearer ${studentBToken}` }
    });
    const studentBExamsData = await studentBExamsRes.json();
    const bSubjects = studentBExamsData.exams.map(e => e.subject);
    const bHasNetworks = bSubjects.includes('Computer Networks Test') || bSubjects.includes('Computer Networks');
    const bHasJava = bSubjects.includes('Java Test');
    const bHasDBMS = bSubjects.includes('DBMS Test');
    assert(bHasNetworks && !bHasJava && !bHasDBMS, 'Test 6c: Student B only receives Computer Networks, NOT Java/DBMS');

    // ----------------------------------------------------
    // Test 7: Unauthorized role access checks
    // ----------------------------------------------------
    // If student attempts to pass year/section via query params, backend ignores and forces student's JWT cohort
    const tamperRes = await fetch(`${baseUrl}/api/exams?year=3rd%20Year&section=B`, {
      headers: { 'Authorization': `Bearer ${studentAToken}` }
    });
    const tamperData = await tamperRes.json();
    const tamperSubjects = tamperData.exams.map(e => e.subject);
    assert(!tamperSubjects.includes('Computer Networks Test'), 'Test 7: Tamper protection - Student A cannot fetch Section B exams');

    // ----------------------------------------------------
    // Test 8: Student attempts POST /api/exams -> MUST return 403 Forbidden
    // ----------------------------------------------------
    const studentAddRes = await fetch(`${baseUrl}/api/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentAToken}`
      },
      body: JSON.stringify({
        subject: 'Hacked Exam',
        year: '3rd Year',
        section: 'A',
        examDate: '2026-10-20',
        examTime: '10:00 AM'
      })
    });
    assert(studentAddRes.status === 403, 'Test 8: Student attempting POST /api/exams returns 403 Forbidden');

    // ----------------------------------------------------
    // Test 9: Student attempts DELETE /api/exams/:id -> MUST return 403 Forbidden
    // ----------------------------------------------------
    const studentDelRes = await fetch(`${baseUrl}/api/exams/${javaExamId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${studentAToken}`
      }
    });
    assert(studentDelRes.status === 403, 'Test 9: Student attempting DELETE /api/exams/:id returns 403 Forbidden');

    // Admin CAN delete exam
    const adminDelRes = await fetch(`${baseUrl}/api/exams/${javaExamId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    assert(adminDelRes.status === 200, 'Test 9b: Admin successfully deletes exam');

    // ----------------------------------------------------
    // Test 10: USER PROFILE ENDPOINTS (/api/users/me and /api/users/update)
    // ----------------------------------------------------
    // GET /api/users/me
    const meRes = await fetch(`${baseUrl}/api/users/me`, {
      headers: { 'Authorization': `Bearer ${studentAToken}` }
    });
    const meData = await meRes.json();
    assert(
      meRes.status === 200 &&
      meData.user.name === 'Student A Test' &&
      meData.user.email === studentAEmail &&
      meData.user.year === '3rd Year' &&
      meData.user.section === 'A',
      'Test 10a: GET /api/users/me returns accurate profile details'
    );

    // POST /api/users/update - Edit Name and Password with bcrypt verification
    const updateRes = await fetch(`${baseUrl}/api/users/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentAToken}`
      },
      body: JSON.stringify({
        name: 'Student A Updated',
        currentPassword: 'Student@123',
        newPassword: 'NewPassword@456',
        confirmNewPassword: 'NewPassword@456'
      })
    });
    const updateData = await updateRes.json();
    assert(
      updateRes.status === 200 &&
      updateData.token &&
      updateData.user.name === 'Student A Updated',
      'Test 10b: POST /api/users/update updates name and password with bcrypt, returns refreshed JWT'
    );

    // Verify login with new password succeeds
    const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentAEmail,
        password: 'NewPassword@456',
        role: 'student'
      })
    });
    assert(newLoginRes.status === 200, 'Test 10c: Login succeeds with newly updated bcrypt hashed password');

    // Verify old password fails
    const oldLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentAEmail,
        password: 'Student@123',
        role: 'student'
      })
    });
    assert(oldLoginRes.status === 401, 'Test 10d: Login fails with old invalidated password');

    console.log(`\n======================================================`);
    console.log(`RESULTS: ${passed} / ${total} tests PASSED`);
    console.log(`======================================================\n`);

  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTests();
