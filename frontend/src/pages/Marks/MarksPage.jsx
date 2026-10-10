import React, { useEffect, useState } from 'react';
import { marksApi } from '../../api/marksApi';
import { courseApi } from '../../api/courseApi';
import { studentApi } from '../../api/studentApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import { Award, Plus, Edit2, Trash2, BookOpen, User } from 'lucide-react';

export const MarksPage = () => {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const isFaculty = hasRole('FACULTY');
  const isStudent = hasRole('STUDENT');
  const canManage = isAdmin || isFaculty;

  const [marksList, setMarksList] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Filters
  const [selectedCourseId, setSelectedCourseId] = useState('');

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentMark, setCurrentMark] = useState(null);
  const [courseStudents, setCourseStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form input state
  const [formData, setFormData] = useState({
    courseId: '',
    studentId: '',
    marksObtained: '',
    maxMarks: '100',
    examType: 'MIDTERM',
    semester: '1',
    academicYear: '2026-2027'
  });
  const [formErrors, setFormErrors] = useState({});

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);

  const fetchMarks = async (courseId = selectedCourseId) => {
    setLoading(true);
    try {
      if (isStudent) {
        const students = await studentApi.getAll({ name: user.username });
        const list = Array.isArray(students) ? students : (students.content || []);
        const matched = list[0];
        if (matched) {
          const stuMarks = await marksApi.getByStudent(matched.id);
          setMarksList(Array.isArray(stuMarks) ? stuMarks : []);
        } else {
          setMarksList([]);
        }
      } else if (courseId) {
        const data = await marksApi.getByCourse(courseId);
        setMarksList(Array.isArray(data) ? data : []);
      } else {
        const data = await marksApi.getAll();
        setMarksList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.userMessage || 'Failed to fetch marks.' });
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
        console.error('Failed to load courses for marks:', e);
      }
      fetchMarks();
    };
    init();
  }, []);

  const handleCourseFilterChange = (e) => {
    const cid = e.target.value;
    setSelectedCourseId(cid);
    fetchMarks(cid);
  };

  // When course selected inside the Add/Edit form, load enrolled students
  const handleFormCourseChange = async (courseId) => {
    setFormData((prev) => ({ ...prev, courseId, studentId: '' }));
    if (!courseId) {
      setCourseStudents([]);
      return;
    }
    setLoadingStudents(true);
    try {
      const students = await courseApi.getStudents(courseId);
      const list = Array.isArray(students) ? students : [];
      setCourseStudents(list);
      if (list.length > 0) {
        setFormData((prev) => ({ ...prev, studentId: String(list[0].id) }));
      }
    } catch {
      setCourseStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const openAddModal = () => {
    setCurrentMark(null);
    const initialCourse = courses[0]?.id ? String(courses[0].id) : '';
    setFormData({
      courseId: initialCourse,
      studentId: '',
      marksObtained: '',
      maxMarks: '100',
      examType: 'MIDTERM',
      semester: '1',
      academicYear: '2026-2027'
    });
    setFormErrors({});
    setIsFormOpen(true);
    if (initialCourse) {
      handleFormCourseChange(initialCourse);
    }
  };

  const openEditModal = async (m) => {
    setCurrentMark(m);
    setFormData({
      courseId: String(m.course?.id || ''),
      studentId: String(m.student?.id || ''),
      marksObtained: String(m.marksObtained || ''),
      maxMarks: String(m.maxMarks || '100'),
      examType: m.examType || 'MIDTERM',
      semester: String(m.semester || '1'),
      academicYear: m.academicYear || '2026-2027'
    });
    setFormErrors({});
    setIsFormOpen(true);
    if (m.course?.id) {
      handleFormCourseChange(String(m.course.id));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.courseId) errors.courseId = 'Course is required';
    if (!formData.studentId) errors.studentId = 'Student is required';

    const obtained = parseFloat(formData.marksObtained);
    const max = parseFloat(formData.maxMarks);

    if (isNaN(obtained) || obtained < 0) {
      errors.marksObtained = 'Marks obtained cannot be negative';
    }
    if (isNaN(max) || max <= 0) {
      errors.maxMarks = 'Maximum marks must be greater than 0';
    }
    if (!isNaN(obtained) && !isNaN(max) && obtained > max) {
      errors.marksObtained = `Marks obtained (${obtained}) cannot exceed maximum marks (${max})`;
    }
    if (!formData.examType) errors.examType = 'Exam type is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        courseId: Number(formData.courseId),
        studentId: Number(formData.studentId),
        marksObtained: parseFloat(formData.marksObtained),
        maxMarks: parseFloat(formData.maxMarks),
        examType: formData.examType,
        semester: formData.semester ? Number(formData.semester) : null,
        academicYear: formData.academicYear
      };

      if (currentMark) {
        const updated = await marksApi.update(currentMark.id, payload);
        setMarksList((prev) => prev.map((m) => (m.id === currentMark.id ? updated : m)));
        setAlert({ type: 'success', message: 'Marks updated successfully.' });
      } else {
        const created = await marksApi.create(payload);
        setMarksList((prev) => [created, ...prev]);
        setAlert({ type: 'success', message: 'Marks recorded successfully.' });
      }
      setIsFormOpen(false);
    } catch (err) {
      setAlert({ type: 'danger', message: err.userMessage || 'Operation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (m) => {
    setDeleteItem(m);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setIsSubmitting(true);
    try {
      await marksApi.delete(deleteItem.id);
      setMarksList((prev) => prev.filter((m) => m.id !== deleteItem.id));
      setAlert({ type: 'success', message: 'Marks record deleted.' });
      setIsDeleteOpen(false);
    } catch (err) {
      setAlert({ type: 'danger', message: err.userMessage || 'Failed to delete record' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGradeBadge = (obtained, max) => {
    const percentage = (obtained / max) * 100;
    if (percentage >= 90) return <span className="badge badge-success">A+ ({percentage.toFixed(1)}%)</span>;
    if (percentage >= 80) return <span className="badge badge-primary">A ({percentage.toFixed(1)}%)</span>;
    if (percentage >= 70) return <span className="badge badge-info">B ({percentage.toFixed(1)}%)</span>;
    if (percentage >= 60) return <span className="badge badge-warning">C ({percentage.toFixed(1)}%)</span>;
    if (percentage >= 40) return <span className="badge badge-gray">D ({percentage.toFixed(1)}%)</span>;
    return <span className="badge badge-danger">F ({percentage.toFixed(1)}%)</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isStudent ? 'My Academic Marks' : 'Marks & Grades'}</h1>
          <p className="page-subtitle">Track, grade, and evaluate student academic performances</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> Enter Marks
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

      {/* Filter toolbar (for Admin and Faculty) */}
      {!isStudent && (
        <div className="toolbar">
          <div className="toolbar-left">
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '220px' }}
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
            {selectedCourseId && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setSelectedCourseId('');
                  fetchMarks('');
                }}
              >
                Clear Filter
              </button>
            )}
          </div>
          <div className="toolbar-right">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing <strong>{marksList.length}</strong> exam records
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading marks and grade records..." />
      ) : marksList.length === 0 ? (
        <div className="card empty-state">
          <Award className="empty-icon" />
          <h3 className="empty-title">No Marks Found</h3>
          <p style={{ fontSize: '0.875rem' }}>
            {selectedCourseId
              ? 'No marks records match the selected course.'
              : 'No examination marks have been submitted yet.'}
          </p>
          {canManage && !selectedCourseId && (
            <button className="btn btn-primary" onClick={openAddModal} style={{ marginTop: 16 }}>
              <Plus size={16} /> Enter Exam Marks
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
                <th>Exam</th>
                <th>Semester</th>
                <th>Score</th>
                <th>Grade</th>
                {canManage && <th style={{ width: '110px', textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {marksList.map((m) => (
                <tr key={m.id}>
                  <td>#{m.id}</td>
                  <td style={{ fontWeight: 600 }}>{m.student?.name}</td>
                  <td>
                    <span className="badge badge-primary">{m.course?.courseCode}</span> {m.course?.courseName}
                  </td>
                  <td>
                    <span className="badge badge-info">{m.examType}</span>
                  </td>
                  <td>Sem {m.semester || '1'} ({m.academicYear || '2026'})</td>
                  <td>
                    <strong>{m.marksObtained}</strong> / {m.maxMarks}
                  </td>
                  <td>{getGradeBadge(m.marksObtained, m.maxMarks)}</td>
                  {canManage && (
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary btn-sm btn-icon"
                          onClick={() => openEditModal(m)}
                          title="Edit Marks"
                        >
                          <Edit2 size={15} />
                        </button>
                        {isAdmin && (
                          <button
                            className="btn btn-danger-ghost btn-sm btn-icon"
                            onClick={() => openDeleteModal(m)}
                            title="Delete Marks"
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

      {/* ================= ENTER / EDIT MARKS MODAL ================= */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => !isSubmitting && setIsFormOpen(false)}
        title={currentMark ? 'Edit Examination Marks' : 'Enter Student Marks'}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsFormOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="marks-form"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : currentMark ? 'Update Marks' : 'Save Marks'}
            </button>
          </>
        }
      >
        <form id="marks-form" onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="m-course">
              Course <span className="required">*</span>
            </label>
            <select
              id="m-course"
              className={`form-control ${formErrors.courseId ? 'is-invalid' : ''}`}
              value={formData.courseId}
              onChange={(e) => handleFormCourseChange(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">Select Course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseCode} - {c.courseName}
                </option>
              ))}
            </select>
            {formErrors.courseId && <div className="form-error">{formErrors.courseId}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="m-student">
              Student <span className="required">*</span>
            </label>
            {loadingStudents ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading course students...</p>
            ) : courseStudents.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>
                No students enrolled in this course. Please enroll students first.
              </p>
            ) : (
              <select
                id="m-student"
                className={`form-control ${formErrors.studentId ? 'is-invalid' : ''}`}
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                disabled={isSubmitting}
              >
                <option value="">Select Student...</option>
                {courseStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </select>
            )}
            {formErrors.studentId && <div className="form-error">{formErrors.studentId}</div>}
          </div>

          <div className="form-row">
            <div className="form-col form-group">
              <label className="form-label" htmlFor="m-obtained">
                Marks Obtained <span className="required">*</span>
              </label>
              <input
                id="m-obtained"
                type="number"
                step="0.5"
                min="0"
                className={`form-control ${formErrors.marksObtained ? 'is-invalid' : ''}`}
                placeholder="e.g. 85.5"
                value={formData.marksObtained}
                onChange={(e) => setFormData({ ...formData, marksObtained: e.target.value })}
                disabled={isSubmitting}
              />
              {formErrors.marksObtained && <div className="form-error">{formErrors.marksObtained}</div>}
            </div>

            <div className="form-col form-group">
              <label className="form-label" htmlFor="m-max">
                Maximum Marks <span className="required">*</span>
              </label>
              <input
                id="m-max"
                type="number"
                step="1"
                min="1"
                className={`form-control ${formErrors.maxMarks ? 'is-invalid' : ''}`}
                placeholder="e.g. 100"
                value={formData.maxMarks}
                onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                disabled={isSubmitting}
              />
              {formErrors.maxMarks && <div className="form-error">{formErrors.maxMarks}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-col form-group">
              <label className="form-label" htmlFor="m-exam">
                Exam Type <span className="required">*</span>
              </label>
              <select
                id="m-exam"
                className="form-control"
                value={formData.examType}
                onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                disabled={isSubmitting}
              >
                <option value="MIDTERM">MIDTERM</option>
                <option value="FINAL">FINAL</option>
                <option value="QUIZ">QUIZ</option>
                <option value="ASSIGNMENT">ASSIGNMENT</option>
                <option value="LAB">LAB</option>
              </select>
            </div>

            <div className="form-col form-group">
              <label className="form-label" htmlFor="m-sem">
                Semester
              </label>
              <input
                id="m-sem"
                type="number"
                min="1"
                max="8"
                className="form-control"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* ================= DELETE CONFIRM MODAL ================= */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Marks Record"
        message={`Are you sure you want to delete the ${deleteItem?.examType} record for ${deleteItem?.student?.name}?`}
        confirmText="Yes, Delete"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default MarksPage;
