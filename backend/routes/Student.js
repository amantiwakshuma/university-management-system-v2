const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/AuthMiddleware');
const db = require('../database/db');

// =============================================
// STUDENT ENDPOINTS
// =============================================

// Get student's own information with section and department
router.get('/my-info', verifyToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const studentId = req.user.studentId;
    
    try {
        const [students] = await db.query(`
            SELECT 
                s.STUDENT_ID,
                s.FIRST_NAME,
                s.LAST_NAME,
                s.EMAIL,
                s.SECTION_NAME,
                s.DEPARTMENT_ID,
                d.DEPARTMENT_NAME
            FROM Student s
            LEFT JOIN DEPARTMENTS d ON s.DEPARTMENT_ID = d.DEPARTMENT_ID
            WHERE s.STUDENT_ID = ?
        `, [studentId]);
        
        if (students.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        res.json(students[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get all courses in student's section (what they can enroll in - already enrolled)
// Get all courses in student's section (by section_name, not section_id)
router.get('/my-section-courses', verifyToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const studentId = req.user.studentId;
    
    try {
        // Get student's section_name
        const [student] = await db.query(
            'SELECT SECTION_NAME FROM Student WHERE STUDENT_ID = ?',
            [studentId]
        );
        
        const sectionName = student[0]?.SECTION_NAME;
        
        if (!sectionName) {
            return res.json([]);
        }
        
        // Get ALL courses in ALL sections with this section_name
        const [courses] = await db.query(`
            SELECT 
                s.SECTION_ID,
                s.SECTION_NAME,
                c.COURSE_ID,
                c.COURSE_CODE,
                c.COURSE_NAME,
                c.CREDIT_HOURS,
                s.SCHEDULE,
                CONCAT(i.FIRST_NAME, ' ', i.LAST_NAME) as INSTRUCTOR_NAME,
                e.FINAL_GRADE,
                e.GRADE_POINTS,
                e.ENROLL_ID,
                CASE WHEN e.ENROLL_ID IS NOT NULL THEN 'enrolled' ELSE 'available' END as STATUS
            FROM Section s
            JOIN Course c ON s.COURSE_ID = c.COURSE_ID
            JOIN Instructor i ON s.INSTRUCTOR_ID = i.INSTRUCTOR_ID
            LEFT JOIN Enrollment e ON e.SECTION_ID = s.SECTION_ID AND e.STUDENT_ID = ?
            WHERE s.SECTION_NAME = ?
            ORDER BY c.COURSE_CODE
        `, [studentId, sectionName]);
        
        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Enroll in a course (by course_id, using section_name)
router.post('/enroll/:courseId', verifyToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const studentId = req.user.studentId;
    const { courseId } = req.params;
    
    try {
        // Get student's section_name
        const [student] = await db.query(
            'SELECT SECTION_NAME FROM Student WHERE STUDENT_ID = ?',
            [studentId]
        );
        
        const sectionName = student[0]?.SECTION_NAME;
        
        if (!sectionName) {
            return res.status(400).json({ error: 'You are not assigned to any section' });
        }
        
        // Find the section_id for this course in this section_name
        const [section] = await db.query(
            'SELECT SECTION_ID FROM Section WHERE SECTION_NAME = ? AND COURSE_ID = ?',
            [sectionName, courseId]
        );
        
        if (section.length === 0) {
            return res.status(404).json({ error: 'Course not available in your section' });
        }
        
        const sectionId = section[0].SECTION_ID;
        
        // Check if already enrolled in ANY course in this section? No, check specific course
        const [existing] = await db.query(
            'SELECT ENROLL_ID FROM Enrollment WHERE STUDENT_ID = ? AND SECTION_ID = ?',
            [studentId, sectionId]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Already enrolled in this course' });
        }
        
        // Create enrollment
        await db.query(
            'INSERT INTO Enrollment (STUDENT_ID, SECTION_ID, SEMESTER, YEAR) VALUES (?, ?, "Fall", YEAR(CURDATE()))',
            [studentId, sectionId]
        );
        
        res.status(201).json({ success: true, message: 'Enrolled successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Drop a course
router.delete('/drop/:courseId', verifyToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const studentId = req.user.studentId;
    const { courseId } = req.params;
    
    try {
        // Get student's section_name
        const [student] = await db.query(
            'SELECT SECTION_NAME FROM Student WHERE STUDENT_ID = ?',
            [studentId]
        );
        
        const sectionName = student[0]?.SECTION_NAME;
        
        if (!sectionName) {
            return res.status(400).json({ error: 'No section found' });
        }
        
        // Find the section_id
        const [section] = await db.query(
            'SELECT SECTION_ID FROM Section WHERE SECTION_NAME = ? AND COURSE_ID = ?',
            [sectionName, courseId]
        );
        
        if (section.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        const sectionId = section[0].SECTION_ID;
        
        // Delete enrollment
        await db.query(
            'DELETE FROM Enrollment WHERE STUDENT_ID = ? AND SECTION_ID = ?',
            [studentId, sectionId]
        );
        
        res.json({ success: true, message: 'Course dropped successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get student's grades
router.get('/my-grades', verifyToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const studentId = req.user.studentId;
    
    try {
        // Get grades from CourseRegistration
        const [grades] = await db.query(`
            SELECT 
                c.COURSE_CODE,
                c.COURSE_NAME,
                c.CREDIT_HOURS,
                cr.grade as FINAL_GRADE,
                cr.grade_points as GRADE_POINTS,
                a.semester,
                a.year,
                cr.registration_id,
                cr.status
            FROM CourseRegistration cr
            JOIN SessionCourse sc ON cr.session_course_id = sc.session_course_id
            JOIN Course c ON sc.course_id = c.COURSE_ID
            JOIN AcademicSession a ON cr.session_id = a.session_id
            WHERE cr.student_id = ?
            ORDER BY a.year DESC, FIELD(a.semester, 'Fall', 'Spring', 'Summer'), c.COURSE_CODE
        `, [studentId]);
        
        console.log('Found grades:', grades.length); // Debug log
        
        // Group by semester
        const semesterMap = new Map();
        
        grades.forEach(grade => {
            const key = `${grade.semester} ${grade.year}`;
            if (!semesterMap.has(key)) {
                semesterMap.set(key, {
                    semester: grade.semester,
                    year: grade.year,
                    courses: [],
                    total_points: 0,
                    total_credits: 0,
                    completed_courses: 0
                });
            }
            
            const semesterData = semesterMap.get(key);
            semesterData.courses.push(grade);
            
            if (grade.GRADE_POINTS && grade.GRADE_POINTS > 0) {
                semesterData.total_points += parseFloat(grade.GRADE_POINTS) * parseFloat(grade.CREDIT_HOURS);
                semesterData.total_credits += parseFloat(grade.CREDIT_HOURS);
                semesterData.completed_courses++;
            }
        });
        
        // Calculate GPA for each semester
        const semesterData = Array.from(semesterMap.values()).map(sem => ({
            semester: sem.semester,
            year: sem.year,
            gpa: sem.total_credits > 0 ? (sem.total_points / sem.total_credits).toFixed(2) : 'N/A',
            total_credits: sem.total_credits,
            completed_courses: sem.completed_courses,
            courses: sem.courses.map(c => ({
                COURSE_CODE: c.COURSE_CODE,
                COURSE_NAME: c.COURSE_NAME,
                CREDIT_HOURS: c.CREDIT_HOURS,
                FINAL_GRADE: c.FINAL_GRADE,
                GRADE_POINTS: c.GRADE_POINTS,
                semester: c.semester,
                year: c.year
            }))
        }));
        
        // Calculate CGPA
        let totalPoints = 0;
        let totalCredits = 0;
        
        grades.forEach(grade => {
            if (grade.GRADE_POINTS && grade.GRADE_POINTS > 0) {
                totalPoints += parseFloat(grade.GRADE_POINTS) * parseFloat(grade.CREDIT_HOURS);
                totalCredits += parseFloat(grade.CREDIT_HOURS);
            }
        });
        
        const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
        
        res.json({
            semesters: semesterData,
            cgpa: cgpa,
            total_credits_earned: totalCredits,
            total_courses: grades.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get student's attendance
// router.get('/my-attendance', verifyToken, async (req, res) => {
//     if (req.user.role !== 'student') {
//         return res.status(403).json({ error: 'Access denied' });
//     }
    
//     const studentId = req.user.studentId;
    
//     try {
//         const [attendance] = await db.query(`
//             SELECT 
//                 c.COURSE_CODE,
//                 c.COURSE_NAME,
//                 COUNT(a.ATTEND_ID) as total_classes,
//                 SUM(CASE WHEN a.STATUS = 'Present' THEN 1 ELSE 0 END) as present_count,
//                 SUM(CASE WHEN a.STATUS = 'Late' THEN 1 ELSE 0 END) as late_count,
//                 SUM(CASE WHEN a.STATUS = 'Absent' THEN 1 ELSE 0 END) as absent_count,
//                 ROUND(SUM(CASE WHEN a.STATUS IN ('Present', 'Late') THEN 1 ELSE 0 END) * 100.0 / COUNT(a.ATTEND_ID), 2) as percentage
//             FROM Attendance a
//             JOIN Enrollment e ON a.ENROLL_ID = e.ENROLL_ID
//             JOIN Section s ON e.SECTION_ID = s.SECTION_ID
//             JOIN Course c ON s.COURSE_ID = c.COURSE_ID
//             WHERE e.STUDENT_ID = ?
//             GROUP BY c.COURSE_ID
//             ORDER BY c.COURSE_CODE
//         `, [studentId]);
        
//         // Also get detailed daily attendance
//         const [dailyAttendance] = await db.query(`
//             SELECT 
//                 a.ATTENDANCE_DATE,
//                 a.STATUS,
//                 a.REMARKS,
//                 c.COURSE_CODE,
//                 c.COURSE_NAME
//             FROM Attendance a
//             JOIN Enrollment e ON a.ENROLL_ID = e.ENROLL_ID
//             JOIN Section s ON e.SECTION_ID = s.SECTION_ID
//             JOIN Course c ON s.COURSE_ID = c.COURSE_ID
//             WHERE e.STUDENT_ID = ?
//             ORDER BY a.ATTENDANCE_DATE DESC
//             LIMIT 30
//         `, [studentId]);
        
//         res.json({
//             summary: attendance,
//             daily: dailyAttendance
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: error.message });
//     }
// });

module.exports = router;