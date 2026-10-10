import React, { useEffect, useState } from 'react';

import { studentApi } from '../../api/studentApi';
import { departmentApi } from '../../api/departmentApi';
import { authApi } from '../../api/authApi';

import { useAuth } from '../../context/AuthContext';

import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';

import {
    Users,
    Plus,
    Edit2,
    Trash2,
    Eye,
    BookOpen,
    Mail
} from 'lucide-react';


export const StudentsPage = () => {
    const { hasRole } = useAuth();

    const isAdmin = hasRole('ADMIN');
    const canManage = hasRole('ADMIN', 'FACULTY');


    const [students, setStudents] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [loading, setLoading] = useState(true);

    const [searchName, setSearchName] = useState('');
    const [selectedDeptId, setSelectedDeptId] = useState('');

    const [alert, setAlert] = useState(null);


    // Pagination state
    const [page, setPage] = useState(0);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);


    // Modals state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const [currentStudent, setCurrentStudent] = useState(null);
    const [studentCourses, setStudentCourses] = useState([]);

    const [isSubmitting, setIsSubmitting] = useState(false);


    // Form input state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        age: '',
        course: '',
        departmentId: '',
        username: '',
        password: ''
    });

    const [formErrors, setFormErrors] = useState({});


    const loadData = async (
        currentPage = page,
        deptId = selectedDeptId,
        name = searchName
    ) => {
        setLoading(true);

        try {
            const params = {
                page: currentPage,
                size: pageSize
            };

            if (deptId) params.departmentId = deptId;
            if (name) params.name = name;

            const [stuData, deptsData] = await Promise.all([
                studentApi.getAll(params),
                departments.length === 0
                    ? departmentApi.getAll()
                    : Promise.resolve(departments)
            ]);


            if (stuData && stuData.content) {
                setStudents(stuData.content);
                setTotalPages(stuData.totalPages || 1);
                setTotalElements(stuData.totalElements || 0);

            } else if (Array.isArray(stuData)) {
                setStudents(stuData);
                setTotalPages(1);
                setTotalElements(stuData.length);

            } else {
                setStudents([]);
            }


            if (departments.length === 0 && Array.isArray(deptsData)) {
                setDepartments(deptsData);
            }

        } catch (err) {
            setAlert({
                type: 'danger',
                message: err.userMessage || 'Failed to load students'
            });

        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadData(page, selectedDeptId, searchName);
    }, [page]);


    const handleSearchChange = (val) => {
        setSearchName(val);
        setPage(0);
        loadData(0, selectedDeptId, val);
    };


    const handleDeptFilterChange = (e) => {
        const deptId = e.target.value;

        setSelectedDeptId(deptId);
        setPage(0);

        loadData(0, deptId, searchName);
    };


    // =========================
    // ADD STUDENT
    // =========================

    const openAddModal = () => {
        setCurrentStudent(null);

        setFormData({
            name: '',
            email: '',
            age: '',
            course: '',
            departmentId: departments[0]?.id || '',
            username: '',
            password: ''
        });

        setFormErrors({});
        setIsFormOpen(true);
    };


    // =========================
    // EDIT STUDENT
    // =========================

    const openEditModal = (stu) => {
        setCurrentStudent(stu);

        setFormData({
            name: stu.name || '',
            email: stu.email || '',
            age: stu.age || '',
            course: stu.course || '',
            departmentId: stu.department?.id || '',
            username: '',
            password: ''
        });

        setFormErrors({});
        setIsFormOpen(true);
    };


    // =========================
    // VIEW STUDENT DETAILS
    // =========================

    const openDetailModal = async (stu) => {
        setCurrentStudent(stu);
        setIsDetailOpen(true);

        try {
            const courses = await studentApi.getCourses(stu.id);

            setStudentCourses(
                Array.isArray(courses) ? courses : []
            );

        } catch {
            setStudentCourses([]);
        }
    };


    // =========================
    // DELETE STUDENT
    // =========================

    const openDeleteModal = (stu) => {
        setCurrentStudent(stu);
        setIsDeleteOpen(true);
    };


    // =========================
    // FORM VALIDATION
    // =========================

    const validateForm = () => {
        const errors = {};

        if (!formData.name.trim()) {
            errors.name = 'Full name is required';
        }


        if (!formData.email.trim()) {
            errors.email = 'Email is required';

        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Valid email is required';
        }


        if (
            formData.age &&
            (
                isNaN(formData.age) ||
                Number(formData.age) < 15 ||
                Number(formData.age) > 100
            )
        ) {
            errors.age = 'Age must be between 15 and 100';
        }


        // Username and password are required
        // only when creating a new student
        if (!currentStudent) {

            if (!formData.username.trim()) {
                errors.username = 'Username is required';
            }

            if (!formData.password.trim()) {
                errors.password = 'Password is required';

            } else if (formData.password.length < 6) {
                errors.password = 'Password must be at least 6 characters';
            }
        }


        setFormErrors(errors);

        return Object.keys(errors).length === 0;
    };


    // =========================
    // FORM SUBMIT
    // =========================

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {

            // Student academic information
            const payload = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                age: formData.age
                    ? Number(formData.age)
                    : null,
                course: formData.course.trim(),

                department: formData.departmentId
                    ? {
                        id: Number(formData.departmentId)
                    }
                    : null
            };


            // =========================
            // EDIT EXISTING STUDENT
            // =========================

            if (currentStudent) {

                const updated = await studentApi.update(
                    currentStudent.id,
                    payload
                );

                setStudents((prev) =>
                    prev.map((s) =>
                        s.id === currentStudent.id
                            ? updated
                            : s
                    )
                );

                setAlert({
                    type: 'success',
                    message: `Student '${updated.name}' updated successfully.`
                });


            // =========================
            // CREATE NEW STUDENT
            // =========================

            } else {

                // STEP 1:
                // Create authentication account
                await authApi.register({
                    username: formData.username.trim(),
                    password: formData.password,
                    email: formData.email.trim(),
                    role: 'STUDENT'
                });


                // STEP 2:
                // Create student academic record
                const created = await studentApi.create(payload);


                setStudents((prev) => [
                    created,
                    ...prev
                ]);

                setTotalElements((prev) => prev + 1);


                setAlert({
                    type: 'success',
                    message:
                        `Student '${created.name}' registered successfully. ` +
                        `They can now sign in using their username and password.`
                });
            }


            setIsFormOpen(false);

        } catch (err) {

            setAlert({
                type: 'danger',
                message:
                    err.userMessage ||
                    err.response?.data?.message ||
                    'Operation failed'
            });

        } finally {
            setIsSubmitting(false);
        }
    };


    // =========================
    // DELETE
    // =========================

    const handleDelete = async () => {

        if (!currentStudent) return;

        setIsSubmitting(true);

        try {

            await studentApi.delete(currentStudent.id);

            setStudents((prev) =>
                prev.filter(
                    (s) => s.id !== currentStudent.id
                )
            );

            setTotalElements((prev) =>
                Math.max(0, prev - 1)
            );

            setAlert({
                type: 'success',
                message:
                    `Student '${currentStudent.name}' deleted successfully.`
            });

            setIsDeleteOpen(false);

        } catch (err) {

            setAlert({
                type: 'danger',
                message:
                    err.userMessage ||
                    err.response?.data?.message ||
                    'Failed to delete student'
            });

        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div>

            {/* ================= HEADER ================= */}

            <div className="page-header">

                <div>
                    <h1 className="page-title">
                        Student Directory
                    </h1>

                    <p className="page-subtitle">
                        View, register, and manage enrolled university students
                    </p>
                </div>


                {canManage && (
                    <button
                        className="btn btn-primary"
                        onClick={openAddModal}
                    >
                        <Plus size={18} />
                        Add Student
                    </button>
                )}

            </div>


            {/* ================= ALERT ================= */}

            {alert && (
                <AlertMessage
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                />
            )}


            {/* ================= TOOLBAR ================= */}

            <div className="toolbar">

                <div className="toolbar-left">

                    <SearchBar
                        value={searchName}
                        onChange={handleSearchChange}
                        placeholder="Search students by name..."
                    />


                    <select
                        className="form-control"
                        style={{
                            width: 'auto',
                            minWidth: '180px'
                        }}
                        value={selectedDeptId}
                        onChange={handleDeptFilterChange}
                    >

                        <option value="">
                            All Departments
                        </option>

                        {departments.map((d) => (
                            <option
                                key={d.id}
                                value={d.id}
                            >
                                {d.name} ({d.code})
                            </option>
                        ))}

                    </select>

                </div>


                <div className="toolbar-right">

                    <span
                        style={{
                            fontSize: '0.85rem',
                            color: 'var(--text-muted)'
                        }}
                    >
                        Total:{' '}
                        <strong>
                            {totalElements}
                        </strong>{' '}
                        students
                    </span>

                </div>

            </div>


            {/* ================= STUDENT TABLE ================= */}

            {loading ? (

                <LoadingSpinner
                    message="Loading student records..."
                />

            ) : students.length === 0 ? (

                <div className="card empty-state">

                    <Users className="empty-icon" />

                    <h3 className="empty-title">
                        No Students Found
                    </h3>

                    <p
                        style={{
                            fontSize: '0.875rem'
                        }}
                    >
                        {searchName || selectedDeptId
                            ? 'No students match your filter criteria.'
                            : 'No students have been enrolled yet.'
                        }
                    </p>


                    {canManage &&
                        !searchName &&
                        !selectedDeptId && (

                            <button
                                className="btn btn-primary"
                                onClick={openAddModal}
                                style={{
                                    marginTop: 16
                                }}
                            >
                                <Plus size={16} />
                                Register First Student
                            </button>

                        )}

                </div>

            ) : (

                <div className="table-container">

                    <table className="data-table">

                        <thead>

                            <tr>

                                <th style={{ width: '70px' }}>
                                    ID
                                </th>

                                <th>
                                    Name
                                </th>

                                <th>
                                    Email
                                </th>

                                <th>
                                    Age
                                </th>

                                <th>
                                    Program / Major
                                </th>

                                <th>
                                    Department
                                </th>

                                <th
                                    style={{
                                        width: '140px',
                                        textAlign: 'right'
                                    }}
                                >
                                    Actions
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {students.map((stu) => (

                                <tr key={stu.id}>

                                    <td>
                                        #{stu.id}
                                    </td>


                                    <td
                                        style={{
                                            fontWeight: 600
                                        }}
                                    >
                                        {stu.name}
                                    </td>


                                    <td>

                                        <span
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            <Mail
                                                size={13}
                                                style={{
                                                    color: 'var(--text-light)'
                                                }}
                                            />

                                            {stu.email}

                                        </span>

                                    </td>


                                    <td>
                                        {stu.age || '—'}
                                    </td>


                                    <td>

                                        <span className="badge badge-info">
                                            {stu.course || 'Undergraduate'}
                                        </span>

                                    </td>


                                    <td>

                                        {stu.department ? (

                                            <span className="badge badge-primary">
                                                {stu.department.code ||
                                                    stu.department.name}
                                            </span>

                                        ) : (
                                            '—'
                                        )}

                                    </td>


                                    <td
                                        style={{
                                            textAlign: 'right'
                                        }}
                                    >

                                        <div
                                            className="table-actions"
                                            style={{
                                                justifyContent: 'flex-end'
                                            }}
                                        >

                                            {/* View */}

                                            <button
                                                className="btn btn-ghost btn-sm btn-icon"
                                                onClick={() =>
                                                    openDetailModal(stu)
                                                }
                                                title="View Student Details"
                                            >
                                                <Eye size={16} />
                                            </button>


                                            {/* Edit */}

                                            {canManage && (

                                                <button
                                                    className="btn btn-secondary btn-sm btn-icon"
                                                    onClick={() =>
                                                        openEditModal(stu)
                                                    }
                                                    title="Edit Student"
                                                >
                                                    <Edit2 size={16} />
                                                </button>

                                            )}


                                            {/* Delete */}

                                            {isAdmin && (

                                                <button
                                                    className="btn btn-danger-ghost btn-sm btn-icon"
                                                    onClick={() =>
                                                        openDeleteModal(stu)
                                                    }
                                                    title="Delete Student"
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


                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalElements={totalElements}
                        pageSize={pageSize}
                        onPageChange={(newPage) =>
                            setPage(newPage)
                        }
                    />

                </div>

            )}


            {/* ================================================= */}
            {/* ADD / EDIT MODAL */}
            {/* ================================================= */}

            <Modal
                isOpen={isFormOpen}
                onClose={() =>
                    !isSubmitting &&
                    setIsFormOpen(false)
                }
                title={
                    currentStudent
                        ? 'Edit Student Details'
                        : 'Register New Student'
                }

                footer={
                    <>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() =>
                                setIsFormOpen(false)
                            }
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            form="student-form"
                            className="btn btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? 'Saving...'
                                : currentStudent
                                    ? 'Update Student'
                                    : 'Register Student'
                            }
                        </button>
                    </>
                }
            >

                <form
                    id="student-form"
                    onSubmit={handleFormSubmit}
                >

                    {/* ================= FULL NAME ================= */}

                    <div className="form-group">

                        <label
                            className="form-label"
                            htmlFor="stu-name"
                        >
                            Full Name{' '}
                            <span className="required">
                                *
                            </span>
                        </label>


                        <input
                            id="stu-name"
                            type="text"
                            className={`form-control ${
                                formErrors.name
                                    ? 'is-invalid'
                                    : ''
                            }`}
                            placeholder="e.g. Grace Hopper"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    name: e.target.value
                                })
                            }
                            disabled={isSubmitting}
                        />


                        {formErrors.name && (
                            <div className="form-error">
                                {formErrors.name}
                            </div>
                        )}

                    </div>


                    {/* ================= EMAIL ================= */}

                    <div className="form-group">

                        <label
                            className="form-label"
                            htmlFor="stu-email"
                        >
                            Email Address{' '}
                            <span className="required">
                                *
                            </span>
                        </label>


                        <input
                            id="stu-email"
                            type="email"
                            className={`form-control ${
                                formErrors.email
                                    ? 'is-invalid'
                                    : ''
                            }`}
                            placeholder="grace.hopper@university.edu"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    email: e.target.value
                                })
                            }
                            disabled={isSubmitting}
                        />


                        {formErrors.email && (
                            <div className="form-error">
                                {formErrors.email}
                            </div>
                        )}

                    </div>


                    {/* ================= LOGIN DETAILS ================= */}

                    {!currentStudent && (

                        <>

                            <div className="form-group">

                                <label
                                    className="form-label"
                                    htmlFor="stu-username"
                                >
                                    Username{' '}
                                    <span className="required">
                                        *
                                    </span>
                                </label>


                                <input
                                    id="stu-username"
                                    type="text"
                                    className={`form-control ${
                                        formErrors.username
                                            ? 'is-invalid'
                                            : ''
                                    }`}
                                    placeholder="e.g. grace.hopper"
                                    value={formData.username}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            username: e.target.value
                                        })
                                    }
                                    disabled={isSubmitting}
                                />


                                {formErrors.username && (
                                    <div className="form-error">
                                        {formErrors.username}
                                    </div>
                                )}

                            </div>


                            <div className="form-group">

                                <label
                                    className="form-label"
                                    htmlFor="stu-password"
                                >
                                    Password{' '}
                                    <span className="required">
                                        *
                                    </span>
                                </label>


                                <input
                                    id="stu-password"
                                    type="password"
                                    className={`form-control ${
                                        formErrors.password
                                            ? 'is-invalid'
                                            : ''
                                    }`}
                                    placeholder="Enter password"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            password: e.target.value
                                        })
                                    }
                                    disabled={isSubmitting}
                                />


                                {formErrors.password && (
                                    <div className="form-error">
                                        {formErrors.password}
                                    </div>
                                )}

                            </div>

                        </>

                    )}


                    {/* ================= AGE + COURSE ================= */}

                    <div className="form-row">

                        <div className="form-col form-group">

                            <label
                                className="form-label"
                                htmlFor="stu-age"
                            >
                                Age
                            </label>


                            <input
                                id="stu-age"
                                type="number"
                                min="15"
                                max="100"
                                className={`form-control ${
                                    formErrors.age
                                        ? 'is-invalid'
                                        : ''
                                }`}
                                placeholder="e.g. 20"
                                value={formData.age}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        age: e.target.value
                                    })
                                }
                                disabled={isSubmitting}
                            />


                            {formErrors.age && (
                                <div className="form-error">
                                    {formErrors.age}
                                </div>
                            )}

                        </div>


                        <div className="form-col form-group">

                            <label
                                className="form-label"
                                htmlFor="stu-course"
                            >
                                Program / Degree
                            </label>


                            <input
                                id="stu-course"
                                type="text"
                                className="form-control"
                                placeholder="e.g. B.Tech Computer Science"
                                value={formData.course}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        course: e.target.value
                                    })
                                }
                                disabled={isSubmitting}
                            />

                        </div>

                    </div>


                    {/* ================= DEPARTMENT ================= */}

                    <div className="form-group">

                        <label
                            className="form-label"
                            htmlFor="stu-dept"
                        >
                            Department (Optional)
                        </label>


                        <select
                            id="stu-dept"
                            className="form-control"
                            value={formData.departmentId}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    departmentId: e.target.value
                                })
                            }
                            disabled={isSubmitting}
                        >

                            <option value="">
                                Select Department...
                            </option>


                            {departments.map((d) => (

                                <option
                                    key={d.id}
                                    value={d.id}
                                >
                                    {d.name} ({d.code})
                                </option>

                            ))}

                        </select>

                    </div>

                </form>

            </Modal>


            {/* ================================================= */}
            {/* DETAILS MODAL */}
            {/* ================================================= */}

            <Modal
                isOpen={isDetailOpen}
                onClose={() =>
                    setIsDetailOpen(false)
                }
                title="Student Academic Profile"
                size="lg"

                footer={
                    <button
                        className="btn btn-secondary"
                        onClick={() =>
                            setIsDetailOpen(false)
                        }
                    >
                        Close
                    </button>
                }
            >

                {currentStudent && (

                    <div>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns:
                                    'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: 16,
                                marginBottom: 20
                            }}
                        >

                            <div className="profile-field">
                                <span className="profile-label">
                                    Student ID
                                </span>

                                <span className="profile-value">
                                    #{currentStudent.id}
                                </span>
                            </div>


                            <div className="profile-field">
                                <span className="profile-label">
                                    Full Name
                                </span>

                                <span className="profile-value">
                                    {currentStudent.name}
                                </span>
                            </div>


                            <div className="profile-field">
                                <span className="profile-label">
                                    Email
                                </span>

                                <span className="profile-value">
                                    {currentStudent.email}
                                </span>
                            </div>


                            <div className="profile-field">
                                <span className="profile-label">
                                    Age
                                </span>

                                <span className="profile-value">
                                    {currentStudent.age || '—'}
                                </span>
                            </div>


                            <div className="profile-field">
                                <span className="profile-label">
                                    Program
                                </span>

                                <span className="profile-value">
                                    {currentStudent.course || '—'}
                                </span>
                            </div>


                            <div className="profile-field">
                                <span className="profile-label">
                                    Department
                                </span>

                                <span className="profile-value">
                                    {currentStudent.department?.name || '—'}
                                </span>
                            </div>

                        </div>


                        <h4
                            style={{
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                marginTop: 16,
                                marginBottom: 10
                            }}
                        >
                            Currently Enrolled Courses (
                            {studentCourses.length}
                            )
                        </h4>


                        {studentCourses.length === 0 ? (

                            <p
                                style={{
                                    color: 'var(--text-muted)',
                                    fontSize: '0.85rem'
                                }}
                            >
                                This student is not yet enrolled
                                in any courses.
                            </p>

                        ) : (

                            <div className="table-container">

                                <table className="data-table">

                                    <thead>

                                        <tr>

                                            <th>
                                                Code
                                            </th>

                                            <th>
                                                Course Name
                                            </th>

                                            <th>
                                                Instructor
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {studentCourses.map((c) => (

                                            <tr key={c.id}>

                                                <td>
                                                    <span className="badge badge-primary">
                                                        {c.courseCode}
                                                    </span>
                                                </td>

                                                <td>
                                                    {c.courseName}
                                                </td>

                                                <td>
                                                    {c.faculty?.name ||
                                                        'Unassigned'}
                                                </td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            </div>

                        )}

                    </div>

                )}

            </Modal>


            {/* ================================================= */}
            {/* DELETE CONFIRM MODAL */}
            {/* ================================================= */}

            <ConfirmModal
                isOpen={isDeleteOpen}
                onClose={() =>
                    setIsDeleteOpen(false)
                }
                onConfirm={handleDelete}
                title="Delete Student"
                message={
                    `Are you sure you want to delete '${currentStudent?.name}'? ` +
                    `All enrollment, attendance, and mark records will be permanently removed.`
                }
                confirmText="Yes, Delete"
                isLoading={isSubmitting}
            />

        </div>
    );
};


export default StudentsPage;