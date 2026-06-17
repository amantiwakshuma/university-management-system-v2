import { useEffect, useState } from "react";
import axios from "axios";
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa';

import {
  Search,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X,
  GraduationCap,
  Menu,
  Home,
  Library as LibraryIcon,
  Info,
  Mail,
  Phone,
  MapPin,
  Globe,
  Award,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import "./Library.css";

function Library() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 12,
      });
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory) params.append("category", selectedCategory);

      const res = await axios.get(`/api/library/books?${params}`);
      setBooks(res.data.books);
      setPagination((prev) => ({
        ...prev,
        totalPages: res.data.pagination.totalPages,
        total: res.data.pagination.total,
      }));
    } catch (error) {
      console.error("Error loading books:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await axios.get("/api/library/categories");
      setCategories(res.data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const viewBookDetails = async (bookId) => {
    try {
      const res = await axios.get(`/api/library/books/${bookId}`);
      setSelectedBook(res.data);
      setShowModal(true);
    } catch (error) {
      console.error("Error loading book details:", error);
    }
  };

  useEffect(() => {
    loadBooks();
    loadCategories();
  }, [pagination.page, selectedCategory, searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadBooks();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Smooth scroll helper
  const scrollToSection = (sectionId) => {
    const section = document.querySelector(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="library-container">
      {/* Beautiful Navigation Bar */}
      <nav className="library-navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <div className="logo-icon-wrapper">
              <GraduationCap size={24} />
            </div>
            <span className="logo-text">
              AM<span className="logo-highlight">TU</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="nav-links">
            <Link to="/" className="nav-link">
              <Home size={16} /> Home
            </Link>
            <Link to="/#courses" className="nav-link">
              <BookOpen size={16} /> Courses
            </Link>
            <Link to="/library" className="nav-link active">
              <LibraryIcon size={16} /> Library
            </Link>
            <Link to="/#about" className="nav-link">
              <Info size={16} /> About
            </Link>
            <Link to="/#contact" className="nav-link">
              <Mail size={16} /> Contact
            </Link>
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
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <div className={`mobile-nav-menu ${isMobileMenuOpen ? "open" : ""}`}>
          <div className="mobile-menu-content">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
              Home
            </Link>
            <Link to="/#courses" onClick={() => setIsMobileMenuOpen(false)}>
              Courses
            </Link>
            <Link to="/library" onClick={() => setIsMobileMenuOpen(false)}>
              Library
            </Link>
            <Link to="/#about" onClick={() => setIsMobileMenuOpen(false)}>
              About
            </Link>
            <Link to="/#contact" onClick={() => setIsMobileMenuOpen(false)}>
              Contact
            </Link>
            <div className="mobile-auth-buttons">
              <Link to="/login" className="mobile-login">
                Login
              </Link>
              <Link to="/register" className="mobile-register">
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Header Section */}
      <div className="library-hero">
        <div className="hero-content">
          <span className="hero-badge">
            <Sparkles size={14} /> Digital Knowledge Hub
          </span>
          <h1>University Library</h1>
          <p>
            Browse our extensive collection of books, journals, and academic
            resources
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-number">{pagination.total}+</span>
              <span className="stat-label">Books Available</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">{categories.length}</span>
              <span className="stat-label">Categories</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="library-search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by title, author, or ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="clear-search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button type="submit" className="search-btn">
            Search
          </button>
        </form>

        <div className="category-filters">
          <button
            className={`category-chip ${!selectedCategory ? "active" : ""}`}
            onClick={clearFilters}
          >
            All Books ({pagination.total})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.category}
              className={`category-chip ${selectedCategory === cat.category ? "active" : ""}`}
              onClick={() => {
                setSelectedCategory(cat.category);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              {cat.category} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="library-loading">
          <div className="spinner"></div>
          <p>Loading books...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="no-books">
          <BookOpen size={64} />
          <h3>No books found</h3>
          <p>Try adjusting your search or filter criteria</p>
          <button onClick={clearFilters} className="clear-btn">
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="books-grid">
            {books.map((book) => (
              <div
                key={book.book_id}
                className="book-card"
                onClick={() => viewBookDetails(book.book_id)}
              >
                <div className="book-cover">
                  {book.cover_image ? (
                    <img src={book.cover_image} alt={book.title} />
                  ) : (
                    <div className="book-cover-placeholder">
                      <BookOpen size={48} />
                    </div>
                  )}
                  <div className="book-availability">
                    {book.available_copies > 0 ? (
                      <span className="available">Available</span>
                    ) : (
                      <span className="unavailable">Borrowed</span>
                    )}
                  </div>
                </div>
                <div className="book-info">
                  <h3>{book.title}</h3>
                  <p className="book-author">{book.author}</p>
                  <div className="book-meta">
                    <span className="book-category">
                      {book.category || "General"}
                    </span>
                    <span className="book-copies">
                      {book.available_copies}/{book.total_copies} copies
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={pagination.page === 1}
                className="page-btn"
              >
                <ChevronLeft size={18} /> Previous
              </button>
              <span className="page-info">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.page === pagination.totalPages}
                className="page-btn"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Book Details Modal - Keep as is */}
      {showModal && selectedBook && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>
              <X size={24} />
            </button>
            <div className="modal-body">
              <div className="modal-cover">
                {selectedBook.cover_image ? (
                  <img
                    src={selectedBook.cover_image}
                    alt={selectedBook.title}
                  />
                ) : (
                  <div className="modal-cover-placeholder">
                    <BookOpen size={64} />
                  </div>
                )}
              </div>
              <div className="modal-details">
                <h2>{selectedBook.title}</h2>
                <p className="modal-author">by {selectedBook.author}</p>
                <div className="modal-meta">
                  <span className="meta-item">
                    <strong>ISBN:</strong> {selectedBook.isbn || "N/A"}
                  </span>
                  <span className="meta-item">
                    <strong>Publisher:</strong>{" "}
                    {selectedBook.publisher || "N/A"}
                  </span>
                  <span className="meta-item">
                    <strong>Year:</strong>{" "}
                    {selectedBook.publication_year || "N/A"}
                  </span>
                  <span className="meta-item">
                    <strong>Edition:</strong> {selectedBook.edition || "1st"}
                  </span>
                  <span className="meta-item">
                    <strong>Category:</strong>{" "}
                    {selectedBook.category || "General"}
                  </span>
                  <span className="meta-item">
                    <strong>Shelf:</strong>{" "}
                    {selectedBook.shelf_location || "N/A"}
                  </span>
                </div>
                <div className="modal-description">
                  <strong>Description:</strong>
                  <p>
                    {selectedBook.description || "No description available."}
                  </p>
                </div>
                <div className="modal-availability">
                  <span
                    className={`availability-badge ${selectedBook.available_copies > 0 ? "available" : "unavailable"}`}
                  >
                    {selectedBook.available_copies > 0
                      ? "Available"
                      : "Currently Borrowed"}
                  </span>
                  <span className="copy-count">
                    {selectedBook.available_copies} of{" "}
                    {selectedBook.total_copies} copies available
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Beautiful Footer */}
      <footer className="library-footer">
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
                Empowering academic administrators, outstanding professors, and
                student networks around the globe with safe and intuitive system
                tools.
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
                    <Link to="/#courses">Courses</Link>
                  </li>
                  <li>
                    <Link to="/library">Library</Link>
                  </li>
                  <li>
                    <Link to="/#about">About</Link>
                  </li>
                  <li>
                    <Link to="/#contact">Contact</Link>
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
              <span>info@amtu.edu</span>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-bottom-left">
              <p>
                &copy; 2026 AMT University. All rights
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

export default Library;
