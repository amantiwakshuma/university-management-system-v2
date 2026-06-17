import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { BookOpen, Plus, Trash2, X, Clock, MapPin, User, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function ManageSessionCourses() {
    const [departments, setDepartments] = useState([]);
    const [selectedDept, setSelectedDept] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [sessionCourses, setSessionCourses] = useState([]);
    const [availableCourses, setAvailableCourses] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [newAssignment, setNewAssignment] = useState({
        session_id: '',
        course_id: '',
        instructor_id: '',
        room_id: '',
        schedule: '',
        section_name: '',
        max_capacity: 30
    });

    const token = localStorage.getItem('token');
    const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { Authorization: `Bearer ${token}` }
    });

    // Load departments
    const loadDepartments = async () => {
        try {
            const res = await api.get('/admin/departments');
            setDepartments(res.data);
        } catch (error) {
            console.error('Error loading departments:', error);
            toast.error('Failed to load departments');
        }
    };

    // Load academic sessions
    const loadSessions = async () => {
        try {
            const res = await api.get('/admin/academic-sessions');
            setSessions(res.data);
            
            // Auto-select active session
            const activeSession = res.data.find(s => s.is_active === 1);
            if (activeSession) {
                setSelectedSession(activeSession);
                setNewAssignment(prev => ({ ...prev, session_id: activeSession.session_id }));
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
            toast.error('Failed to load academic sessions');
        }
    };

    // Load courses assigned to selected session for selected department
    const loadSessionCourses = async () => {
        if (!selectedSession || !selectedDept) return;
        
        try {
            const res = await api.get(`/admin/session-courses/${selectedSession.session_id}?department_id=${selectedDept.department_id}`);
            setSessionCourses(res.data);
        } catch (error) {
            console.error('Error loading session courses:', error);
            toast.error('Failed to load session courses');
        }
    };

    // Load available courses for dropdown (filtered by department)
    const loadAvailableCourses = async () => {
        if (!selectedDept) return;
        
        try {
            const res = await api.get(`/admin/available-courses-for-session?department_id=${selectedDept.department_id}`);
            setAvailableCourses(res.data);
        } catch (error) {
            console.error('Error loading courses:', error);
        }
    };

    // Load instructors for dropdown
    const loadInstructors = async () => {
        try {
            const res = await api.get('/admin/instructors-list');
            setInstructors(res.data);
        } catch (error) {
            console.error('Error loading instructors:', error);
        }
    };

    // Load classrooms for dropdown
    const loadClassrooms = async () => {
        try {
            const res = await api.get('/admin/classrooms-list');
            setClassrooms(res.data);
        } catch (error) {
            console.error('Error loading classrooms:', error);
        }
    };

    // Handle department click
    const handleDepartmentClick = async (dept) => {
        setSelectedDept(dept);
        setShowAssignModal(false);
    };

    // Handle session selection
    const handleSessionSelect = async (session) => {
        setSelectedSession(session);
        setNewAssignment(prev => ({ ...prev, session_id: session.session_id }));
    };

    // Assign course to session
    const handleAssignCourse = async (e) => {
        e.preventDefault();
        
        if (!newAssignment.course_id) {
            toast.error('Please select a course');
            return;
        }
        
        if (!newAssignment.section_name) {
            toast.error('Please enter a section name');
            return;
        }
        
        try {
            await api.post('/admin/assign-course-to-session', {
                ...newAssignment,
                department_id: selectedDept.department_id
            });
            toast.success('Course assigned to session successfully');
            setShowAssignModal(false);
            setNewAssignment({
                session_id: selectedSession.session_id,
                course_id: '',
                instructor_id: '',
                room_id: '',
                schedule: '',
                section_name: '',
                max_capacity: 30
            });
            await loadSessionCourses();
            await loadAvailableCourses();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to assign course');
        }
    };

    // Remove course from session
    const handleRemoveCourse = async (sessionCourseId) => {
        if (confirm('Remove this course from the session? This will also delete all student registrations for this course.')) {
            try {
                await api.delete(`/admin/remove-course-from-session/${sessionCourseId}`);
                toast.success('Course removed from session');
                await loadSessionCourses();
                await loadAvailableCourses();
            } catch (error) {
                toast.error('Failed to remove course');
            }
        }
    };

    // Load data when department or session changes
    useEffect(() => {
        if (selectedDept && selectedSession) {
            loadSessionCourses();
            loadAvailableCourses();
        }
    }, [selectedDept, selectedSession]);

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            await Promise.all([
                loadDepartments(),
                loadSessions(),
                loadInstructors(),
                loadClassrooms()
            ]);
            setLoading(false);
        };
        loadAll();
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading session courses...</p>
            </div>
        );
    }

    return (
        <div className="session-courses-container">
            {/* Header */}
            <div className="tab-header">
                <div className="tab-header-titles">
                    <h2 className="tab-header-title">📚 Session Course Management</h2>
                    <p className="tab-header-subtitle">
                        Assign which courses are offered in each academic semester, organized by department
                    </p>
                </div>
            </div>

            {/* Session Selector */}
            <div className="admin-card" style={{ marginBottom: '20px' }}>
                <div style={{ padding: '20px' }}>
                    <label className="form-label" style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>
                        Select Academic Semester
                    </label>
                    <select
                        className="admin-input"
                        style={{ width: '300px' }}
                        value={selectedSession?.session_id || ''}
                        onChange={(e) => {
                            const session = sessions.find(s => s.session_id === parseInt(e.target.value));
                            handleSessionSelect(session);
                        }}
                    >
                        <option value="">Select a semester</option>
                        {sessions.map(s => (
                            <option key={s.session_id} value={s.session_id}>
                                {s.semester} {s.year} {s.is_active ? '(Active)' : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedSession && (
                <div className="sections-layout">
                    {/* Left Sidebar: Departments */}
                    <div className="dept-sidebar">
                        <h3 className="dept-sidebar-heading">Departments</h3>
                        {departments.map((dept) => (
                            <div
                                key={dept.department_id}
                                className={`dept-item ${selectedDept?.department_id === dept.department_id ? "active" : ""}`}
                                onClick={() => handleDepartmentClick(dept)}
                            >
                                {dept.department_name}
                            </div>
                        ))}
                    </div>

                    {/* Right Content: Courses for Selected Department */}
                    <div className="sections-center-pane">
                        {selectedDept ? (
                            <>
                                <div className="pane-header">
                                    <h3 className="pane-title">
                                        Courses in {selectedDept.department_name} - {selectedSession.semester} {selectedSession.year}
                                    </h3>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setShowAssignModal(!showAssignModal)}
                                    >
                                        <Plus size={18} />
                                        {showAssignModal ? 'Cancel' : 'Assign Course'}
                                    </button>
                                </div>

                                {/* Assign Course Modal */}
                                <AnimatePresence>
                                    {showAssignModal && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="admin-card"
                                            style={{ marginBottom: '20px', padding: '20px' }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                <h3 style={{ margin: 0 }}>Assign Course to {selectedDept.department_name}</h3>
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => setShowAssignModal(false)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>
                                            <form onSubmit={handleAssignCourse}>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                                                    <div className="form-field">
                                                        <label className="form-label">Course *</label>
                                                        <select
                                                            className="admin-input"
                                                            value={newAssignment.course_id}
                                                            onChange={(e) => setNewAssignment({...newAssignment, course_id: e.target.value})}
                                                            required
                                                        >
                                                            <option value="">Select Course</option>
                                                            {availableCourses.map(c => (
                                                                <option key={c.course_id} value={c.course_id}>
                                                                    {c.course_code} - {c.course_name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="form-field">
                                                        <label className="form-label">Section Name *</label>
                                                        <input
                                                            type="text"
                                                            className="admin-input"
                                                            placeholder="e.g., 4A, 4B"
                                                            value={newAssignment.section_name}
                                                            onChange={(e) => setNewAssignment({...newAssignment, section_name: e.target.value.toUpperCase()})}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="form-field">
                                                        <label className="form-label">Instructor (Optional)</label>
                                                        <select
                                                            className="admin-input"
                                                            value={newAssignment.instructor_id}
                                                            onChange={(e) => setNewAssignment({...newAssignment, instructor_id: e.target.value})}
                                                        >
                                                            <option value="">Select Instructor</option>
                                                            {instructors.map(i => (
                                                                <option key={i.INSTRUCTOR_ID} value={i.INSTRUCTOR_ID}>
                                                                    {i.FIRST_NAME} {i.LAST_NAME} ({i.DEPARTMENT_NAME})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="form-field">
                                                        <label className="form-label">Classroom (Optional)</label>
                                                        <select
                                                            className="admin-input"
                                                            value={newAssignment.room_id}
                                                            onChange={(e) => setNewAssignment({...newAssignment, room_id: e.target.value})}
                                                        >
                                                            <option value="">Select Classroom</option>
                                                            {classrooms.map(r => (
                                                                <option key={r.ROOM_ID} value={r.ROOM_ID}>
                                                                    {r.BUILDING} - Room {r.ROOM_NUMBER} (Capacity: {r.CAPACITY})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="form-field">
                                                        <label className="form-label">Schedule</label>
                                                        <input
                                                            type="text"
                                                            className="admin-input"
                                                            placeholder="e.g., Mon/Wed 10:00-11:30"
                                                            value={newAssignment.schedule}
                                                            onChange={(e) => setNewAssignment({...newAssignment, schedule: e.target.value})}
                                                        />
                                                    </div>
                                                    <div className="form-field">
                                                        <label className="form-label">Max Capacity</label>
                                                        <input
                                                            type="number"
                                                            className="admin-input"
                                                            value={newAssignment.max_capacity}
                                                            onChange={(e) => setNewAssignment({...newAssignment, max_capacity: e.target.value})}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="form-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                                    <button type="button" className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>
                                                        Cancel
                                                    </button>
                                                    <button type="submit" className="btn btn-primary">
                                                        Assign Course
                                                    </button>
                                                </div>
                                            </form>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Assigned Courses Table */}
                                <div className="admin-card">
                                    <div className="admin-table-container">
                                        {sessionCourses.length === 0 ? (
                                            <div className="large-empty-pane">
                                                <BookOpen size={48} className="empty-pane-icon" />
                                                <p className="empty-pane-text">
                                                    No courses assigned to {selectedDept.department_name} for {selectedSession.semester} {selectedSession.year}.
                                                </p>
                                                <button className="btn btn-primary" onClick={() => setShowAssignModal(true)}>
                                                    <Plus size={16} /> Assign First Course
                                                </button>
                                            </div>
                                        ) : (
                                            <table className="admin-table">
                                                <thead>
                                                    <tr>
                                                        <th>Course Code</th>
                                                        <th>Course Name</th>
                                                        <th>Credits</th>
                                                        <th>Section</th>
                                                        <th>Instructor</th>
                                                        <th>Schedule</th>
                                                        <th>Room</th>
                                                        <th>Capacity</th>
                                                        <th>Enrolled</th>
                                                        <th className="align-center-header">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sessionCourses.map(course => (
                                                        <tr key={course.session_course_id}>
                                                            <td className="mono font-bold-blue">{course.COURSE_CODE}</td>
                                                            <td className="semibold-name">{course.COURSE_NAME}</td>
                                                            <td className="center-bold-text">{course.CREDIT_HOURS}</td>
                                                            <td><span className="badge badge-blue">{course.section_name}</span></td>
                                                            <td>
                                                                {course.INSTRUCTOR_NAME !== 'Not Assigned' ? (
                                                                    <div className="instructor-cell-wrapper">
                                                                        <User size={14} style={{ marginRight: '4px' }} />
                                                                        {course.INSTRUCTOR_NAME}
                                                                    </div>
                                                                ) : (
                                                                    <span className="unassigned-text">Not Assigned</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <div className="meta-info-cell">
                                                                    <Clock size={12} /> {course.schedule || 'TBD'}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="meta-info-cell">
                                                                    <MapPin size={12} /> {course.ROOM_NUMBER ? `${course.BUILDING} - ${course.ROOM_NUMBER}` : 'Not Assigned'}
                                                                </div>
                                                            </td>
                                                            <td className="center-bold-text">{course.max_capacity}</td>
                                                            <td className="center-bold-text">{course.current_enrollment || 0}</td>
                                                            <td className="align-center-cell">
                                                                <button
                                                                    className="action-delete-icon-btn"
                                                                    onClick={() => handleRemoveCourse(course.session_course_id)}
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="admin-card large-empty-pane">
                                <BookOpen size={48} className="empty-pane-icon" />
                                <p className="empty-pane-text">
                                    Select a department to manage its courses for {selectedSession.semester} {selectedSession.year}.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!selectedSession && (
                <div className="admin-card large-empty-pane">
                    <BookOpen size={48} className="empty-pane-icon" />
                    <p className="empty-pane-text">
                        Select an academic semester to start managing courses.
                    </p>
                </div>
            )}
        </div>
    );
}

export default ManageSessionCourses;