import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa';

import {
  GraduationCap,
  Lock,
  User,
  BookOpen,
  Calendar,
  HelpCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import "./Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/auth/login`,
        {
          username,
          password,
        },
      );

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      toast.success(`Welcome back, ${user.username}!`);
      navigate("/dashboard");
    } catch (error) {
      const message =
        error.response?.data?.error ||
        "Login failed. Please check your credentials.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    toast.success(
      "Password reset instructions sent to your registered email!",
      {
        icon: "✉️",
      },
    );
  };

  return (
    <div id="univ_login_page" className="univ-wrapper">
      {/* Dynamic Header */}
      <header className="portal-header" id="portal_header">
        <Link to="/home" className="header-brand">
          <div className="logo-icon">AMT</div>
          <div className="brand-text">
            <h1>AMTU</h1>
            <span>Portal Login</span>
          </div>
        </Link>
        <div className="header-nav">
          <Link to="/home" className="nav-link">
            Home
          </Link>
          <a href="#curriculum" className="nav-link">
            Academics
          </a>
          <a href="#help" className="nav-link">
            About AMTU
          </a>
          <a
            href="#support"
            className="nav-btn-support"
            onClick={(e) => {
              e.preventDefault();
              toast.success(
                "Helpdesk agent contacted. We are here to assist 24/7!",
                { icon: "📞" },
              );
            }}
          >
            <HelpCircle size={15} /> Help Desk
          </a>
        </div>
      </header>

      {/* Main Container Grid */}
      <main className="portal-main" id="portal_main">
        <div className="login-card-container">
          {/* Left Panel: Aesthetic University Info */}
          <section className="portal-info-panel">
            <div className="panel-top">
              <span className="panel-crest">🎓</span>
              <blockquote className="panel-quote">
                "Knowledge is not merely information, but the light that
                illuminates the path of innovation."
              </blockquote>
              <span className="panel-quote-author">
                — VSU Chancellor's Office
              </span>
            </div>

            <div className="panel-middle">
              <div className="university-features">
                <div className="feat-item">
                  <div className="feat-icon-box">
                    <BookOpen size={18} />
                  </div>
                  <div className="feat-text">
                    <h4>Unified Academics</h4>
                    <p>
                      Real-time classroom enrollment, syllabus lookups, and
                      personalized schedules.
                    </p>
                  </div>
                </div>

                <div className="feat-item">
                  <div className="feat-icon-box">
                    <Calendar size={18} />
                  </div>
                  <div className="feat-text">
                    <h4>Dynamic Calendar</h4>
                    <p>
                      Track examinations, assignment deadlines, and university
                      symposia instantly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel-bottom-notes">
              <span>ESTD. 1954 • All Rights Reserved</span>
              <div className="system-status">
                <span className="status-dot"></span>
                <span>Portal Live</span>
              </div>
            </div>
          </section>

          {/* Right Panel: Clean Login Form */}
          <section className="form-side">
            <div className="form-header">
              <h2>Account Login</h2>
              <p>Enter your credentials to enter the management environment</p>
            </div>

            <form onSubmit={handleLogin} id="auth_login_form">
              {/* Username Input */}
              <div className="ui-input-group">
                <label className="ui-input-label">Username</label>
                <div className="input-with-icon">
                  <User className="input-icon" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="ui-input"
                    placeholder="Enter your username"
                    id="login_username_input"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="ui-input-group">
                <label className="ui-input-label">Password</label>
                <div className="input-with-icon">
                  <Lock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="ui-input"
                    style={{ paddingRight: "3rem" }}
                    placeholder="••••••••"
                    id="login_password_input"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="form-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    className="remember-checkbox"
                    defaultChecked
                  />
                  Remember this device
                </label>
                <a
                  href="#reset"
                  onClick={handleForgotPassword}
                  className="forgot-link"
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <div className="submit-button-container">
                <button
                  type="submit"
                  disabled={loading}
                  className="univ-btn-primary"
                  id="login_submit_btn"
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Login to Dashboard</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="secondary-action-area">
              Are you new to the university?{" "}
              <Link
                to="/register"
                className="secondary-action-link"
                id="link_to_register"
              >
                Register here
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
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

export default Login;
