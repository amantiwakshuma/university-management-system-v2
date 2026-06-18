import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from "react-icons/fa";

import {
  GraduationCap,
  BookOpen,
  BarChart3,
  Calendar,
  User,
  Mail,
  Hash,
  MapPin,
  Trash2,
  PlusCircle,
  CheckCircle2,
  Clock,
  FileText,
  Home,
  LogOut,
  LayoutDashboard,
  Phone,
  MapPin as MapPinIcon,
  Mail as MailIcon,
  Globe,
  Heart,
  Sparkles,
  DollarSign
} from "lucide-react";
import "./StudentDashboard.css";

import { motion, AnimatePresence } from "framer-motion";
import MyGrades from "../MyGrades/MyGrades";
import StudentLibrary from "../StudentLibrary/StudentLibrary";
import FeeStatus from "../FeeStatus";

// Brand Colors - Consistent with Home and Library
const brandColors = {
  primary: "#2563eb",
  primaryDark: "#1d4ed8",
  accent: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  dark: "#1e293b",
  light: "#f8fafc",
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("current");
  const [actionLoading, setActionLoading] = useState(false);
  const [isAwaitingSection, setIsAwaitingSection] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // State for current semester courses (in-progress)
  const [currentCourses, setCurrentCourses] = useState([]);

  // State for completed courses (all past semesters with grades)
  const [completedCourses, setCompletedCourses] = useState([]);

  // State for course registration
  const [registrationAvailableCourses, setRegistrationAvailableCourses] =
    useState([]);
  const [myRegisteredCourses, setMyRegisteredCourses] = useState([]);
  const [canRegister, setCanRegister] = useState(false);
  const [registrationInfo, setRegistrationInfo] = useState(null);
  const [borrowedBooksCount, setBorrowedBooksCount] = useState(0);

  // Current session info
  const [currentSession, setCurrentSession] = useState(null);

  const getApiBaseUrl = () => {
    const { hostname, port, origin } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      if (port === "3000") {
        return "http://localhost:5000/api";
      }
    }
    return `${origin}/api`;
  };

  const token = localStorage.getItem("token");
  const api = axios.create({
    baseURL: getApiBaseUrl(),
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

  // Load current session
  const loadCurrentSession = async () => {
    try {
      const res = await api.get("/academic/current-session");
      setCurrentSession(res.data.session);
    } catch (error) {
      console.error("Error loading session:", error);
    }
  };

  // Load current courses (registered but not graded yet)
  const loadCurrentCourses = async () => {
    try {
      const res = await api.get("/academic/my-registered-courses");
      const inProgress = res.data.filter((course) => !course.grade);
      setCurrentCourses(inProgress);
    } catch (error) {
      console.error("Error loading current courses:", error);
    }
  };

  // Load completed courses (all graded courses from all semesters)
  const loadCompletedCourses = async () => {
    try {
      const res = await api.get("/academic/all-completed-courses");
      setCompletedCourses(res.data);
    } catch (error) {
      console.error("Error loading completed courses:", error);
    }
  };

  // Load available courses for registration
  const loadAvailableCourses = async () => {
    try {
      const res = await api.get("/academic/available-courses");
      setCanRegister(res.data.can_register);
      setRegistrationInfo({
        session: res.data.session,
        regPeriod: res.data.regPeriod,
        reason: res.data.reason,
      });
      setRegistrationAvailableCourses(res.data.courses || []);
    } catch (error) {
      console.error("Error loading available courses:", error);
    }
  };

  // Load my registered courses (for registration tab display)
  const loadMyRegisteredCourses = async () => {
    try {
      const res = await api.get("/academic/my-registered-courses");
      setMyRegisteredCourses(res.data);
    } catch (error) {
      console.error("Error loading registered courses:", error);
    }
  };

  const loadBorrowedBooks = async () => {
    try {
      const res = await api.get("/library/my-borrowed");
      setBorrowedBooksCount(res.data.borrowed?.length || 0);
    } catch (error) {
      console.error("Error loading borrowed books:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setIsAwaitingSection(false);
    try {
      let infoRes;
      try {
        infoRes = await api.get("/student/my-info");
      } catch (err) {
        console.error("Error loading /student/my-info:", err);
        const errMessage = String(
          err.response?.data?.error ||
            err.response?.data?.message ||
            err.message ||
            "",
        ).toLowerCase();

        if (
          errMessage.includes("dashboard") ||
          errMessage.includes("student") ||
          errMessage.includes("section") ||
          errMessage.includes("not found") ||
          err.response?.status === 404 ||
          err.response?.status === 500
        ) {
          setIsAwaitingSection(true);
          setLoading(false);
          return;
        }
        throw err;
      }

      const info = infoRes.data;
      setStudentInfo(info);

      if (!info || !info.SECTION_NAME) {
        setIsAwaitingSection(true);
        setLoading(false);
        return;
      }

      await Promise.all([
        loadCurrentSession().catch((e) =>
          console.error("Session load failed:", e),
        ),
        loadCurrentCourses().catch((e) =>
          console.error("Current courses load failed:", e),
        ),
        loadCompletedCourses().catch((e) =>
          console.error("Completed courses load failed:", e),
        ),
        loadAvailableCourses().catch((e) =>
          console.error("Available courses load failed:", e),
        ),
        loadMyRegisteredCourses().catch((e) =>
          console.error("My registered courses load failed:", e),
        ),
        loadBorrowedBooks().catch((e) =>
          console.error("Borrowed books load failed:", e),
        ),
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      const errMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to load academic records.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (sessionCourseId, sessionId) => {
    setActionLoading(true);
    try {
      await api.post("/academic/register-course", {
        session_course_id: sessionCourseId,
        session_id: sessionId,
      });
      toast.success("Course registered successfully!");
      await Promise.all([
        loadAvailableCourses(),
        loadMyRegisteredCourses(),
        loadCurrentCourses(),
      ]);
    } catch (error) {
      toast.error(error.response?.data?.error || "Registration failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDropRegistration = async (registrationId) => {
    if (!window.confirm("Are you sure you want to drop this course?")) return;

    setActionLoading(true);
    try {
      await api.delete(`/academic/drop-course/${registrationId}`);
      toast.success("Course dropped successfully");
      await Promise.all([
        loadAvailableCourses(),
        loadMyRegisteredCourses(),
        loadCurrentCourses(),
      ]);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to drop course");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Smooth scroll helper
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p style={{ marginTop: "1rem", color: "#64748b", fontWeight: 500 }}>
          Loading Academic Profile...
        </p>
      </div>
    );
  }

  if (isAwaitingSection || (studentInfo && !studentInfo.SECTION_NAME)) {
    return (
      <div className="awaiting-section-container">
        <div className="awaiting-section-card">
          <div className="awaiting-section-icon">⏳</div>
          <h2>Awaiting Section Assignment</h2>
          <p className="awaiting-section-text">
            Your account has been created, but you haven't been assigned to a
            section yet. Please contact the administrator to complete your
            registration.
          </p>
          <button
            onClick={handleLogout}
            className="btn btn-primary awaiting-section-btn"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header with Navigation to Home */}
      <header className="dashboard-header">
        <div className="header-content">
          <div
            className="logo-section"
            onClick={goToHomeDashboard}
            style={{ cursor: "pointer" }}
          >
            <div
              className="logo-icon"
              style={{
                background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.accent})`,
              }}
            >
              <GraduationCap size={22} />
            </div>
            <span className="logo-text">
              AM<span style={{ color: brandColors.primary }}>TU</span>
            </span>
          </div>

          <div className="user-profile">
            <div className="user-details">
              <span className="user-name">
                {studentInfo?.FIRST_NAME} {studentInfo?.LAST_NAME}
              </span>
              <span className="user-role">Student Portal</span>
            </div>
            <button
              onClick={handleLogout}
              className="logout-icon-btn"
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
            <div className="avatar">
              {studentInfo?.FIRST_NAME?.[0]}
              {studentInfo?.LAST_NAME?.[0]}
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Welcome Section */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="welcome-section"
          style={{
            background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%)`,
          }}
        >
          <div className="welcome-grid">
            <div className="welcome-text">
              <h1>Welcome, {studentInfo?.FIRST_NAME}! </h1>
              <div className="info-chips">
                <InfoChip
                  icon={Hash}
                  label="Roll No"
                  value={studentInfo?.ROLL_NUMBER}
                />
                <InfoChip
                  icon={MapPin}
                  label="Dept"
                  value={studentInfo?.DEPARTMENT_NAME}
                />
                <InfoChip
                  icon={User}
                  label="Section"
                  value={studentInfo?.SECTION_NAME || "Unassigned"}
                />
                <InfoChip
                  icon={Mail}
                  label="Email"
                  value={studentInfo?.EMAIL}
                />
              </div>
            </div>
            <div className="cgpa-preview">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                <BarChart3 size={16} />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Academic Standing
                </span>
              </div>
              <div style={{ fontSize: "48px", fontWeight: 900 }}>Verified</div>
              <div style={{ fontSize: "12px", opacity: 0.8 }}>
                {currentSession?.semester} Semester{" "}
                {currentSession?.year || "2024"}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Tabs Container */}
        <div className="tabs-container">
          <nav className="tabs-nav">
            <TabButton
              active={activeTab === "current"}
              onClick={() => setActiveTab("current")}
              icon={BookOpen}
              label={`Current (${currentCourses.length})`}
            />
            <TabButton
              active={activeTab === "completed"}
              onClick={() => setActiveTab("completed")}
              icon={CheckCircle2}
              label={`Completed (${completedCourses.length})`}
            />
            <TabButton
              active={activeTab === "registration"}
              onClick={() => setActiveTab("registration")}
              icon={FileText}
              label="Course Registration"
            />
            <TabButton
              active={activeTab === "grades"}
              onClick={() => setActiveTab("grades")}
              icon={BarChart3}
              label="Grades & GPA"
            />
            <TabButton
              active={activeTab === "library"}
              onClick={() => setActiveTab("library")}
              icon={BookOpen}
              label={`Library (${borrowedBooksCount})`}
            />

            <TabButton
              active={activeTab === "fees"}
              onClick={() => setActiveTab("fees")}
              icon={DollarSign}
              label="Fee Status"
            />
          </nav>

          <div className="tab-content">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === "current" && (
                  <CurrentCoursesView
                    courses={currentCourses}
                    onDrop={handleDropRegistration}
                    actionLoading={actionLoading}
                    currentSession={currentSession}
                  />
                )}
                {activeTab === "completed" && (
                  <CompletedCoursesView courses={completedCourses} />
                )}
                {activeTab === "registration" && (
                  <RegistrationView
                    canRegister={canRegister}
                    registrationInfo={registrationInfo}
                    myRegisteredCourses={myRegisteredCourses}
                    availableCourses={registrationAvailableCourses}
                    onRegister={handleRegister}
                    onDrop={handleDropRegistration}
                    actionLoading={actionLoading}
                    sessionId={registrationInfo?.session?.session_id}
                  />
                )}
                {activeTab === "grades" && <MyGrades />}
                {activeTab === "library" && <StudentLibrary />}
                {activeTab === "fees" && <FeeStatus />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="student-footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <div
                  className="footer-logo-icon"
                  style={{
                    background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.accent})`,
                  }}
                >
                  <GraduationCap size={24} />
                </div>
                <div>
                  <span className="footer-logo-text">AMTU</span>
                  <span className="footer-tagline">Education Reimagined</span>
                </div>
              </div>
              <p className="footer-description">
                Empowering students with cutting-edge academic tools and
                resources to excel in their educational journey.
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
                    <button onClick={scrollToTop} className="footer-link-btn">
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
                    <Link to="/student">My Courses</Link>
                  </li>
                  <li>
                    <Link to="/student/grades">My Grades</Link>
                  </li>
                  <li>
                    <a href="#">Help Center</a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="footer-heading">Support</h4>
                <ul className="footer-links-list">
                  <li>
                    <a href="#">FAQs</a>
                  </li>
                  <li>
                    <a href="#">Technical Support</a>
                  </li>
                  <li>
                    <a href="#">Contact Us</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer-contact-bar">
            <div className="contact-info-item">
              <MapPinIcon size={16} />
              <span>123 University Avenue, Education City</span>
            </div>
            <div className="contact-info-item">
              <Phone size={16} />
              <span>+1 (800) 555-0199</span>
            </div>
            <div className="contact-info-item">
              <MailIcon size={16} />
              <span>support@amtu.edu</span>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-bottom-left">
              <p>
                &copy; {new Date().getFullYear()} AMTU. All rights
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
}

// Helper Components
function InfoChip({ icon: Icon, label, value }) {
  return (
    <div className="info-chip">
      <Icon size={14} className="icon-soft" />
      <div>
        <div className="chip-label">{label}</div>
        <div className="chip-value">{value}</div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button className={`tab-btn ${active ? "active" : ""}`} onClick={onClick}>
      <Icon size={16} />
      {label}
      {active && (
        <motion.div layoutId="tab-indicator" className="tab-indicator" />
      )}
    </button>
  );
}

// Current Courses View Component
function CurrentCoursesView({
  courses,
  onDrop,
  actionLoading,
  currentSession,
}) {
  if (courses.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <BookOpen size={48} />
        </div>
        <h3>No Current Courses</h3>
        <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
          You have no in-progress courses for {currentSession?.semester}{" "}
          {currentSession?.year}.
        </p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Course Code</th>
            <th style={{ width: "35%" }}>Course Name</th>
            <th style={{ textAlign: "center" }}>Credits</th>
            <th>Instructor</th>
            <th>Schedule</th>
            <th style={{ textAlign: "center" }}>Status</th>
            <th style={{ textAlign: "center" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course.registration_id}>
              <td>
                <span className="course-code">{course.COURSE_CODE}</span>
              </td>
              <td>
                <div className="course-meta">
                  <span style={{ fontWeight: 600 }}>{course.COURSE_NAME}</span>
                  <span className="course-name">
                    Section: {course.section_name || "N/A"}
                  </span>
                </div>
              </td>
              <td style={{ textAlign: "center", fontWeight: "bold" }}>
                {course.CREDIT_HOURS}
              </td>
              <td>{course.INSTRUCTOR_NAME || "Not Assigned"}</td>
              <td>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    color: "#64748b",
                  }}
                >
                  <Clock size={12} /> {course.SCHEDULE || "TBD"}
                </div>
              </td>
              <td style={{ textAlign: "center" }}>
                <span className="status-tag status-progress">In Progress</span>
              </td>
              <td style={{ textAlign: "center" }}>
                <button
                  className="btn btn-danger-outline"
                  onClick={() => onDrop(course.registration_id)}
                  disabled={actionLoading}
                >
                  <Trash2 size={13} /> Drop
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Completed Courses View Component
function CompletedCoursesView({ courses }) {
  if (courses.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <CheckCircle2 size={48} />
        </div>
        <h3>No Completed Courses</h3>
        <p style={{ color: "#64748b" }}>
          Complete your current courses to see them here.
        </p>
      </div>
    );
  }

  const groupedBySemester = courses.reduce((acc, course) => {
    const key = `${course.semester} ${course.year}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(course);
    return acc;
  }, {});

  return (
    <div>
      {Object.entries(groupedBySemester).map(([semester, semesterCourses]) => (
        <div key={semester} style={{ marginBottom: "30px" }}>
          <h3 style={{ marginBottom: "15px", color: "#2563eb" }}>{semester}</h3>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th style={{ width: "35%" }}>Course Name</th>
                  <th style={{ textAlign: "center" }}>Credits</th>
                  <th>Instructor</th>
                  <th style={{ textAlign: "center" }}>Grade</th>
                  <th style={{ textAlign: "center" }}>Grade Points</th>
                </tr>
              </thead>
              <tbody>
                {semesterCourses.map((course, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className="course-code">{course.COURSE_CODE}</span>
                    </td>
                    <td>
                      <div className="course-meta">
                        <span style={{ fontWeight: 600 }}>
                          {course.COURSE_NAME}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                      {course.CREDIT_HOURS}
                    </td>
                    <td>{course.INSTRUCTOR_NAME || "Not Assigned"}</td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        className="badge badge-green"
                        style={{ fontSize: "14px", padding: "4px 12px" }}
                      >
                        {course.grade || course.FINAL_GRADE || "N/A"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {course.grade_points || course.GRADE_POINTS || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// Registration View Component
function RegistrationView({
  canRegister,
  registrationInfo,
  myRegisteredCourses,
  availableCourses,
  onRegister,
  onDrop,
  actionLoading,
  sessionId,
}) {
  if (!canRegister) {
    return (
      <div
        className="empty-state"
        style={{
          backgroundColor: "#fef2f2",
          border: "1px solid #fee2e2",
          borderRadius: "12px",
          padding: "3rem",
        }}
      >
        <div
          className="empty-icon"
          style={{ color: "var(--danger)", marginBottom: "1rem" }}
        >
          <FileText size={48} />
        </div>
        <h3 style={{ color: "#991b1b", marginBottom: "0.5rem" }}>
          Registration Not Available
        </h3>
        <p
          style={{ color: "#7f1d1d", maxWidth: "400px", margin: "0 auto 1rem" }}
        >
          {registrationInfo?.reason || "Registration is currently closed."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className="alert-banner"
        style={{
          backgroundColor: "#ecfdf5",
          border: "1px solid #d1fae5",
          color: "#065f46",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <p>
          <strong>Registration Period:</strong>{" "}
          {registrationInfo?.regPeriod?.start_date} to{" "}
          {registrationInfo?.regPeriod?.end_date}
        </p>
        <p>
          <strong>Semester:</strong> {registrationInfo?.session?.semester}{" "}
          {registrationInfo?.session?.year}
        </p>
      </div>

      <div style={{ marginBottom: "30px" }}>
        <h3
          style={{ marginBottom: "1rem", fontSize: "1.25rem", fontWeight: 700 }}
        >
          My Registered Courses ({myRegisteredCourses.length})
        </h3>
        {myRegisteredCourses.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
            You haven't registered for any courses yet.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th style={{ width: "35%" }}>Course Name</th>
                  <th style={{ textAlign: "center" }}>Credits</th>
                  <th>Instructor</th>
                  <th style={{ textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {myRegisteredCourses.map((course) => (
                  <tr key={course.registration_id}>
                    <td>
                      <span className="course-code">{course.COURSE_CODE}</span>
                    </td>
                    <td>
                      <div className="course-meta">
                        <span style={{ fontWeight: 600 }}>
                          {course.COURSE_NAME}
                        </span>
                        <span className="course-name">
                          Section: {course.section_name || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                      {course.CREDIT_HOURS}
                    </td>
                    <td>{course.INSTRUCTOR_NAME || "Not Assigned"}</td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        onClick={() => onDrop(course.registration_id)}
                        className="btn btn-danger-outline"
                        disabled={actionLoading}
                      >
                        <Trash2 size={13} /> Drop
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h3
          style={{ marginBottom: "1rem", fontSize: "1.25rem", fontWeight: 700 }}
        >
          Available Courses for Registration
        </h3>
        {availableCourses.filter((c) => c.STATUS === "available").length ===
        0 ? (
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
            No courses available for registration.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th style={{ width: "35%" }}>Course Name</th>
                  <th style={{ textAlign: "center" }}>Credits</th>
                  <th>Instructor</th>
                  <th>Schedule</th>
                  <th style={{ textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {availableCourses
                  .filter((c) => c.STATUS === "available")
                  .map((course) => (
                    <tr key={course.session_course_id}>
                      <td>
                        <span className="course-code">
                          {course.COURSE_CODE}
                        </span>
                      </td>
                      <td>
                        <div className="course-meta">
                          <span style={{ fontWeight: 600 }}>
                            {course.COURSE_NAME}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: "center", fontWeight: "bold" }}>
                        {course.CREDIT_HOURS}
                      </td>
                      <td>{course.INSTRUCTOR_NAME || "Not Assigned"}</td>
                      <td>{course.SCHEDULE || "TBD"}</td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() =>
                            onRegister(course.session_course_id, sessionId)
                          }
                          className="btn btn-primary"
                          disabled={actionLoading}
                        >
                          <PlusCircle size={13} /> Register
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
