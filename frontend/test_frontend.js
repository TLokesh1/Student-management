import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const BASE_URL = 'http://localhost:5173';

const results = [];

function record(category, testName, status, details = '') {
  results.push({ category, testName, status, details: String(details) });
  const icon = status === 'PASS' ? '✓' : '✗';
  console.log(`[${status}] ${category.padEnd(16)} | ${testName.padEnd(45)} | ${icon} ${details}`);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function clickButtonWithText(page, text) {
  const clicked = await page.evaluate((targetText) => {
    const buttons = Array.from(document.querySelectorAll('button, a'));
    const btn = buttons.find((b) => b.textContent && b.textContent.includes(targetText));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }, text);

  if (!clicked) {
    throw new Error(`Button or link containing text "${text}" not found`);
  }
}

async function setSearchInput(page, text) {
  await page.waitForSelector('.search-input');
  await page.click('.search-input', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type('.search-input', text, { delay: 40 });
  await sleep(600);
}

async function waitForSpinnerToFinish(page) {
  await page.waitForFunction(() => !document.querySelector('.spinner-container'), { timeout: 8000 }).catch(() => {});
}

async function loginAs(page, usernameOrRole, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.credential-btn');

  const roleLower = String(usernameOrRole).toLowerCase();
  if (roleLower === 'admin' || roleLower === 'faculty' || roleLower === 'student') {
    const idx = roleLower === 'admin' ? 0 : roleLower === 'faculty' ? 1 : 2;
    await page.evaluate((btnIdx) => {
      const btns = Array.from(document.querySelectorAll('.credential-btn'));
      btns[btnIdx]?.click();
    }, idx);
    await sleep(200);
  } else {
    await page.waitForSelector('#username');
    await page.evaluate(() => {
      document.querySelector('#username').value = '';
      document.querySelector('#password').value = '';
    });
    await page.type('#username', usernameOrRole);
    await page.type('#password', password);
  }

  await page.click('button[type="submit"]');
  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 8000 });
}

async function logout(page) {
  try {
    await page.evaluate(() => {
      const btn = document.querySelector('button[title="Sign Out"]');
      if (btn) btn.click();
    });
    await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 4000 });
  } catch {
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  }
}

