import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studentApi } from '../../api/studentApi';
import { facultyApi } from '../../api/facultyApi';
import { departmentApi } from '../../api/departmentApi';
import { courseApi } from '../../api/courseApi';
import { attendanceApi } from '../../api/attendanceApi';
import { marksApi } from '../../api/marksApi';
import { assignmentApi } from '../../api/assignmentApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';
import {
  Users,
  Briefcase,
  Building2,
  BookOpen,
  CalendarCheck,
  Award,
  FileText,
  UserCheck,
  ArrowRight
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Admin stats
  const [stats, setStats] = useState({
    studentsCount: 0,
    facultyCount: 0,
    departmentsCount: 0,
    coursesCount: 0
  });

  // Recent data
  const [recentCourses, setRecentCourses] = useState([]);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [studentCourses, setStudentCourses] = useState([]);
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [studentMarks, setStudentMarks] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        if (user.role === 'ADMIN') {
          const [students, faculty, departments, courses] = await Promise.all([
            studentApi.getAll(),
            facultyApi.getAll(),
            departmentApi.getAll(),
            courseApi.getAll()
          ]);

          setStats({
            studentsCount: Array.isArray(students) ? students.length : (students.totalElements || 0),
            facultyCount: Array.isArray(faculty) ? faculty.length : (faculty.totalElements || 0),
            departmentsCount: Array.isArray(departments) ? departments.length : 0,
            coursesCount: Array.isArray(courses) ? courses.length : (courses.totalElements || 0)
          });
          setRecentCourses(Array.isArray(courses) ? courses.slice(0, 5) : (courses.content?.slice(0, 5) || []));
        } else if (user.role === 'FACULTY') {
          const [courses, assignments] = await Promise.all([
            courseApi.getAll(),
            assignmentApi.getAll()
          ]);
          const courseList = Array.isArray(courses) ? courses : (courses.content || []);
          setRecentCourses(courseList);
          setRecentAssignments(Array.isArray(assignments) ? assignments.slice(0, 5) : []);
        } else if (user.role === 'STUDENT') {
          // Find matching student record by username/email or student ID
          const studentsResp = await studentApi.getAll({ name: user.username });
          const studentList = Array.isArray(studentsResp) ? studentsResp : (studentsResp.content || []);
          const matchedStudent = studentList[0];

          if (matchedStudent) {
            const [courses, att, marks, assignments] = await Promise.all([
              studentApi.getCourses(matchedStudent.id).catch(() => []),
              attendanceApi.getByStudent(matchedStudent.id).catch(() => []),
              marksApi.getByStudent(matchedStudent.id).catch(() => []),
              assignmentApi.getAll().catch(() => [])
            ]);
            setStudentCourses(courses || []);
            setStudentAttendance(att || []);
            setStudentMarks(marks || []);
            setRecentAssignments(assignments?.slice(0, 5) || []);
          } else {
            // General assignments if no specific student linked to user account yet
            const assignments = await assignmentApi.getAll().catch(() => []);
            setRecentAssignments(assignments?.slice(0, 5) || []);
          }
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
        setError('Unable to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return <LoadingSpinner message="Loading dashboard statistics..." />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Welcome, {user?.username}
          </h1>
          <p className="page-subtitle">
            Role: <strong>{user?.role}</strong> | Academic Management Portal
          </p>
        </div>
      </div>

      {error && <AlertMessage type="danger" message={error} />}

      {/* ================= ADMIN DASHBOARD ================= */}
      {user.role === 'ADMIN' && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">
                <Users size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.studentsCount}</span>
                <span className="stat-label">Total Students</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple">
                <Briefcase size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.facultyCount}</span>
                <span className="stat-label">Total Faculty</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon amber">
                <Building2 size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.departmentsCount}</span>
                <span className="stat-label">Departments</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">
                <BookOpen size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.coursesCount}</span>
                <span className="stat-label">Total Courses</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Active Courses</h3>
                <Link to="/courses" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  View All <ArrowRight size={14} />
                </Link>
              </div>

              {recentCourses.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No courses added yet.</p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Course Name</th>
                        <th>Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCourses.map((c) => (
                        <tr key={c.id}>
                          <td><strong>{c.courseCode}</strong></td>
                          <td>{c.courseName}</td>
                          <td>{c.department?.name || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 16 }}>Quick Administrative Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Link to="/students" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                  <Users size={16} /> Manage Student Directory
                </Link>
                <Link to="/departments" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                  <Building2 size={16} /> Manage Academic Departments
                </Link>
                <Link to="/courses" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                  <BookOpen size={16} /> Add or Update Courses
                </Link>
                <Link to="/faculty" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                  <Briefcase size={16} /> Faculty Staff Directory
                </Link>
                <Link to="/enrollment" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                  <UserCheck size={16} /> Course Enrollment Management
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================= FACULTY DASHBOARD ================= */}
      {user.role === 'FACULTY' && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon green">
                <BookOpen size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{recentCourses.length}</span>
                <span className="stat-label">Available Courses</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple">
                <FileText size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{recentAssignments.length}</span>
                <span className="stat-label">Assignments</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Courses</h3>
                <Link to="/courses" style={{ fontSize: '0.85rem' }}>View All Courses</Link>
              </div>

              {recentCourses.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No courses found.</p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Course Title</th>
                        <th>Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCourses.map((c) => (
                        <tr key={c.id}>
                          <td><strong>{c.courseCode}</strong></td>
                          <td>{c.courseName}</td>
                          <td>{c.department?.name || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 16 }}>Faculty Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Link to="/attendance" className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
                  <CalendarCheck size={16} /> Mark Class Attendance
                </Link>
                <Link to="/marks" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                  <Award size={16} /> Enter / Update Marks
                </Link>
                <Link to="/assignments" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                  <FileText size={16} /> Create Course Assignment
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================= STUDENT DASHBOARD ================= */}
      {user.role === 'STUDENT' && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">
                <BookOpen size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{studentCourses.length}</span>
                <span className="stat-label">Enrolled Courses</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">
                <CalendarCheck size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">
                  {studentAttendance.length > 0
                    ? `${Math.round(
                        (studentAttendance.filter((a) => a.status === 'PRESENT').length /
                          studentAttendance.length) *
                          100
                      )}%`
                    : '100%'}
                </span>
                <span className="stat-label">Attendance Rate</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon amber">
                <Award size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{studentMarks.length}</span>
                <span className="stat-label">Graded Exams</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple">
                <FileText size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{recentAssignments.length}</span>
                <span className="stat-label">Assignments</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>My Enrolled Courses</h3>
                <Link to="/courses" style={{ fontSize: '0.85rem' }}>View Catalog</Link>
              </div>

              {studentCourses.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>You are not enrolled in any courses yet.</p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Course</th>
                        <th>Instructor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentCourses.map((c) => (
                        <tr key={c.id}>
                          <td><strong>{c.courseCode}</strong></td>
                          <td>{c.courseName}</td>
                          <td>{c.faculty?.name || 'TBA'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Active Assignments</h3>
                <Link to="/assignments" style={{ fontSize: '0.85rem' }}>View All</Link>
              </div>

              {recentAssignments.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No upcoming assignments.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recentAssignments.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        padding: '12px 14px',
                        background: 'var(--bg-alt)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Course: {a.course?.courseCode} - {a.course?.courseName}
                        </div>
                      </div>
                      <span className="badge badge-warning">Due: {a.dueDate}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
