import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa';

import {
  GraduationCap,
  Users,
  BookOpen,
  ArrowRight,
  Award,
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookMarked,
  HelpCircle,
  Clock,
  Menu,
  X,
  Star,
  Heart,
  Target,
  CheckCircle,
  Home as HomeIcon,
  Library,
  Info,
  Mail as MailIcon,
  Calendar,
} from "lucide-react";
import "./Home.css";

// Fallback data (keep your existing defaults)
const defaultStats = {
  totalStudents: 15420,
  totalInstructors: 840,
  totalCourses: 312,
  totalDepartments: 18,
};

const defaultDepartments = [
  { department_id: 1, department_name: "Computer Science" },
  { department_id: 2, department_name: "Electrical Engineering" },
  { department_id: 3, department_name: "Business Administration" },
  { department_id: 4, department_name: "Mathematics" },
];

const defaultCourses = [
  // Computer Science
  {
    course_id: 101,
    department_id: 1,
    course_name: "Introduction to Computer Science",
    course_code: "CS-101",
    credit_hours: 3,
  },
  {
    course_id: 102,
    department_id: 1,
    course_name: "Data Structures & Algorithms",
    course_code: "CS-201",
    credit_hours: 4,
  },
  {
    course_id: 103,
    department_id: 1,
    course_name: "Web Application Development",
    course_code: "CS-302",
    credit_hours: 3,
  },
  {
    course_id: 104,
    department_id: 1,
    course_name: "Artificial Intelligence & ML",
    course_code: "CS-425",
    credit_hours: 4,
  },
  {
    course_id: 105,
    department_id: 1,
    course_name: "Database Management Systems",
    course_code: "CS-210",
    credit_hours: 3,
  },
  {
    course_id: 106,
    department_id: 1,
    course_name: "Cyber Security Fundamentals",
    course_code: "CS-350",
    credit_hours: 3,
  },
  {
    course_id: 107,
    department_id: 1,
    course_name: "Cloud Computing Architectures",
    course_code: "CS-480",
    credit_hours: 3,
  },
  {
    course_id: 108,
    department_id: 1,
    course_name: "Human-Computer Interaction",
    course_code: "CS-315",
    credit_hours: 3,
  },

  // Electrical Engineering
  {
    course_id: 201,
    department_id: 2,
    course_name: "Circuit Theory & Analysis",
    course_code: "EE-102",
    credit_hours: 4,
  },
  {
    course_id: 202,
    department_id: 2,
    course_name: "Digital Signal Processing",
    course_code: "EE-304",
    credit_hours: 3,
  },
  {
    course_id: 203,
    department_id: 2,
    course_name: "Embedded Systems Laboratory",
    course_code: "EE-312",
    credit_hours: 4,
  },
  {
    course_id: 204,
    department_id: 2,
    course_name: "Power Grids & Renewable Energy",
    course_code: "EE-401",
    credit_hours: 3,
  },
  {
    course_id: 205,
    department_id: 2,
    course_name: "Microelectronics Engineering",
    course_code: "EE-220",
    credit_hours: 3,
  },

  // Business Administration
  {
    course_id: 301,
    department_id: 3,
    course_name: "Principles of Microeconomics",
    course_code: "BUS-110",
    credit_hours: 3,
  },
  {
    course_id: 302,
    department_id: 3,
    course_name: "Corporate Finance & Strategy",
    course_code: "BUS-250",
    credit_hours: 3,
  },
  {
    course_id: 303,
    department_id: 3,
    course_name: "Digital Marketing Analytics",
    course_code: "BUS-315",
    credit_hours: 3,
  },
  {
    course_id: 304,
    department_id: 3,
    course_name: "Organizational Leadership",
    course_code: "BUS-420",
    credit_hours: 3,
  },
  {
    course_id: 305,
    department_id: 3,
    course_name: "Strategic Brand Management",
    course_code: "BUS-360",
    credit_hours: 3,
  },

  // Mathematics
  {
    course_id: 401,
    department_id: 4,
    course_name: "Calculus I: Single Variable",
    course_code: "MATH-151",
    credit_hours: 4,
  },
  {
    course_id: 402,
    department_id: 4,
    course_name: "Linear Algebra & Applications",
    course_code: "MATH-202",
    credit_hours: 3,
  },
  {
    course_id: 403,
    department_id: 4,
    course_name: "Probability & Statistics",
    course_code: "MATH-220",
    credit_hours: 3,
  },
  {
    course_id: 404,
    department_id: 4,
    course_name: "Abstract Algebraic Systems",
    course_code: "MATH-310",
    credit_hours: 3,
  },
];

