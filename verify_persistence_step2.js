const fs = require('fs');
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

async function verifyPersistence() {
    const state = JSON.parse(fs.readFileSync('d:/student-management/persistence_state.json', 'utf-8'));
    console.log('Loaded persistence state:', state);

    // 1. Login after restart
    const login = await request('POST', '/auth/login', { username: 'admin', password: 'admin123' });
    const token = login.data.token;
    console.log('1. Post-restart Admin login: SUCCESS');

    let allPassed = true;

    // 2. Verify Department
    const dept = await request('GET', `/departments/${state.deptId}`, null, token);
    const deptOk = dept.status === 200 && dept.data.code === state.deptCode;
    console.log(`2. Department persisted: ${deptOk ? 'PASS' : 'FAIL'} (${dept.data?.name})`);
    if (!deptOk) allPassed = false;

    // 3. Verify Faculty
    const fac = await request('GET', `/faculty/${state.facultyId}`, null, token);
    const facOk = fac.status === 200 && fac.data.department?.id === state.deptId;
    console.log(`3. Faculty persisted & linked to Dept: ${facOk ? 'PASS' : 'FAIL'} (${fac.data?.name})`);
    if (!facOk) allPassed = false;

    // 4. Verify Course
    const course = await request('GET', `/courses/${state.courseId}`, null, token);
    const courseOk = course.status === 200 && course.data.department?.id === state.deptId && course.data.faculty?.id === state.facultyId;
    console.log(`4. Course persisted & linked to Dept + Faculty: ${courseOk ? 'PASS' : 'FAIL'} (${course.data?.courseName})`);
    if (!courseOk) allPassed = false;

    // 5. Verify Student
    const stu = await request('GET', `/students/${state.studentId}`, null, token);
    const stuOk = stu.status === 200 && stu.data.id === state.studentId;
    console.log(`5. Student persisted: ${stuOk ? 'PASS' : 'FAIL'} (${stu.data?.name})`);
    if (!stuOk) allPassed = false;

    // 6. Verify Enrollment: Student -> Courses
    const stuCourses = await request('GET', `/students/${state.studentId}/courses`, null, token);
    const stuCourseOk = stuCourses.status === 200 && stuCourses.data.some(c => c.id === state.courseId);
    console.log(`6. Student -> Course enrollment persisted: ${stuCourseOk ? 'PASS' : 'FAIL'}`);
    if (!stuCourseOk) allPassed = false;

    // 7. Verify Enrollment: Course -> Students
    const courseStudents = await request('GET', `/courses/${state.courseId}/students`, null, token);
    const courseStuOk = courseStudents.status === 200 && courseStudents.data.some(s => s.id === state.studentId);
    console.log(`7. Course -> Student enrollment persisted: ${courseStuOk ? 'PASS' : 'FAIL'}`);
    if (!courseStuOk) allPassed = false;

    // 8. Verify Attendance
    const att = await request('GET', `/attendance/${state.attId}`, null, token);
    const attOk = att.status === 200 && att.data.student?.id === state.studentId && att.data.course?.id === state.courseId && att.data.status === 'PRESENT';
    console.log(`8. Attendance record persisted & linked: ${attOk ? 'PASS' : 'FAIL'}`);
    if (!attOk) allPassed = false;

    // 9. Verify Marks
    const marks = await request('GET', `/marks/${state.marksId}`, null, token);
    const marksOk = marks.status === 200 && marks.data.student?.id === state.studentId && marks.data.course?.id === state.courseId && marks.data.marksObtained === 98.5;
    console.log(`9. Marks record persisted & linked: ${marksOk ? 'PASS' : 'FAIL'}`);
    if (!marksOk) allPassed = false;

    // 10. Verify Assignment
    const assign = await request('GET', `/assignments/${state.assignId}`, null, token);
    const assignOk = assign.status === 200 && assign.data.course?.id === state.courseId && assign.data.faculty?.id === state.facultyId;
    console.log(`10. Assignment persisted & linked: ${assignOk ? 'PASS' : 'FAIL'}`);
    if (!assignOk) allPassed = false;

    console.log('\n--- CLEANING UP PERSISTENCE TEST DATA ---');
    // Cleanup in correct dependency order
    await request('DELETE', `/attendance/${state.attId}`, null, token);
    await request('DELETE', `/marks/${state.marksId}`, null, token);
    await request('DELETE', `/assignments/${state.assignId}`, null, token);
    await request('DELETE', `/students/${state.studentId}/courses/${state.courseId}`, null, token);
    await request('DELETE', `/students/${state.studentId}`, null, token);
    await request('DELETE', `/courses/${state.courseId}`, null, token);
    await request('DELETE', `/faculty/${state.facultyId}`, null, token);
    await request('DELETE', `/departments/${state.deptId}`, null, token);
    console.log('Cleanup complete.');

    console.log(`\nOVERALL PERSISTENCE TEST RESULT: ${allPassed ? 'ALL PASS (10/10)' : 'FAILED'}`);
    process.exit(allPassed ? 0 : 1);
}

verifyPersistence().catch(err => {
    console.error('Persistence test failed:', err);
    process.exit(1);
});
