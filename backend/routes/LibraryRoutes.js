const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/AuthMiddleware');
const db = require('../database/db');

// =============================================
// PUBLIC LIBRARY ENDPOINTS (No auth required)
// =============================================

// Get all books with pagination and search
router.get('/books', async (req, res) => {
    const { search, category, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;
    
    try {
        let query = `
            SELECT b.*, 
                   (SELECT COUNT(*) FROM Borrow WHERE book_id = b.book_id AND status = 'Borrowed') as borrowed_count
            FROM LibraryBook b
            WHERE 1=1
        `;
        const params = [];
        
        if (search) {
            query += ` AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)`;
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }
        
        if (category) {
            query += ` AND b.category = ?`;
            params.push(category);
        }
        
        // Get total count
        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM LibraryBook b WHERE 1=1 ${search ? 'AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)' : ''} ${category ? 'AND category = ?' : ''}`,
            params
        );
        const total = countResult[0].total;
        
        query += ` ORDER BY b.title LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));
        
        const [books] = await db.query(query, params);
        
        res.json({
            books,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get book by ID
router.get('/books/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const [books] = await db.query(`
            SELECT b.*, 
                   (SELECT COUNT(*) FROM Borrow WHERE book_id = b.book_id AND status = 'Borrowed') as borrowed_count
            FROM LibraryBook b
            WHERE b.book_id = ?
        `, [id]);
        
        if (books.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        res.json(books[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get all categories
router.get('/categories', async (req, res) => {
    try {
        const [categories] = await db.query(`
            SELECT DISTINCT category, COUNT(*) as count 
            FROM LibraryBook 
            WHERE category IS NOT NULL 
            GROUP BY category 
            ORDER BY category
        `);
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// AUTHENTICATED LIBRARY ENDPOINTS (Student only)
// =============================================

// Get student's borrowed books
router.get('/my-borrowed', verifyToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const studentId = req.user.studentId;
    
    try {
        const [borrowed] = await db.query(`
            SELECT 
                b.borrow_id,
                b.borrow_date,
                b.due_date,
                b.return_date,
                b.status,
                b.fine_amount,
                bk.book_id,
                bk.title,
                bk.author,
                bk.isbn,
                bk.cover_image,
                DATEDIFF(CURDATE(), b.due_date) as days_overdue
            FROM Borrow b
            JOIN LibraryBook bk ON b.book_id = bk.book_id
            WHERE b.student_id = ? AND b.status != 'Returned'
            ORDER BY b.due_date ASC
        `, [studentId]);
        
        const [history] = await db.query(`
            SELECT 
                b.borrow_id,
                b.borrow_date,
                b.due_date,
                b.return_date,
                b.status,
                b.fine_amount,
                bk.title,
                bk.author,
                bk.cover_image
            FROM Borrow b
            JOIN LibraryBook bk ON b.book_id = bk.book_id
            WHERE b.student_id = ? AND b.status = 'Returned'
            ORDER BY b.return_date DESC
            LIMIT 10
        `, [studentId]);
        
        res.json({ borrowed, history });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// ADMIN/LIBRARIAN ENDPOINTS
// =============================================

// Get all currently borrowed books (Admin view)
router.get('/admin/borrowed', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        const [borrowed] = await db.query(`
            SELECT 
                b.borrow_id,
                b.borrow_date,
                b.due_date,
                b.status,
                b.fine_amount,
                b.fine_paid,
                s.student_id,
                s.first_name,
                s.last_name,
                s.email,
                bk.book_id,
                bk.title,
                bk.author,
                bk.isbn
            FROM Borrow b
            JOIN Student s ON b.student_id = s.student_id
            JOIN LibraryBook bk ON b.book_id = bk.book_id
            WHERE b.status != 'Returned'
            ORDER BY b.due_date ASC
        `);
        
        res.json(borrowed);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get borrowing history (Admin view)
router.get('/admin/history', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { search, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    try {
        let query = `
            SELECT 
                b.borrow_id,
                b.borrow_date,
                b.due_date,
                b.return_date,
                b.status,
                b.fine_amount,
                b.fine_paid,
                s.student_id,
                s.first_name,
                s.last_name,
                s.roll_number,
                bk.book_id,
                bk.title,
                bk.author
            FROM Borrow b
            JOIN Student s ON b.student_id = s.student_id
            JOIN LibraryBook bk ON b.book_id = bk.book_id
            WHERE 1=1
        `;
        const params = [];
        
        if (search) {
            query += ` AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.roll_number LIKE ? OR bk.title LIKE ?)`;
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam, searchParam);
        }
        
        if (status && status !== 'all') {
            query += ` AND b.status = ?`;
            params.push(status);
        }
        
        // Get total count
        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM Borrow b WHERE 1=1 ${search ? 'AND (student_id IN (SELECT student_id FROM Student WHERE first_name LIKE ? OR last_name LIKE ? OR roll_number LIKE ?) OR book_id IN (SELECT book_id FROM LibraryBook WHERE title LIKE ?))' : ''}`,
            search ? [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`] : []
        );
        const total = countResult[0].total;
        
        query += ` ORDER BY b.borrow_date DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));
        
        const [borrowed] = await db.query(query, params);
        
        res.json({
            borrows: borrowed,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get all students for dropdown (Admin)
router.get('/admin/students', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        const [students] = await db.query(`
            SELECT student_id, first_name, last_name, email
            FROM Student
            ORDER BY student_id
        `);
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all available books for borrowing (Admin)
router.get('/admin/available-books', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        const [books] = await db.query(`
            SELECT book_id, title, author, isbn, available_copies, total_copies
            FROM LibraryBook
            WHERE available_copies > 0
            ORDER BY title
        `);
        res.json(books);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ADMIN: Borrow a book (record borrowing)
router.post('/admin/borrow', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { student_id, book_id, due_date } = req.body || {};
    
    if (!student_id || !book_id) {
        return res.status(400).json({ error: 'Student ID and Book ID are required' });
    }
    
    try {
        // Check if book exists and has available copies
        const [book] = await db.query(
            'SELECT available_copies, title FROM LibraryBook WHERE book_id = ?',
            [book_id]
        );
        
        if (book.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        if (book[0].available_copies < 1) {
            return res.status(400).json({ error: 'No copies available' });
        }
        
        // Check if student already has this book borrowed
        const [existing] = await db.query(
            'SELECT borrow_id FROM Borrow WHERE student_id = ? AND book_id = ? AND status = "Borrowed"',
            [student_id, book_id]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Student already has this book borrowed' });
        }
        
        // Check if student has overdue books
        const [overdue] = await db.query(
            'SELECT COUNT(*) as count FROM Borrow WHERE student_id = ? AND status = "Overdue"',
            [student_id]
        );
        
        if (overdue[0].count > 0) {
            return res.status(400).json({ error: 'Student has overdue books. Please return them first.' });
        }
        
        // Calculate due date (default 14 days from now if not provided)
        let finalDueDate = due_date;
        if (!finalDueDate) {
            const date = new Date();
            date.setDate(date.getDate() + 14);
            finalDueDate = date.toISOString().split('T')[0];
        }
        
        // Create borrow record
        await db.query(
            `INSERT INTO Borrow (student_id, book_id, borrow_date, due_date, status) 
             VALUES (?, ?, CURDATE(), ?, 'Borrowed')`,
            [student_id, book_id, finalDueDate]
        );
        
        // Update available copies
        await db.query(
            'UPDATE LibraryBook SET available_copies = available_copies - 1 WHERE book_id = ?',
            [book_id]
        );
        
        res.status(201).json({ 
            success: true, 
            message: `Book "${book[0].title}" borrowed successfully`,
            due_date: finalDueDate
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// ADMIN: Return a book
// ADMIN: Return a book
router.put('/admin/return/:borrow_id', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { borrow_id } = req.params;
    // Provide default values if body is empty
    const { fine_amount, fine_paid } = req.body || {};
    
    try {
        // Get borrow record
        const [borrow] = await db.query(
            'SELECT book_id, due_date, status FROM Borrow WHERE borrow_id = ?',
            [borrow_id]
        );
        
        if (borrow.length === 0) {
            return res.status(404).json({ error: 'Borrow record not found' });
        }
        
        if (borrow[0].status === 'Returned') {
            return res.status(400).json({ error: 'Book already returned' });
        }
        
        // Calculate fine if overdue and not manually set
        let finalFine = fine_amount || 0;
        if (!fine_amount && fine_amount !== 0) {
            const dueDate = new Date(borrow[0].due_date);
            const today = new Date();
            if (today > dueDate) {
                const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
                finalFine = daysOverdue * 5; // $5 per day
            }
        }
        
        // Update borrow record
        await db.query(
            `UPDATE Borrow 
             SET return_date = CURDATE(), 
                 status = 'Returned', 
                 fine_amount = ?,
                 fine_paid = ?
             WHERE borrow_id = ?`,
            [finalFine, fine_paid === true ? 1 : 0, borrow_id]
        );
        
        // Update available copies
        await db.query(
            'UPDATE LibraryBook SET available_copies = available_copies + 1 WHERE book_id = ?',
            [borrow[0].book_id]
        );
        
        res.json({ 
            success: true, 
            message: 'Book returned successfully',
            fine_amount: finalFine
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});



// ADMIN: Update overdue statuses (can run as cron job)
router.put('/admin/update-overdue', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        const [result] = await db.query(`
            UPDATE Borrow 
            SET status = 'Overdue' 
            WHERE due_date < CURDATE() 
            AND status = 'Borrowed'
        `);
        
        res.json({ 
            message: 'Overdue statuses updated',
            updated_count: result.affectedRows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;