const testimonialAvatars = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
];

const getCourseImage = (courseName) => {
  const name = courseName.toLowerCase();
  if (
    name.includes("computer") ||
    name.includes("software") ||
    name.includes("programming") ||
    name.includes("web") ||
    name.includes("algorithm") ||
    name.includes("data") ||
    name.includes("cyber") ||
    name.includes("cloud")
  ) {
    return "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80";
  }
  if (
    name.includes("math") ||
    name.includes("calculus") ||
    name.includes("algebra") ||
    name.includes("geometry") ||
    name.includes("statistics") ||
    name.includes("probability")
  ) {
    return "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80";
  }
  if (
    name.includes("business") ||
    name.includes("econ") ||
    name.includes("market") ||
    name.includes("finance") ||
    name.includes("manage") ||
    name.includes("leadership")
  ) {
    return "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80";
  }
  if (
    name.includes("chemistry") ||
    name.includes("physic") ||
    name.includes("biolog") ||
    name.includes("science")
  ) {
    return "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600&auto=format&fit=crop&q=80";
  }
  if (
    name.includes("engine") ||
    name.includes("architect") ||
    name.includes("civil") ||
    name.includes("mechan") ||
    name.includes("circuit") ||
    name.includes("signal") ||
    name.includes("embedded")
  ) {
    return "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80";
  }
  if (
    name.includes("art") ||
    name.includes("history") ||
    name.includes("literature") ||
    name.includes("philosophy") ||
    name.includes("human")
  ) {
    return "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80";
  }
  return "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80";
};

function CountingStat({ value, duration = 1200 }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (end <= 0) {
      setCurrent(0);
      return;
    }

    const startTime = performance.now();
    let animationFrameId;

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress = progress * (2 - progress);
      const nextVal = Math.floor(easedProgress * end);

      setCurrent(nextVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(update);
      } else {
        setCurrent(end);
      }
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return <>{current.toLocaleString()}</>;
}