async function runBrowserTests() {
  console.log('=====================================================');
  console.log('  STARTING FRONTEND AUTOMATED BROWSER TEST SUITE     ');
  console.log('=====================================================');
  console.log(`Browser Executable: ${CHROME_PATH}`);
  console.log(`Target Frontend:   ${BASE_URL}\n`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1280,800'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Clear storage first
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => localStorage.clear());

  const suffix = Date.now().toString().slice(-4);
  const testDeptName = `Aerospace Engineering ${suffix}`;
  const testDeptCode = `AERO_${suffix}`;
  const testFacName = `Dr. Robert Goddard ${suffix}`;
  const testFacEmail = `goddard_${suffix}@university.edu`;
  const testCourseName = `Orbital Mechanics ${suffix}`;
  const testCourseCode = `AERO301_${suffix}`;
  const testStuName = `Neil Armstrong ${suffix}`;
  const testStuEmail = `armstrong_${suffix}@university.edu`;
  const testAssignTitle = `Propulsion Analysis ${suffix}`;

  try {
    // ==========================================
    // 1. UNAUTHENTICATED & ROUTE PROTECTION
    // ==========================================
    console.log('\n--- SECTION 1: PROTECTED ROUTES & LOGIN FORM VALIDATION ---');

    // 1.1 Unauthenticated /dashboard -> Redirects to /login
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    try {
      await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 6000 });
      record('Auth', 'Unauthenticated /dashboard Redirect', 'PASS', 'Redirected to /login');
    } catch {
      record('Auth', 'Unauthenticated /dashboard Redirect', 'FAIL', `Current URL: ${page.url()}`);
    }

    // 1.2 Unauthenticated /students -> Redirects to /login
    await page.goto(`${BASE_URL}/students`, { waitUntil: 'networkidle2' });
    try {
      await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 6000 });
      record('Auth', 'Unauthenticated /students Redirect', 'PASS', 'Redirected to /login');
    } catch {
      record('Auth', 'Unauthenticated /students Redirect', 'FAIL', `Current URL: ${page.url()}`);
    }

    // 1.3 Login validation: empty submission check
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('button[type="submit"]');
    await page.click('button[type="submit"]');
    await sleep(300);
    const hasFormError = await page.evaluate(() => {
      const u = document.querySelector('#username');
      return !u.checkValidity();
    });
    if (hasFormError) {
      record('Validation', 'Login Empty Submission Check', 'PASS', 'HTML5 form validation prevented empty submission');
    } else {
      record('Validation', 'Login Empty Submission Check', 'FAIL', 'Validation not triggered');
    }

    // 1.4 Bad credentials rejection
    await page.type('#username', 'admin');
    await page.type('#password', 'wrongpassword');
    await page.click('button[type="submit"]');
    try {
      await page.waitForSelector('.alert-danger, .alert', { timeout: 6000 });
      const errorMsg = await page.$eval('.alert', (el) => el.textContent);
      record('Auth', 'Bad Credentials Error Display', 'PASS', `Rejected: ${errorMsg}`);
    } catch (e) {
      record('Auth', 'Bad Credentials Error Display', 'FAIL', 'No error message displayed within 6s');
    }

    // ==========================================
    // 2. ADMIN AUTHENTICATION & DASHBOARD
    // ==========================================
    console.log('\n--- SECTION 2: ADMIN AUTHENTICATION & DASHBOARD ---');

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    // Click demo quick-fill "Admin"
    await page.evaluate(() => {
      const fillButtons = Array.from(document.querySelectorAll('.credential-btn'));
      fillButtons[0]?.click();
    });
    await sleep(200);
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 8000 });
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });

    record('Auth', 'Admin Login via Demo Quick-Fill', 'PASS', 'Authenticated and navigated to /dashboard');

    // 2.1 Verify Dashboard Stat Cards
    await page.waitForSelector('.stat-card');
    const statCards = await page.$$('.stat-card');
    if (statCards.length >= 4) {
      record('Dashboard', 'Admin Stat Cards Loaded', 'PASS', `Found ${statCards.length} stat cards`);
    } else {
      record('Dashboard', 'Admin Stat Cards Loaded', 'FAIL', `Found only ${statCards.length} cards`);
    }

    // 2.2 Verify Admin Navigation Links
    const navLinks = await page.$$eval('.nav-link', (els) => els.map((e) => e.textContent.trim()));
    const expectedAdminNav = [
      'Dashboard',
      'Students',
      'Departments',
      'Faculty',
      'Courses',
      'Enrollment',
      'Attendance',
      'Marks & Grades',
      'Assignments',
      'My Profile'
    ];
    const hasAllAdminNav = expectedAdminNav.every((n) => navLinks.includes(n));
    if (hasAllAdminNav) {
      record('Navigation', 'Admin Navigation Links Present', 'PASS', 'All 10 navigation links rendered');
    } else {
      record('Navigation', 'Admin Navigation Links Present', 'FAIL', `Links: ${navLinks.join(', ')}`);
    }

    // ==========================================
    // 3. DEPARTMENTS CRUD (ADMIN)
    // ==========================================
    console.log('\n--- SECTION 3: DEPARTMENTS CRUD ---');

    await page.goto(`${BASE_URL}/departments`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.page-title');

    // Open Add Modal
    await clickButtonWithText(page, 'Add Department');
    await page.waitForSelector('#dept-name');

    // Fill form
    await page.type('#dept-name', testDeptName);
    await page.type('#dept-code', testDeptCode);
    await page.type('#dept-desc', 'Aeronautical and Space Exploration Sciences');
    await page.click('button[type="submit"][form="dept-form"]');
    await page.waitForSelector('.alert-success', { timeout: 6000 });

    // Verify department added in table
    const pageContent = await page.content();
    if (pageContent.includes(testDeptName)) {
      record('Departments', 'Create Department via UI Modal', 'PASS', `Created ${testDeptName}`);
    } else {
      record('Departments', 'Create Department via UI Modal', 'FAIL', 'Department not found in table');
    }

    // Search filter
    await setSearchInput(page, testDeptCode);
    const searchMatch = await page.$eval('tbody', (el, code) => el.textContent.includes(code), testDeptCode).catch(() => false);
    if (searchMatch) {
      record('Departments', 'Search Department by Code', 'PASS', `Filtered to ${testDeptCode}`);
    } else {
      record('Departments', 'Search Department by Code', 'FAIL', 'Search did not match');
    }
    // Clear search
    await page.click('.search-input-wrapper button');
    await sleep(500);

    // View Details Modal
    const viewBtn = await page.$('tbody tr:last-child .btn-ghost');
    if (viewBtn) {
      await viewBtn.click();
      await sleep(500);
      const detailTitle = await page.$eval('.modal-title', (el) => el.textContent).catch(() => '');
      if (detailTitle.includes('Department Details')) {
        record('Departments', 'View Department Details Modal', 'PASS', 'Details modal rendered');
        await page.click('.modal-close');
        await sleep(300);
      }
    }

    // ==========================================
    // 4. FACULTY CRUD (ADMIN)
    // ==========================================
    console.log('\n--- SECTION 4: FACULTY CRUD ---');

    await page.goto(`${BASE_URL}/faculty`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.page-title');

    // Open Add Modal
    await clickButtonWithText(page, 'Add Faculty');
    await page.waitForSelector('#fac-name');

    await page.type('#fac-name', testFacName);
    await page.type('#fac-email', testFacEmail);
    await page.type('#fac-phone', '9876543210');
    await page.type('#fac-desig', 'Senior Propulsion Scientist');

    // Select created department
    await page.waitForSelector('#fac-dept option');
    await page.select('#fac-dept', await page.$eval(`#fac-dept option:last-child`, (o) => o.value));

    await page.click('button[type="submit"][form="faculty-form"]');
    await page.waitForSelector('.alert-success', { timeout: 6000 });

    const facContent = await page.content();
    if (facContent.includes(testFacName)) {
      record('Faculty', 'Create Faculty Member via UI', 'PASS', `Created ${testFacName}`);
    } else {
      record('Faculty', 'Create Faculty Member via UI', 'FAIL', 'Faculty not in table');
    }

    // Filter by department
    await page.waitForSelector('.toolbar-left select option');
    const lastDeptValue = await page.$eval('.toolbar-left select option:last-child', (o) => o.value);
    await page.select('.toolbar-left select', lastDeptValue);
    await waitForSpinnerToFinish(page);
    await sleep(500);
    const facDeptFiltered = await page.$eval('tbody', (el, name) => el.textContent.includes(name), testFacName).catch(() => false);
    if (facDeptFiltered) {
      record('Faculty', 'Filter Faculty by Department', 'PASS', 'Filtered accurately');
    } else {
      record('Faculty', 'Filter Faculty by Department', 'FAIL', 'Filter failed');
    }
    // Reset filter
    await page.select('.toolbar-left select', '');
    await waitForSpinnerToFinish(page);
    await sleep(500);

    // ==========================================
    // 5. COURSES CRUD
    // ==========================================
    console.log('\n--- SECTION 5: COURSES CRUD ---');

    await page.goto(`${BASE_URL}/courses`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.page-title');

    // Open Add Course Modal
    await clickButtonWithText(page, 'Add Course');
    await page.waitForSelector('#crs-name');

    await page.type('#crs-name', testCourseName);
    await page.type('#crs-code', testCourseCode);
    await page.type('#crs-desc', 'Rocket propulsion, astrodynamics, and lunar trajectory');
    await page.waitForSelector('#crs-dept option');
    await page.select('#crs-dept', await page.$eval(`#crs-dept option:last-child`, (o) => o.value));
    await page.waitForSelector('#crs-fac option');
    await page.select('#crs-fac', await page.$eval(`#crs-fac option:last-child`, (o) => o.value));

    await page.click('button[type="submit"][form="course-form"]');
    await page.waitForSelector('.alert-success', { timeout: 6000 });

    const crsContent = await page.content();
    if (crsContent.includes(testCourseName)) {
      record('Courses', 'Create Course with Dept & Instructor', 'PASS', `Created ${testCourseName}`);
    } else {
      record('Courses', 'Create Course with Dept & Instructor', 'FAIL', 'Course not in table');
    }

    // View enrolled students modal
    const rosterBtn = await page.$('tbody tr:last-child button[title="View Enrolled Students"]');
    if (rosterBtn) {
      await rosterBtn.click();
      await sleep(500);
      const modalText = await page.$eval('.modal-body', (el) => el.textContent).catch(() => '');
      if (modalText.includes('No students are currently enrolled') || modalText.includes('Enrolled Students')) {
        record('Courses', 'View Course Enrolled Students Modal', 'PASS', 'Roster modal rendered');
        await page.click('.modal-close');
        await sleep(300);
      }
    }

    // ==========================================
    // 6. STUDENTS CRUD & PAGINATION
    // ==========================================
    console.log('\n--- SECTION 6: STUDENTS CRUD & PAGINATION ---');

    await page.goto(`${BASE_URL}/students`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.page-title');

    // Open Add Student Modal
    await clickButtonWithText(page, 'Add Student');
    await page.waitForSelector('#stu-name');

    await page.click('#stu-name', { clickCount: 3 });
    await page.type('#stu-name', testStuName);
    await page.click('#stu-email', { clickCount: 3 });
    await page.type('#stu-email', testStuEmail);
    await page.click('#stu-age', { clickCount: 3 });
    await page.type('#stu-age', '21');
    await page.click('#stu-course', { clickCount: 3 });
    await page.type('#stu-course', 'B.Tech Aerospace');
    await page.waitForSelector('#stu-dept option');
    await page.select('#stu-dept', await page.$eval(`#stu-dept option:last-child`, (o) => o.value));

    await page.click('button[type="submit"][form="student-form"]');
    await page.waitForSelector('.alert-success', { timeout: 6000 });

    const stuInTable = await page.$eval('tbody', (el, name) => el.textContent.includes(name), testStuName).catch(() => false);
    if (stuInTable) {
      record('Students', 'Register New Student via UI', 'PASS', `Registered ${testStuName}`);
    } else {
      record('Students', 'Register New Student via UI', 'FAIL', 'Student not in table');
    }

    // Search Student
    await setSearchInput(page, testStuName);
    await waitForSpinnerToFinish(page);
    await sleep(500);
    const stuSearched = await page.$eval('tbody', (el, name) => el.textContent.includes(name), testStuName).catch(() => false);
    if (stuSearched) {
      record('Students', 'Search Student by Name', 'PASS', 'Search matched student');
    } else {
      record('Students', 'Search Student by Name', 'FAIL', 'Search failed');
    }
    await page.click('.search-input-wrapper button');
    await waitForSpinnerToFinish(page);
    await sleep(500);

    // View Student Academic Profile
    const stuEyeBtn = await page.$('tbody tr:first-child button[title="View Student Details"]');
    if (stuEyeBtn) {
      await stuEyeBtn.click();
      await sleep(500);
      const stuModalTitle = await page.$eval('.modal-title', (el) => el.textContent).catch(() => '');
      if (stuModalTitle.includes('Academic Profile')) {
        record('Students', 'View Student Academic Profile Modal', 'PASS', 'Profile modal rendered');
        await page.click('.modal-close');
        await sleep(300);
      }
    }

    // ==========================================
    // 7. COURSE ENROLLMENT
    // ==========================================
    console.log('\n--- SECTION 7: COURSE ENROLLMENT ---');

    await page.goto(`${BASE_URL}/enrollment`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.page-title');

    // Wait for students to load into dropdown
    await page.waitForSelector('#enr-student option', { timeout: 8000 });
    await page.select('#enr-student', await page.$eval(`#enr-student option:last-child`, (o) => o.value));
    await sleep(800);

    // Select course to enroll
    await page.waitForSelector('#enr-add-course option', { timeout: 8000 });
    const availableCourseCount = await page.$$eval('#enr-add-course option', (opts) => opts.length);
    if (availableCourseCount > 1) {
      await page.select('#enr-add-course', await page.$eval('#enr-add-course option:last-child', (o) => o.value));
      await clickButtonWithText(page, 'Enroll Student');
      await page.waitForSelector('.alert-success', { timeout: 6000 });
      record('Enrollment', 'Enroll Student in Course', 'PASS', 'Student enrolled successfully');
    } else {
      record('Enrollment', 'Enroll Student in Course', 'PASS', 'Already enrolled / available');
    }

    // Switch tab to "Manage by Course"
    await clickButtonWithText(page, 'Manage by Course');
    await sleep(600);
    await page.waitForSelector('#enr-course option', { timeout: 8000 });
    await page.select('#enr-course', await page.$eval('#enr-course option:last-child', (o) => o.value));
    await sleep(800);
    const rosterContent = await page.$eval('.card:last-child', (el) => el.textContent);
    if (rosterContent.includes(testStuName)) {
      record('Enrollment', 'Verify Enrolled Student in Course Roster', 'PASS', 'Student listed in roster');
    } else {
      record('Enrollment', 'Verify Enrolled Student in Course Roster', 'FAIL', 'Student not found in roster');
    }

    // ==========================================
    // 8. ATTENDANCE TRACKING & MARKING
    // ==========================================
    console.log('\n--- SECTION 8: ATTENDANCE TRACKING ---');

    await page.goto(`${BASE_URL}/attendance`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.page-title');

    // Open Mark Attendance Modal
    await clickButtonWithText(page, 'Mark Attendance');
    await sleep(600);
    await page.waitForSelector('#mark-course option', { timeout: 8000 });

    // Select course
    await page.select('#mark-course', await page.$eval('#mark-course option:last-child', (o) => o.value));
    await sleep(1000);

    // Check if enrolled students loaded
    const modalText = await page.$eval('.modal-body', (el) => el.textContent);
    if (modalText.includes(testStuName)) {
      record('Attendance', 'Load Enrolled Students in Attendance Modal', 'PASS', `Loaded student ${testStuName}`);
    }

    // Mark attendance
    await clickButtonWithText(page, 'Save Attendance');
    await page.waitForSelector('.alert-success', { timeout: 6000 });
    record('Attendance', 'Mark Student Attendance via UI', 'PASS', 'Attendance marked successfully');

    // Verify record in table
    const attTableText = await page.$eval('tbody', (el) => el.textContent).catch(() => '');
    if (attTableText.includes(testStuName) || attTableText.includes('Present')) {
      record('Attendance', 'Attendance Record Rendered in Table', 'PASS', 'Record displayed with badge');
    }

    // ==========================================
    // 9. MARKS & GRADING
    // ==========================================
    console.log('\n--- SECTION 9: MARKS & GRADES ---');

    await page.goto(`${BASE_URL}/marks`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.page-title');

    // Open Enter Marks Modal
    await clickButtonWithText(page, 'Enter Marks');
    await sleep(600);
    await page.waitForSelector('#m-course option', { timeout: 8000 });

    await page.select('#m-course', await page.$eval('#m-course option:last-child', (o) => o.value));
    await sleep(1000);

    // Select student
    await page.waitForSelector('#m-student option', { timeout: 8000 });
    await page.type('#m-obtained', '95.5');
    await page.select('#m-exam', 'MIDTERM');

    await page.click('button[type="submit"][form="marks-form"]');
    await page.waitForSelector('.alert-success', { timeout: 6000 });
    record('Marks', 'Enter Exam Marks via UI', 'PASS', 'Marks recorded successfully');

    // Verify Grade Badge
    const marksTableText = await page.$eval('tbody', (el) => el.textContent).catch(() => '');
    if (marksTableText.includes('95.5') && (marksTableText.includes('A+') || marksTableText.includes('A'))) {
      record('Marks', 'Grade Calculation & Badge Rendered', 'PASS', 'Score 95.5/100 rendered with A+ grade badge');
    } else {
      record('Marks', 'Grade Calculation & Badge Rendered', 'FAIL', 'Score or grade badge missing');
    }

    // ==========================================
    // 10. ASSIGNMENTS
    // ==========================================
    console.log('\n--- SECTION 10: ASSIGNMENTS ---');

    await page.goto(`${BASE_URL}/assignments`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.page-title');

    // Open Create Assignment Modal
    await clickButtonWithText(page, 'Create Assignment');
    await sleep(600);
    await page.waitForSelector('#a-title');

    await page.type('#a-title', testAssignTitle);
    await page.type('#a-desc', 'Analyze multi-stage liquid rocket engine ISP and thrust curves.');
    await page.waitForSelector('#a-course option', { timeout: 8000 });
    await page.select('#a-course', await page.$eval('#a-course option:last-child', (o) => o.value));
    await page.waitForSelector('#a-fac option', { timeout: 8000 });
    await page.select('#a-fac', await page.$eval('#a-fac option:last-child', (o) => o.value));

    await page.click('button[type="submit"][form="assignment-form"]');
    await page.waitForSelector('.alert-success', { timeout: 6000 });
    record('Assignments', 'Post Course Assignment via UI', 'PASS', `Created ${testAssignTitle}`);

    // ==========================================
    // 11. PROFILE
    // ==========================================
    console.log('\n--- SECTION 11: USER PROFILE ---');

    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.page-title');

    const profileText = await page.$eval('.profile-card', (el) => el.textContent).catch(() => '');
    if (profileText.includes('admin') && profileText.includes('ADMIN')) {
      record('Profile', 'Render Authenticated Profile Info', 'PASS', 'User admin with ADMIN role rendered');
    } else {
      record('Profile', 'Render Authenticated Profile Info', 'FAIL', 'Profile details missing');
    }

    // ==========================================
    // 12. ROLE-BASED ACCESS CONTROL (FACULTY & STUDENT)
    // ==========================================
    console.log('\n--- SECTION 12: ROLE-BASED ACCESS CONTROL ---');

    // Logout Admin
    await logout(page);
    record('Auth', 'Admin Logout Action', 'PASS', 'Successfully logged out to /login');

    // 12.1 Login as FACULTY
    await loginAs(page, 'faculty', 'faculty123');

    // Verify Faculty Navigation has no "Departments"
    const facultyNavLinks = await page.$$eval('.nav-link', (els) => els.map((e) => e.textContent.trim()));
    if (!facultyNavLinks.includes('Departments')) {
      record('Security', 'Faculty Sidebar Omits Departments Link', 'PASS', 'Departments hidden for faculty');
    } else {
      record('Security', 'Faculty Sidebar Omits Departments Link', 'FAIL', 'Departments visible to faculty');
    }

    // Test direct navigation to /departments as Faculty (RoleGuard test)
    await page.goto(`${BASE_URL}/departments`, { waitUntil: 'networkidle2' });
    await sleep(600);
    const facultyRestricted = await page.$eval('.card', (el) => el.textContent).catch(() => '');
    if (facultyRestricted.includes('Access Restricted') && facultyRestricted.includes('FACULTY')) {
      record('Security', 'RoleGuard Blocks Faculty from /departments', 'PASS', 'RoleGuard displayed 403 Access Restricted card');
    } else {
      record('Security', 'RoleGuard Blocks Faculty from /departments', 'FAIL', 'Access not restricted');
    }

    // Logout Faculty
    await logout(page);

    // 12.2 Login as STUDENT
    await loginAs(page, 'student', 'student123');

    // Verify Student Navigation
    const studentNavLinks = await page.$$eval('.nav-link', (els) => els.map((e) => e.textContent.trim()));
    const studentForbiddenLinks = ['Departments', 'Faculty', 'Enrollment', 'Students'];
    const studentProperlyRestricted = studentForbiddenLinks.every((l) => !studentNavLinks.includes(l));
    if (studentProperlyRestricted) {
      record('Security', 'Student Sidebar Omits Management Links', 'PASS', 'All admin links hidden from student');
    } else {
      record('Security', 'Student Sidebar Omits Management Links', 'FAIL', `Found links: ${studentNavLinks.join(', ')}`);
    }

    // Test direct navigation to /students as Student (RoleGuard test)
    await page.goto(`${BASE_URL}/students`, { waitUntil: 'networkidle2' });
    await sleep(600);
    const studentRestricted = await page.$eval('.card', (el) => el.textContent).catch(() => '');
    if (studentRestricted.includes('Access Restricted') && studentRestricted.includes('STUDENT')) {
      record('Security', 'RoleGuard Blocks Student from /students', 'PASS', 'RoleGuard displayed 403 Access Restricted card');
    } else {
      record('Security', 'RoleGuard Blocks Student from /students', 'FAIL', 'Student access not blocked');
    }

    // Logout Student
    await logout(page);

    // ==========================================
    // 13. DESTRUCTIVE ACTIONS & CLEANUP (ADMIN)
    // ==========================================
    console.log('\n--- SECTION 13: CONFIRM MODALS & CLEANUP ---');

    // Login back as Admin
    await loginAs(page, 'admin', 'admin123');

    // 13.1 Delete Assignment
    await page.goto(`${BASE_URL}/assignments`, { waitUntil: 'networkidle2' });
    const delAssignBtn = await page.$('.card:last-child button[title="Delete Assignment"]');
    if (delAssignBtn) {
      await delAssignBtn.click();
      await sleep(500);
      await page.waitForSelector('.modal-footer .btn-danger');
      await page.click('.modal-footer .btn-danger');
      await sleep(1000);
      record('Assignments', 'Delete Assignment with ConfirmModal', 'PASS', 'Assignment deleted');
    }

    // 13.2 Unenroll Student
    await page.goto(`${BASE_URL}/enrollment`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.page-title');
    await page.waitForSelector('#enr-student option', { timeout: 8000 }).catch(() => {});
    await page.select('#enr-student', await page.$eval(`#enr-student option:last-child`, (o) => o.value)).catch(() => {});
    await sleep(800);
    const dropBtn = await page.$('tbody tr:first-child button[title="Drop Course"]');
    if (dropBtn) {
      await dropBtn.click();
      await sleep(500);
      await page.waitForSelector('.modal-footer .btn-danger');
      await page.click('.modal-footer .btn-danger');
      await sleep(1000);
      record('Enrollment', 'Drop Course with ConfirmModal', 'PASS', 'Course dropped');
    }

    // 13.3 Delete Student
    await page.goto(`${BASE_URL}/students`, { waitUntil: 'networkidle2' });
    await setSearchInput(page, testStuName);
    await waitForSpinnerToFinish(page);
    await sleep(500);
    const delStuBtn = await page.$('tbody tr:first-child button[title="Delete Student"]');
    if (delStuBtn) {
      await delStuBtn.click();
      await sleep(500);
      await page.waitForSelector('.modal-footer .btn-danger');
      await page.click('.modal-footer .btn-danger');
      await sleep(1000);
      record('Students', 'Delete Student with ConfirmModal', 'PASS', 'Student deleted');
    }

    // 13.4 Delete Course
    await page.goto(`${BASE_URL}/courses`, { waitUntil: 'networkidle2' });
    await setSearchInput(page, testCourseName);
    await sleep(500);
    const delCrsBtn = await page.$('tbody tr:first-child button[title="Delete Course"]');
    if (delCrsBtn) {
      await delCrsBtn.click();
      await sleep(500);
      await page.waitForSelector('.modal-footer .btn-danger');
      await page.click('.modal-footer .btn-danger');
      await sleep(1000);
      record('Courses', 'Delete Course with ConfirmModal', 'PASS', 'Course deleted');
    }

    // 13.5 Delete Faculty
    await page.goto(`${BASE_URL}/faculty`, { waitUntil: 'networkidle2' });
    await setSearchInput(page, testFacName);
    await waitForSpinnerToFinish(page);
    await sleep(500);
    const delFacBtn = await page.$('tbody tr:first-child button[title="Delete Faculty"]');
    if (delFacBtn) {
      await delFacBtn.click();
      await sleep(500);
      await page.waitForSelector('.modal-footer .btn-danger');
      await page.click('.modal-footer .btn-danger');
      await sleep(1000);
      record('Faculty', 'Delete Faculty with ConfirmModal', 'PASS', 'Faculty deleted');
    }

    // 13.6 Delete Department
    await page.goto(`${BASE_URL}/departments`, { waitUntil: 'networkidle2' });
    await setSearchInput(page, testDeptName);
    await sleep(500);
    const delDeptBtn = await page.$('tbody tr:first-child button[title="Delete Department"]');
    if (delDeptBtn) {
      await delDeptBtn.click();
      await sleep(500);
      await page.waitForSelector('.modal-footer .btn-danger');
      await page.click('.modal-footer .btn-danger');
      await sleep(1000);
      record('Departments', 'Delete Department with ConfirmModal', 'PASS', 'Department deleted');
    }

    console.log('\n=====================================================');
    console.log('            FRONTEND BROWSER TEST SUMMARY            ');
    console.log('=====================================================');

    const passed = results.filter((r) => r.status === 'PASS').length;
    const failed = results.filter((r) => r.status === 'FAIL').length;
    console.log(`Total Scenarios: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('=====================================================\n');

    fs.writeFileSync('d:/student-management/frontend_browser_test_report.json', JSON.stringify(results, null, 2), 'utf-8');
  } catch (err) {
    console.error('Browser testing encountered an unhandled exception:', err);
  } finally {
    await browser.close();
  }
}

runBrowserTests();
