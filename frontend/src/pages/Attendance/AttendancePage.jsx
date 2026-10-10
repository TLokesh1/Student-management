import React, { useEffect, useState } from 'react';
import { attendanceApi } from '../../api/attendanceApi';
import { courseApi } from '../../api/courseApi';
import { studentApi } from '../../api/studentApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import { CalendarCheck, Plus, CheckCircle, XCircle, Trash2, Edit2, Filter } from 'lucide-react';

export const AttendancePage = () => {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const isFaculty = hasRole('FACULTY');
  const isStudent = hasRole('STUDENT');
  const canMark = isAdmin || isFaculty;

  const [records, setRecords] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Filters
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Mark Attendance Modal state
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [markCourseId, setMarkCourseId] = useState('');
  const [markDate, setMarkDate] = useState(new Date().toISOString().split('T')[0]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [studentStatuses, setStudentStatuses] = useState({}); // { studentId: 'PRESENT' | 'ABSENT' }
  const [loadingEnrolled, setLoadingEnrolled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Single Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editStatus, setEditStatus] = useState('PRESENT');

  // Delete Confirm Modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const fetchRecords = async (courseId = selectedCourseId, date = selectedDate) => {
    setLoading(true);
    try {
      if (isStudent) {
        // Find matching student record for this user
        const students = await studentApi.getAll({ name: user.username });
        const stuList = Array.isArray(students) ? students : (students.content || []);
        const matched = stuList[0];
        if (matched) {
          const stuRecords = await attendanceApi.getByStudent(matched.id);
          setRecords(Array.isArray(stuRecords) ? stuRecords : []);
        } else {
          setRecords([]);
        }
      } else if (courseId) {
        const data = await attendanceApi.getByCourse(courseId);
        setRecords(Array.isArray(data) ? data : []);
      } else if (date) {
        const data = await attendanceApi.getAll({ date });
        setRecords(Array.isArray(data) ? data : []);
      } else {
        const data = await attendanceApi.getAll();
        setRecords(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.userMessage || 'Failed to fetch attendance records' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const coursesData = await courseApi.getAll();
        const list = Array.isArray(coursesData) ? coursesData : (coursesData.content || []);
        setCourses(list);
      } catch (e) {
        console.error('Failed to load courses for attendance:', e);
      }
      fetchRecords();
    };
    init();
  }, []);

  const handleCourseFilterChange = (e) => {
    const val = e.target.value;
    setSelectedCourseId(val);
    fetchRecords(val, selectedDate);
  };

  const handleDateFilterChange = (e) => {
    const val = e.target.value;
    setSelectedDate(val);
    fetchRecords(selectedCourseId, val);
  };

  const clearFilters = () => {
    setSelectedCourseId('');
    setSelectedDate('');
    fetchRecords('', '');
  };

  // When course selected in Mark Attendance Modal
  const handleMarkCourseChange = async (courseId) => {
    setMarkCourseId(courseId);
    if (!courseId) {
      setEnrolledStudents([]);
      setStudentStatuses({});
      return;
    }

    setLoadingEnrolled(true);
    try {
      const students = await courseApi.getStudents(courseId);
      const list = Array.isArray(students) ? students : [];
      setEnrolledStudents(list);

      // Default all to PRESENT
      const statuses = {};
      list.forEach((s) => {
        statuses[s.id] = 'PRESENT';
      });
      setStudentStatuses(statuses);
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to load students for selected course.' });
    } finally {
      setLoadingEnrolled(false);
    }
  };

  const openMarkAttendanceModal = () => {
    setIsMarkModalOpen(true);
    const initialCourse = courses[0]?.id || '';
    setMarkDate(new Date().toISOString().split('T')[0]);
    if (initialCourse) {
      handleMarkCourseChange(initialCourse);
    }
  };

  const handleMarkStatusToggle = (studentId, status) => {
    setStudentStatuses((prev) => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    enrolledStudents.forEach((s) => {
      updated[s.id] = status;
    });
    setStudentStatuses(updated);
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (!markCourseId) {
      setAlert({ type: 'danger', message: 'Please select a course.' });
      return;
    }
    if (enrolledStudents.length === 0) {
      setAlert({ type: 'warning', message: 'No enrolled students to mark attendance for.' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit attendance for all students in parallel
      const promises = enrolledStudents.map((s) =>
        attendanceApi.mark({
          studentId: s.id,
          courseId: Number(markCourseId),
          date: markDate,
          status: studentStatuses[s.id] || 'PRESENT'
        })
      );

      await Promise.all(promises);
      setAlert({
        type: 'success',
        message: `Attendance marked successfully for ${enrolledStudents.length} students on ${markDate}.`
      });
      setIsMarkModalOpen(false);
      fetchRecords(selectedCourseId, selectedDate);
    } catch (err) {
      setAlert({ type: 'danger', message: err.userMessage || 'Failed to save attendance.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (rec) => {
    setEditRecord(rec);
    setEditStatus(rec.status);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editRecord) return;

    setIsSubmitting(true);
    try {
      const updated = await attendanceApi.update(editRecord.id, {
        studentId: editRecord.student.id,
        courseId: editRecord.course.id,
        date: editRecord.date,
        status: editStatus
      });
      setRecords((prev) => prev.map((r) => (r.id === editRecord.id ? updated : r)));
      setAlert({ type: 'success', message: 'Attendance status updated.' });
      setIsEditModalOpen(false);
    } catch (err) {
      setAlert({ type: 'danger', message: err.userMessage || 'Failed to update attendance' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (rec) => {
    setDeleteRecord(rec);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteRecord) return;
    setIsSubmitting(true);
    try {
      await attendanceApi.delete(deleteRecord.id);
      setRecords((prev) => prev.filter((r) => r.id !== deleteRecord.id));
      setAlert({ type: 'success', message: 'Attendance record deleted.' });
      setIsDeleteOpen(false);
    } catch (err) {
      setAlert({ type: 'danger', message: err.userMessage || 'Failed to delete record.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats calculation
  const totalPresent = records.filter((r) => r.status === 'PRESENT').length;
  const totalAbsent = records.filter((r) => r.status === 'ABSENT').length;
  const attendanceRate = records.length > 0 ? Math.round((totalPresent / records.length) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isStudent ? 'My Attendance' : 'Attendance Tracking'}</h1>
          <p className="page-subtitle">Track, mark, and review student class attendance</p>
        </div>
        {canMark && (
          <button className="btn btn-primary" onClick={openMarkAttendanceModal}>
            <Plus size={18} /> Mark Attendance
          </button>
        )}
      </div>

      {alert && (
        <AlertMessage
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Summary stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalPresent}</span>
            <span className="stat-label">Present Records</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <XCircle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalAbsent}</span>
            <span className="stat-label">Absent Records</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <CalendarCheck size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{records.length > 0 ? `${attendanceRate}%` : 'N/A'}</span>
            <span className="stat-label">Attendance Rate</span>
          </div>
        </div>
      </div>

      {/* Filter toolbar (for Admin and Faculty) */}
      {!isStudent && (
        <div className="toolbar">
          <div className="toolbar-left">
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '200px' }}
              value={selectedCourseId}
              onChange={handleCourseFilterChange}
            >
              <option value="">Filter by Course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseCode} - {c.courseName}
                </option>
              ))}
            </select>

            <input
              type="date"
              className="form-control"
              style={{ width: 'auto' }}
              value={selectedDate}
              onChange={handleDateFilterChange}
              title="Filter by Date"
            />

            {(selectedCourseId || selectedDate) && (
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                Clear Filter
              </button>
            )}
          </div>
          <div className="toolbar-right">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing <strong>{records.length}</strong> records
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading attendance records..." />
      ) : records.length === 0 ? (
        <div className="card empty-state">
          <CalendarCheck className="empty-icon" />
          <h3 className="empty-title">No Attendance Records Found</h3>
          <p style={{ fontSize: '0.875rem' }}>
            {selectedCourseId || selectedDate
              ? 'No attendance records match the selected filters.'
              : 'No attendance has been recorded yet.'}
          </p>
          {canMark && !selectedCourseId && !selectedDate && (
            <button className="btn btn-primary" onClick={openMarkAttendanceModal} style={{ marginTop: 16 }}>
              <Plus size={16} /> Mark Class Attendance
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Student</th>
                <th>Course</th>
                <th>Date</th>
                <th>Status</th>
                {canMark && <th style={{ width: '110px', textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <tr key={rec.id}>
                  <td>#{rec.id}</td>
                  <td style={{ fontWeight: 600 }}>{rec.student?.name}</td>
                  <td>
                    <span className="badge badge-primary">{rec.course?.courseCode}</span> {rec.course?.courseName}
                  </td>
                  <td>{rec.date}</td>
                  <td>
                    {rec.status === 'PRESENT' ? (
                      <span className="badge badge-success">
                        <CheckCircle size={12} /> Present
                      </span>
                    ) : (
                      <span className="badge badge-danger">
                        <XCircle size={12} /> Absent
                      </span>
                    )}
                  </td>
                  {canMark && (
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary btn-sm btn-icon"
                          onClick={() => openEditModal(rec)}
                          title="Edit Attendance Status"
                        >
                          <Edit2 size={15} />
                        </button>
                        {isAdmin && (
                          <button
                            className="btn btn-danger-ghost btn-sm btn-icon"
                            onClick={() => openDeleteModal(rec)}
                            title="Delete Record"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= MARK ATTENDANCE MODAL ================= */}
      <Modal
        isOpen={isMarkModalOpen}
        onClose={() => !isSubmitting && setIsMarkModalOpen(false)}
        title="Mark Class Attendance"
        size="lg"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsMarkModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveAttendance}
              disabled={isSubmitting || enrolledStudents.length === 0}
            >
              {isSubmitting ? 'Saving Records...' : 'Save Attendance'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-row">
            <div className="form-col form-group">
              <label className="form-label" htmlFor="mark-course">
                Select Course <span className="required">*</span>
              </label>
              <select
                id="mark-course"
                className="form-control"
                value={markCourseId}
                onChange={(e) => handleMarkCourseChange(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Choose Course...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.courseCode} - {c.courseName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-col form-group">
              <label className="form-label" htmlFor="mark-date">
                Session Date <span className="required">*</span>
              </label>
              <input
                id="mark-date"
                type="date"
                className="form-control"
                value={markDate}
                onChange={(e) => setMarkDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {loadingEnrolled ? (
            <LoadingSpinner message="Loading course students..." />
          ) : enrolledStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
              <p>No students enrolled in this course yet. Please enroll students first under the Enrollment tab.</p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  Enrolled Students ({enrolledStudents.length})
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleMarkAll('PRESENT')}
                  >
                    Mark All Present
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleMarkAll('ABSENT')}
                  >
                    Mark All Absent
                  </button>
                </div>
              </div>

              <div className="table-container" style={{ maxHeight: '340px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Email</th>
                      <th style={{ width: '160px', textAlign: 'center' }}>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledStudents.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.email}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: 8 }}>
                            <button
                              type="button"
                              className={`btn btn-sm ${
                                studentStatuses[s.id] === 'PRESENT' ? 'btn-primary' : 'btn-secondary'
                              }`}
                              onClick={() => handleMarkStatusToggle(s.id, 'PRESENT')}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm ${
                                studentStatuses[s.id] === 'ABSENT' ? 'btn-danger' : 'btn-secondary'
                              }`}
                              onClick={() => handleMarkStatusToggle(s.id, 'ABSENT')}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ================= EDIT SINGLE RECORD MODAL ================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Attendance Status"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-att-form"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Status'}
            </button>
          </>
        }
      >
        <form id="edit-att-form" onSubmit={handleEditSubmit}>
          <p style={{ marginBottom: 16, fontSize: '0.9rem' }}>
            Updating attendance for <strong>{editRecord?.student?.name}</strong> in{' '}
            <strong>{editRecord?.course?.courseName}</strong> on <strong>{editRecord?.date}</strong>.
          </p>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-status">
              Attendance Status
            </label>
            <select
              id="edit-status"
              className="form-control"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
            >
              <option value="PRESENT">PRESENT</option>
              <option value="ABSENT">ABSENT</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* ================= DELETE CONFIRM MODAL ================= */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Attendance Record"
        message={`Delete attendance record for ${deleteRecord?.student?.name} on ${deleteRecord?.date}?`}
        confirmText="Yes, Delete"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default AttendancePage;
