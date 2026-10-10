import React, { useEffect, useState } from 'react';
import { studentApi } from '../../api/studentApi';
import { courseApi } from '../../api/courseApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';
import ConfirmModal from '../../components/ConfirmModal';
import { UserPlus, UserMinus, BookOpen, Users, CheckCircle } from 'lucide-react';

export const EnrollmentPage = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const canManage = hasRole('ADMIN', 'FACULTY');

  const [activeTab, setActiveTab] = useState('student'); // 'student' | 'course'
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Tab 1: By Student
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentCourses, setStudentCourses] = useState([]);
  const [courseToEnrollId, setCourseToEnrollId] = useState('');
  const [loadingStudentCourses, setLoadingStudentCourses] = useState(false);

  // Tab 2: By Course
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseStudents, setCourseStudents] = useState([]);
  const [studentToEnrollId, setStudentToEnrollId] = useState('');
  const [loadingCourseStudents, setLoadingCourseStudents] = useState(false);

  // Drop/Unenroll modal state
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const [dropParams, setDropParams] = useState(null); // { studentId, courseId, title }
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      setLoading(true);
      try {
        const [stuData, crsData] = await Promise.all([
          studentApi.getAll(),
          courseApi.getAll()
        ]);
        const stuList = Array.isArray(stuData) ? stuData : (stuData.content || []);
        const crsList = Array.isArray(crsData) ? crsData : (crsData.content || []);
        setStudents(stuList);
        setCourses(crsList);

        if (stuList.length > 0) {
          setSelectedStudentId(String(stuList[0].id));
          loadStudentCourses(stuList[0].id);
        }
        if (crsList.length > 0) {
          setSelectedCourseId(String(crsList[0].id));
          loadCourseStudents(crsList[0].id);
        }
      } catch (err) {
        setAlert({ type: 'danger', message: err.userMessage || 'Failed to load enrollment metadata' });
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, []);

  const loadStudentCourses = async (studentId) => {
    if (!studentId) return;
    setLoadingStudentCourses(true);
    try {
      const data = await studentApi.getCourses(studentId);
      setStudentCourses(Array.isArray(data) ? data : []);
    } catch {
      setStudentCourses([]);
    } finally {
      setLoadingStudentCourses(false);
    }
  };

  const loadCourseStudents = async (courseId) => {
    if (!courseId) return;
    setLoadingCourseStudents(true);
    try {
      const data = await courseApi.getStudents(courseId);
      setCourseStudents(Array.isArray(data) ? data : []);
    } catch {
      setCourseStudents([]);
    } finally {
      setLoadingCourseStudents(false);
    }
  };

  const handleStudentSelect = (studentId) => {
    setSelectedStudentId(studentId);
    loadStudentCourses(studentId);
  };

  const handleCourseSelect = (courseId) => {
    setSelectedCourseId(courseId);
    loadCourseStudents(courseId);
  };

  // Enroll in Tab 1
  const handleEnrollStudentInCourse = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !courseToEnrollId) return;

    setIsSubmitting(true);
    try {
      await studentApi.enrollInCourse(selectedStudentId, courseToEnrollId);
      setAlert({ type: 'success', message: 'Student successfully enrolled in course!' });
      setCourseToEnrollId('');
      loadStudentCourses(selectedStudentId);
    } catch (err) {
      setAlert({ type: 'danger', message: err.userMessage || 'Failed to enroll student' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enroll in Tab 2
  const handleEnrollCourseWithStudent = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || !studentToEnrollId) return;

    setIsSubmitting(true);
    try {
      await studentApi.enrollInCourse(studentToEnrollId, selectedCourseId);
      setAlert({ type: 'success', message: 'Student added to course roster!' });
      setStudentToEnrollId('');
      loadCourseStudents(selectedCourseId);
    } catch (err) {
      setAlert({ type: 'danger', message: err.userMessage || 'Failed to add student to course' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDropModal = (studentId, courseId, title) => {
    setDropParams({ studentId, courseId, title });
    setIsDropModalOpen(true);
  };

  const handleDropConfirm = async () => {
    if (!dropParams) return;
    setIsSubmitting(true);
    try {
      await studentApi.removeFromCourse(dropParams.studentId, dropParams.courseId);
      setAlert({ type: 'success', message: 'Course enrollment removed successfully.' });
      setIsDropModalOpen(false);

      if (activeTab === 'student') {
        loadStudentCourses(dropParams.studentId);
      } else {
        loadCourseStudents(dropParams.courseId);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.userMessage || 'Failed to remove enrollment' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unenrolled courses for the selected student
  const availableCourses = courses.filter(
    (c) => !studentCourses.some((sc) => sc.id === c.id)
  );

  // Unenrolled students for the selected course
  const availableStudents = students.filter(
    (s) => !courseStudents.some((cs) => cs.id === s.id)
  );

  if (loading) {
    return <LoadingSpinner message="Loading enrollment portal..." />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Course Enrollment</h1>
          <p className="page-subtitle">Manage student registrations and course enrollments</p>
        </div>
      </div>

      {alert && (
        <AlertMessage
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          className={`btn ${activeTab === 'student' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('student')}
        >
          <Users size={16} /> Manage by Student
        </button>
        <button
          className={`btn ${activeTab === 'course' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('course')}
        >
          <BookOpen size={16} /> Manage by Course
        </button>
      </div>

      {/* ================= TAB 1: MANAGE BY STUDENT ================= */}
      {activeTab === 'student' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 16 }}>Select Student</h3>

            <div className="form-group">
              <label className="form-label" htmlFor="enr-student">Student</label>
              <select
                id="enr-student"
                className="form-control"
                value={selectedStudentId}
                onChange={(e) => handleStudentSelect(e.target.value)}
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </select>
            </div>

            {canManage && (
              <form onSubmit={handleEnrollStudentInCourse} style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 12 }}>Enroll in New Course</h4>

                <div className="form-group">
                  <label className="form-label" htmlFor="enr-add-course">Course to Add</label>
                  <select
                    id="enr-add-course"
                    className="form-control"
                    value={courseToEnrollId}
                    onChange={(e) => setCourseToEnrollId(e.target.value)}
                    disabled={isSubmitting || availableCourses.length === 0}
                  >
                    <option value="">Choose Available Course...</option>
                    {availableCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.courseCode} - {c.courseName}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={isSubmitting || !courseToEnrollId}
                >
                  <UserPlus size={16} /> Enroll Student
                </button>
              </form>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 16 }}>
              Currently Enrolled Courses ({studentCourses.length})
            </h3>

            {loadingStudentCourses ? (
              <LoadingSpinner message="Loading courses..." />
            ) : studentCourses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                <BookOpen size={32} style={{ color: 'var(--text-light)', marginBottom: 8 }} />
                <p>This student is not enrolled in any courses.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Course Name</th>
                      <th>Instructor</th>
                      {canManage && <th style={{ width: '80px', textAlign: 'right' }}>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {studentCourses.map((c) => (
                      <tr key={c.id}>
                        <td><span className="badge badge-primary">{c.courseCode}</span></td>
                        <td style={{ fontWeight: 600 }}>{c.courseName}</td>
                        <td>{c.faculty?.name || 'TBA'}</td>
                        {canManage && (
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn btn-danger-ghost btn-sm btn-icon"
                              onClick={() => openDropModal(selectedStudentId, c.id, `Drop ${c.courseCode} for student`)}
                              title="Drop Course"
                            >
                              <UserMinus size={15} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: MANAGE BY COURSE ================= */}
      {activeTab === 'course' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 16 }}>Select Course</h3>

            <div className="form-group">
              <label className="form-label" htmlFor="enr-course">Course</label>
              <select
                id="enr-course"
                className="form-control"
                value={selectedCourseId}
                onChange={(e) => handleCourseSelect(e.target.value)}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.courseCode} - {c.courseName}
                  </option>
                ))}
              </select>
            </div>

            {canManage && (
              <form onSubmit={handleEnrollCourseWithStudent} style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 12 }}>Add Student to Roster</h4>

                <div className="form-group">
                  <label className="form-label" htmlFor="enr-add-student">Student to Add</label>
                  <select
                    id="enr-add-student"
                    className="form-control"
                    value={studentToEnrollId}
                    onChange={(e) => setStudentToEnrollId(e.target.value)}
                    disabled={isSubmitting || availableStudents.length === 0}
                  >
                    <option value="">Choose Available Student...</option>
                    {availableStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={isSubmitting || !studentToEnrollId}
                >
                  <UserPlus size={16} /> Add to Course
                </button>
              </form>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 16 }}>
              Course Student Roster ({courseStudents.length})
            </h3>

            {loadingCourseStudents ? (
              <LoadingSpinner message="Loading course students..." />
            ) : courseStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                <Users size={32} style={{ color: 'var(--text-light)', marginBottom: 8 }} />
                <p>No students enrolled in this course yet.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Student Name</th>
                      <th>Email</th>
                      {canManage && <th style={{ width: '80px', textAlign: 'right' }}>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {courseStudents.map((s) => (
                      <tr key={s.id}>
                        <td>#{s.id}</td>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>{s.email}</td>
                        {canManage && (
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn btn-danger-ghost btn-sm btn-icon"
                              onClick={() => openDropModal(s.id, selectedCourseId, `Remove ${s.name} from this course`)}
                              title="Remove Student"
                            >
                              <UserMinus size={15} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= DROP CONFIRM MODAL ================= */}
      <ConfirmModal
        isOpen={isDropModalOpen}
        onClose={() => setIsDropModalOpen(false)}
        onConfirm={handleDropConfirm}
        title="Unenroll Confirmation"
        message={dropParams?.title || 'Are you sure you want to drop this course enrollment?'}
        confirmText="Yes, Drop"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default EnrollmentPage;
