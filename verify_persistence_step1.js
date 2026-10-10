const BASE_URL = 'http://localhost:8080';

async function request(method, path, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    const resp = await fetch(`${BASE_URL}${path}`, options);
    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: resp.status, data };
}

async function main() {
    // 1. Admin login
    const login = await request('POST', '/auth/login', { username: 'admin', password: 'admin123' });
    const token = login.data.token;
    console.log('Admin login successful.');

    const suffix = 'P' + Date.now().toString().slice(-4);

    // 2. Create Dept
    const dept = await request('POST', '/departments', {
        name: `Quantum Physics Department ${suffix}`,
        code: `QPHYS_${suffix}`,
        description: 'Physics & Quantum Computing'
    }, token);
    const deptId = dept.data.id;
    console.log(`Created Department ID: ${deptId}, code: QPHYS_${suffix}`);

    // 3. Create Faculty
    const fac = await request('POST', '/faculty', {
        name: `Prof. Feynman ${suffix}`,
        email: `feynman_${suffix}@university.edu`,
        phone: '9876543210',
        designation: 'Distinguished Professor',
        departmentId: deptId
    }, token);
    const facultyId = fac.data.id;
    console.log(`Created Faculty ID: ${facultyId}`);

    // 4. Create Course
    const course = await request('POST', '/courses', {
        courseName: `Quantum Mechanics ${suffix}`,
        courseCode: `QM_${suffix}`,
        description: 'Wave functions and Hilbert spaces',
        departmentId: deptId,
        facultyId: facultyId
    }, token);
    const courseId = course.data.id;
    console.log(`Created Course ID: ${courseId}, code: QM_${suffix}`);

    // 5. Create Student
    const stu = await request('POST', '/students', {
        name: `Marie Curie ${suffix}`,
        email: `marie_${suffix}@university.edu`,
        age: 22,
        course: 'Physics'
    }, token);
    const studentId = stu.data.id;
    console.log(`Created Student ID: ${studentId}`);

    // 6. Enroll Student in Course
    const enroll = await request('POST', `/students/${studentId}/courses/${courseId}`, null, token);
    console.log(`Enrolled Student in Course: status ${enroll.status}`);

    // 7. Mark Attendance
    const att = await request('POST', '/attendance', {
        studentId: studentId,
        courseId: courseId,
        date: '2026-10-04',
        status: 'PRESENT'
    }, token);
    const attId = att.data.id;
    console.log(`Created Attendance ID: ${attId}`);

    // 8. Enter Marks
    const marks = await request('POST', '/marks', {
        studentId: studentId,
        courseId: courseId,
        marksObtained: 98.5,
        maxMarks: 100.0,
        examType: 'MIDTERM',
        semester: 5,
        academicYear: '2026'
    }, token);
    const marksId = marks.data.id;
    console.log(`Created Marks ID: ${marksId}`);

    // 9. Create Assignment
    const assign = await request('POST', '/assignments', {
        title: `Wavefunction Collapse Lab ${suffix}`,
        description: 'Simulate photon interference',
        courseId: courseId,
        facultyId: facultyId,
        dueDate: '2026-10-30'
    }, token);
    const assignId = assign.data.id;
    console.log(`Created Assignment ID: ${assignId}`);

    const state = {
        deptId,
        deptCode: `QPHYS_${suffix}`,
        facultyId,
        courseId,
        courseCode: `QM_${suffix}`,
        studentId,
        attId,
        marksId,
        assignId
    };

    const fs = require('fs');
    fs.writeFileSync('d:/student-management/persistence_state.json', JSON.stringify(state, null, 2), 'utf-8');
    console.log('Saved persistence state to persistence_state.json');
}

main().catch(console.error);
