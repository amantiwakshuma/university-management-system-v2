import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  GraduationCap, BookOpen, Calendar, Clock, Bell, 
  TrendingUp, Award, Users, Library, DollarSign,
  ChevronRight, CheckCircle, AlertCircle, FileText,
  Home, LogOut, LayoutDashboard, Monitor, UserCheck,
  Target, Zap, Shield, Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import './HomeDashboard.css';

// UniManage Brand Colors
const brandColors = {
  primary: '#1e293b',
  primaryDark: '#4338ca',
  secondary: '#0ea5e9',
  accent: '#636e80',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  dark: '#1e293b',
  light: '#f8fafc'
};

function HomeDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    completedCourses: 0,
    // attendance: 0,
    pendingFees: 0,
    borrowedBooks: 0,
    upcomingEvents: []
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [gradeSummary, setGradeSummary] = useState({ cgpa: 0, totalCredits: 0 });

  const token = localStorage.getItem('token');
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const role = userData.role || 'student';

  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      navigate('/login');
    }
  };

  // Load student info for personalized greeting
  const loadStudentInfo = async () => {
    try {
      const res = await api.get('/student/my-info');
      setStudentInfo(res.data);
    } catch (error) {
      console.error('Error loading student info:', error);
    }
  };

  // Load grade summary for CGPA
  const loadGradeSummary = async () => {
    try {
      const res = await api.get('/student/my-grades');
      setGradeSummary({
        cgpa: res.data.cgpa || 0,
        totalCredits: res.data.total_credits_earned || 0
      });
    } catch (error) {
      console.error('Error loading grades:', error);
    }
  };

  const loadStudentStats = async () => {
    try {
      const [coursesRes,  feesRes, booksRes] = await Promise.all([
        api.get('/student/my-section-courses').catch(() => ({ data: [] })),
        // api.get('/student/attendance').catch(() => ({ data: [] })),
        api.get('/fees/my-fees').catch(() => ({ data: { fees: [] } })),
        api.get('/library/my-borrowed').catch(() => ({ data: { borrowed: [] } }))
      ]);

      const enrolled = coursesRes.data.filter(c => c.STATUS === 'enrolled').length;
      
      // let attendancePercent = 0;
      // if (attendanceRes.data.length > 0) {
        // const total = attendanceRes.data.reduce((sum, a) => sum + a.total_classes, 0);
        // const present = attendanceRes.data.reduce((sum, a) => sum + a.present_count, 0);
        // attendancePercent = total > 0 ? (present / total) * 100 : 0;
      //}

      const pendingFees = feesRes.data.fees?.filter(f => f.status !== 'Paid').reduce((sum, f) => sum + f.remaining_amount, 0) || 0;
      const borrowedBooks = booksRes.data.borrowed?.length || 0;

      setStats({
        enrolledCourses: enrolled,
        completedCourses: 0,
        // attendance: Math.round(attendancePercent),
        pendingFees: pendingFees,
        borrowedBooks: borrowedBooks,
        upcomingEvents: [
          { title: 'Midterm Examinations', date: '2024-12-15', type: 'exam' },
          { title: 'Project Submission Deadline', date: '2024-12-10', type: 'assignment' },
          { title: 'Library Book Returns', date: '2024-12-20', type: 'library' }
        ]
      });

      setNotifications([
        { id: 1, message: 'Your Database Systems assignment is due in 3 days', type: 'warning', date: '2024-12-07' },
        { id: 2, message: 'Fee payment deadline approaching on Dec 15', type: 'danger', date: '2024-12-05' },
        { id: 3, message: 'New course materials uploaded for Web Development', type: 'info', date: '2024-12-03' }
      ]);

    } catch (error) {
      console.error('Error loading student stats:', error);
    }
  };

  const loadInstructorStats = async () => {
    try {
      const [coursesRes] = await Promise.all([
        api.get('/instructor/my-teaching-courses').catch(() => ({ data: { courses: [] } }))
      ]);

      const totalCourses = coursesRes.data.courses?.length || 0;

      setStats({
        enrolledCourses: totalCourses,
        completedCourses: 0,
        // attendance: 0,
        pendingFees: 0,
        borrowedBooks: 0,
        upcomingEvents: [
          { title: 'Faculty Meeting', date: '2024-12-12', type: 'meeting' },
          { title: 'Grade Submission Deadline', date: '2024-12-20', type: 'deadline' }
        ]
      });

      setNotifications([
        { id: 1, message: 'Department curriculum review meeting tomorrow', type: 'info', date: '2024-12-06' },
        { id: 2, message: 'Student evaluation forms pending submission', type: 'warning', date: '2024-12-04' }
      ]);

    } catch (error) {
      console.error('Error loading instructor stats:', error);
    }
  };

  const loadAdminStats = async () => {
    try {
      const [statsRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: {} }))
      ]);

      setStats({
        enrolledCourses: statsRes.data.totalStudents || 0,
        completedCourses: statsRes.data.totalCourses || 0,
        // attendance: statsRes.data.totalInstructors || 0,
        pendingFees: statsRes.data.totalSections || 0,
        borrowedBooks: 0,
        upcomingEvents: [
          { title: 'Registration Deadline', date: '2024-12-20', type: 'admin' },
          { title: 'Fee Collection Due', date: '2024-12-25', type: 'admin' }
        ]
      });

      setNotifications([
        { id: 1, message: 'New student registrations pending approval', type: 'warning', date: '2024-12-05' },
        { id: 2, message: 'System backup completed successfully', type: 'success', date: '2024-12-04' }
      ]);

    } catch (error) {
      console.error('Error loading admin stats:', error);
    }
  };

  const getMainDashboardPath = () => {
    if (role === 'student') return '/student';
    if (role === 'instructor') return '/instructor';
    if (role === 'admin') return '/admin';
    return '#';
  };

  const getDisplayName = () => {
    if (studentInfo?.FIRST_NAME) {
      return `${studentInfo.FIRST_NAME} ${studentInfo.LAST_NAME || ''}`;
    }
    return userData.username || 'User';
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (role === 'student') {
        await Promise.all([
          loadStudentInfo(),
          loadGradeSummary(),
          loadStudentStats()
        ]);
      } else if (role === 'instructor') {
        await loadInstructorStats();
      } else if (role === 'admin') {
        await loadAdminStats();
      }
      setLoading(false);
    };
    loadData();
  }, [role]);

  if (loading) {
    return (
      <div className="home-loading">
        <div className="spinner"></div>
        <p>Loading your UniManage dashboard...</p>
      </div>
    );
  }

  return (
    <div className="home-dashboard-layout">
      {/* Professional Navigation Bar */}
      <nav className="dashboard-navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <div className="brand-icon-wrapper" style={{ background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.accent})` }}>
              <GraduationCap size={24} />
            </div>
            <span className="brand-text">AMTU</span>
            <span className="brand-badge" style={{ background: `${brandColors.primary}15`, color: brandColors.primary }}>
              {role.toUpperCase()}
            </span>
          </div>
          
          <div className="nav-links">
            <Link to="/dashboard" className="nav-link active">
              <Home size={18} />
              <span>Home</span>
            </Link>
            <Link to={getMainDashboardPath()} className="nav-link">
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
          </div>

          <div className="nav-user">
            <div className="user-info">
              <span className="user-greeting">{greeting},</span>
              <span className="user-name">{getDisplayName()}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>

          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-menu">
            <Link to="/dashboard" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <Home size={18} /> Home
            </Link>
            <Link to={getMainDashboardPath()} className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <LayoutDashboard size={18} /> Dashboard
            </Link>
            <button className="mobile-logout-btn" onClick={handleLogout}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="dashboard-main-content">
        <div className="home-dashboard">
          
          {/* Welcome Hero Section with Gradient */}
          <div className="welcome-section" style={{ background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%)` }}>
            <div className="welcome-content">
              <h1>{greeting}, {getDisplayName()}!</h1>
              <p>Welcome to your {role} portal. Track your academic journey and stay updated.</p>
            </div>
            <div className="date-badge">
              <Calendar size={18} />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          {/* Stats Grid - Role based */}
          <div className="stats-grid-home">
            {role === 'student' && (
              <>
                <StatCard icon={BookOpen} title="Enrolled Courses" value={stats.enrolledCourses} color={brandColors.primary} />
                <StatCard icon={Award} title="CGPA" value={gradeSummary.cgpa} color={brandColors.success} />
                {/* <StatCard icon={TrendingUp} title="Attendance" value={`${stats.attendance}%`} color={brandColors.warning} /> */}
                <StatCard icon={DollarSign} title="Pending Fees" value={`$${stats.pendingFees.toLocaleString()}`} color={brandColors.danger} />
                <StatCard icon={Library} title="Borrowed Books" value={stats.borrowedBooks} color={brandColors.accent} />
              </>
            )}
            {role === 'instructor' && (
              <>
                <StatCard icon={BookOpen} title="Teaching Courses" value={stats.enrolledCourses} color={brandColors.primary} />
                <StatCard icon={Users} title="Total Students" value={0} color={brandColors.success} />
                {/* <StatCard icon={TrendingUp} title="Avg Attendance" value="94%" color={brandColors.warning} /> */}
                <StatCard icon={Award} title="Departments" value={1} color={brandColors.accent} />
              </>
            )}
            {role === 'admin' && (
              <>
                <StatCard icon={Users} title="Total Students" value={stats.enrolledCourses} color={brandColors.primary} />
                <StatCard icon={BookOpen} title="Active Courses" value={stats.completedCourses} color={brandColors.success} />
                {/* <StatCard icon={GraduationCap} title="Instructors" value={stats.attendance} color={brandColors.warning} /> */}
                <StatCard icon={DollarSign} title="Sections" value={stats.pendingFees} color={brandColors.accent} />
              </>
            )}
          </div>

          {/* Bento Grid Layout */}
          <div className="home-content-grid">
            
            {/* Quick Actions */}
            <div className="quick-actions-card">
              <h3>Quick Actions</h3>
              <div className="quick-actions-list">
                <Link to={getMainDashboardPath()} className="quick-action-item">
                  <LayoutDashboard size={20} />
                  <span>Go to Full Dashboard</span>
                  <ChevronRight size={16} />
                </Link>
                <Link to="/library" className="quick-action-item">
                  <Library size={20} />
                  <span>Browse Library</span>
                  <ChevronRight size={16} />
                </Link>
                {role === 'student' && (
                  <Link to="/student/grades" className="quick-action-item">
                    <FileText size={20} />
                    <span>Check Grades</span>
                    <ChevronRight size={16} />
                  </Link>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="notifications-card">
              <h3>Notifications</h3>
              <div className="notifications-list">
                {notifications.length === 0 ? (
                  <div className="no-notifications">
                    <Bell size={32} />
                    <p>No new notifications</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className={`notification-item ${notif.type}`}>
                      <div className="notification-icon">
                        {notif.type === 'warning' && <AlertCircle size={16} />}
                        {notif.type === 'danger' && <AlertCircle size={16} />}
                        {notif.type === 'info' && <Bell size={16} />}
                        {notif.type === 'success' && <CheckCircle size={16} />}
                      </div>
                      <div className="notification-content">
                        <p>{notif.message}</p>
                        <span>{notif.date}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="upcoming-events-card">
              <h3>Upcoming Events</h3>
              <div className="events-list">
                {stats.upcomingEvents.map((event, idx) => (
                  <div key={idx} className="event-item">
                    <div className="event-date">
                      <span className="event-day">{new Date(event.date).getDate()}</span>
                      <span className="event-month">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div className="event-info">
                      <strong>{event.title}</strong>
                      <span>{event.type}</span>
                    </div>
                    <ChevronRight size={16} className="event-arrow" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Motivational Quote */}
          <div className="quote-card">
            <Sparkles size={24} style={{ color: brandColors.primary, marginBottom: '12px' }} />
            <p>"The beautiful thing about learning is that no one can take it away from you."</p>
            <span>- B.B. King</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-brand-icon" style={{ background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.accent})` }}>
              <GraduationCap size={24} />
            </div>
            <span>AMTU</span>
            <p>Empowering education through innovative technology solutions.</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Quick Links</h4>
              <Link to="/dashboard">Home</Link>
              <Link to={getMainDashboardPath()}>Dashboard</Link>
              <Link to="/library">Library</Link>
            </div>
            <div className="footer-column">
              <h4>Support</h4>
              <a href="#">Help Center</a>
              <a href="#">Contact Us</a>
              <a href="#">FAQs</a>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 AMT University. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, title, value, color }) {
  return (
    <motion.div 
      className="stat-card-home"
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="stat-icon" style={{ backgroundColor: `${color}15`, color: color }}>
        <Icon size={24} />
      </div>
      <div className="stat-info">
        <h4>{title}</h4>
        <p>{value}</p>
      </div>
    </motion.div>
  );
}

export default HomeDashboard;