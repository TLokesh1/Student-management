import React, { useEffect, useState } from 'react';
import { courseApi } from '../../api/courseApi';
import { departmentApi } from '../../api/departmentApi';
import { facultyApi } from '../../api/facultyApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import SearchBar from '../../components/SearchBar';
import { BookOpen, Plus, Edit2, Trash2, Eye, Users, User } from 'lucide-react';

export const CoursesPage = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const isFaculty = hasRole('FACULTY');
  const canManageCourses = isAdmin || isFaculty;

  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [alert, setAlert] = useState(null);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isStudentsOpen, setIsStudentsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form input state
  const [formData, setFormData] = useState({
    courseName: '',
    courseCode: '',
    description: '',
    departmentId: '',
    facultyId: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const loadData = async (deptId = selectedDeptId, name = searchName) => {
    setLoading(true);
    try {
      const params = {};
      if (deptId) params.departmentId = deptId;
      if (name) params.name = name;

      const [courseData, deptsData, facData] = await Promise.all([
        courseApi.getAll(params),
        departments.length === 0 ? departmentApi.getAll() : Promise.resolve(departments),
        facultyList.length === 0 ? facultyApi.getAll() : Promise.resolve(facultyList)
      ]);

      setCourses(Array.isArray(courseData) ? courseData : (courseData.content || []));
      if (departments.length === 0 && Array.isArray(deptsData)) setDepartments(deptsData);
      if (facultyList.length === 0 && Array.isArray(facData)) setFacultyList(Array.isArray(facData) ? facData : (facData.content || []));
    } catch (err) {
      setAlert({ type: 'danger', message: err.userMessage || 'Failed to load courses' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeptFilterChange = (e) => {
    const deptId = e.target.value;
    setSelectedDeptId(deptId);
    loadData(deptId, searchName);
  };

  const handleSearchChange = (val) => {
    setSearchName(val);
    loadData(selectedDeptId, val);
  };

  const openAddModal = () => {
    setCurrentCourse(null);
    setFormData({
      courseName: '',
      courseCode: '',
      description: '',
      departmentId: departments[0]?.id || '',
      facultyId: ''
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openEditModal = (c) => {
    setCurrentCourse(c);
    setFormData({
      courseName: c.courseName || '',
      courseCode: c.courseCode || '',
      description: c.description || '',
      departmentId: c.department?.id || '',
      facultyId: c.faculty?.id || ''
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openDetailModal = (c) => {
    setCurrentCourse(c);
    setIsDetailOpen(true);
  };

  const openStudentsModal = async (c) => {
    setCurrentCourse(c);
    setIsStudentsOpen(true);
    setLoadingStudents(true);
    try {
      const students = await courseApi.getStudents(c.id);
      setEnrolledStudents(Array.isArray(students) ? students : []);
    } catch (err) {
      setEnrolledStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const openDeleteModal = (c) => {
    setCurrentCourse(c);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.courseName.trim()) errors.courseName = 'Course name is required';
    if (!formData.courseCode.trim()) errors.courseCode = 'Course code is required';
    if (!formData.departmentId) errors.departmentId = 'Department is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        courseName: formData.courseName.trim(),
        courseCode: formData.courseCode.trim().toUpperCase(),
        description: formData.description.trim(),
        departmentId: Number(formData.departmentId),
        facultyId: formData.facultyId ? Number(formData.facultyId) : null
      };

      if (currentCourse) {
        const updated = await courseApi.update(currentCourse.id, payload);
        setCourses((prev) => prev.map((c) => (c.id === currentCourse.id ? updated : c)));
        setAlert({ type: 'success', message: `Course '${updated.courseName}' updated successfully.` });
      } else {
        const created = await courseApi.create(payload);
        setCourses((prev) => [...prev, created]);
        setAlert({ type: 'success', message: `Course '${created.courseName}' created successfully.` });
      }
      setIsFormOpen(false);
    } catch (err) {
      setAlert({ type: 'danger', message: err.userMessage || 'Operation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentCourse) return;
    setIsSubmitting(true);
    try {
      await courseApi.delete(currentCourse.id);
      setCourses((prev) => prev.filter((c) => c.id !== currentCourse.id));
      setAlert({ type: 'success', message: `Course '${currentCourse.courseName}' deleted successfully.` });
      setIsDeleteOpen(false);
    } catch (err) {
      setAlert({ type: 'danger', message: err.userMessage || 'Failed to delete course' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Courses</h1>
          <p className="page-subtitle">Academic course catalog and class enrollments</p>
        </div>
        {canManageCourses && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> Add Course
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
          <SearchBar
            value={searchName}
            onChange={handleSearchChange}
            placeholder="Search by course title..."
          />
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '180px' }}
            value={selectedDeptId}
            onChange={handleDeptFilterChange}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar-right">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Total: <strong>{courses.length}</strong> courses
          </span>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading courses..." />
      ) : courses.length === 0 ? (
        <div className="card empty-state">
          <BookOpen className="empty-icon" />
          <h3 className="empty-title">No Courses Found</h3>
          <p style={{ fontSize: '0.875rem' }}>
            {searchName || selectedDeptId ? 'No courses match the current filter.' : 'No courses have been created yet.'}
          </p>
          {canManageCourses && !searchName && !selectedDeptId && (
            <button className="btn btn-primary" onClick={openAddModal} style={{ marginTop: 16 }}>
              <Plus size={16} /> Add First Course
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '70px' }}>ID</th>
                <th style={{ width: '120px' }}>Code</th>
                <th>Course Name</th>
                <th>Department</th>
                <th>Instructor</th>
                <th style={{ width: '160px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td>#{c.id}</td>
                  <td>
                    <span className="badge badge-primary">{c.courseCode}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{c.courseName}</td>
                  <td>
                    {c.department ? (
                      <span className="badge badge-gray">{c.department.code || c.department.name}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {c.faculty ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                        <User size={14} style={{ color: 'var(--text-muted)' }} /> {c.faculty.name}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => openDetailModal(c)}
                        title="View Course Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => openStudentsModal(c)}
                        title="View Enrolled Students"
                      >
                        <Users size={16} />
                      </button>
                      {canManageCourses && (
                        <button
                          className="btn btn-secondary btn-sm btn-icon"
                          onClick={() => openEditModal(c)}
                          title="Edit Course"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          className="btn btn-danger-ghost btn-sm btn-icon"
                          onClick={() => openDeleteModal(c)}
                          title="Delete Course"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= ADD / EDIT MODAL ================= */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => !isSubmitting && setIsFormOpen(false)}
        title={currentCourse ? 'Edit Course' : 'Add New Course'}
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
              form="course-form"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : currentCourse ? 'Update Course' : 'Create Course'}
            </button>
          </>
        }
      >
        <form id="course-form" onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="crs-name">
              Course Title <span className="required">*</span>
            </label>
            <input
              id="crs-name"
              type="text"
              className={`form-control ${formErrors.courseName ? 'is-invalid' : ''}`}
              placeholder="e.g. Data Structures & Algorithms"
              value={formData.courseName}
              onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
              disabled={isSubmitting}
            />
            {formErrors.courseName && <div className="form-error">{formErrors.courseName}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="crs-code">
              Course Code <span className="required">*</span>
            </label>
            <input
              id="crs-code"
              type="text"
              className={`form-control ${formErrors.courseCode ? 'is-invalid' : ''}`}
              placeholder="e.g. CS201"
              value={formData.courseCode}
              onChange={(e) => setFormData({ ...formData, courseCode: e.target.value.toUpperCase() })}
              disabled={isSubmitting}
            />
            {formErrors.courseCode && <div className="form-error">{formErrors.courseCode}</div>}
          </div>

          <div className="form-row">
            <div className="form-col form-group">
              <label className="form-label" htmlFor="crs-dept">
                Department <span className="required">*</span>
              </label>
              <select
                id="crs-dept"
                className={`form-control ${formErrors.departmentId ? 'is-invalid' : ''}`}
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                disabled={isSubmitting}
              >
                <option value="">Select Department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
              {formErrors.departmentId && <div className="form-error">{formErrors.departmentId}</div>}
            </div>

            <div className="form-col form-group">
              <label className="form-label" htmlFor="crs-fac">
                Assigned Instructor (Optional)
              </label>
              <select
                id="crs-fac"
                className="form-control"
                value={formData.facultyId}
                onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                disabled={isSubmitting}
              >
                <option value="">Select Faculty...</option>
                {facultyList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.designation || 'Faculty'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="crs-desc">
              Description / Syllabus Overview
            </label>
            <textarea
              id="crs-desc"
              rows={3}
              className="form-control"
              placeholder="Topics covered, prerequisites, learning outcomes..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isSubmitting}
            />
          </div>
        </form>
      </Modal>

      {/* ================= DETAILS MODAL ================= */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Course Information"
        footer={
          <button className="btn btn-secondary" onClick={() => setIsDetailOpen(false)}>
            Close
          </button>
        }
      >
        {currentCourse && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="profile-field">
              <span className="profile-label">Course ID</span>
              <span className="profile-value">#{currentCourse.id}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Course Code</span>
              <span className="profile-value">
                <span className="badge badge-primary">{currentCourse.courseCode}</span>
              </span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Title</span>
              <span className="profile-value">{currentCourse.courseName}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Department</span>
              <span className="profile-value">{currentCourse.department?.name || '—'}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Instructor</span>
              <span className="profile-value">{currentCourse.faculty?.name || 'Unassigned'}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Description</span>
              <span className="profile-value" style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>
                {currentCourse.description || 'No syllabus description provided.'}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= ENROLLED STUDENTS MODAL ================= */}
      <Modal
        isOpen={isStudentsOpen}
        onClose={() => setIsStudentsOpen(false)}
        title={`Enrolled Students: ${currentCourse?.courseName || ''}`}
        size="lg"
        footer={
          <button className="btn btn-secondary" onClick={() => setIsStudentsOpen(false)}>
            Close
          </button>
        }
      >
        {loadingStudents ? (
          <LoadingSpinner message="Loading enrolled students roster..." />
        ) : enrolledStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
            <Users size={36} style={{ color: 'var(--text-light)', marginBottom: 8 }} />
            <p>No students are currently enrolled in this course.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Age</th>
                </tr>
              </thead>
              <tbody>
                {enrolledStudents.map((s) => (
                  <tr key={s.id}>
                    <td>#{s.id}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.email}</td>
                    <td>{s.age || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* ================= DELETE CONFIRM MODAL ================= */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Course"
        message={`Are you sure you want to delete '${currentCourse?.courseName}' (${currentCourse?.courseCode})? Enrolled students will be dropped from this course.`}
        confirmText="Yes, Delete"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default CoursesPage;
