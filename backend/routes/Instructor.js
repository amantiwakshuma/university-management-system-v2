const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/AuthMiddleware');
const db = require('../database/db');

// =============================================
// INSTRUCTOR ENDPOINTS (FIXED)
// =============================================

// Get instructor's departments (where they teach courses)
router.get('/my-departments', verifyToken, async (req, res) => {
    if (req.user.role !== 'instructor') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const instructorId = req.user.instructorId;
    
    try {
        const [departments] = await db.query(`
            SELECT DISTINCT d.DEPARTMENT_ID, d.DEPARTMENT_NAME
            FROM DEPARTMENTS d
            JOIN Course c ON c.DEPARTMENT_ID = d.DEPARTMENT_ID
            JOIN Section s ON s.COURSE_ID = c.COURSE_ID
            WHERE s.INSTRUCTOR_ID = ?
            ORDER BY d.DEPARTMENT_NAME
        `, [instructorId]);
        
        res.json(departments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get sections for a specific department (grouped by section_name)
router.get('/department/:deptId/sections', verifyToken, async (req, res) => {
    if (req.user.role !== 'instructor') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const instructorId = req.user.instructorId;
    const { deptId } = req.params;
    
    try {
        const [sections] = await db.query(`
            SELECT 
                s.SECTION_NAME,
                GROUP_CONCAT(DISTINCT c.COURSE_CODE ORDER BY c.COURSE_CODE SEPARATOR ', ') as courses,
                COUNT(DISTINCT s.SECTION_ID) as course_count,
                COUNT(DISTINCT stu.STUDENT_ID) as student_count
            FROM Section s
            JOIN Course c ON s.COURSE_ID = c.COURSE_ID
            LEFT JOIN Student stu ON stu.SECTION_NAME = s.SECTION_NAME
            WHERE c.DEPARTMENT_ID = ? AND s.INSTRUCTOR_ID = ?
            GROUP BY s.SECTION_NAME
            ORDER BY s.SECTION_NAME
        `, [deptId, instructorId]);
        
        res.json(sections);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get ALL students in a section (by section_name) - FIXED
router.get('/section/:sectionName/students', verifyToken, async (req, res) => {
    if (req.user.role !== 'instructor') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const instructorId = req.user.instructorId;
    const { sectionName } = req.params;
    
    try {
        // Get ALL students in this section_name
        const [students] = await db.query(`
            SELECT DISTINCT
                stu.STUDENT_ID,
                stu.FIRST_NAME,
                stu.LAST_NAME,
                stu.EMAIL,
                stu.SECTION_NAME
            FROM Student stu
            WHERE stu.SECTION_NAME = ?
        `, [sectionName]);
        
        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get ALL courses for a section (by section_name) that this instructor teaches
router.get('/section/:sectionName/courses', verifyToken, async (req, res) => {
    if (req.user.role !== 'instructor') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const instructorId = req.user.instructorId;
    const { sectionName } = req.params;
    
    try {
        const [courses] = await db.query(`
            SELECT 
                s.SECTION_ID,
                c.COURSE_ID,
                c.COURSE_CODE,
                c.COURSE_NAME,
                c.CREDIT_HOURS,
                s.SCHEDULE
            FROM Section s
            JOIN Course c ON s.COURSE_ID = c.COURSE_ID
            WHERE s.SECTION_NAME = ? AND s.INSTRUCTOR_ID = ?
            ORDER BY c.COURSE_CODE
        `, [sectionName, instructorId]);
        
        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get grades for a specific student in a specific section
router.get('/section/:sectionName/student/:studentId/grades', verifyToken, async (req, res) => {
    if (req.user.role !== 'instructor') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const instructorId = req.user.instructorId;
    const { sectionName, studentId } = req.params;
    
    try {
        const [grades] = await db.query(`
            SELECT 
                c.COURSE_ID,
                c.COURSE_CODE,
                c.COURSE_NAME,
                e.FINAL_GRADE,
                e.GRADE_POINTS,
                e.ENROLL_ID
            FROM Enrollment e
            JOIN Section s ON e.SECTION_ID = s.SECTION_ID
            JOIN Course c ON s.COURSE_ID = c.COURSE_ID
            WHERE e.STUDENT_ID = ? 
                AND s.SECTION_NAME = ?
                AND s.INSTRUCTOR_ID = ?
        `, [studentId, sectionName, instructorId]);
        
        res.json(grades);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Update student grade for a specific course
router.put('/grade/:studentId/:courseId', verifyToken, async (req, res) => {
    if (req.user.role !== 'instructor') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { studentId, courseId } = req.params;
    const { grade } = req.body;
    const instructorId = req.user.instructorId;
    
    // Calculate grade points
    const gradePoints = {
        'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0
    }[grade] || null;
    
    try {
        // Get the section for this course taught by this instructor
        const [section] = await db.query(`
            SELECT SECTION_ID FROM Section 
            WHERE COURSE_ID = ? AND INSTRUCTOR_ID = ?
            LIMIT 1
        `, [courseId, instructorId]);
        
        if (section.length === 0) {
            return res.status(404).json({ error: 'Course not found for this instructor' });
        }
        
        const sectionId = section[0].SECTION_ID;
        
        // Check if enrollment exists
        const [existing] = await db.query(
            `SELECT ENROLL_ID FROM Enrollment 
             WHERE STUDENT_ID = ? AND SECTION_ID = ?`,
            [studentId, sectionId]
        );
        
        if (existing.length > 0) {
            // Update existing grade
            await db.query(
                `UPDATE Enrollment 
                 SET FINAL_GRADE = ?, GRADE_POINTS = ? 
                 WHERE STUDENT_ID = ? AND SECTION_ID = ?`,
                [grade, gradePoints, studentId, sectionId]
            );
        } else {
            // Create new enrollment with grade
            await db.query(
                `INSERT INTO Enrollment (STUDENT_ID, SECTION_ID, FINAL_GRADE, GRADE_POINTS, SEMESTER, YEAR) 
                 VALUES (?, ?, ?, ?, 'Fall', YEAR(CURDATE()))`,
                [studentId, sectionId, grade, gradePoints]
            );
        }
        
        res.json({ success: true, message: 'Grade updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get a matrix of all students and all courses in a section (for grade entry)
router.get('/section/:sectionName/grade-matrix', verifyToken, async (req, res) => {
    if (req.user.role !== 'instructor') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const instructorId = req.user.instructorId;
    const { sectionName } = req.params;
    
    try {
        // Get all students in this section
        const [students] = await db.query(`
            SELECT DISTINCT
                stu.STUDENT_ID,
                stu.FIRST_NAME,
                stu.LAST_NAME,
                stu.SECTION_NAME
            FROM Student stu
            WHERE stu.SECTION_NAME = ?
        `, [sectionName]);
        
        // Get all courses taught by this instructor in this section
        const [courses] = await db.query(`
            SELECT 
                s.SECTION_ID,
                c.COURSE_ID,
                c.COURSE_CODE,
                c.COURSE_NAME,
                c.CREDIT_HOURS
            FROM Section s
            JOIN Course c ON s.COURSE_ID = c.COURSE_ID
            WHERE s.SECTION_NAME = ? AND s.INSTRUCTOR_ID = ?
            ORDER BY c.COURSE_CODE
        `, [sectionName, instructorId]);
        
        // Get existing grades
        const [grades] = await db.query(`
            SELECT 
                e.STUDENT_ID,
                s.COURSE_ID,
                e.FINAL_GRADE,
                e.GRADE_POINTS
            FROM Enrollment e
            JOIN Section s ON e.SECTION_ID = s.SECTION_ID
            WHERE s.SECTION_NAME = ? AND s.INSTRUCTOR_ID = ?
        `, [sectionName, instructorId]);
        
        // Build grade map
        const gradeMap = {};
        grades.forEach(g => {
            gradeMap[`${g.STUDENT_ID}_${g.COURSE_ID}`] = g.FINAL_GRADE;
        });
        
        res.json({
            students,
            courses,
            grades: gradeMap
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});





// =============================================
// INSTRUCTOR - COURSE REGISTRATION GRADING
// =============================================

// Get instructor's assigned courses for current/active semester
router.get('/my-teaching-courses', verifyToken, async (req, res) => {
    if (req.user.role !== 'instructor') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const instructorId = req.user.instructorId;
    
    try {
        // Get current active session
        const [session] = await db.query(
            'SELECT session_id, semester, year FROM AcademicSession WHERE is_active = TRUE LIMIT 1'
        );
        
        if (session.length === 0) {
            return res.json([]);
        }
        
        // Get courses assigned to this instructor in the current session
        const [courses] = await db.query(`
            SELECT 
                sc.session_course_id,
                sc.course_id,
                sc.section_name,
                sc.schedule,
                c.COURSE_CODE,
                c.COURSE_NAME,
                c.CREDIT_HOURS,
                COUNT(cr.registration_id) as enrolled_students
            FROM SessionCourse sc
            JOIN Course c ON sc.course_id = c.COURSE_ID
            LEFT JOIN CourseRegistration cr ON cr.session_course_id = sc.session_course_id 
                AND cr.session_id = sc.session_id
            WHERE sc.instructor_id = ? AND sc.session_id = ?
            GROUP BY sc.session_course_id
            ORDER BY c.COURSE_CODE
        `, [instructorId, session[0].session_id]);
        
        res.json({
            session: session[0],
            courses: courses
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get students registered for a specific course (session_course)
router.get('/course/:sessionCourseId/students', verifyToken, async (req, res) => {
    if (req.user.role !== 'instructor') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { sessionCourseId } = req.params;
    const instructorId = req.user.instructorId;
    
    try {
        // Verify this course belongs to the instructor
        const [verify] = await db.query(
            'SELECT instructor_id FROM SessionCourse WHERE session_course_id = ?',
            [sessionCourseId]
        );
        
        if (verify.length === 0 || verify[0].instructor_id !== instructorId) {
            return res.status(403).json({ error: 'Access denied to this course' });
        }
        
        // Get registered students with their current grades
        const [students] = await db.query(`
            SELECT 
      cr.registration_id,
      s.STUDENT_ID,
      s.FIRST_NAME,
      s.LAST_NAME,
      s.EMAIL,
      cr.grade,
      cr.grade_points,
      cr.status
    FROM CourseRegistration cr
    JOIN Student s ON cr.student_id = s.STUDENT_ID
    WHERE cr.session_course_id = ?
    -- DO NOT add: AND cr.status != 'Completed'
    ORDER BY s.STUDENT_ID
  `, [sessionCourseId]);
        
        // Get course info
        const [course] = await db.query(`
            SELECT c.COURSE_CODE, c.COURSE_NAME, c.CREDIT_HOURS, sc.section_name
            FROM SessionCourse sc
            JOIN Course c ON sc.course_id = c.COURSE_ID
            WHERE sc.session_course_id = ?
        `, [sessionCourseId]);
        
        res.json({
            course: course[0],
            students: students
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Update grade for a student in a course
router.put('/grade/:registrationId', verifyToken, async (req, res) => {
    if (req.user.role !== 'instructor') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { registrationId } = req.params;
    const { grade } = req.body;
    const instructorId = req.user.instructorId;
    
    // Calculate grade points
    const gradePoints = {
        'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0
    }[grade] || null;
    
    try {
        // Verify this registration belongs to a course taught by this instructor
        const [verify] = await db.query(`
            SELECT cr.session_course_id, sc.instructor_id
            FROM CourseRegistration cr
            JOIN SessionCourse sc ON cr.session_course_id = sc.session_course_id
            WHERE cr.registration_id = ?
        `, [registrationId]);
        
        if (verify.length === 0 || verify[0].instructor_id !== instructorId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // Update grade
        await db.query(
            `UPDATE CourseRegistration 
             SET grade = ?, grade_points = ?, status = 'Completed'
             WHERE registration_id = ?`,
            [grade, gradePoints, registrationId]
        );
        
        // Get updated student info for response
        const [student] = await db.query(`
            SELECT s.FIRST_NAME, s.LAST_NAME, c.COURSE_CODE
            FROM CourseRegistration cr
            JOIN Student s ON cr.student_id = s.STUDENT_ID
            JOIN SessionCourse sc ON cr.session_course_id = sc.session_course_id
            JOIN Course c ON sc.course_id = c.COURSE_ID
            WHERE cr.registration_id = ?
        `, [registrationId]);
        
        res.json({ 
            success: true, 
            message: `Grade ${grade} recorded for ${student[0].FIRST_NAME} ${student[0].LAST_NAME} in ${student[0].COURSE_CODE}`,
            grade: grade,
            grade_points: gradePoints
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get grade summary for a course (statistics)
router.get('/course/:sessionCourseId/grade-summary', verifyToken, async (req, res) => {
    if (req.user.role !== 'instructor') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { sessionCourseId } = req.params;
    const instructorId = req.user.instructorId;
    
    try {
        // Verify ownership
        const [verify] = await db.query(
            'SELECT instructor_id FROM SessionCourse WHERE session_course_id = ?',
            [sessionCourseId]
        );
        
        if (verify.length === 0 || verify[0].instructor_id !== instructorId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const [summary] = await db.query(`
            SELECT 
                COUNT(*) as total_students,
                SUM(CASE WHEN grade IS NOT NULL THEN 1 ELSE 0 END) as graded_count,
                AVG(grade_points) as average_grade,
                COUNT(CASE WHEN grade = 'A' THEN 1 END) as A_count,
                COUNT(CASE WHEN grade = 'B' THEN 1 END) as B_count,
                COUNT(CASE WHEN grade = 'C' THEN 1 END) as C_count,
                COUNT(CASE WHEN grade = 'D' THEN 1 END) as D_count,
                COUNT(CASE WHEN grade = 'F' THEN 1 END) as F_count
            FROM CourseRegistration
            WHERE session_course_id = ?
        `, [sessionCourseId]);
        
        res.json(summary[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;