function Home() {
  const [stats, setStats] = useState({
    totalStudents: defaultStats.totalStudents,
    totalInstructors: defaultStats.totalInstructors,
    totalCourses: defaultStats.totalCourses,
    totalDepartments: defaultStats.totalDepartments,
  });
  const [departments, setDepartments] = useState(defaultDepartments);
  const [courses, setCourses] = useState(defaultCourses);
  const [selectedDept, setSelectedDept] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [coursesLimit, setCoursesLimit] = useState(6);

  const slides = [
    {
      image: "https://images.unsplash.com/photo-1562774053-701939374585?w=1600",
      title: "Welcome to AMT University",
      subtitle: "Empowering Education Through Technology",
      buttonText: "Get Started",
      buttonLink: "/register",
    },
    {
      image:
        "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      title: "World-Class Education",
      subtitle: "Join thousands of successful graduates",
      buttonText: "Explore Courses",
      buttonLink: "#courses",
    },
    {
      image:
        "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600",
      title: "Modern Learning Environment",
      subtitle: "State-of-the-art facilities and expert faculty",
      buttonText: "Learn More",
      buttonLink: "#about",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Computer Science Student",
      content:
        "The University Management System has transformed how I track my academic progress. Everything is so organized and accessible!",
      rating: 5,
    },
    {
      name: "Dr. Michael Chen",
      role: "Professor of Mathematics",
      content:
        "Managing courses and grades has never been easier. The platform is intuitive, fast, and remarkably powerful.",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "Alumni",
      content:
        "My journey here prepared me perfectly for my career in industry. I am forever grateful for the systems and support provided!",
      rating: 5,
    },
  ];

  const loadStats = async () => {
    try {
      const [studentsRes, instructorsRes, coursesRes, deptsRes] =
        await Promise.all([
          axios
            .get("/api/public/stats/students")
            .catch(() => ({ data: { count: defaultStats.totalStudents } })),
          axios
            .get("http://localhost:5000/api/public/stats/instructors")
            .catch(() => ({ data: { count: defaultStats.totalInstructors } })),
          axios
            .get("http://localhost:5000/api/public/stats/courses")
            .catch(() => ({ data: { count: defaultStats.totalCourses } })),
          axios
            .get("http://localhost:5000/api/public/stats/departments")
            .catch(() => ({ data: { count: defaultStats.totalDepartments } })),
        ]);

      setStats({
        totalStudents: studentsRes.data.count || defaultStats.totalStudents,
        totalInstructors:
          instructorsRes.data.count || defaultStats.totalInstructors,
        totalCourses: coursesRes.data.count || defaultStats.totalCourses,
        totalDepartments: deptsRes.data.count || defaultStats.totalDepartments,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadDepartmentsAndCourses = async () => {
    try {
      const [deptsRes, coursesRes] = await Promise.all([
        axios
          .get("http://localhost:5000/api/public/departments")
          .catch(() => ({ data: defaultDepartments })),
        axios
          .get("http://localhost:5000/api/public/courses")
          .catch(() => ({ data: defaultCourses })),
      ]);
      setDepartments(deptsRes.data);
      setCourses(coursesRes.data);
      if (deptsRes.data.length > 0) {
        setSelectedDept(deptsRes.data[0].department_id);
      }
    } catch (error) {
      console.error("Error loading departments and courses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadStats();
    loadDepartmentsAndCourses();
  }, []);

  useEffect(() => {
    setCoursesLimit(6);
  }, [selectedDept]);

  const filteredCourses = courses.filter(
    (course) => course.department_id === selectedDept,
  );
  const displayedCourses = filteredCourses.slice(0, coursesLimit);

  // Smooth scroll function for hash links
  const scrollToSection = (sectionId) => {
    const section = document.querySelector(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading) {
    return (
      <div className="home-loading">
        <div className="spinner"></div>
        <p className="loading-text">Initializing Academic Portal...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Navigation Bar - Same style as Library */}
      <nav className="home-navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <div className="logo-icon-wrapper">
              <GraduationCap size={24} />
            </div>
            <span className="logo-text">
              AM<span className="logo-highlight">TU</span>
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="nav-links">
            <Link to="/" className="nav-link active">
              <HomeIcon size={16} /> Home
            </Link>
            <a
              href="#courses"
              className="nav-link"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("#courses");
              }}
            >
              <BookOpen size={16} /> Courses
            </a>
            <Link to="/library" className="nav-link">
              <Library size={16} /> Library
            </Link>
            <a
              href="#about"
              className="nav-link"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("#about");
              }}
            >
              <Info size={16} /> About
            </a>
            <a
              href="#contact"
              className="nav-link"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("#contact");
              }}
            >
              <MailIcon size={16} /> Contact
            </a>
          </div>

          <div className="nav-buttons">
            <Link to="/login" className="btn-login-new">
              Login
            </Link>
            <Link to="/register" className="btn-register-new">
              Register
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mobile-menu-btn"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <div className={`mobile-nav-menu ${isMobileMenuOpen ? "open" : ""}`}>
          <div className="mobile-menu-content">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
              <HomeIcon size={16} /> Home
            </Link>
            <a
              href="#courses"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("#courses");
                setIsMobileMenuOpen(false);
              }}
            >
              <BookOpen size={16} /> Courses
            </a>
            <Link to="/library" onClick={() => setIsMobileMenuOpen(false)}>
              <Library size={16} /> Library
            </Link>
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("#about");
                setIsMobileMenuOpen(false);
              }}
            >
              <Info size={16} /> About
            </a>
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("#contact");
                setIsMobileMenuOpen(false);
              }}
            >
              <MailIcon size={16} /> Contact
            </a>
            <div className="mobile-auth-buttons">
              <Link
                to="/login"
                className="mobile-login"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="mobile-register"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Slider Section - Keep your existing hero code */}
      <section id="home" className="hero-section">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`hero-slide ${currentSlide === index ? "active" : ""}`}
            style={{
              backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.65)), url(${slide.image})`,
            }}
          >
            <div className="hero-content">
              <span className="hero-badge">
                <Sparkles size={12} className="sparkle-icon" />
                Next-Gen Academic Environment
              </span>
              <h1 className="hero-title">{slide.title}</h1>
              <p className="hero-subtitle">{slide.subtitle}</p>
              <div className="hero-buttons">
                <a
                  href={slide.buttonLink}
                  className="hero-btn"
                  onClick={(e) => {
                    if (slide.buttonLink.startsWith("#")) {
                      e.preventDefault();
                      scrollToSection(slide.buttonLink);
                    }
                  }}
                >
                  {slide.buttonText}
                  <ArrowRight size={18} className="btn-arrow" />
                </a>
              </div>
            </div>
          </div>
        ))}
        <button
          className="slider-btn prev"
          onClick={() =>
            setCurrentSlide(
              (prev) => (prev - 1 + slides.length) % slides.length,
            )
          }
        >
          <ChevronLeft size={24} />
        </button>
        <button
          className="slider-btn next"
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
        >
          <ChevronRight size={24} />
        </button>
        <div className="slider-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`dot ${currentSlide === index ? "active" : ""}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </section>

      {/* Statistics Section - Keep your existing code */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon students-icon">
                <Users size={32} />
              </div>
              <div className="stat-number">
                <CountingStat value={stats.totalStudents} />+
              </div>
              <div className="stat-label">Active Students</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon instructors-icon">
                <GraduationCap size={32} />
              </div>
              <div className="stat-number">
                <CountingStat value={stats.totalInstructors} />+
              </div>
              <div className="stat-label">Faculty Members</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon courses-icon">
                <BookOpen size={32} />
              </div>
              <div className="stat-number">
                <CountingStat value={stats.totalCourses} />+
              </div>
              <div className="stat-label">Active Courses</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon departments-icon">
                <Building2 size={32} />
              </div>
              <div className="stat-number">
                <CountingStat value={stats.totalDepartments} />+
              </div>
              <div className="stat-label">Academic Depts</div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section - Keep your existing code */}
      <section id="courses" className="courses-section">
        <div className="courses-container">
          <div className="section-header">
            <span className="section-badge">Comprehensive Curriculum</span>
            <h2 className="section-title">Explore Our Popular Courses</h2>
            <p className="section-subtitle">
              We offer cutting-edge academic courses designed to accelerate your
              knowledge and build future-proof careers.
            </p>
          </div>

          <div className="dept-filter">
            {departments.map((dept) => (
              <button
                key={dept.department_id}
                className={`dept-btn ${selectedDept === dept.department_id ? "active" : ""}`}
                onClick={() => setSelectedDept(dept.department_id)}
              >
                {dept.department_name}
              </button>
            ))}
          </div>

          <div className="courses-grid">
            {displayedCourses.map((course) => (
              <div key={course.course_id} className="course-card">
                <div className="course-image-wrapper">
                  <div className="image-overlay" />
                  <img
                    src={getCourseImage(course.course_name)}
                    alt={course.course_name}
                    className="course-image"
                  />
                  <div className="course-badge">
                    {course.course_code.split("-")[0] || "ACAD"}
                  </div>
                </div>
                <div className="course-content">
                  <p className="course-code">
                    <Clock size={12} /> {course.course_code}
                  </p>
                  <h3 className="course-title">{course.course_name}</h3>
                </div>
                <div className="course-footer">
                  <div className="credits-wrapper">
                    <span className="credits-label">Structure</span>
                    <p className="course-credits">
                      <BookMarked size={14} /> {course.credit_hours} Credits
                      Study
                    </p>
                  </div>
                  <Link to="/register" className="course-btn">
                    Enroll Now <ArrowRight size={14} className="btn-arrow" />
                  </Link>
                  <Link to="/register" className="course-btn-mobile">
                    Enroll Now
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="no-courses">
              <HelpCircle className="no-courses-icon" size={40} />
              <p className="no-courses-title">
                No courses listed under this department yet.
              </p>
              <p className="no-courses-subtitle">
                Please login or check other domains above.
              </p>
            </div>
          )}

          {filteredCourses.length > 6 && (
            <div className="view-more-wrapper">
              <button
                onClick={() =>
                  setCoursesLimit((prev) =>
                    prev === 6 ? filteredCourses.length : 6,
                  )
                }
                className="view-more-btn"
              >
                {coursesLimit === 6 ? (
                  <>
                    View More Courses ({filteredCourses.length - 6} available){" "}
                    <ChevronRight size={18} className="btn-arrow" />
                  </>
                ) : (
                  <>
                    Show Fewer Courses{" "}
                    <ChevronLeft size={18} className="btn-arrow" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* About Section - Keep your existing code */}
      <section id="about" className="about-section">
        <div className="about-container">
          <div className="about-grid">
            <div className="about-content">
              <span className="about-badge">
                <Target size={14} /> Our Vision & Mission
              </span>
              <h2 className="about-title">
                Shaping Tomorrow's Leaders Through Excellence
              </h2>
              <p className="about-description">
                Founded with a visionary purpose to deliver world-class research
                and learning, our university has been a sanctuary of academic
                excellence for over two decades.
              </p>
              <div className="about-stats">
                <div className="about-stat-item">
                  <div className="about-stat-number">98%</div>
                  <div className="about-stat-label">
                    Graduate Employment Rate
                  </div>
                </div>
                <div className="about-stat-item">
                  <div className="about-stat-number">50+</div>
                  <div className="about-stat-label">Research Centers</div>
                </div>
                <div className="about-stat-item">
                  <div className="about-stat-number">200+</div>
                  <div className="about-stat-label">Global Partners</div>
                </div>
              </div>
              <div className="about-features">
                <div className="feature">
                  <div className="feature-icon award-icon">
                    <Award size={24} />
                  </div>
                  <div>
                    <h4 className="feature-title">
                      Nationally Accredited Programs
                    </h4>
                    <p className="feature-description">
                      All degrees are verified and accredited worldwide.
                    </p>
                  </div>
                </div>
                <div className="feature">
                  <div className="feature-icon star-icon">
                    <Star size={24} />
                  </div>
                  <div>
                    <h4 className="feature-title">
                      Faculty of Industry Leaders
                    </h4>
                    <p className="feature-description">
                      Study under expert professors and industry veterans.
                    </p>
                  </div>
                </div>
                <div className="feature">
                  <div className="feature-icon globe-icon">
                    <Globe size={24} />
                  </div>
                  <div>
                    <h4 className="feature-title">
                      Global Academic Recognition
                    </h4>
                    <p className="feature-description">
                      Our alumni work in tier-1 global networks.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="about-image-wrapper">
              <div className="about-image-glow" />
              <img
                src="https://images.unsplash.com/photo-1562774053-701939374585?w=600"
                alt="University Campus"
                className="about-image"
              />
              <div className="about-image-badge">
                <CheckCircle size={16} />
                <span>Top Ranked University</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Keep your existing code */}
      <section className="testimonials-section">
        <div className="testimonials-container">
          <div className="section-header">
            <span className="section-badge testimonials-badge">
              <Heart size={14} /> Success Stories
            </span>
            <h2 className="section-title">What Our Community Says</h2>
            <p className="section-subtitle">
              Real opinions from students and respected professors.
            </p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div>
                  <div className="testimonial-rating">
                    {"★".repeat(testimonial.rating)}
                    {"☆".repeat(5 - testimonial.rating)}
                  </div>
                  <p className="testimonial-content">"{testimonial.content}"</p>
                </div>
                <div className="testimonial-author">
                  <img
                    src={testimonialAvatars[index]}
                    alt={testimonial.name}
                    className="author-avatar"
                  />
                  <div>
                    <strong className="author-name">{testimonial.name}</strong>
                    <span className="author-role">{testimonial.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section - Keep your existing code */}
      <section id="contact" className="contact-section">
        <div className="contact-container">
          <div className="contact-grid">
            <div className="contact-info">
              <span className="contact-badge">
                <Mail size={14} /> Get in Touch
              </span>
              <h2 className="contact-title">
                Have Questions? We're Here to Help
              </h2>
              <p className="contact-description">
                Our dedicated support team is ready to assist you.
              </p>
              <div className="contact-details">
                <div className="contact-item">
                  <div className="contact-icon map-icon">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <strong>Visit Us</strong>
                    <span>123 University Avenue, Education City</span>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon phone-icon">
                    <Phone size={22} />
                  </div>
                  <div>
                    <strong>Call Us</strong>
                    <span>+1 (800) 555-0199</span>
                    <span className="contact-sub">Mon-Fri, 9am-6pm EST</span>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon email-icon">
                    <Mail size={22} />
                  </div>
                  <div>
                    <strong>Email Us</strong>
                    <span>info@unimanage.edu</span>
                    <span className="contact-sub">support@unimanage.edu</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="contact-form-wrapper">
              <h3 className="contact-form-title">Send Us a Message</h3>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="contact-form"
              >
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Your Name</label>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Your Email</label>
                    <input
                      type="email"
                      placeholder="jane@example.com"
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    placeholder="I have a question about..."
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea
                    rows={4}
                    placeholder="How can we help you?"
                    className="form-textarea"
                  ></textarea>
                </div>
                <button type="submit" className="submit-btn">
                  Send Message <ArrowRight size={16} className="btn-arrow" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Keep your existing code */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="footer-logo-icon">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <span className="footer-logo-text">AMTU</span>
                  <span className="footer-tagline">Education Portal</span>
                </div>
              </div>
              <p className="footer-description">
                Empowering education through innovative technology solutions.
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
                    <Link to="/">Home</Link>
                  </li>
                  <li>
                    <Link to="/library">Library</Link>
                  </li>
                  <li>
                    <a href="#courses">Courses</a>
                  </li>
                  <li>
                    <a href="#about">About</a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="footer-heading">Resources</h4>
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
              <span>123 University Avenue, Education City</span>
            </div>
            <div className="contact-info-item">
              <Phone size={16} />
              <span>+1 (800) 555-0199</span>
            </div>
            <div className="contact-info-item">
              <Mail size={16} />
              <span>info@unimanage.edu</span>
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
              <span className="separator">|</span>
              <a href="#">Accessibility</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
