import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './MyGrades.css';

function MyGrades() {
    const [semesters, setSemesters] = useState([]);
    const [cgpa, setCgpa] = useState('0.00');
    const [totalCredits, setTotalCredits] = useState(0);
    const [totalCourses, setTotalCourses] = useState(0);
    const [loading, setLoading] = useState(true);
    const [expandedSemester, setExpandedSemester] = useState(null);
    
    const token = localStorage.getItem('token');
    const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { Authorization: `Bearer ${token}` }
    });

    const loadGrades = async () => {
        try {
            const res = await api.get('/student/my-grades');
            console.log('Grades data:', res.data);
            setSemesters(res.data.semesters || []);
            setCgpa(res.data.cgpa || '0.00');
            setTotalCredits(res.data.total_credits_earned || 0);
            setTotalCourses(res.data.total_courses || 0);
        } catch (error) {
            console.error('Error loading grades:', error);
            toast.error('Failed to load grades');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to safely format grade points
    const formatGradePoints = (points) => {
        if (!points && points !== 0) return '-';
        const num = parseFloat(points);
        if (isNaN(num)) return '-';
        return num.toFixed(1);
    };

    const getGradeColor = (grade) => {
        if (!grade) return '#e9ecef';
        if (grade === 'A' || grade === 'A-') return '#d4edda';
        if (grade === 'F') return '#f8d7da';
        return '#fff3cd';
    };

    const getGpaColor = (gpa) => {
        if (gpa === 'N/A') return '#6c757d';
        const gpaNum = parseFloat(gpa);
        if (isNaN(gpaNum)) return '#6c757d';
        if (gpaNum >= 3.5) return '#10b981';
        if (gpaNum >= 3.0) return '#3b82f6';
        if (gpaNum >= 2.0) return '#f59e0b';
        return '#ef4444';
    };

    const toggleSemester = (index) => {
        setExpandedSemester(expandedSemester === index ? null : index);
    };

    useEffect(() => {
        loadGrades();
    }, []);

    if (loading) return <div className="grades-loading">Loading your academic record...</div>;

    return (
        <div className="grades-container">
            {/* CGPA Summary Cards */}
            <div className="grades-stats-grid">
                <div className="grades-stat-card cgpa-card">
                    <div className="stat-label">Cumulative GPA</div>
                    <div className="stat-value">{cgpa}</div>
                    <div className="stat-sub">out of 4.0</div>
                </div>
                <div className="grades-stat-card">
                    <div className="stat-label">Total Credits</div>
                    <div className="stat-value">{totalCredits}</div>
                </div>
                <div className="grades-stat-card">
                    <div className="stat-label">Courses Completed</div>
                    <div className="stat-value">{totalCourses}</div>
                </div>
            </div>

            {/* Semesters List */}
            <h3 className="grades-section-title">📚 Semester-wise Grades</h3>
            
            {semesters.length === 0 ? (
                <div className="grades-empty-state">
                    <p>No grades available yet. Grades will appear once instructors publish them.</p>
                </div>
            ) : (
                semesters.map((semester, idx) => (
                    <div key={idx} className="grades-semester-card">
                        {/* Semester Header */}
                        <div
                            onClick={() => toggleSemester(idx)}
                            className="grades-semester-header"
                        >
                            <div>
                                <h4 className="semester-title">
                                    {semester.semester} {semester.year}
                                </h4>
                                <div className="semester-meta">
                                    {semester.completed_courses} courses • {semester.total_credits} credits
                                </div>
                            </div>
                            <div className="semester-right">
                                <div className="semester-gpa" style={{ backgroundColor: getGpaColor(semester.gpa) }}>
                                    GPA: {semester.gpa}
                                </div>
                                {expandedSemester === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                        </div>

                        {/* Semester Courses - Expanded */}
                        {expandedSemester === idx && (
                            <div className="grades-semester-content">
                                <div className="grades-table-wrapper">
                                    <table className="grades-table">
                                        <thead>
                                            <tr>
                                                <th>Course Code</th>
                                                <th>Course Name</th>
                                                <th className="text-center">Credits</th>
                                                <th className="text-center">Grade</th>
                                                <th className="text-center">Grade Points</th>
                                                <th className="text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {semester.courses && semester.courses.map((course, i) => {
                                                const grade = course.FINAL_GRADE || course.grade;
                                                const gradePoints = course.GRADE_POINTS || course.grade_points;
                                                
                                                return (
                                                    <tr key={i}>
                                                        <td>
                                                            <strong className="course-code-text">{course.COURSE_CODE || course.course_code || 'N/A'}</strong>
                                                        </td>
                                                        <td>{course.COURSE_NAME || course.course_name || 'Unknown'}</td>
                                                        <td className="text-center">{course.CREDIT_HOURS || course.credit_hours || 0}</td>
                                                        <td className="text-center">
                                                            <span className="grade-badge" style={{ backgroundColor: getGradeColor(grade) }}>
                                                                {grade || 'In Progress'}
                                                            </span>
                                                        </td>
                                                        <td className="text-center">{formatGradePoints(gradePoints)}</td>
                                                        <td className="text-center">
                                                            {grade ? (
                                                                <span className="status-completed-text">✓ Completed</span>
                                                            ) : (
                                                                <span className="status-progress-text">In Progress</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr className="grades-table-footer">
                                                <td colSpan="2">Semester Summary</td>
                                                <td className="text-center">{semester.total_credits}</td>
                                                <td colSpan="2" className="text-center">GPA: {semester.gpa}</td>
                                                <td className="text-center">
                                                    {semester.completed_courses} / {semester.courses?.length || 0} completed
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}

export default MyGrades;