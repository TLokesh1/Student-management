import React, { useEffect, useState } from 'react';
import { facultyApi } from '../../api/facultyApi';
import { departmentApi } from '../../api/departmentApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import SearchBar from '../../components/SearchBar';
import { Briefcase, Plus, Edit2, Trash2, Eye, Mail, Phone } from 'lucide-react';

export const FacultyPage = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');

  const [facultyList, setFacultyList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [alert, setAlert] = useState(null);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentFaculty, setCurrentFaculty] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form input state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    departmentId: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const loadData = async (deptId = selectedDeptId, name = searchName) => {
    setLoading(true);
    try {
      const params = {};
      if (deptId) params.departmentId = deptId;
      if (name) params.name = name;

      const [facData, deptsData] = await Promise.all([
        facultyApi.getAll(params),
        departments.length === 0 ? departmentApi.getAll() : Promise.resolve(departments)
      ]);

      setFacultyList(Array.isArray(facData) ? facData : (facData.content || []));
      if (departments.length === 0 && Array.isArray(deptsData)) {
        setDepartments(deptsData);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.userMessage || 'Failed to load faculty list' });
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
    setCurrentFaculty(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      designation: 'Assistant Professor',
      departmentId: departments[0]?.id || ''
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openEditModal = (fac) => {
    setCurrentFaculty(fac);
    setFormData({
      name: fac.name || '',
      email: fac.email || '',
      phone: fac.phone || '',
      designation: fac.designation || '',
      departmentId: fac.department?.id || ''
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openDetailModal = (fac) => {
    setCurrentFaculty(fac);
    setIsDetailOpen(true);
  };

  const openDeleteModal = (fac) => {
    setCurrentFaculty(fac);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Faculty name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Valid email is required (e.g. prof@university.edu)';
    }
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
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        designation: formData.designation.trim(),
        departmentId: Number(formData.departmentId)
      };

      if (currentFaculty) {
        const updated = await facultyApi.update(currentFaculty.id, payload);
        setFacultyList((prev) => prev.map((f) => (f.id === currentFaculty.id ? updated : f)));
        setAlert({ type: 'success', message: `Faculty member '${updated.name}' updated successfully.` });
      } else {
        const created = await facultyApi.create(payload);
        setFacultyList((prev) => [...prev, created]);
        setAlert({ type: 'success', message: `Faculty member '${created.name}' created successfully.` });
      }
      setIsFormOpen(false);
    } catch (err) {
      setAlert({ type: 'danger', message: err.userMessage || 'Operation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentFaculty) return;
    setIsSubmitting(true);
    try {
      await facultyApi.delete(currentFaculty.id);
      setFacultyList((prev) => prev.filter((f) => f.id !== currentFaculty.id));
      setAlert({ type: 'success', message: `Faculty '${currentFaculty.name}' deleted successfully.` });
      setIsDeleteOpen(false);
    } catch (err) {
      setAlert({ type: 'danger', message: err.userMessage || 'Failed to delete faculty member' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Faculty Staff</h1>
          <p className="page-subtitle">View and manage teaching professors and instructors</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> Add Faculty
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
            placeholder="Search faculty by name..."
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
            Total: <strong>{facultyList.length}</strong> staff members
          </span>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading faculty directory..." />
      ) : facultyList.length === 0 ? (
        <div className="card empty-state">
          <Briefcase className="empty-icon" />
          <h3 className="empty-title">No Faculty Found</h3>
          <p style={{ fontSize: '0.875rem' }}>
            {searchName || selectedDeptId
              ? 'No faculty members match the current filter.'
              : 'No faculty members added yet.'}
          </p>
          {isAdmin && !searchName && !selectedDeptId && (
            <button className="btn btn-primary" onClick={openAddModal} style={{ marginTop: 16 }}>
              <Plus size={16} /> Add First Faculty Member
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '70px' }}>ID</th>
                <th>Name</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Contact</th>
                <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {facultyList.map((fac) => (
                <tr key={fac.id}>
                  <td>#{fac.id}</td>
                  <td style={{ fontWeight: 600 }}>{fac.name}</td>
                  <td>
                    <span className="badge badge-info">{fac.designation || 'Faculty'}</span>
                  </td>
                  <td>
                    {fac.department ? (
                      <span className="badge badge-primary">{fac.department.name}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.825rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Mail size={12} style={{ color: 'var(--text-light)' }} /> {fac.email}
                      </span>
                      {fac.phone && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                          <Phone size={12} style={{ color: 'var(--text-light)' }} /> {fac.phone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => openDetailModal(fac)}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            className="btn btn-secondary btn-sm btn-icon"
                            onClick={() => openEditModal(fac)}
                            title="Edit Faculty"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn btn-danger-ghost btn-sm btn-icon"
                            onClick={() => openDeleteModal(fac)}
                            title="Delete Faculty"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
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
        title={currentFaculty ? 'Edit Faculty Member' : 'Add New Faculty Member'}
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
              form="faculty-form"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : currentFaculty ? 'Update Faculty' : 'Create Faculty'}
            </button>
          </>
        }
      >
        <form id="faculty-form" onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="fac-name">
              Full Name <span className="required">*</span>
            </label>
            <input
              id="fac-name"
              type="text"
              className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
              placeholder="e.g. Dr. Alan Turing"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSubmitting}
            />
            {formErrors.name && <div className="form-error">{formErrors.name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="fac-email">
              University Email <span className="required">*</span>
            </label>
            <input
              id="fac-email"
              type="email"
              className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
              placeholder="prof@university.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isSubmitting}
            />
            {formErrors.email && <div className="form-error">{formErrors.email}</div>}
          </div>

          <div className="form-row">
            <div className="form-col form-group">
              <label className="form-label" htmlFor="fac-phone">
                Phone Number
              </label>
              <input
                id="fac-phone"
                type="text"
                className="form-control"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div className="form-col form-group">
              <label className="form-label" htmlFor="fac-desig">
                Designation
              </label>
              <input
                id="fac-desig"
                type="text"
                className="form-control"
                placeholder="e.g. Associate Professor"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="fac-dept">
              Department <span className="required">*</span>
            </label>
            <select
              id="fac-dept"
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
        </form>
      </Modal>

      {/* ================= DETAILS MODAL ================= */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Faculty Member Profile"
        footer={
          <button className="btn btn-secondary" onClick={() => setIsDetailOpen(false)}>
            Close
          </button>
        }
      >
        {currentFaculty && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="profile-field">
              <span className="profile-label">Faculty ID</span>
              <span className="profile-value">#{currentFaculty.id}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Full Name</span>
              <span className="profile-value">{currentFaculty.name}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Designation</span>
              <span className="profile-value">{currentFaculty.designation || 'Faculty Member'}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Department</span>
              <span className="profile-value">{currentFaculty.department?.name || '—'}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Email</span>
              <span className="profile-value">{currentFaculty.email}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Phone</span>
              <span className="profile-value">{currentFaculty.phone || 'Not provided'}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= DELETE CONFIRM MODAL ================= */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Faculty Member"
        message={`Are you sure you want to delete '${currentFaculty?.name}'? Any assigned courses will have their faculty disassociated.`}
        confirmText="Yes, Delete"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default FacultyPage;
