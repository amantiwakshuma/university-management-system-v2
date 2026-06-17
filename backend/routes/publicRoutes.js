const express = require('express')
// const router = express.Router()
// const verifyToken = require('../middlewares/AuthMiddleware')
const db = require('../database/db')


// Public Routes (no authentication required)
const publicRoutes = express.Router();

// Get total students count
publicRoutes.get('/stats/students', async (req, res) => {
    try {
        const [result] = await db.query('SELECT COUNT(*) as count FROM Student');
        res.json({ count: result[0].count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get total instructors count
publicRoutes.get('/stats/instructors', async (req, res) => {
    try {
        const [result] = await db.query('SELECT COUNT(*) as count FROM Instructor');
        res.json({ count: result[0].count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get total courses count
publicRoutes.get('/stats/courses', async (req, res) => {
    try {
        const [result] = await db.query('SELECT COUNT(*) as count FROM Course');
        res.json({ count: result[0].count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get total departments count
publicRoutes.get('/stats/departments', async (req, res) => {
    try {
        const [result] = await db.query('SELECT COUNT(*) as count FROM DEPARTMENTS');
        res.json({ count: result[0].count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all departments
publicRoutes.get('/departments', async (req, res) => {
    try {
        const [departments] = await db.query('SELECT * FROM DEPARTMENTS ORDER BY DEPARTMENT_NAME');
        res.json(departments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all courses
publicRoutes.get('/courses', async (req, res) => {
    try {
        const [courses] = await db.query(`
            SELECT c.*, d.DEPARTMENT_NAME 
            FROM Course c
            JOIN DEPARTMENTS d ON c.DEPARTMENT_ID = d.DEPARTMENT_ID
            ORDER BY d.DEPARTMENT_NAME, c.COURSE_CODE
        `);
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = publicRoutes;