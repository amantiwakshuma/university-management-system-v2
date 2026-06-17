const express = require('express')
const router = express.Router()
// const bcrypt = require('bcrypt')
const {sign} = require('jsonwebtoken')
const verifyToken = require('../middlewares/AuthMiddleware');


const db = require('../database/db')




// LOGIN endpoint
// LOGIN endpoint (CORRECT VERSION)
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // Find user
        const [users] = await db.query(
            'SELECT * FROM user WHERE username = ?',
            [username]
        );
        
        const user = users[0];
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        if (password !== user.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Get studentId or instructorId based on role
        let studentId = null;
        let instructorId = null;
        
        if (user.role === 'student') {
            const [students] = await db.query(
                'SELECT student_id FROM Student WHERE user_id = ?',
                [user.user_id]
            );
            studentId = students[0]?.student_id;
            console.log('Student login - studentId:', studentId);
        } 
        else if (user.role === 'instructor') {
            const [instructors] = await db.query(
                'SELECT instructor_id FROM Instructor WHERE user_id = ?',
                [user.user_id]
            );
            instructorId = instructors[0]?.instructor_id;
            console.log('Instructor login - instructorId:', instructorId);
        }
        
        // Create token with ALL needed fields
        const token = sign(
            { 
                userId: user.user_id, 
                role: user.role,
                studentId: studentId,
                instructorId: instructorId
            },
            'your_secret_key',
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            token,
            user: {
                id: user.user_id,
                username: user.username,
                role: user.role,
                studentId: studentId,
                instructorId: instructorId
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/logout', verifyToken, async (req, res) => {
  // Token blacklisting would go here if implemented
  res.json({ message: 'Logged out successfully' });
});





// =============================================
// REGISTRATION ENDPOINTS
// =============================================

// Register as Student
// Register as Student
// Register as Student (without address)
// =============================================
// REGISTRATION ENDPOINTS (FIXED - No email in user table)
// =============================================

// Register as Student
// =============================================
// REGISTRATION ENDPOINTS (FIXED - No enrollment_year)
// =============================================

// Register as Student
router.post('/register/student', async (req, res) => {
    const { 
        first_name, last_name, email, phone, 
        date_of_birth, department_id,
        username, password 
    } = req.body;
    
    try {
        // Check if username already exists in user table
        const [existingUser] = await db.query(
            'SELECT user_id FROM user WHERE username = ?',
            [username]
        );
        
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        // Check if email already exists in student table
        const [existingEmail] = await db.query(
            'SELECT student_id FROM Student WHERE email = ?',
            [email]
        );
        
        if (existingEmail.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Create user account
        const [userResult] = await db.query(
            'INSERT INTO user (username, password, role) VALUES (?, ?, ?)',
            [username, password, 'student']
        );
        
        // Create student profile (without enrollment_year)
        await db.query(
            `INSERT INTO Student (user_id, first_name, last_name, email, phone, date_of_birth, department_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userResult.insertId, first_name, last_name, email, phone, date_of_birth, department_id]
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'Student registration successful! Please login.',
            userId: userResult.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Register as Instructor
router.post('/register/instructor', async (req, res) => {
    const { 
        first_name, last_name, email, phone, 
        department_id, designation, username, password 
    } = req.body;
    
    try {
        // Check if username already exists in user table
        const [existingUser] = await db.query(
            'SELECT user_id FROM user WHERE username = ?',
            [username]
        );
        
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        // Check if email already exists in instructor table
        const [existingEmail] = await db.query(
            'SELECT instructor_id FROM Instructor WHERE email = ?',
            [email]
        );
        
        if (existingEmail.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Create user account
        const [userResult] = await db.query(
            'INSERT INTO user (username, password, role) VALUES (?, ?, ?)',
            [username, password, 'instructor']
        );
        
        // Create instructor profile (without hire_date if not exists)
        await db.query(
            `INSERT INTO Instructor (user_id, first_name, last_name, email, phone, department_id, designation) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userResult.insertId, first_name, last_name, email, phone, department_id, designation]
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'Instructor registration successful! Please login.',
            userId: userResult.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get departments for registration dropdown
router.get('/departments', async (req, res) => {
    try {
        const [departments] = await db.query(
            'SELECT department_id, department_name FROM DEPARTMENTS ORDER BY department_name'
        );
        res.json(departments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports = router