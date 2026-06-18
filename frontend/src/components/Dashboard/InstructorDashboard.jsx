import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa';


import {
  BookOpen,
  Users,
  GraduationCap,
  ChevronRight,
  Search,
  LayoutDashboard,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  FileCheck,
  Home,
  LogOut,
  Phone,
  MapPin,
  Mail,
} from "lucide-react";
import "./InstructorDashboard.css";

const GRADES = [
  { value: "A", label: "A (4.0)", class: "grade-A" },
  { value: "A-", label: "A- (3.7)", class: "grade-Am" },
  { value: "B+", label: "B+ (3.3)", class: "grade-Bp" },
  { value: "B", label: "B (3.0)", class: "grade-B" },
  { value: "B-", label: "B- (2.7)", class: "grade-Bm" },
  { value: "C+", label: "C+ (2.3)", class: "grade-Cp" },
  { value: "C", label: "C (2.0)", class: "grade-C" },
  { value: "C-", label: "C- (1.7)", class: "grade-Cm" },
  { value: "D+", label: "D+ (1.3)", class: "grade-Dp" },
  { value: "D", label: "D (1.0)", class: "grade-D" },
  { value: "F", label: "F (0.0)", class: "grade-F" },
];

// Helper function to safely convert to string for filtering
const safeToString = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).toLowerCase();
};

const InstructorDashboard = () => {
  const navigate = useNavigate();

  // Navigation
  const [activeTab, setActiveTab] = useState("teaching-courses");

  // Unified Loading & Search State
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Workflow 1: Department Matrix State
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [sections, setSections] = useState([]);
  const [selectedSectionName, setSelectedSectionName] = useState(null);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState({});

  // Workflow 2: Direct Teaching Courses State
  const [session, setSession] = useState(null);
  const [teachingCourses, setTeachingCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseStudents, setCourseStudents] = useState([]);
  const [courseInfo, setCourseInfo] = useState(null);

  const token = localStorage.getItem("token");
  const api = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: { Authorization: `Bearer ${token}` },
  });

  // Logout handler
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      navigate("/login");
    }
  };

  // Navigate to Home Dashboard
  const goToHomeDashboard = () => {
    navigate("/dashboard");
  };

  // Loaders for Workflow 1 (Department View)
  const loadDepartments = async () => {
    try {
      const res = await api.get("/instructor/my-departments");
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load departments");
    }
  };

  const loadSectionsByDepartment = async (deptId) => {
    try {
      const res = await api.get(`/instructor/department/${deptId}/sections`);
      setSections(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load sections");
    }
  };

  const loadGradeMatrix = async (sectionName) => {
    try {
      const res = await api.get(
        `/instructor/section/${sectionName}/grade-matrix`,
      );
      setStudents(res.data.students || []);
      setCourses(res.data.courses || []);
      setGrades(res.data.grades || {});
    } catch (err) {
      console.error(err);
      toast.error("Failed to load grade matrix");
    }
  };

  // Loaders for Workflow 2 (Direct Courses View)
  const loadMyCourses = async () => {
    try {
      const res = await api.get("/instructor/my-teaching-courses");
      setSession(res.data.session);
      setTeachingCourses(res.data.courses || []);
    } catch (error) {
      console.error("Error loading courses:", error);
      toast.error("Failed to load your courses");
    }
  };

  const loadCourseStudents = async (sessionCourseId) => {
    try {
      const res = await api.get(
        `/instructor/course/${sessionCourseId}/students`,
      );
      setCourseInfo(res.data.course);
      setCourseStudents(res.data.students || []);
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("Failed to load students");
    }
  };

  // Handlers for Workflow 1
  const handleDepartmentClick = async (dept) => {
    setSelectedDept(dept);
    setSelectedSectionName(null);
    setStudents([]);
    setCourses([]);
    setSearchTerm("");
    await loadSectionsByDepartment(dept.DEPARTMENT_ID);
  };

  const handleSectionClick = async (sectionName) => {
    setSelectedSectionName(sectionName);
    setLoading(true);
    setSearchTerm("");
    await loadGradeMatrix(sectionName);
    setLoading(false);
  };

  const handleMatrixGradeChange = async (studentId, courseId, grade) => {
    setUpdating(true);
    const gradeKey = `${studentId}_${courseId}`;
    const previousGrade = grades[gradeKey];

    setGrades((prev) => ({ ...prev, [gradeKey]: grade }));

    try {
      await api.put(`/instructor/grade/${studentId}/${courseId}`, { grade });
      toast.success(`Grade saved`, { icon: "✅" });
    } catch (error) {
      setGrades((prev) => ({ ...prev, [gradeKey]: previousGrade }));
      toast.error(error.response?.data?.error || "Failed to update grade");
    } finally {
      setUpdating(false);
    }
  };

  // Handlers for Workflow 2
  const handleCourseSelect = async (course) => {
    setSelectedCourse(course);
    setLoading(true);
    setSearchTerm("");
    await loadCourseStudents(course.session_course_id);
    setLoading(false);
  };

  // Helper function for grade points
  const getGradePoints = (grade) => {
    const points = {
      A: 4.0,
      "A-": 3.7,
      "B+": 3.3,
      B: 3.0,
      "B-": 2.7,
      "C+": 2.3,
      C: 2.0,
      "C-": 1.7,
      "D+": 1.3,
      D: 1.0,
      F: 0.0,
    };
    return points[grade] || null;
  };

  const handleCourseGradeChange = async (registrationId, grade) => {
    if (!grade) return;

    setUpdating(true);
    try {
      const res = await api.put(`/instructor/grade/${registrationId}`, {
        grade,
      });
      toast.success(res.data.message || "Grade updated successfully");

      setCourseStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.registration_id === registrationId
            ? { ...student, grade: grade, grade_points: getGradePoints(grade) }
            : student,
        ),
      );

      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.registration_id === registrationId
            ? { ...student, grade: grade, grade_points: getGradePoints(grade) }
            : student,
        ),
      );

      await loadCourseStudents(selectedCourse.session_course_id);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update grade");
    } finally {
      setUpdating(false);
    }
  };

  const getGradeClass = (grade) => {
    if (!grade) return "grade-pending";
    const config = GRADES.find((g) => g.value === grade);
    return config ? config.class : "grade-pending";
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadMyCourses(), loadDepartments()]);
      setLoading(false);
    };
    init();
  }, []);

  // FIXED: Safe filtering with proper type checking
  const filteredStudents = students.filter((s) => {
    const firstName = safeToString(s.FIRST_NAME);
    const lastName = safeToString(s.LAST_NAME);
    // const rollNumber = safeToString(s.ROLL_NUMBER || s.STUDENT_ID || "");
    const search = safeToString(searchTerm);

    return (
      firstName.includes(search) ||
      lastName.includes(search) ||
      rollNumber.includes(search)
    );
  });

  const filteredCourseStudents = courseStudents.filter((s) => {
    const firstName = safeToString(s.FIRST_NAME);
    const lastName = safeToString(s.LAST_NAME);
    const rollNumber = safeToString(s.ROLL_NUMBER || s.STUDENT_ID || "");
    const email = safeToString(s.EMAIL);
    const search = safeToString(searchTerm);

    return (
      firstName.includes(search) ||
      lastName.includes(search) ||
      rollNumber.includes(search) ||
      email.includes(search)
    );
  });

  if (loading && departments.length === 0 && teachingCourses.length === 0) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Top Professional Banner Navigation */}
      <header className="header">
        <div className="header-content">
          <div
            className="brand"
            style={{ cursor: "pointer" }}
            onClick={goToHomeDashboard}
          >
            <div className="icon-box">
              <GraduationCap size={24} />
            </div>
            <div className="brand-text">
              <h1>AMTU</h1>
              <p>Instructor Portal</p>
            </div>
          </div>

          <div className="brand">
            <div className="brand-badge-info">
              <div className="badge-title">Faculty Dashboard</div>
              <div className="badge-subtitle">Active Session</div>
            </div>
            <button
              onClick={handleLogout}
              className="logout-icon-btn"
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
            <div className="icon-box-muted">
              <Users size={20} />
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Left Sidebar */}
        <aside className="sidebar">
          <div className="dashboard-tabs">
            <button
              className={`tab-button ${activeTab === "teaching-courses" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("teaching-courses");
                setSearchTerm("");
              }}
            >
              <BookOpen size={16} />
              <span>Direct Courses</span>
            </button>
            <button
              className={`tab-button ${activeTab === "department-matrix" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("department-matrix");
                setSearchTerm("");
              }}
            >
              <Layers size={16} />
              <span>Department Matrix</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "teaching-courses" ? (
              <motion.section
                key="courses"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="panel"
              >
                <div className="panel-header">
                  <BookOpen size={20} color="#2563eb" />
                  <h3>My Teaching Courses</h3>
                </div>
                <div className="list-container">
                  {teachingCourses.length === 0 ? (
                    <p
                      style={{
                        color: "#64748b",
                        fontSize: "14px",
                        padding: "10px",
                      }}
                    >
                      No courses assigned for current semester.
                    </p>
                  ) : (
                    teachingCourses.map((course) => (
                      <button
                        key={course.session_course_id}
                        onClick={() => handleCourseSelect(course)}
                        className={`course-card ${selectedCourse?.session_course_id === course.session_course_id ? "active" : ""}`}
                      >
                        <div className="course-code-badge">
                          {course.COURSE_CODE}
                        </div>
                        <div className="course-name-text">
                          {course.COURSE_NAME}
                        </div>
                        <div className="course-meta-footer">
                          Section: {course.section_name} | enrolled:{" "}
                          {course.enrolled_students}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </motion.section>
            ) : (
              <motion.div
                key="departments"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                <section className="panel">
                  <div className="panel-header">
                    <LayoutDashboard size={20} color="#2563eb" />
                    <h3>Departments</h3>
                  </div>
                  <div className="list-container">
                    {departments.map((dept) => (
                      <button
                        key={dept.DEPARTMENT_ID}
                        onClick={() => handleDepartmentClick(dept)}
                        className={`dept-btn ${selectedDept?.DEPARTMENT_ID === dept.DEPARTMENT_ID ? "active" : "inactive"}`}
                      >
                        <span>{dept.DEPARTMENT_NAME}</span>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </div>
                </section>

                {selectedDept && (
                  <motion.section
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="panel"
                  >
                    <div className="panel-header">
                      <ClipboardList size={20} color="#10b981" />
                      <h3>Active Sections</h3>
                    </div>
                    <div className="list-container">
                      {sections.map((section) => (
                        <button
                          key={section.SECTION_NAME}
                          onClick={() =>
                            handleSectionClick(section.SECTION_NAME)
                          }
                          className={`section-card ${selectedSectionName === section.SECTION_NAME ? "active" : ""}`}
                        >
                          <h4>Section {section.SECTION_NAME}</h4>
                          <div className="stats">
                            <span>
                              <BookOpen size={12} /> {section.course_count}{" "}
                              Courses
                            </span>
                            <span>
                              <Users size={12} /> {section.student_count}{" "}
                              Students
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.section>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

        {/* Dynamic Action Workspace */}
        <div className="content-area">
          {session && activeTab === "teaching-courses" && (
            <div className="session-banner">
              <Calendar size={18} />
              <span>
                <strong>Academic Semester:</strong> {session.semester || ""}{" "}
                {session.year || ""}
              </span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === "teaching-courses" && (
              <motion.div
                key={
                  selectedCourse
                    ? selectedCourse.session_course_id
                    : "no-course"
                }
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {!selectedCourse ? (
                  <div className="empty-state">
                    <Search size={48} color="#cbd5e1" />
                    <h2>Select a Teaching Course</h2>
                    <p>
                      Unlock professional grade management by selecting from the
                      list on your left screen.
                    </p>
                  </div>
                ) : (
                  <div className="matrix-panel">
                    <div className="matrix-header">
                      <div className="matrix-header-row">
                        <div className="matrix-info">
                          <div className="grade-status">
                            <FileCheck size={16} />
                            <span>Course Grading Console</span>
                          </div>
                          <h2>
                            {courseInfo?.COURSE_CODE} -{" "}
                            {courseInfo?.COURSE_NAME}
                          </h2>
                          <p>
                            Section: {courseInfo?.section_name} | Credits:{" "}
                            {courseInfo?.CREDIT_HOURS}
                          </p>
                        </div>
                        <div className="search-container">
                          <Search
                            size={20}
                            color="#94a3b8"
                            className="search-icon"
                          />
                          <input
                            type="text"
                            placeholder="Search registered student..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="table-wrapper">
                      {filteredCourseStudents.length === 0 ? (
                        <div
                          style={{
                            padding: "40px",
                            textAlign: "center",
                            color: "#64748b",
                          }}
                        >
                          No registered students found.
                        </div>
                      ) : (
                        <table className="grade-table">
                          <thead>
                            <tr>
                              <th style={{ textAlign: "left" }}>Roll Number</th>
                              <th style={{ textAlign: "left" }}>
                                Student Profile
                              </th>
                              <th style={{ textAlign: "left" }}>Email</th>
                              <th style={{ textAlign: "center" }}>
                                Current Grade
                              </th>
                              <th style={{ textAlign: "center" }}>
                                Update Grade
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredCourseStudents.map((student) => (
                              <tr key={student.registration_id}>
                                <td
                                  style={{
                                    fontFamily: "monospace",
                                    fontWeight: "bold",
                                    fontSize: "13px",
                                  }}
                                >
                                  {student.ROLL_NUMBER ||
                                    student.STUDENT_ID ||
                                    "N/A"}
                                </td>
                                <td>
                                  <div className="student-info">
                                    <div className="avatar">
                                      {student.FIRST_NAME
                                        ? student.FIRST_NAME[0]
                                        : "S"}
                                      {student.LAST_NAME
                                        ? student.LAST_NAME[0]
                                        : ""}
                                    </div>
                                    <div className="student-meta">
                                      <div
                                        className="name"
                                        style={{
                                          fontSize: "14px",
                                          fontWeight: "700",
                                        }}
                                      >
                                        {student.FIRST_NAME} {student.LAST_NAME}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td
                                  style={{ color: "#64748b", fontSize: "13px" }}
                                >
                                  {student.EMAIL}
                                </td>
                                <td style={{ textAlign: "center" }}>
                                  <span
                                    className={`grade-select ${getGradeClass(student.grade)}`}
                                    style={{
                                      display: "inline-block",
                                      width: "fit-content",
                                      padding: "4px 16px",
                                    }}
                                  >
                                    {student.grade || "Pending"}
                                  </span>
                                </td>
                                <td style={{ textAlign: "center" }}>
                                  <div className="select-wrapper">
                                    <select
                                      value={student.grade || ""}
                                      onChange={(e) =>
                                        handleCourseGradeChange(
                                          student.registration_id,
                                          e.target.value,
                                        )
                                      }
                                      disabled={updating}
                                      className={`grade-select ${getGradeClass(student.grade)}`}
                                      style={{
                                        display: "inline-block",
                                        maxWidth: "160px",
                                      }}
                                    >
                                      <option value="">Select Grade</option>
                                      {GRADES.map((g) => (
                                        <option key={g.value} value={g.value}>
                                          {g.label}
                                        </option>
                                      ))}
                                    </select>
                                    {updating && (
                                      <div className="loader-container">
                                        <div className="loader-bar"></div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "department-matrix" && (
              <motion.div
                key={selectedSectionName ? selectedSectionName : "no-matrix"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {!selectedSectionName ? (
                  <div className="empty-state">
                    <Search size={48} color="#cbd5e1" />
                    <h2>Select a Department & Active Section</h2>
                    <p>
                      Choose an organizational department and active section
                      from your left screen.
                    </p>
                  </div>
                ) : (
                  <div className="matrix-panel">
                    <div className="matrix-header">
                      <div className="matrix-header-row">
                        <div className="matrix-info">
                          <div className="grade-status">
                            <CheckCircle2 size={16} />
                            <span>Section Grading Console</span>
                          </div>
                          <h2>Section {selectedSectionName}</h2>
                          <p>
                            Manage multiple academic records for{" "}
                            {students.length} students
                          </p>
                        </div>
                        <div className="search-container">
                          <Search
                            size={20}
                            color="#94a3b8"
                            className="search-icon"
                          />
                          <input
                            type="text"
                            placeholder="Search student profile..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="table-wrapper">
                      <table className="grade-table">
                        <thead>
                          <tr>
                            <th>
                              <div className="table-header-cell">
                                <Users size={14} /> Student Profile
                              </div>
                            </th>
                            {courses.map((course) => (
                              <th key={course.COURSE_ID}>
                                <div className="course-code">
                                  {course.COURSE_CODE}
                                </div>
                                <div className="course-title">
                                  {course.COURSE_NAME || "Course"}
                                </div>
                                <div className="course-credits">
                                  {course.CREDIT_HOURS} Credits
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.length === 0 ? (
                            <tr>
                              <td
                                colSpan={courses.length + 1}
                                style={{
                                  textAlign: "center",
                                  padding: "40px",
                                  color: "#64748b",
                                }}
                              >
                                No students match the criteria.
                              </td>
                            </tr>
                          ) : (
                            filteredStudents.map((student) => (
                              <tr key={student.STUDENT_ID}>
                                <td>
                                  <div className="student-info">
                                    <div className="avatar">
                                      {student.FIRST_NAME
                                        ? student.FIRST_NAME[0]
                                        : ""}
                                      {student.LAST_NAME
                                        ? student.LAST_NAME[0]
                                        : ""}
                                    </div>
                                    <div className="student-meta">
                                      <div className="name">
                                        {student.FIRST_NAME} {student.LAST_NAME}
                                      </div>
                                      <span className="roll">
                                        {student.ROLL_NUMBER ||
                                          student.STUDENT_ID}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                {courses.map((course) => {
                                  const gradeKey = `${student.STUDENT_ID}_${course.COURSE_ID}`;
                                  const currentGrade = grades[gradeKey] || "";
                                  const gradeConfig = GRADES.find(
                                    (g) => g.value === currentGrade,
                                  );
                                  return (
                                    <td key={course.COURSE_ID}>
                                      <div className="select-wrapper">
                                        <select
                                          value={currentGrade}
                                          onChange={(e) =>
                                            handleMatrixGradeChange(
                                              student.STUDENT_ID,
                                              course.COURSE_ID,
                                              e.target.value,
                                            )
                                          }
                                          disabled={updating}
                                          className={`grade-select ${gradeConfig ? gradeConfig.class : "grade-pending"}`}
                                        >
                                          <option value="">Pending</option>
                                          {GRADES.map((g) => (
                                            <option
                                              key={g.value}
                                              value={g.value}
                                            >
                                              {g.label}
                                            </option>
                                          ))}
                                        </select>
                                        {updating && (
                                          <div className="loader-container">
                                            <div className="loader-bar"></div>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="instructor-footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="footer-logo-icon">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <span className="footer-logo-text">UniManage</span>
                  <span className="footer-tagline">Education Reimagined</span>
                </div>
              </div>
              <p className="footer-description">
                Empowering educators with cutting-edge tools to shape the future
                of learning.
              </p>
              <div className="footer-social">
                <a href="#" className="social-icon">
                  <FaFacebook size={18} />
                </a>
                <a href="#" className="social-icon">
                  <FaTwitter size={18} />
                </a>
                <a href="#" className="social-icon">
                  <FaLinkedin size={18} />
                </a>
                <a href="#" className="social-icon">
                  <FaInstagram size={18} />
                </a>
              </div>
            </div>

            <div className="footer-links-group">
              <div>
                <h4 className="footer-heading">Quick Links</h4>
                <ul className="footer-links-list">
                  <li>
                    <button
                      onClick={goToHomeDashboard}
                      className="footer-link-btn"
                    >
                      Dashboard Home
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() =>
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }
                      className="footer-link-btn"
                    >
                      Back to Top
                    </button>
                  </li>
                  <li>
                    <Link to="/library">Library</Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="footer-heading">Resources</h4>
                <ul className="footer-links-list">
                  <li>
                    <Link to="/instructor">My Courses</Link>
                  </li>
                  <li>
                    <a href="#">Help Center</a>
                  </li>
                  <li>
                    <a href="#">Support</a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="footer-heading">Legal</h4>
                <ul className="footer-links-list">
                  <li>
                    <a href="#">Privacy Policy</a>
                  </li>
                  <li>
                    <a href="#">Terms of Use</a>
                  </li>
                  <li>
                    <a href="#">Cookie Settings</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer-contact-bar">
            <div className="contact-info-item">
              <MapPin size={16} />
              <span>123 University Avenue, Education City</span>
            </div>
            <div className="contact-info-item">
              <Phone size={16} />
              <span>+1 (800) 555-0199</span>
            </div>
            <div className="contact-info-item">
              <Mail size={16} />
              <span>faculty@unimanage.edu</span>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-bottom-left">
              <p>
                &copy; {new Date().getFullYear()} UniManage. All rights
                reserved.
              </p>
            </div>
            <div className="footer-bottom-right">
              <a href="#">Privacy Policy</a>
              <span className="separator">|</span>
              <a href="#">Terms of Use</a>
              <span className="separator">|</span>
              <a href="#">Cookie Settings</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default InstructorDashboard;
