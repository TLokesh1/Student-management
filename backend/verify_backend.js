// Complete Backend Verification Test Suite using Node.js native fetch
const BASE_URL = 'http://localhost:8080';

const results = [];

function recordResult(category, testName, endpoint, expectedStatus, actualStatus, status, details = '') {
    results.push({
        category,
        testName,
        endpoint,
        expectedStatus,
        actualStatus,
        status,
        details: typeof details === 'object' ? JSON.stringify(details) : String(details)
    });
}

async function request(method, path, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers
    };
    if (body) {
        options.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    try {
        const resp = await fetch(`${BASE_URL}${path}`, options);
        let data = null;
        const text = await resp.text();
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
        return { status: resp.status, data };
    } catch (err) {
        return { status: 0, error: err.message };
    }
}

async function runTests() {
    console.log('\n=== SECTION 1: AUTHENTICATION & LOGIN TESTS ===');

    // 1.1 Admin Login
    const adminLogin = await request('POST', '/auth/login', { username: 'admin', password: 'admin123' });
    const adminToken = adminLogin.data?.token;
    if (adminLogin.status === 200 && adminToken) {
        recordResult('Auth', 'Admin Login', 'POST /auth/login', 200, adminLogin.status, 'PASS', 'Admin JWT token received');
    } else {
        recordResult('Auth', 'Admin Login', 'POST /auth/login', 200, adminLogin.status, 'FAIL', adminLogin.data);
    }

    // 1.2 Faculty Login
    const facultyLogin = await request('POST', '/auth/login', { username: 'faculty', password: 'faculty123' });
    const facultyToken = facultyLogin.data?.token;
    if (facultyLogin.status === 200 && facultyToken) {
        recordResult('Auth', 'Faculty Login', 'POST /auth/login', 200, facultyLogin.status, 'PASS', 'Faculty JWT token received');
    } else {
        recordResult('Auth', 'Faculty Login', 'POST /auth/login', 200, facultyLogin.status, 'FAIL', facultyLogin.data);
    }

    // 1.3 Student Login
    const studentLogin = await request('POST', '/auth/login', { username: 'student', password: 'student123' });
    const studentToken = studentLogin.data?.token;
    if (studentLogin.status === 200 && studentToken) {
        recordResult('Auth', 'Student Login', 'POST /auth/login', 200, studentLogin.status, 'PASS', 'Student JWT token received');
    } else {
        recordResult('Auth', 'Student Login', 'POST /auth/login', 200, studentLogin.status, 'FAIL', studentLogin.data);
    }

    // 1.4 Register New User
    const rndUser = `user_${Date.now().toString().slice(-5)}`;
    const regResp = await request('POST', '/auth/register', {
        username: rndUser,
        password: 'password123',
        email: `${rndUser}@university.edu`,
        role: 'STUDENT'
    });
    if (regResp.status === 201 && regResp.data?.token) {
        recordResult('Auth', 'Register New User', 'POST /auth/register', 201, regResp.status, 'PASS', `Created user ${rndUser}`);
    } else {
        recordResult('Auth', 'Register New User', 'POST /auth/register', 201, regResp.status, 'FAIL', regResp.data);
    }

    // 1.5 GET /auth/me
    const meResp = await request('GET', '/auth/me', null, adminToken);
    if (meResp.status === 200 && meResp.data?.username === 'admin') {
        recordResult('Auth', 'Get Profile (/auth/me)', 'GET /auth/me', 200, meResp.status, 'PASS', 'Returned user: admin');
    } else {
        recordResult('Auth', 'Get Profile (/auth/me)', 'GET /auth/me', 200, meResp.status, 'FAIL', meResp.data);
    }

    // 1.6 Reject Request without token
    const noToken = await request('GET', '/departments');
    if (noToken.status === 401 || noToken.status === 403) {
        recordResult('Auth', 'Reject Request Without Token', 'GET /departments', '401/403', noToken.status, 'PASS', 'Unauthenticated access rejected');
    } else {
        recordResult('Auth', 'Reject Request Without Token', 'GET /departments', '401/403', noToken.status, 'FAIL', noToken.data);
    }

    // 1.7 Reject Invalid Token
    const badToken = await request('GET', '/departments', null, 'invalid.token.here');
    if (badToken.status === 401 || badToken.status === 403) {
        recordResult('Auth', 'Reject Invalid Token', 'GET /departments', '401/403', badToken.status, 'PASS', 'Invalid token rejected');
    } else {
        recordResult('Auth', 'Reject Invalid Token', 'GET /departments', '401/403', badToken.status, 'FAIL', badToken.data);
    }

    console.log('\n=== SECTION 2: FULL WORKFLOW & ALL CRUD ENDPOINTS ===');
    const suffix = Date.now().toString().slice(-4);

    // 2.1 POST /departments
    const deptCode = `DEPT_${suffix}`;
    const createDept = await request('POST', '/departments', {
        name: `Dept of Computer Engineering ${suffix}`,
        code: deptCode,
        description: 'Computer Engineering Department'
    }, adminToken);
    const deptId = createDept.data?.id;
    if (createDept.status === 201 && deptId) {
        recordResult('Departments', 'Create Department', 'POST /departments', 201, createDept.status, 'PASS', `ID: ${deptId}, Code: ${deptCode}`);
    } else {
        recordResult('Departments', 'Create Department', 'POST /departments', 201, createDept.status, 'FAIL', createDept.data);
    }

    // 2.2 GET /departments
    const getDepts = await request('GET', '/departments', null, adminToken);
    if (getDepts.status === 200 && Array.isArray(getDepts.data)) {
        recordResult('Departments', 'Get All Departments', 'GET /departments', 200, getDepts.status, 'PASS', `Count: ${getDepts.data.length}`);
    } else {
        recordResult('Departments', 'Get All Departments', 'GET /departments', 200, getDepts.status, 'FAIL', getDepts.data);
    }

    // 2.3 GET /departments/{id}
    const getDept = await request('GET', `/departments/${deptId}`, null, adminToken);
    if (getDept.status === 200 && getDept.data?.code === deptCode) {
        recordResult('Departments', 'Get Department by ID', 'GET /departments/{id}', 200, getDept.status, 'PASS', `ID: ${deptId}`);
    } else {
        recordResult('Departments', 'Get Department by ID', 'GET /departments/{id}', 200, getDept.status, 'FAIL', getDept.data);
    }

    // 2.4 PUT /departments/{id}
    const updateDept = await request('PUT', `/departments/${deptId}`, {
        name: `Dept of Computer Engineering Updated ${suffix}`,
        code: deptCode,
        description: 'Updated Description'
    }, adminToken);
    if (updateDept.status === 200 && updateDept.data?.name?.includes('Updated')) {
        recordResult('Departments', 'Update Department', 'PUT /departments/{id}', 200, updateDept.status, 'PASS', 'Updated name verified');
    } else {
        recordResult('Departments', 'Update Department', 'PUT /departments/{id}', 200, updateDept.status, 'FAIL', updateDept.data);
    }

    // 2.5 POST /faculty
    const facEmail = `prof_${suffix}@university.edu`;
    const createFac = await request('POST', '/faculty', {
        name: `Prof. Charles ${suffix}`,
        email: facEmail,
        phone: '9876501234',
        designation: 'Associate Professor',
        departmentId: deptId
    }, adminToken);
    const facultyId = createFac.data?.id;
    if (createFac.status === 201 && facultyId) {
        recordResult('Faculty', 'Create Faculty', 'POST /faculty', 201, createFac.status, 'PASS', `ID: ${facultyId}, Email: ${facEmail}`);
    } else {
        recordResult('Faculty', 'Create Faculty', 'POST /faculty', 201, createFac.status, 'FAIL', createFac.data);
    }

    // 2.6 GET /faculty
    const getFaculties = await request('GET', '/faculty', null, adminToken);
    if (getFaculties.status === 200 && Array.isArray(getFaculties.data)) {
        recordResult('Faculty', 'Get All Faculty', 'GET /faculty', 200, getFaculties.status, 'PASS', `Count: ${getFaculties.data.length}`);
    } else {
        recordResult('Faculty', 'Get All Faculty', 'GET /faculty', 200, getFaculties.status, 'FAIL', getFaculties.data);
    }

    // 2.7 GET /faculty/{id}
    const getFac = await request('GET', `/faculty/${facultyId}`, null, adminToken);
    if (getFac.status === 200 && getFac.data?.email === facEmail) {
        recordResult('Faculty', 'Get Faculty by ID', 'GET /faculty/{id}', 200, getFac.status, 'PASS', `ID: ${facultyId}`);
    } else {
        recordResult('Faculty', 'Get Faculty by ID', 'GET /faculty/{id}', 200, getFac.status, 'FAIL', getFac.data);
    }

    // 2.8 PUT /faculty/{id}
    const updateFac = await request('PUT', `/faculty/${facultyId}`, {
        name: `Prof. Charles Babbage ${suffix}`,
        email: facEmail,
        phone: '9876509999',
        designation: 'Professor & Chair',
        departmentId: deptId
    }, adminToken);
    if (updateFac.status === 200 && updateFac.data?.designation === 'Professor & Chair') {
        recordResult('Faculty', 'Update Faculty', 'PUT /faculty/{id}', 200, updateFac.status, 'PASS', 'Updated designation');
    } else {
        recordResult('Faculty', 'Update Faculty', 'PUT /faculty/{id}', 200, updateFac.status, 'FAIL', updateFac.data);
    }

    // 2.9 POST /courses
    const courseCode = `CS_${suffix}`;
    const createCourse = await request('POST', '/courses', {
        courseName: `Operating Systems ${suffix}`,
        courseCode: courseCode,
        description: 'OS Kernel & Concurrency',
        departmentId: deptId,
        facultyId: facultyId
    }, adminToken);
    const courseId = createCourse.data?.id;
    if (createCourse.status === 201 && courseId) {
        recordResult('Courses', 'Create Course', 'POST /courses', 201, createCourse.status, 'PASS', `ID: ${courseId}, Code: ${courseCode}`);
    } else {
        recordResult('Courses', 'Create Course', 'POST /courses', 201, createCourse.status, 'FAIL', createCourse.data);
    }

    // 2.10 GET /courses
    const getCourses = await request('GET', '/courses', null, adminToken);
    if (getCourses.status === 200 && Array.isArray(getCourses.data)) {
        recordResult('Courses', 'Get All Courses', 'GET /courses', 200, getCourses.status, 'PASS', `Count: ${getCourses.data.length}`);
    } else {
        recordResult('Courses', 'Get All Courses', 'GET /courses', 200, getCourses.status, 'FAIL', getCourses.data);
    }

    // 2.11 GET /courses/{id}
    const getCourse = await request('GET', `/courses/${courseId}`, null, adminToken);
    if (getCourse.status === 200 && getCourse.data?.courseCode === courseCode) {
        recordResult('Courses', 'Get Course by ID', 'GET /courses/{id}', 200, getCourse.status, 'PASS', `ID: ${courseId}`);
    } else {
        recordResult('Courses', 'Get Course by ID', 'GET /courses/{id}', 200, getCourse.status, 'FAIL', getCourse.data);
    }

    // 2.12 PUT /courses/{id}
    const updateCourse = await request('PUT', `/courses/${courseId}`, {
        courseName: `Advanced Operating Systems ${suffix}`,
        courseCode: courseCode,
        description: 'Distributed & Kernel Systems',
        departmentId: deptId,
        facultyId: facultyId
    }, adminToken);
    if (updateCourse.status === 200 && updateCourse.data?.courseName?.includes('Advanced')) {
        recordResult('Courses', 'Update Course', 'PUT /courses/{id}', 200, updateCourse.status, 'PASS', 'Updated course title');
    } else {
        recordResult('Courses', 'Update Course', 'PUT /courses/{id}', 200, updateCourse.status, 'FAIL', updateCourse.data);
    }

    // 2.13 POST /students
    const stuEmail = `student_${suffix}@gmail.com`;
    const createStu = await request('POST', '/students', {
        name: `Ada Lovelace ${suffix}`,
        email: stuEmail,
        age: 20,
        course: 'CSE'
    }, adminToken);
    const studentId = createStu.data?.id;
    if (createStu.status === 201 && studentId) {
        recordResult('Students', 'Create Student', 'POST /students', 201, createStu.status, 'PASS', `ID: ${studentId}, Email: ${stuEmail}`);
    } else {
        recordResult('Students', 'Create Student', 'POST /students', 201, createStu.status, 'FAIL', createStu.data);
    }

    // 2.14 GET /students
    const getStudents = await request('GET', '/students', null, adminToken);
    if (getStudents.status === 200 && Array.isArray(getStudents.data)) {
        recordResult('Students', 'Get All Students', 'GET /students', 200, getStudents.status, 'PASS', `Count: ${getStudents.data.length}`);
    } else {
        recordResult('Students', 'Get All Students', 'GET /students', 200, getStudents.status, 'FAIL', getStudents.data);
    }

    // 2.15 GET /students/{id}
    const getStu = await request('GET', `/students/${studentId}`, null, adminToken);
    if (getStu.status === 200 && getStu.data?.email === stuEmail) {
        recordResult('Students', 'Get Student by ID', 'GET /students/{id}', 200, getStu.status, 'PASS', `ID: ${studentId}`);
    } else {
        recordResult('Students', 'Get Student by ID', 'GET /students/{id}', 200, getStu.status, 'FAIL', getStu.data);
    }

    // 2.16 PUT /students/{id}
    const updateStu = await request('PUT', `/students/${studentId}`, {
        name: `Ada Lovelace Countess ${suffix}`,
        email: stuEmail,
        age: 21,
        course: 'CSE'
    }, adminToken);
    if (updateStu.status === 200 && updateStu.data?.age === 21) {
        recordResult('Students', 'Update Student', 'PUT /students/{id}', 200, updateStu.status, 'PASS', 'Updated student age to 21');
    } else {
        recordResult('Students', 'Update Student', 'PUT /students/{id}', 200, updateStu.status, 'FAIL', updateStu.data);
    }

    // 2.17 POST /students/{studentId}/courses/{courseId} (Enrollment)
    const enrollResp = await request('POST', `/students/${studentId}/courses/${courseId}`, null, adminToken);
    if (enrollResp.status === 200) {
        recordResult('Enrollment', 'Enroll Student in Course', 'POST /students/{sId}/courses/{cId}', 200, enrollResp.status, 'PASS', `Enrolled Student ${studentId} in Course ${courseId}`);
    } else {
        recordResult('Enrollment', 'Enroll Student in Course', 'POST /students/{sId}/courses/{cId}', 200, enrollResp.status, 'FAIL', enrollResp.data);
    }

    // 2.18 GET /students/{studentId}/courses
    const getStuCourses = await request('GET', `/students/${studentId}/courses`, null, adminToken);
    if (getStuCourses.status === 200 && Array.isArray(getStuCourses.data) && getStuCourses.data.some(c => c.id === courseId)) {
        recordResult('Enrollment', 'Get Student Courses', 'GET /students/{id}/courses', 200, getStuCourses.status, 'PASS', `Found course ${courseCode}`);
    } else {
        recordResult('Enrollment', 'Get Student Courses', 'GET /students/{id}/courses', 200, getStuCourses.status, 'FAIL', getStuCourses.data);
    }

    // 2.19 GET /courses/{courseId}/students
    const getCourseStudents = await request('GET', `/courses/${courseId}/students`, null, adminToken);
    if (getCourseStudents.status === 200 && Array.isArray(getCourseStudents.data) && getCourseStudents.data.some(s => s.id === studentId)) {
        recordResult('Enrollment', 'Get Students in Course', 'GET /courses/{id}/students', 200, getCourseStudents.status, 'PASS', `Found student ${studentId}`);
    } else {
        recordResult('Enrollment', 'Get Students in Course', 'GET /courses/{id}/students', 200, getCourseStudents.status, 'FAIL', getCourseStudents.data);
    }

    // 2.20 POST /attendance
    const today = new Date().toISOString().split('T')[0];
    const markAtt = await request('POST', '/attendance', {
        studentId: studentId,
        courseId: courseId,
        date: today,
        status: 'PRESENT'
    }, adminToken);
    const attId = markAtt.data?.id;
    if (markAtt.status === 201 && attId) {
        recordResult('Attendance', 'Mark Attendance', 'POST /attendance', 201, markAtt.status, 'PASS', `ID: ${attId}, Status: PRESENT`);
    } else {
        recordResult('Attendance', 'Mark Attendance', 'POST /attendance', 201, markAtt.status, 'FAIL', markAtt.data);
    }

    // 2.21 GET /attendance
    const getAllAtt = await request('GET', '/attendance', null, adminToken);
    if (getAllAtt.status === 200 && Array.isArray(getAllAtt.data)) {
        recordResult('Attendance', 'Get All Attendance', 'GET /attendance', 200, getAllAtt.status, 'PASS', `Count: ${getAllAtt.data.length}`);
    } else {
        recordResult('Attendance', 'Get All Attendance', 'GET /attendance', 200, getAllAtt.status, 'FAIL', getAllAtt.data);
    }

    // 2.22 GET /attendance/{id}
    const getAtt = await request('GET', `/attendance/${attId}`, null, adminToken);
    if (getAtt.status === 200 && getAtt.data?.status === 'PRESENT') {
        recordResult('Attendance', 'Get Attendance by ID', 'GET /attendance/{id}', 200, getAtt.status, 'PASS', `ID: ${attId}`);
    } else {
        recordResult('Attendance', 'Get Attendance by ID', 'GET /attendance/{id}', 200, getAtt.status, 'FAIL', getAtt.data);
    }

    // 2.23 GET /attendance/student/{studentId}
    const getAttByStu = await request('GET', `/attendance/student/${studentId}`, null, adminToken);
    if (getAttByStu.status === 200 && Array.isArray(getAttByStu.data) && getAttByStu.data.length > 0) {
        recordResult('Attendance', 'Get Attendance by Student', 'GET /attendance/student/{id}', 200, getAttByStu.status, 'PASS', `Count: ${getAttByStu.data.length}`);
    } else {
        recordResult('Attendance', 'Get Attendance by Student', 'GET /attendance/student/{id}', 200, getAttByStu.status, 'FAIL', getAttByStu.data);
    }

    // 2.24 GET /attendance/course/{courseId}
    const getAttByCourse = await request('GET', `/attendance/course/${courseId}`, null, adminToken);
    if (getAttByCourse.status === 200 && Array.isArray(getAttByCourse.data) && getAttByCourse.data.length > 0) {
        recordResult('Attendance', 'Get Attendance by Course', 'GET /attendance/course/{id}', 200, getAttByCourse.status, 'PASS', `Count: ${getAttByCourse.data.length}`);
    } else {
        recordResult('Attendance', 'Get Attendance by Course', 'GET /attendance/course/{id}', 200, getAttByCourse.status, 'FAIL', getAttByCourse.data);
    }

    // 2.25 PUT /attendance/{id}
    const updateAtt = await request('PUT', `/attendance/${attId}`, {
        studentId: studentId,
        courseId: courseId,
        date: today,
        status: 'ABSENT'
    }, adminToken);
    if (updateAtt.status === 200 && updateAtt.data?.status === 'ABSENT') {
        recordResult('Attendance', 'Update Attendance', 'PUT /attendance/{id}', 200, updateAtt.status, 'PASS', 'Updated status to ABSENT');
    } else {
        recordResult('Attendance', 'Update Attendance', 'PUT /attendance/{id}', 200, updateAtt.status, 'FAIL', updateAtt.data);
    }

    // 2.26 POST /marks
    const enterMarks = await request('POST', '/marks', {
        studentId: studentId,
        courseId: courseId,
        marksObtained: 89.5,
        maxMarks: 100.0,
        examType: 'MIDTERM',
        semester: 4,
        academicYear: '2026'
    }, adminToken);
    const marksId = enterMarks.data?.id;
    if (enterMarks.status === 201 && marksId) {
        recordResult('Marks', 'Enter Marks', 'POST /marks', 201, enterMarks.status, 'PASS', `ID: ${marksId}, Score: 89.5/100`);
    } else {
        recordResult('Marks', 'Enter Marks', 'POST /marks', 201, enterMarks.status, 'FAIL', enterMarks.data);
    }

    // 2.27 GET /marks
    const getAllMarks = await request('GET', '/marks', null, adminToken);
    if (getAllMarks.status === 200 && Array.isArray(getAllMarks.data)) {
        recordResult('Marks', 'Get All Marks', 'GET /marks', 200, getAllMarks.status, 'PASS', `Count: ${getAllMarks.data.length}`);
    } else {
        recordResult('Marks', 'Get All Marks', 'GET /marks', 200, getAllMarks.status, 'FAIL', getAllMarks.data);
    }

    // 2.28 GET /marks/{id}
    const getMarks = await request('GET', `/marks/${marksId}`, null, adminToken);
    if (getMarks.status === 200 && getMarks.data?.marksObtained === 89.5) {
        recordResult('Marks', 'Get Marks by ID', 'GET /marks/{id}', 200, getMarks.status, 'PASS', `ID: ${marksId}`);
    } else {
        recordResult('Marks', 'Get Marks by ID', 'GET /marks/{id}', 200, getMarks.status, 'FAIL', getMarks.data);
    }

    // 2.29 GET /marks/student/{studentId}
    const getMarksByStu = await request('GET', `/marks/student/${studentId}`, null, adminToken);
    if (getMarksByStu.status === 200 && Array.isArray(getMarksByStu.data) && getMarksByStu.data.length > 0) {
        recordResult('Marks', 'Get Marks by Student', 'GET /marks/student/{id}', 200, getMarksByStu.status, 'PASS', `Count: ${getMarksByStu.data.length}`);
    } else {
        recordResult('Marks', 'Get Marks by Student', 'GET /marks/student/{id}', 200, getMarksByStu.status, 'FAIL', getMarksByStu.data);
    }

    // 2.30 GET /marks/course/{courseId}
    const getMarksByCourse = await request('GET', `/marks/course/${courseId}`, null, adminToken);
    if (getMarksByCourse.status === 200 && Array.isArray(getMarksByCourse.data) && getMarksByCourse.data.length > 0) {
        recordResult('Marks', 'Get Marks by Course', 'GET /marks/course/{id}', 200, getMarksByCourse.status, 'PASS', `Count: ${getMarksByCourse.data.length}`);
    } else {
        recordResult('Marks', 'Get Marks by Course', 'GET /marks/course/{id}', 200, getMarksByCourse.status, 'FAIL', getMarksByCourse.data);
    }

    // 2.31 PUT /marks/{id}
    const updateMarks = await request('PUT', `/marks/${marksId}`, {
        studentId: studentId,
        courseId: courseId,
        marksObtained: 96.0,
        maxMarks: 100.0,
        examType: 'FINAL',
        semester: 4,
        academicYear: '2026'
    }, adminToken);
    if (updateMarks.status === 200 && updateMarks.data?.marksObtained === 96.0) {
        recordResult('Marks', 'Update Marks', 'PUT /marks/{id}', 200, updateMarks.status, 'PASS', 'Updated score to 96.0');
    } else {
        recordResult('Marks', 'Update Marks', 'PUT /marks/{id}', 200, updateMarks.status, 'FAIL', updateMarks.data);
    }

    // 2.32 POST /assignments
    const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    const createAssign = await request('POST', '/assignments', {
        title: `Kernel Synchronization Lab ${suffix}`,
        description: 'Implement reader-writer locks in C',
        courseId: courseId,
        facultyId: facultyId,
        dueDate: dueDate
    }, adminToken);
    const assignId = createAssign.data?.id;
    if (createAssign.status === 201 && assignId) {
        recordResult('Assignments', 'Create Assignment', 'POST /assignments', 201, createAssign.status, 'PASS', `ID: ${assignId}`);
    } else {
        recordResult('Assignments', 'Create Assignment', 'POST /assignments', 201, createAssign.status, 'FAIL', createAssign.data);
    }

    // 2.33 GET /assignments
    const getAllAssign = await request('GET', '/assignments', null, adminToken);
    if (getAllAssign.status === 200 && Array.isArray(getAllAssign.data)) {
        recordResult('Assignments', 'Get All Assignments', 'GET /assignments', 200, getAllAssign.status, 'PASS', `Count: ${getAllAssign.data.length}`);
    } else {
        recordResult('Assignments', 'Get All Assignments', 'GET /assignments', 200, getAllAssign.status, 'FAIL', getAllAssign.data);
    }

    // 2.34 GET /assignments/{id}
    const getAssign = await request('GET', `/assignments/${assignId}`, null, adminToken);
    if (getAssign.status === 200 && getAssign.data?.id === assignId) {
        recordResult('Assignments', 'Get Assignment by ID', 'GET /assignments/{id}', 200, getAssign.status, 'PASS', `ID: ${assignId}`);
    } else {
        recordResult('Assignments', 'Get Assignment by ID', 'GET /assignments/{id}', 200, getAssign.status, 'FAIL', getAssign.data);
    }

    // 2.35 GET /assignments/course/{courseId}
    const getAssignByCourse = await request('GET', `/assignments/course/${courseId}`, null, adminToken);
    if (getAssignByCourse.status === 200 && Array.isArray(getAssignByCourse.data) && getAssignByCourse.data.length > 0) {
        recordResult('Assignments', 'Get Assignments by Course', 'GET /assignments/course/{id}', 200, getAssignByCourse.status, 'PASS', `Count: ${getAssignByCourse.data.length}`);
    } else {
        recordResult('Assignments', 'Get Assignments by Course', 'GET /assignments/course/{id}', 200, getAssignByCourse.status, 'FAIL', getAssignByCourse.data);
    }

    // 2.36 GET /assignments/faculty/{facultyId}
    const getAssignByFac = await request('GET', `/assignments/faculty/${facultyId}`, null, adminToken);
    if (getAssignByFac.status === 200 && Array.isArray(getAssignByFac.data) && getAssignByFac.data.length > 0) {
        recordResult('Assignments', 'Get Assignments by Faculty', 'GET /assignments/faculty/{id}', 200, getAssignByFac.status, 'PASS', `Count: ${getAssignByFac.data.length}`);
    } else {
        recordResult('Assignments', 'Get Assignments by Faculty', 'GET /assignments/faculty/{id}', 200, getAssignByFac.status, 'FAIL', getAssignByFac.data);
    }

    // 2.37 PUT /assignments/{id}
    const updateAssign = await request('PUT', `/assignments/${assignId}`, {
        title: `Kernel Synchronization Lab Updated ${suffix}`,
        description: 'Bonus points for lock-free queue',
        courseId: courseId,
        facultyId: facultyId,
        dueDate: dueDate
    }, adminToken);
    if (updateAssign.status === 200 && updateAssign.data?.title?.includes('Updated')) {
        recordResult('Assignments', 'Update Assignment', 'PUT /assignments/{id}', 200, updateAssign.status, 'PASS', 'Updated title');
    } else {
        recordResult('Assignments', 'Update Assignment', 'PUT /assignments/{id}', 200, updateAssign.status, 'FAIL', updateAssign.data);
    }

    console.log('\n=== SECTION 3: ROLE-BASED AUTHORIZATION (RBAC) TESTS ===');

    // 3.1 Faculty creating Course (Allowed)
    const facCourseResp = await request('POST', '/courses', {
        courseName: `Faculty Created Course ${suffix}`,
        courseCode: `FC_${suffix}`,
        description: 'Course created by faculty',
        departmentId: deptId,
        facultyId: facultyId
    }, facultyToken);
    const facCourseId = facCourseResp.data?.id;
    if (facCourseResp.status === 201) {
        recordResult('Security', 'Faculty Create Course', 'POST /courses', 201, facCourseResp.status, 'PASS', `Faculty authorized to create course (ID: ${facCourseId})`);
    } else {
        recordResult('Security', 'Faculty Create Course', 'POST /courses', 201, facCourseResp.status, 'FAIL', facCourseResp.data);
    }

    // 3.2 Faculty creating Department (Forbidden -> 403)
    const facDeptResp = await request('POST', '/departments', {
        name: 'Unauthorized Dept',
        code: `UNAUTH_${suffix}`
    }, facultyToken);
    if (facDeptResp.status === 403) {
        recordResult('Security', 'Faculty Create Dept (Forbidden)', 'POST /departments', 403, facDeptResp.status, 'PASS', 'Rejected with 403 Forbidden');
    } else {
        recordResult('Security', 'Faculty Create Dept (Forbidden)', 'POST /departments', 403, facDeptResp.status, 'FAIL', facDeptResp.data);
    }

    // 3.3 Student creating Course (Forbidden -> 403)
    const stuCourseResp = await request('POST', '/courses', {
        courseName: 'Student Course',
        courseCode: `SC_${suffix}`,
        departmentId: deptId
    }, studentToken);
    if (stuCourseResp.status === 403) {
        recordResult('Security', 'Student Create Course (Forbidden)', 'POST /courses', 403, stuCourseResp.status, 'PASS', 'Rejected with 403 Forbidden');
    } else {
        recordResult('Security', 'Student Create Course (Forbidden)', 'POST /courses', 403, stuCourseResp.status, 'FAIL', stuCourseResp.data);
    }

    // 3.4 Student marking Attendance (Forbidden -> 403)
    const stuAttResp = await request('POST', '/attendance', {
        studentId: studentId,
        courseId: courseId,
        date: today,
        status: 'PRESENT'
    }, studentToken);
    if (stuAttResp.status === 403) {
        recordResult('Security', 'Student Mark Attendance (Forbidden)', 'POST /attendance', 403, stuAttResp.status, 'PASS', 'Rejected with 403 Forbidden');
    } else {
        recordResult('Security', 'Student Mark Attendance (Forbidden)', 'POST /attendance', 403, stuAttResp.status, 'FAIL', stuAttResp.data);
    }

    // 3.5 Student entering Marks (Forbidden -> 403)
    const stuMarksResp = await request('POST', '/marks', {
        studentId: studentId,
        courseId: courseId,
        marksObtained: 100,
        maxMarks: 100,
        examType: 'MIDTERM'
    }, studentToken);
    if (stuMarksResp.status === 403) {
        recordResult('Security', 'Student Enter Marks (Forbidden)', 'POST /marks', 403, stuMarksResp.status, 'PASS', 'Rejected with 403 Forbidden');
    } else {
        recordResult('Security', 'Student Enter Marks (Forbidden)', 'POST /marks', 403, stuMarksResp.status, 'FAIL', stuMarksResp.data);
    }

    // 3.6 Student viewing Attendance (Allowed -> 200)
    const stuReadAtt = await request('GET', `/attendance/student/${studentId}`, null, studentToken);
    if (stuReadAtt.status === 200) {
        recordResult('Security', 'Student Read Attendance (Allowed)', 'GET /attendance/student/{id}', 200, stuReadAtt.status, 'PASS', 'Student read access permitted');
    } else {
        recordResult('Security', 'Student Read Attendance (Allowed)', 'GET /attendance/student/{id}', 200, stuReadAtt.status, 'FAIL', stuReadAtt.data);
    }

    // 3.7 Non-admin delete operation (Forbidden -> 403)
    const facDelResp = await request('DELETE', `/departments/${deptId}`, null, facultyToken);
    if (facDelResp.status === 403) {
        recordResult('Security', 'Faculty Delete Dept (Forbidden)', 'DELETE /departments/{id}', 403, facDelResp.status, 'PASS', 'Rejected with 403 Forbidden');
    } else {
        recordResult('Security', 'Faculty Delete Dept (Forbidden)', 'DELETE /departments/{id}', 403, facDelResp.status, 'FAIL', facDelResp.data);
    }

    console.log('\n=== SECTION 4: VALIDATION TESTS ===');

    // 4.1 Empty required fields
    const emptyDept = await request('POST', '/departments', { name: '', code: '' }, adminToken);
    if (emptyDept.status === 400 && emptyDept.data?.errors) {
        recordResult('Validation', 'Empty Required Fields', 'POST /departments', 400, emptyDept.status, 'PASS', 'Validation error list returned');
    } else {
        recordResult('Validation', 'Empty Required Fields', 'POST /departments', 400, emptyDept.status, 'FAIL', emptyDept.data);
    }

    // 4.2 Invalid Email format
    const badEmail = await request('POST', '/faculty', {
        name: 'Invalid Email Person',
        email: 'not-an-email',
        departmentId: deptId
    }, adminToken);
    if (badEmail.status === 400) {
        recordResult('Validation', 'Invalid Email Format', 'POST /faculty', 400, badEmail.status, 'PASS', 'Rejected invalid email');
    } else {
        recordResult('Validation', 'Invalid Email Format', 'POST /faculty', 400, badEmail.status, 'FAIL', badEmail.data);
    }

    // 4.3 Duplicate Department Code (409)
    const dupDept = await request('POST', '/departments', {
        name: 'Another Dept',
        code: deptCode
    }, adminToken);
    if (dupDept.status === 409) {
        recordResult('Validation', 'Duplicate Department Code', 'POST /departments', 409, dupDept.status, 'PASS', 'Rejected with 409 Conflict');
    } else {
        recordResult('Validation', 'Duplicate Department Code', 'POST /departments', 409, dupDept.status, 'FAIL', dupDept.data);
    }

    // 4.4 Duplicate Course Code (409)
    const dupCourse = await request('POST', '/courses', {
        courseName: 'Duplicate OS',
        courseCode: courseCode,
        departmentId: deptId
    }, adminToken);
    if (dupCourse.status === 409) {
        recordResult('Validation', 'Duplicate Course Code', 'POST /courses', 409, dupCourse.status, 'PASS', 'Rejected with 409 Conflict');
    } else {
        recordResult('Validation', 'Duplicate Course Code', 'POST /courses', 409, dupCourse.status, 'FAIL', dupCourse.data);
    }

    // 4.5 Duplicate Faculty Email (409)
    const dupFac = await request('POST', '/faculty', {
        name: 'Duplicate Fac',
        email: facEmail,
        departmentId: deptId
    }, adminToken);
    if (dupFac.status === 409) {
        recordResult('Validation', 'Duplicate Faculty Email', 'POST /faculty', 409, dupFac.status, 'PASS', 'Rejected with 409 Conflict');
    } else {
        recordResult('Validation', 'Duplicate Faculty Email', 'POST /faculty', 409, dupFac.status, 'FAIL', dupFac.data);
    }

    // 4.6 Nonexistent Department ID (404)
    const badDeptId = await request('POST', '/courses', {
        courseName: 'Quantum Computing',
        courseCode: `QC_${suffix}`,
        departmentId: 999999
    }, adminToken);
    if (badDeptId.status === 404) {
        recordResult('Validation', 'Nonexistent Department ID', 'POST /courses', 404, badDeptId.status, 'PASS', 'Rejected with 404 Not Found');
    } else {
        recordResult('Validation', 'Nonexistent Department ID', 'POST /courses', 404, badDeptId.status, 'FAIL', badDeptId.data);
    }

    // 4.7 Nonexistent Student ID in Marks (404)
    const badStuMarks = await request('POST', '/marks', {
        studentId: 999999,
        courseId: courseId,
        marksObtained: 80,
        maxMarks: 100,
        examType: 'MIDTERM'
    }, adminToken);
    if (badStuMarks.status === 404) {
        recordResult('Validation', 'Nonexistent Student ID', 'POST /marks', 404, badStuMarks.status, 'PASS', 'Rejected with 404 Not Found');
    } else {
        recordResult('Validation', 'Nonexistent Student ID', 'POST /marks', 404, badStuMarks.status, 'FAIL', badStuMarks.data);
    }

    // 4.8 Marks Obtained > Max Marks (400)
    const overMarks = await request('POST', '/marks', {
        studentId: studentId,
        courseId: courseId,
        marksObtained: 125.0,
        maxMarks: 100.0,
        examType: 'MIDTERM'
    }, adminToken);
    if (overMarks.status === 400) {
        recordResult('Validation', 'Marks > Max Marks', 'POST /marks', 400, overMarks.status, 'PASS', 'Rejected marksObtained > maxMarks');
    } else {
        recordResult('Validation', 'Marks > Max Marks', 'POST /marks', 400, overMarks.status, 'FAIL', overMarks.data);
    }

    // 4.9 Negative Marks (400)
    const negMarks = await request('POST', '/marks', {
        studentId: studentId,
        courseId: courseId,
        marksObtained: -15.0,
        maxMarks: 100.0,
        examType: 'MIDTERM'
    }, adminToken);
    if (negMarks.status === 400) {
        recordResult('Validation', 'Negative Marks', 'POST /marks', 400, negMarks.status, 'PASS', 'Rejected negative marks');
    } else {
        recordResult('Validation', 'Negative Marks', 'POST /marks', 400, negMarks.status, 'FAIL', negMarks.data);
    }

    console.log('\n=== SECTION 5: SEARCH & PAGINATION TESTS ===');

    // 5.1 Pagination on Students
    const stuPage = await request('GET', '/students?page=0&size=2', null, adminToken);
    if (stuPage.status === 200 && stuPage.data?.content && Array.isArray(stuPage.data.content)) {
        recordResult('Pagination', 'Students Pagination', 'GET /students?page=0&size=2', 200, stuPage.status, 'PASS', `Total elements: ${stuPage.data.totalElements}`);
    } else {
        recordResult('Pagination', 'Students Pagination', 'GET /students?page=0&size=2', 200, stuPage.status, 'FAIL', stuPage.data);
    }

    // 5.2 Filter Faculty by Department
    const facFilter = await request('GET', `/faculty?departmentId=${deptId}`, null, adminToken);
    if (facFilter.status === 200 && Array.isArray(facFilter.data) && facFilter.data.length > 0) {
        recordResult('Search', 'Filter Faculty by Dept', 'GET /faculty?departmentId={id}', 200, facFilter.status, 'PASS', `Found ${facFilter.data.length} faculty`);
    } else {
        recordResult('Search', 'Filter Faculty by Dept', 'GET /faculty?departmentId={id}', 200, facFilter.status, 'FAIL', facFilter.data);
    }

    // 5.3 Filter Course by Name
    const courseFilter = await request('GET', `/courses?name=Operating`, null, adminToken);
    if (courseFilter.status === 200 && Array.isArray(courseFilter.data) && courseFilter.data.length > 0) {
        recordResult('Search', 'Search Course by Name', 'GET /courses?name=...', 200, courseFilter.status, 'PASS', `Found ${courseFilter.data.length} courses`);
    } else {
        recordResult('Search', 'Search Course by Name', 'GET /courses?name=...', 200, courseFilter.status, 'FAIL', courseFilter.data);
    }

    // 5.4 Filter Attendance by Date
    const attFilter = await request('GET', `/attendance?date=${today}`, null, adminToken);
    if (attFilter.status === 200 && Array.isArray(attFilter.data) && attFilter.data.length > 0) {
        recordResult('Search', 'Filter Attendance by Date', 'GET /attendance?date=...', 200, attFilter.status, 'PASS', `Found ${attFilter.data.length} records`);
    } else {
        recordResult('Search', 'Filter Attendance by Date', 'GET /attendance?date=...', 200, attFilter.status, 'FAIL', attFilter.data);
    }

    console.log('\n=== SECTION 6: DELETE ENDPOINTS CLEANUP VERIFICATION ===');

    // 6.1 Delete Attendance
    const delAtt = await request('DELETE', `/attendance/${attId}`, null, adminToken);
    if (delAtt.status === 200) {
        recordResult('Attendance', 'Delete Attendance', 'DELETE /attendance/{id}', 200, delAtt.status, 'PASS', 'Deleted attendance');
    } else {
        recordResult('Attendance', 'Delete Attendance', 'DELETE /attendance/{id}', 200, delAtt.status, 'FAIL', delAtt.data);
    }

    // 6.2 Delete Marks
    const delMarks = await request('DELETE', `/marks/${marksId}`, null, adminToken);
    if (delMarks.status === 200) {
        recordResult('Marks', 'Delete Marks', 'DELETE /marks/{id}', 200, delMarks.status, 'PASS', 'Deleted marks');
    } else {
        recordResult('Marks', 'Delete Marks', 'DELETE /marks/{id}', 200, delMarks.status, 'FAIL', delMarks.data);
    }

    // 6.3 Delete Assignment
    const delAssign = await request('DELETE', `/assignments/${assignId}`, null, adminToken);
    if (delAssign.status === 200) {
        recordResult('Assignments', 'Delete Assignment', 'DELETE /assignments/{id}', 200, delAssign.status, 'PASS', 'Deleted assignment');
    } else {
        recordResult('Assignments', 'Delete Assignment', 'DELETE /assignments/{id}', 200, delAssign.status, 'FAIL', delAssign.data);
    }

    // 6.4 Drop Course for Student
    const unenroll = await request('DELETE', `/students/${studentId}/courses/${courseId}`, null, adminToken);
    if (unenroll.status === 200) {
        recordResult('Enrollment', 'Drop Course for Student', 'DELETE /students/{sId}/courses/{cId}', 200, unenroll.status, 'PASS', 'Dropped course');
    } else {
        recordResult('Enrollment', 'Drop Course for Student', 'DELETE /students/{sId}/courses/{cId}', 200, unenroll.status, 'FAIL', unenroll.data);
    }

    // 6.5 Delete Student
    const delStu = await request('DELETE', `/students/${studentId}`, null, adminToken);
    if (delStu.status === 200) {
        recordResult('Students', 'Delete Student', 'DELETE /students/{id}', 200, delStu.status, 'PASS', 'Deleted student');
    } else {
        recordResult('Students', 'Delete Student', 'DELETE /students/{id}', 200, delStu.status, 'FAIL', delStu.data);
    }

    // 6.6 Delete Course
    const delCourse = await request('DELETE', `/courses/${courseId}`, null, adminToken);
    if (delCourse.status === 200) {
        recordResult('Courses', 'Delete Course', 'DELETE /courses/{id}', 200, delCourse.status, 'PASS', 'Deleted primary course');
    } else {
        recordResult('Courses', 'Delete Course', 'DELETE /courses/{id}', 200, delCourse.status, 'FAIL', delCourse.data);
    }

    // 6.6b Delete Course created by Faculty in RBAC test
    if (facCourseId) {
        const delFacCourse = await request('DELETE', `/courses/${facCourseId}`, null, adminToken);
        if (delFacCourse.status === 200) {
            recordResult('Courses', 'Delete Secondary Course', 'DELETE /courses/{id}', 200, delFacCourse.status, 'PASS', 'Deleted faculty-created course');
        } else {
            recordResult('Courses', 'Delete Secondary Course', 'DELETE /courses/{id}', 200, delFacCourse.status, 'FAIL', delFacCourse.data);
        }
    }

    // 6.7 Delete Faculty
    const delFac = await request('DELETE', `/faculty/${facultyId}`, null, adminToken);
    if (delFac.status === 200) {
        recordResult('Faculty', 'Delete Faculty', 'DELETE /faculty/{id}', 200, delFac.status, 'PASS', 'Deleted faculty');
    } else {
        recordResult('Faculty', 'Delete Faculty', 'DELETE /faculty/{id}', 200, delFac.status, 'FAIL', delFac.data);
    }

    // 6.8 Delete Department
    const delDept = await request('DELETE', `/departments/${deptId}`, null, adminToken);
    if (delDept.status === 200) {
        recordResult('Departments', 'Delete Department', 'DELETE /departments/{id}', 200, delDept.status, 'PASS', 'Deleted department');
    } else {
        recordResult('Departments', 'Delete Department', 'DELETE /departments/{id}', 200, delDept.status, 'FAIL', delDept.data);
    }

    console.log('\n=========================================');
    console.log('            TEST RESULTS SUMMARY         ');
    console.log('=========================================');

    let passCount = 0;
    let failCount = 0;
    for (const r of results) {
        if (r.status === 'PASS') passCount++;
        else failCount++;
        console.log(`[${r.status}] ${r.category.padEnd(12)} | ${r.endpoint.padEnd(35)} | Expected: ${String(r.expectedStatus).padEnd(7)} | Actual: ${String(r.actualStatus).padEnd(4)} | ${r.testName}`);
        if (r.status === 'FAIL') {
            console.log(`       >>> Details: ${r.details}`);
        }
    }

    console.log('=========================================');
    console.log(`Total: ${results.length} | PASSED: ${passCount} | FAILED: ${failCount}`);
    console.log('=========================================\n');

    const fs = require('fs');
    fs.writeFileSync('d:/student-management/live_test_report.json', JSON.stringify(results, null, 2), 'utf-8');
}

runTests();
