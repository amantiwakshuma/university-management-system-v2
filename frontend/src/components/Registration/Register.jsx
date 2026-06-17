import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa';

import {
  GraduationCap,
  User,
  Mail,
  Phone,
  Calendar,
  Building,
  Briefcase,
  Lock,
  ArrowLeft,
  HelpCircle,
  MapPin,
  CheckCircle,
  ShieldAlert,
  ArrowRight,
  Globe,
} from "lucide-react";
import "./Register.css";

function Register() {
  const [userType, setUserType] = useState("student");
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Student form data
  const [studentData, setStudentData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    department_id: "",
    username: "",
    password: "",
    confirm_password: "",
  });

  // Instructor form data
  const [instructorData, setInstructorData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department_id: "",
    designation: "",
    username: "",
    password: "",
    confirm_password: "",
  });

  const mockDepartments = [
    { department_id: "1", department_name: "Computer Science & Engineering" },
    {
      department_id: "2",
      department_name: "Electrical & Electronics Engineering",
    },
    {
      department_id: "3",
      department_name: "Mechanical & Materials Engineering",
    },
    { department_id: "4", department_name: "Biological Sciences & Tech" },
    { department_id: "5", department_name: "Mathematics & Quantum Physics" },
    { department_id: "6", department_name: "Verdant Business School" },
  ];

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/auth/departments");
      if (res.data && res.data.length > 0) {
        setDepartments(res.data);
      } else {
        setDepartments(mockDepartments);
      }
    } catch (error) {
      console.log("Using backup departments list.");
      setDepartments(mockDepartments);
    }
  };

  const handleStudentRegister = async (e) => {
    e.preventDefault();

    if (studentData.password !== studentData.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }

    if (studentData.password.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }

    setLoading(true);

    try {
      await axios.post("http://localhost:5000/api/auth/register/student", {
        first_name: studentData.first_name,
        last_name: studentData.last_name,
        email: studentData.email,
        phone: studentData.phone,
        date_of_birth: studentData.date_of_birth,
        department_id: studentData.department_id,
        username: studentData.username,
        password: studentData.password,
      });
      toast.success("Registration successful! Please login.");
      navigate("/login");
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInstructorRegister = async (e) => {
    e.preventDefault();

    if (instructorData.password !== instructorData.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }

    if (instructorData.password.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }

    setLoading(true);

    try {
      await axios.post("http://localhost:5000/api/auth/register/instructor", {
        first_name: instructorData.first_name,
        last_name: instructorData.last_name,
        email: instructorData.email,
        phone: instructorData.phone,
        department_id: instructorData.department_id,
        designation: instructorData.designation,
        username: instructorData.username,
        password: instructorData.password,
      });
      toast.success("Registration successful! Please login.");
      navigate("/login");
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          "Instructor registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="univ_register_page" className="univ-wrapper">
      {/* Header */}
      <header className="portal-header">
        <Link to="/home" className="header-brand">
          <div className="logo-icon">AMTU</div>
          <div className="brand-text">
            <h1>AMTU</h1>
            <span>Portal Register</span>
          </div>
        </Link>
        <div className="header-nav">
          <Link to="/login" className="nav-link">
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="portal-main">
        <div className="register-card-container">
          {/* Form Side - Left Column */}
          <section className="register-form-side">
            <div className="register-form-header">
              <h2>Establish Account</h2>
              <p>
                Identify your academic standing and fill in your records below
              </p>
            </div>

            {/* Role Selector Switch */}
            <div className="role-toggle-container">
              <button
                type="button"
                onClick={() => setUserType("student")}
                className={`role-toggle-button ${userType === "student" ? "active-student" : ""}`}
              >
                 Student Registry
              </button>
              <button
                type="button"
                onClick={() => setUserType("instructor")}
                className={`role-toggle-button ${userType === "instructor" ? "active-instructor" : ""}`}
              >
                 Faculty Registry
              </button>
            </div>

            {/* Student Registration Form */}
            {userType === "student" && (
              <form onSubmit={handleStudentRegister}>
                <div className="registration-form-grid">
                  <div className="reg-input-group">
                    <label className="reg-label">
                      First Name <span>*</span>
                    </label>
                    <input
                      type="text"
                      className="reg-input"
                      value={studentData.first_name}
                      onChange={(e) =>
                        setStudentData({
                          ...studentData,
                          first_name: e.target.value,
                        })
                      }
                      required
                      placeholder="Alex"
                    />
                  </div>
                  <div className="reg-input-group">
                    <label className="reg-label">
                      Last Name <span>*</span>
                    </label>
                    <input
                      type="text"
                      className="reg-input"
                      value={studentData.last_name}
                      onChange={(e) =>
                        setStudentData({
                          ...studentData,
                          last_name: e.target.value,
                        })
                      }
                      required
                      placeholder="Johnson"
                    />
                  </div>
                  <div className="reg-input-group">
                    <label className="reg-label">
                      Email Address <span>*</span>
                    </label>
                    <input
                      type="email"
                      className="reg-input"
                      value={studentData.email}
                      onChange={(e) =>
                        setStudentData({
                          ...studentData,
                          email: e.target.value,
                        })
                      }
                      required
                      placeholder="alex.j@university.edu"
                    />
                  </div>
                  <div className="reg-input-group">
                    <label className="reg-label">Phone Contact</label>
                    <input
                      type="tel"
                      className="reg-input"
                      value={studentData.phone}
                      onChange={(e) =>
                        setStudentData({
                          ...studentData,
                          phone: e.target.value,
                        })
                      }
                      placeholder="+1 (555) 012-3456"
                    />
                  </div>
                  <div className="reg-input-group">
                    <label className="reg-label">Date of Birth</label>
                    <input
                      type="date"
                      className="reg-input"
                      value={studentData.date_of_birth}
                      onChange={(e) =>
                        setStudentData({
                          ...studentData,
                          date_of_birth: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="reg-input-group">
                    <label className="reg-label">
                      Academic Department <span>*</span>
                    </label>
                    <select
                      className="reg-input"
                      value={studentData.department_id}
                      onChange={(e) =>
                        setStudentData({
                          ...studentData,
                          department_id: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option
                          key={dept.department_id}
                          value={dept.department_id}
                        >
                          {dept.department_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="reg-input-group grid-col-span-2">
                    <label className="reg-label">
                      Create Username <span>*</span>
                    </label>
                    <input
                      type="text"
                      className="reg-input"
                      value={studentData.username}
                      onChange={(e) =>
                        setStudentData({
                          ...studentData,
                          username: e.target.value,
                        })
                      }
                      required
                      placeholder="e.g. alex_johnson"
                    />
                  </div>
                  <div className="reg-input-group">
                    <label className="reg-label">
                      Password <span>*</span>
                    </label>
                    <input
                      type="password"
                      className="reg-input"
                      value={studentData.password}
                      onChange={(e) =>
                        setStudentData({
                          ...studentData,
                          password: e.target.value,
                        })
                      }
                      required
                      placeholder="Min 4 characters"
                    />
                  </div>
                  <div className="reg-input-group">
                    <label className="reg-label">
                      Confirm Password <span>*</span>
                    </label>
                    <input
                      type="password"
                      className="reg-input"
                      value={studentData.confirm_password}
                      onChange={(e) =>
                        setStudentData({
                          ...studentData,
                          confirm_password: e.target.value,
                        })
                      }
                      required
                      placeholder="Repeat password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="reg-submit-btn theme-student"
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      <span>Enrolling student...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Student Enrollment</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Instructor Registration Form */}
            {userType === "instructor" && (
              <form onSubmit={handleInstructorRegister}>
                <div className="registration-form-grid">
                  <div className="reg-input-group">
                    <label className="reg-label">
                      First Name <span>*</span>
                    </label>
                    <input
                      type="text"
                      className="reg-input"
                      value={instructorData.first_name}
                      onChange={(e) =>
                        setInstructorData({
                          ...instructorData,
                          first_name: e.target.value,
                        })
                      }
                      required
                      placeholder="Dr. Evelyn"
                    />
                  </div>
                  <div className="reg-input-group">
                    <label className="reg-label">
                      Last Name <span>*</span>
                    </label>
                    <input
                      type="text"
                      className="reg-input"
                      value={instructorData.last_name}
                      onChange={(e) =>
                        setInstructorData({
                          ...instructorData,
                          last_name: e.target.value,
                        })
                      }
                      required
                      placeholder="Carter"
                    />
                  </div>
                  <div className="reg-input-group">
                    <label className="reg-label">
                      Institutional Email <span>*</span>
                    </label>
                    <input
                      type="email"
                      className="reg-input"
                      value={instructorData.email}
                      onChange={(e) =>
                        setInstructorData({
                          ...instructorData,
                          email: e.target.value,
                        })
                      }
                      required
                      placeholder="evelyn.carter@university.edu"
                    />
                  </div>
                  <div className="reg-input-group">
                    <label className="reg-label">Phone Contact</label>
                    <input
                      type="tel"
                      className="reg-input"
                      value={instructorData.phone}
                      onChange={(e) =>
                        setInstructorData({
                          ...instructorData,
                          phone: e.target.value,
                        })
                      }
                      placeholder="+1 (555) 999-8811"
                    />
                  </div>
                  <div className="reg-input-group">
                    <label className="reg-label">
                      Employing Department <span>*</span>
                    </label>
                    <select
                      className="reg-input"
                      value={instructorData.department_id}
                      onChange={(e) =>
                        setInstructorData({
                          ...instructorData,
                          department_id: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option
                          key={dept.department_id}
                          value={dept.department_id}
                        >
                          {dept.department_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="reg-input-group">
                    <label className="reg-label">Faculty Designation</label>
                    <select
                      className="reg-input"
                      value={instructorData.designation}
                      onChange={(e) =>
                        setInstructorData({
                          ...instructorData,
                          designation: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Designation</option>
                      <option value="Professor">Professor</option>
                      <option value="Associate Professor">
                        Associate Professor
                      </option>
                      <option value="Assistant Professor">
                        Assistant Professor
                      </option>
                      <option value="Lecturer">Lecturer</option>
                      <option value="Senior Lecturer">Senior Lecturer</option>
                    </select>
                  </div>
                  <div className="reg-input-group grid-col-span-2">
                    <label className="reg-label">
                      System Username <span>*</span>
                    </label>
                    <input
                      type="text"
                      className="reg-input"
                      value={instructorData.username}
                      onChange={(e) =>
                        setInstructorData({
                          ...instructorData,
                          username: e.target.value,
                        })
                      }
                      required
                      placeholder="e.g. evelyn_carter"
                    />
                  </div>
                  <div className="reg-input-group">
                    <label className="reg-label">
                      Password <span>*</span>
                    </label>
                    <input
                      type="password"
                      className="reg-input"
                      value={instructorData.password}
                      onChange={(e) =>
                        setInstructorData({
                          ...instructorData,
                          password: e.target.value,
                        })
                      }
                      required
                      placeholder="Min 4 characters"
                    />
                  </div>
                  <div className="reg-input-group">
                    <label className="reg-label">
                      Confirm Password <span>*</span>
                    </label>
                    <input
                      type="password"
                      className="reg-input"
                      value={instructorData.confirm_password}
                      onChange={(e) =>
                        setInstructorData({
                          ...instructorData,
                          confirm_password: e.target.value,
                        })
                      }
                      required
                      placeholder="Repeat password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="reg-submit-btn theme-instructor"
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      <span>Submitting dossier...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Faculty Application</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="secondary-register-link-area">
              Have you already registered with us?{" "}
              <Link to="/login" className="link-highlight">
                Login here
              </Link>
            </div>
          </section>

          {/* Right Pillar - Guidance & Criteria Checklist */}
          <aside className="registration-onboard-sidebar">
            <div>
              <span className="onboard-title">Registry Checklist</span>
              <p className="onboard-subtitle">
                To authorize student or faculty access, guarantee you satisfy
                the guidelines below:
              </p>

              <div className="guide-list">
                <div className="guide-step done">
                  <div className="step-num">✓</div>
                  <div className="step-info">
                    <h5>Official Credentials</h5>
                    <p>
                      Enter your full legal name matching class indices or work
                      logs.
                    </p>
                  </div>
                </div>

                <div className="guide-step done">
                  <div className="step-num">✓</div>
                  <div className="step-info">
                    <h5>Valid Mailbox</h5>
                    <p>
                      An institutional '.edu' address or primary personal
                      account is required.
                    </p>
                  </div>
                </div>

                <div
                  className={`guide-step ${studentData.department_id || instructorData.department_id ? "done" : ""}`}
                >
                  <div className="step-num">3</div>
                  <div className="step-info">
                    <h5>Affiliation Mapping</h5>
                    <p>
                      Locating your departmental registry completes your
                      course/grade indexing.
                    </p>
                  </div>
                </div>

                <div
                  className={`guide-step ${(studentData.password && studentData.password.length >= 4) || (instructorData.password && instructorData.password.length >= 4) ? "done" : ""}`}
                >
                  <div className="step-num">4</div>
                  <div className="step-info">
                    <h5>Secure Cipher</h5>
                    <p>
                      Ciphers must contain at least 4 symbols for default safety
                      regulations.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sidebar-brand-badge">
              <span className="badge-icon">🏛️</span>
              <div className="badge-text">
                <h6>Aura Accreditation</h6>
                <p>Recognized Board of Academic Excellence since 1954</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="portal-footer-enhanced">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="footer-logo-icon">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <span className="footer-logo-text">
                    Verdant State University
                  </span>
                  <span className="footer-tagline">Est. 1954</span>
                </div>
              </div>
              <p className="footer-description">
                An elite higher education learning center dedicated to
                technological distinction, community enrichment, and progressive
                research sciences. Certified by the state board.
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
                <h4 className="footer-heading">Portal Services</h4>
                <ul className="footer-links-list">
                  <li>
                    <a href="#">Office of the Registrar</a>
                  </li>
                  <li>
                    <a href="#">Academics Catalog</a>
                  </li>
                  <li>
                    <a href="#">Financial Administration</a>
                  </li>
                  <li>
                    <a href="#">Information Security Portal</a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="footer-heading">Quick Links</h4>
                <ul className="footer-links-list">
                  <li>
                    <Link to="/login">Student Portal</Link>
                  </li>
                  <li>
                    <Link to="/login">Faculty Hub</Link>
                  </li>
                  <li>
                    <Link to="/library">Digital Library</Link>
                  </li>
                  <li>
                    <a href="#">Career Services</a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="footer-heading">Support</h4>
                <ul className="footer-links-list">
                  <li>
                    <a href="#">Help Center</a>
                  </li>
                  <li>
                    <a href="#">FAQs</a>
                  </li>
                  <li>
                    <a href="#">Technical Support</a>
                  </li>
                  <li>
                    <a href="#">Report an Issue</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer-contact-bar">
            <div className="contact-info-item">
              <MapPin size={16} />
              <span>100 Academic Circle, Science Hill, VT 05401</span>
            </div>
            <div className="contact-info-item">
              <Phone size={16} />
              <span>+1 (800) 555-0199</span>
            </div>
            <div className="contact-info-item">
              <Mail size={16} />
              <span>registrar@verdant.edu</span>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-bottom-left">
              <p>
                &copy; {new Date().getFullYear()} Verdant State University. All
                rights reserved.
              </p>
            </div>
            <div className="footer-bottom-right">
              <a href="#">Privacy Policy</a>
              <span className="separator">|</span>
              <a href="#">Terms of Use</a>
              <span className="separator">|</span>
              <a href="#">Cookie Settings</a>
              <span className="separator">|</span>
              <a href="#">Accessibility</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Register;
