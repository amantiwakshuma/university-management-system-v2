import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  BookOpen,
  User,
  Calendar,
  Search,
  RefreshCw,
  DollarSign,
} from "lucide-react";

function LibraryManagement() {
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [availableBooks, setAvailableBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [showBorrowForm, setShowBorrowForm] = useState(false);

  const token = localStorage.getItem("token");
  const api = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: { Authorization: `Bearer ${token}` },
  });

  const loadBorrowedBooks = async () => {
    try {
      const res = await api.get("/library/admin/borrowed");
      setBorrowedBooks(res.data);
    } catch (error) {
      console.error("Error loading borrowed books:", error);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await api.get("/library/admin/students");
      setStudents(res.data);
    } catch (error) {
      console.error("Error loading students:", error);
    }
  };

  const loadAvailableBooks = async () => {
    try {
      const res = await api.get("/library/admin/available-books");
      setAvailableBooks(res.data);
    } catch (error) {
      console.error("Error loading available books:", error);
    }
  };

  const handleBorrowBook = async (e) => {
    e.preventDefault();

    if (!selectedStudent || !selectedBook) {
      toast.error("Please select both student and book");
      return;
    }

    try {
      await api.post("/library/admin/borrow", {
        student_id: selectedStudent,
        book_id: selectedBook,
        due_date: dueDate || null,
      });
      toast.success("Book borrowed successfully");
      setShowBorrowForm(false);
      setSelectedStudent("");
      setSelectedBook("");
      setDueDate("");
      await Promise.all([loadBorrowedBooks(), loadAvailableBooks()]);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to borrow book");
    }
  };

const handleReturnBook = async (borrowId) => {
    if (confirm('Return this book?')) {
        try {
            await api.put(`/library/admin/return/${borrowId}`, {}); // Empty body is fine now
            toast.success('Book returned successfully');
            await Promise.all([loadBorrowedBooks(), loadAvailableBooks()]);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to return book');
        }
    }
};

  const handleUpdateOverdue = async () => {
    try {
      const res = await api.put("/library/admin/update-overdue");
      toast.success(`${res.data.updated_count} books marked as overdue`);
      await loadBorrowedBooks();
    } catch (error) {
      toast.error("Failed to update overdue status");
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        loadBorrowedBooks(),
        loadStudents(),
        loadAvailableBooks(),
      ]);
      setLoading(false);
    };
    loadAll();
  }, []);

  const filteredBooks = borrowedBooks.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.roll_number?.includes(searchTerm),
  );

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        Loading library data...
      </div>
    );

  return (
    <div className="library-management">
      <div className="tab-header">
        <div className="tab-header-titles">
          <h2 className="tab-header-title">📚 Library Management</h2>
          <p className="tab-header-subtitle">
            Manage book borrowing and returns
          </p>
        </div>
        <div className="tab-header-actions">
          <button className="btn btn-secondary" onClick={handleUpdateOverdue}>
            <RefreshCw size={16} /> Update Overdue
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowBorrowForm(!showBorrowForm)}
          >
            <BookOpen size={16} /> {showBorrowForm ? "Cancel" : "Borrow Book"}
          </button>
        </div>
      </div>

      {/* Borrow Form */}
      {showBorrowForm && (
        <div
          className="admin-card"
          style={{ marginBottom: "20px", padding: "20px" }}
        >
          <h3>Record New Borrowing</h3>
          <form onSubmit={handleBorrowBook}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "15px",
              }}
            >
              <div className="form-field">
                <label className="form-label">Student</label>
                <select
                  className="admin-input"
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  required
                >
                  <option value="">Select Student</option>
                  {students.map((s) => (
                    <option key={s.student_id} value={s.student_id}>
                      {s.roll_number} - {s.first_name} {s.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Book</label>
                <select
                  className="admin-input"
                  value={selectedBook}
                  onChange={(e) => setSelectedBook(e.target.value)}
                  required
                >
                  <option value="">Select Book</option>
                  {availableBooks.map((b) => (
                    <option key={b.book_id} value={b.book_id}>
                      {b.title} by {b.author} ({b.available_copies} available)
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Due Date (Optional)</label>
                <input
                  type="date"
                  className="admin-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="form-actions" style={{ marginTop: "15px" }}>
              <button type="submit" className="btn btn-primary">
                Borrow Book
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="search-bar" style={{ marginBottom: "20px" }}>
        <div className="search-input-wrapper">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by student name, roll number, or book title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Borrowed Books Table */}
      <div className="admin-card">
        <div className="card-header colored-header">
          <h2 className="card-title">Currently Borrowed Books</h2>
          <BookOpen size={20} />
        </div>
        <div className="admin-table-container">
          {filteredBooks.length === 0 ? (
            <div className="large-empty-pane">
              <BookOpen size={48} />
              <p>No books currently borrowed.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Book Title</th>
                  <th>Author</th>
                  <th>Borrowed Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Fine</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map((book) => (
                  <tr key={book.borrow_id}>
                    <td>
                      <strong>
                        {book.first_name} {book.last_name}
                      </strong>
                      <br />
                      <span className="text-muted">
                        Roll: {book.roll_number}
                      </span>
                    </td>
                    <td>
                      <strong>{book.title}</strong>
                    </td>
                    <td>{book.author}</td>
                    <td>{new Date(book.borrow_date).toLocaleDateString()}</td>
                    <td
                      className={
                        new Date(book.due_date) < new Date()
                          ? "text-danger"
                          : ""
                      }
                    >
                      {new Date(book.due_date).toLocaleDateString()}
                    </td>
                    <td>
                      <span
                        className={`badge ${book.status === "Overdue" ? "badge-danger" : "badge-warning"}`}
                      >
                        {book.status}
                      </span>
                    </td>
                    <td>
                      {book.fine_amount > 0 ? (
                        <span className="text-danger">${book.fine_amount}</span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleReturnBook(book.borrow_id)}
                      >
                        Return
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default LibraryManagement;
