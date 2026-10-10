import React, { useEffect, useState } from 'react';
import { assignmentApi } from '../../api/assignmentApi';
import { courseApi } from '../../api/courseApi';
import { facultyApi } from '../../api/facultyApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import { FileText, Plus, Edit2, Trash2, Calendar, User, BookOpen } from 'lucide-react';

export const AssignmentsPage = () => {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const isFaculty = hasRole('FACULTY');
  const isStudent = hasRole('STUDENT');
  const canManage = isAdmin || isFaculty;

  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [alert, setAlert] = useState(null);

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentAssign, setCurrentAssign] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form input state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    facultyId: '',
    dueDate: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);

  const fetchAssignments = async (courseId = selectedCourseId) => {
    setLoading(true);
    try {
      if (courseId) {
        const data = await assignmentApi.getByCourse(courseId);
        setAssignments(Array.isArray(data) ? data : []);
      } else {
        const data = await assignmentApi.getAll();
        setAssignments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.userMessage || 'Failed to fetch assignments.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [cData, fData] = await Promise.all([
          courseApi.getAll(),
          facultyApi.getAll()
        ]);
        setCourses(Array.isArray(cData) ? cData : (cData.content || []));
        setFacultyList(Array.isArray(fData) ? fData : (fData.content || []));
      } catch (e) {
        console.error('Failed to load metadata for assignments:', e);
      }
      fetchAssignments();
    };
    init();
  }, []);

  const handleCourseFilterChange = (e) => {
    const cid = e.target.value;
    setSelectedCourseId(cid);
    fetchAssignments(cid);
  };

  const openAddModal = () => {
    setCurrentAssign(null);
    const twoWeeksLater = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    setFormData({
      title: '',
      description: '',
      courseId: courses[0]?.id ? String(courses[0].id) : '',
      facultyId: facultyList[0]?.id ? String(facultyList[0].id) : '',
      dueDate: twoWeeksLater
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openEditModal = (a) => {
    setCurrentAssign(a);
    setFormData({
      title: a.title || '',
      description: a.description || '',
      courseId: String(a.course?.id || ''),
      facultyId: String(a.faculty?.id || ''),
      dueDate: a.dueDate || ''
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.courseId) errors.courseId = 'Course is required';
    if (!formData.facultyId) errors.facultyId = 'Faculty instructor is required';
    if (!formData.dueDate) errors.dueDate = 'Due date is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        courseId: Number(formData.courseId),
        facultyId: Number(formData.facultyId),
        dueDate: formData.dueDate
      };

      if (currentAssign) {
        const updated = await assignmentApi.update(currentAssign.id, payload);
        setAssignments((prev) => prev.map((a) => (a.id === currentAssign.id ? updated : a)));
        setAlert({ type: 'success', message: `Assignment '${updated.title}' updated successfully.` });
      } else {
        const created = await assignmentApi.create(payload);
        setAssignments((prev) => [created, ...prev]);
        setAlert({ type: 'success', message: `Assignment '${created.title}' created successfully.` });
      }
      setIsFormOpen(false);
    } catch (err) {
      setAlert({ type: 'danger', message: err.userMessage || 'Operation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (a) => {
    setDeleteItem(a);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setIsSubmitting(true);
    try {
      await assignmentApi.delete(deleteItem.id);
      setAssignments((prev) => prev.filter((a) => a.id !== deleteItem.id));
      setAlert({ type: 'success', message: 'Assignment deleted successfully.' });
      setIsDeleteOpen(false);
    } catch (err) {
      setAlert({ type: 'danger', message: err.userMessage || 'Failed to delete assignment' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPastDue = (dueDate) => {
    return new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Course Assignments</h1>
          <p className="page-subtitle">Publish, submit, and manage coursework deadlines</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> Create Assignment
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

      <div className="toolbar">
        <div className="toolbar-left">
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '220px' }}
            value={selectedCourseId}
            onChange={handleCourseFilterChange}
          >
            <option value="">All Courses</option>
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
                fetchAssignments('');
              }}
            >
              Clear Filter
            </button>
          )}
        </div>
        <div className="toolbar-right">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Total: <strong>{assignments.length}</strong> assignments
          </span>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading assignments..." />
      ) : assignments.length === 0 ? (
        <div className="card empty-state">
          <FileText className="empty-icon" />
          <h3 className="empty-title">No Assignments Found</h3>
          <p style={{ fontSize: '0.875rem' }}>
            {selectedCourseId
              ? 'No assignments posted for the selected course.'
              : 'No coursework assignments have been created yet.'}
          </p>
          {canManage && !selectedCourseId && (
            <button className="btn btn-primary" onClick={openAddModal} style={{ marginTop: 16 }}>
              <Plus size={16} /> Create First Assignment
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {assignments.map((a) => {
            const pastDue = isPastDue(a.dueDate);
            return (
              <div key={a.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                    <span className="badge badge-primary">{a.course?.courseCode}</span>
                    <span className={`badge ${pastDue ? 'badge-danger' : 'badge-warning'}`}>
                      <Calendar size={12} /> Due: {a.dueDate}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
                    {a.title}
                  </h3>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 16, lineHeight: 1.4 }}>
                    {a.description || 'No detailed instructions provided.'}
                  </p>
                </div>

                <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={13} style={{ color: 'var(--text-light)' }} />
                    Instructor: <strong>{a.faculty?.name || 'TBA'}</strong>
                  </div>

                  {canManage && (
                    <div className="table-actions">
                      <button
                        className="btn btn-secondary btn-sm btn-icon"
                        onClick={() => openEditModal(a)}
                        title="Edit Assignment"
                      >
                        <Edit2 size={14} />
                      </button>
                      {isAdmin && (
                        <button
                          className="btn btn-danger-ghost btn-sm btn-icon"
                          onClick={() => openDeleteModal(a)}
                          title="Delete Assignment"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= CREATE / EDIT MODAL ================= */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => !isSubmitting && setIsFormOpen(false)}
        title={currentAssign ? 'Edit Assignment' : 'Create Course Assignment'}
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
              form="assignment-form"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : currentAssign ? 'Update Assignment' : 'Post Assignment'}
            </button>
          </>
        }
      >
        <form id="assignment-form" onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="a-title">
              Assignment Title <span className="required">*</span>
            </label>
            <input
              id="a-title"
              type="text"
              className={`form-control ${formErrors.title ? 'is-invalid' : ''}`}
              placeholder="e.g. Implement Binary Search Tree"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={isSubmitting}
            />
            {formErrors.title && <div className="form-error">{formErrors.title}</div>}
          </div>

          <div className="form-row">
            <div className="form-col form-group">
              <label className="form-label" htmlFor="a-course">
                Course <span className="required">*</span>
              </label>
              <select
                id="a-course"
                className={`form-control ${formErrors.courseId ? 'is-invalid' : ''}`}
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
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

            <div className="form-col form-group">
              <label className="form-label" htmlFor="a-fac">
                Instructor <span className="required">*</span>
              </label>
              <select
                id="a-fac"
                className={`form-control ${formErrors.facultyId ? 'is-invalid' : ''}`}
                value={formData.facultyId}
                onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                disabled={isSubmitting}
              >
                <option value="">Select Instructor...</option>
                {facultyList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              {formErrors.facultyId && <div className="form-error">{formErrors.facultyId}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="a-due">
              Due Date <span className="required">*</span>
            </label>
            <input
              id="a-due"
              type="date"
              className={`form-control ${formErrors.dueDate ? 'is-invalid' : ''}`}
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              disabled={isSubmitting}
            />
            {formErrors.dueDate && <div className="form-error">{formErrors.dueDate}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="a-desc">
              Description & Requirements
            </label>
            <textarea
              id="a-desc"
              rows={4}
              className="form-control"
              placeholder="Outline problem statements, submission format, and grading rubric..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isSubmitting}
            />
          </div>
        </form>
      </Modal>

      {/* ================= DELETE CONFIRM MODAL ================= */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Assignment"
        message={`Are you sure you want to delete assignment '${deleteItem?.title}'?`}
        confirmText="Yes, Delete"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default AssignmentsPage;
