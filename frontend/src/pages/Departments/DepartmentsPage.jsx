import React, { useEffect, useState } from 'react';
import { departmentApi } from '../../api/departmentApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import SearchBar from '../../components/SearchBar';
import { Building2, Plus, Edit2, Trash2, Eye } from 'lucide-react';

export const DepartmentsPage = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [alert, setAlert] = useState(null); // { type, message }

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentDept, setCurrentDept] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form input state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const data = await departmentApi.getAll();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      setAlert({ type: 'danger', message: err.userMessage || 'Failed to fetch departments' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openAddModal = () => {
    setCurrentDept(null);
    setFormData({ name: '', code: '', description: '' });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openEditModal = (dept) => {
    setCurrentDept(dept);
    setFormData({
      name: dept.name || '',
      code: dept.code || '',
      description: dept.description || ''
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openDetailModal = (dept) => {
    setCurrentDept(dept);
    setIsDetailOpen(true);
  };

  const openDeleteModal = (dept) => {
    setCurrentDept(dept);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Department name is required';
    if (!formData.code.trim()) errors.code = 'Department code is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (currentDept) {
        // Update
        const updated = await departmentApi.update(currentDept.id, formData);
        setDepartments((prev) => prev.map((d) => (d.id === currentDept.id ? updated : d)));
        setAlert({ type: 'success', message: `Department '${updated.name}' updated successfully.` });
      } else {
        // Create
        const created = await departmentApi.create(formData);
        setDepartments((prev) => [...prev, created]);
        setAlert({ type: 'success', message: `Department '${created.name}' created successfully.` });
      }
      setIsFormOpen(false);
    } catch (err) {
      setAlert({ type: 'danger', message: err.userMessage || 'Operation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentDept) return;
    setIsSubmitting(true);
    try {
      await departmentApi.delete(currentDept.id);
      setDepartments((prev) => prev.filter((d) => d.id !== currentDept.id));
      setAlert({ type: 'success', message: `Department '${currentDept.name}' deleted successfully.` });
      setIsDeleteOpen(false);
    } catch (err) {
      setAlert({ type: 'danger', message: err.userMessage || 'Failed to delete department' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDepts = departments.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      d.name?.toLowerCase().includes(q) ||
      d.code?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">Manage university departments and academic divisions</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> Add Department
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
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name or code..."
          />
        </div>
        <div className="toolbar-right">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Total: <strong>{filteredDepts.length}</strong> departments
          </span>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading departments..." />
      ) : filteredDepts.length === 0 ? (
        <div className="card empty-state">
          <Building2 className="empty-icon" />
          <h3 className="empty-title">No Departments Found</h3>
          <p style={{ fontSize: '0.875rem' }}>
            {searchQuery ? 'No departments match your search.' : 'No departments have been added yet.'}
          </p>
          {isAdmin && !searchQuery && (
            <button className="btn btn-primary" onClick={openAddModal} style={{ marginTop: 16 }}>
              <Plus size={16} /> Add First Department
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th style={{ width: '130px' }}>Code</th>
                <th>Department Name</th>
                <th>Description</th>
                <th style={{ width: '140px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepts.map((dept) => (
                <tr key={dept.id}>
                  <td>#{dept.id}</td>
                  <td>
                    <span className="badge badge-primary">{dept.code}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{dept.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{dept.description || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => openDetailModal(dept)}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            className="btn btn-secondary btn-sm btn-icon"
                            onClick={() => openEditModal(dept)}
                            title="Edit Department"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn btn-danger-ghost btn-sm btn-icon"
                            onClick={() => openDeleteModal(dept)}
                            title="Delete Department"
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
        title={currentDept ? 'Edit Department' : 'Add New Department'}
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
              form="dept-form"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : currentDept ? 'Update Department' : 'Create Department'}
            </button>
          </>
        }
      >
        <form id="dept-form" onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="dept-name">
              Department Name <span className="required">*</span>
            </label>
            <input
              id="dept-name"
              type="text"
              className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
              placeholder="e.g. Computer Science and Engineering"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSubmitting}
            />
            {formErrors.name && <div className="form-error">{formErrors.name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="dept-code">
              Department Code <span className="required">*</span>
            </label>
            <input
              id="dept-code"
              type="text"
              className={`form-control ${formErrors.code ? 'is-invalid' : ''}`}
              placeholder="e.g. CSE"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              disabled={isSubmitting}
            />
            {formErrors.code && <div className="form-error">{formErrors.code}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="dept-desc">
              Description
            </label>
            <textarea
              id="dept-desc"
              rows={3}
              className="form-control"
              placeholder="Brief overview of the department..."
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
        title="Department Details"
        footer={
          <button className="btn btn-secondary" onClick={() => setIsDetailOpen(false)}>
            Close
          </button>
        }
      >
        {currentDept && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="profile-field">
              <span className="profile-label">Department ID</span>
              <span className="profile-value">#{currentDept.id}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Code</span>
              <span className="profile-value">
                <span className="badge badge-primary">{currentDept.code}</span>
              </span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Name</span>
              <span className="profile-value">{currentDept.name}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Description</span>
              <span className="profile-value" style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>
                {currentDept.description || 'No description provided.'}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= DELETE CONFIRM MODAL ================= */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Department"
        message={`Are you sure you want to delete '${currentDept?.name}' (${currentDept?.code})? This will also affect associated courses and faculty.`}
        confirmText="Yes, Delete"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default DepartmentsPage;
