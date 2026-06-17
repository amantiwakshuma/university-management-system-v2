const express = require('express')
const router = express.Router()
const verifyToken = require('../middlewares/AuthMiddleware')
const db = require('../database/db')

// =============================================
// ADMIN ENDPOINTS
// =============================================

  



// =============================================
// DEPARTMENT ENDPOINTS
// =============================================

router.get('/departments', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        const [departments] = await db.query('SELECT * FROM DEPARTMENTS ORDER BY DEPARTMENT_NAME');
        res.json(departments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// STUDENT ENDPOINTS
// =============================================

// Get all students for dropdown
router.get('/students', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        const [students] = await db.query(`
            SELECT s.student_id, s.first_name, s.last_name, s.email
            FROM Student s
            ORDER BY s.student_id
        `);
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/students/available', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        const [students] = await db.query(`
            SELECT 
                s.STUDENT_ID, 
                s.FIRST_NAME, 
                s.LAST_NAME, 
                s.EMAIL,
                d.DEPARTMENT_ID,
                d.DEPARTMENT_NAME
            FROM Student s
            JOIN DEPARTMENTS d ON s.DEPARTMENT_ID = d.DEPARTMENT_ID
            WHERE s.SECTION_NAME IS NULL OR s.SECTION_NAME = ''
            ORDER BY s.STUDENT_ID
        `);
        
        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/student', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { first_name, last_name, email, phone, department_id, roll_number, section_name, username, password } = req.body;
    
    try {
        const [userResult] = await db.query(
            'INSERT INTO user (username, password, role) VALUES (?, ?, ?)',
            [username, password, 'student']
        );
        
        await db.query(
            `INSERT INTO Student (FIRST_NAME, LAST_NAME, EMAIL, PHONE, DEPARTMENT_ID, SECTION_NAME, USER_ID) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [first_name, last_name, email, phone, department_id, section_name, userResult.insertId]
        );
        
        res.status(201).json({ message: 'Student created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/student/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { id } = req.params;
    
    try {
        const [student] = await db.query('SELECT USER_ID FROM Student WHERE STUDENT_ID = ?', [id]);
        const userId = student[0]?.USER_ID;
        
        await db.query('DELETE FROM Enrollment WHERE STUDENT_ID = ?', [id]);
        await db.query('DELETE FROM Student WHERE STUDENT_ID = ?', [id]);
        
        if (userId) {
            await db.query('DELETE FROM user WHERE USER_ID = ?', [userId]);
        }
        
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// INSTRUCTOR ENDPOINTS
// =============================================

router.get('/instructors', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        const [instructors] = await db.query(`
            SELECT 
                i.INSTRUCTOR_ID,
                i.FIRST_NAME,
                i.LAST_NAME,
                i.EMAIL
            FROM Instructor i
            ORDER BY i.FIRST_NAME
        `);
        res.json(instructors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/instructors/all', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        const [instructors] = await db.query(`
            SELECT 
                i.INSTRUCTOR_ID,
                i.FIRST_NAME,
                i.LAST_NAME,
                i.EMAIL,
                i.PHONE,
                i.DEPARTMENT_ID,
                d.DEPARTMENT_NAME,
                i.USER_ID,
                u.USERNAME
            FROM Instructor i
            JOIN DEPARTMENTS d ON i.DEPARTMENT_ID = d.DEPARTMENT_ID
            LEFT JOIN user u ON i.USER_ID = u.USER_ID
            ORDER BY i.FIRST_NAME
        `);
        res.json(instructors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/instructor', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { first_name, last_name, email, phone, department_id, username, password } = req.body;
    
    try {
        const [userResult] = await db.query(
            'INSERT INTO user (username, password, role) VALUES (?, ?, ?)',
            [username, password, 'instructor']
        );
        
        await db.query(
            `INSERT INTO Instructor (FIRST_NAME, LAST_NAME, EMAIL, PHONE, DEPARTMENT_ID, USER_ID) 
             VALUES (?, ?, ?, ?, ?, ?,)`,
            [first_name, last_name, email, phone, department_id, userResult.insertId]
        );
        
        res.status(201).json({ message: 'Instructor created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/instructor/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { id } = req.params;
    
    try {
        const [instructor] = await db.query('SELECT USER_ID FROM Instructor WHERE INSTRUCTOR_ID = ?', [id]);
        const userId = instructor[0]?.USER_ID;
        
        await db.query('UPDATE Section SET INSTRUCTOR_ID = NULL WHERE INSTRUCTOR_ID = ?', [id]);
        await db.query('DELETE FROM Instructor WHERE INSTRUCTOR_ID = ?', [id]);
        
        if (userId) {
            await db.query('DELETE FROM user WHERE USER_ID = ?', [userId]);
        }
        
        res.json({ message: 'Instructor deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// COURSE ENDPOINTS
// =============================================

router.get('/courses', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        const [courses] = await db.query(`
            SELECT c.*, d.DEPARTMENT_NAME 
            FROM Course c
            JOIN DEPARTMENTS d ON c.DEPARTMENT_ID = d.DEPARTMENT_ID
        `);
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/courses/all', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
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

router.post('/course', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { course_code, course_name, credit_hours, department_id } = req.body;
    
    try {
        await db.query(
            'INSERT INTO Course (COURSE_CODE, COURSE_NAME, CREDIT_HOURS, DEPARTMENT_ID) VALUES (?, ?, ?, ?)',
            [course_code, course_name, credit_hours, department_id]
        );
        res.status(201).json({ message: 'Course created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/course/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { id } = req.params;
    
    try {
        const [sections] = await db.query('SELECT SECTION_ID FROM Section WHERE COURSE_ID = ?', [id]);
        
        for (const section of sections) {
            await db.query('DELETE FROM Enrollment WHERE SECTION_ID = ?', [section.SECTION_ID]);
        }
        
        await db.query('DELETE FROM Section WHERE COURSE_ID = ?', [id]);
        await db.query('DELETE FROM Course WHERE COURSE_ID = ?', [id]);
        
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// SECTION ENDPOINTS
// =============================================

// =============================================
// UPDATED SECTION & INSTRUCTOR ASSIGNMENT ENDPOINTS
// =============================================

// Get ALL sections for instructor assignment (show all sections)
router.get('/sections/for-assignment', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        const [sections] = await db.query(`
            SELECT 
                s.SECTION_ID,
                s.SECTION_NAME,
                c.COURSE_ID,
                c.COURSE_CODE,
                c.COURSE_NAME,
                d.DEPARTMENT_NAME,
                CONCAT(i.FIRST_NAME, ' ', i.LAST_NAME) as CURRENT_INSTRUCTOR,
                i.INSTRUCTOR_ID as CURRENT_INSTRUCTOR_ID
            FROM Section s
            JOIN Course c ON s.COURSE_ID = c.COURSE_ID
            JOIN DEPARTMENTS d ON c.DEPARTMENT_ID = d.DEPARTMENT_ID
            LEFT JOIN Instructor i ON s.INSTRUCTOR_ID = i.INSTRUCTOR_ID
            ORDER BY d.DEPARTMENT_NAME, s.SECTION_NAME, c.COURSE_CODE
        `);
        
        res.json(sections);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Assign instructor to a specific section (course-section combination)
router.post('/section/:sectionId/assign-instructor', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { sectionId } = req.params;
    const { instructor_id } = req.body;
    
    try {
        // Update the instructor for this specific section (course)
        await db.query(
            'UPDATE Section SET INSTRUCTOR_ID = ? WHERE SECTION_ID = ?',
            [instructor_id, sectionId]
        );
        
        // Get the updated section info for response
        const [updated] = await db.query(`
            SELECT 
                s.SECTION_ID,
                s.SECTION_NAME,
                c.COURSE_CODE,
                c.COURSE_NAME,
                CONCAT(i.FIRST_NAME, ' ', i.LAST_NAME) as INSTRUCTOR_NAME
            FROM Section s
            JOIN Course c ON s.COURSE_ID = c.COURSE_ID
            LEFT JOIN Instructor i ON s.INSTRUCTOR_ID = i.INSTRUCTOR_ID
            WHERE s.SECTION_ID = ?
        `, [sectionId]);
        
        res.json({ 
            message: 'Instructor assigned successfully',
            section: updated[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get all instructors (for dropdown)
router.get('/instructors/list', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        const [instructors] = await db.query(`
            SELECT 
                i.INSTRUCTOR_ID,
                i.FIRST_NAME,
                i.LAST_NAME,
                i.EMAIL,
                d.DEPARTMENT_NAME
            FROM Instructor i
            JOIN DEPARTMENTS d ON i.DEPARTMENT_ID = d.DEPARTMENT_ID
            ORDER BY i.FIRST_NAME
        `);
        res.json(instructors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get sections by department (with instructor info)
// Get sections by department (FIXED - returns proper section names)
router.get('/department/:deptId/sections', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
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
            WHERE c.DEPARTMENT_ID = ?
            GROUP BY s.SECTION_NAME
            ORDER BY s.SECTION_NAME
        `, [deptId]);
        
        // Convert to lowercase keys for frontend consistency
        const formattedSections = sections.map(s => ({
            section_name: s.SECTION_NAME,
            courses: s.courses,
            course_count: s.course_count,
            student_count: s.student_count
        }));
        
        res.json(formattedSections);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/section/create', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { course_id, instructor_id, room_id, section_name, schedule } = req.body;
    
    try {
        await db.query(
            `INSERT INTO Section (COURSE_ID, INSTRUCTOR_ID, ROOM_ID, SECTION_NAME, SCHEDULE) 
             VALUES (?, ?, ?, ?, ?)`,
            [course_id, instructor_id || null, room_id || null, section_name, schedule]
        );
        res.status(201).json({ message: 'Section created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get students in a section (FIXED - returns actual student data)
router.get('/section/:sectionName/students', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { sectionName } = req.params;
    
    try {
        const [students] = await db.query(`
            SELECT 
                s.STUDENT_ID,
                s.FIRST_NAME,
                s.LAST_NAME,
                s.EMAIL,
                s.SECTION_NAME
            FROM Student s
            WHERE s.SECTION_NAME = ?
        `, [sectionName]);
        
        const formattedStudents = students.map(student => ({
            student_id: student.STUDENT_ID,
            first_name: student.FIRST_NAME || 'N/A',
            last_name: student.LAST_NAME || 'N/A',
            email: student.EMAIL || 'N/A',
            section_name: student.SECTION_NAME
        }));
        
        res.json(formattedStudents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get courses for a specific section (FIXED - returns actual course data)
router.get('/section/:sectionName/courses', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { sectionName } = req.params;
    
    try {
        const [courses] = await db.query(`
            SELECT 
                s.SECTION_ID,
                c.COURSE_ID,
                c.COURSE_CODE,
                c.COURSE_NAME,
                c.CREDIT_HOURS,
                s.SCHEDULE,
                CONCAT(i.FIRST_NAME, ' ', i.LAST_NAME) as INSTRUCTOR_NAME,
                i.INSTRUCTOR_ID,
                r.ROOM_NUMBER,
                r.BUILDING,
                s.SECTION_NAME
            FROM Section s
            JOIN Course c ON s.COURSE_ID = c.COURSE_ID
            LEFT JOIN Instructor i ON s.INSTRUCTOR_ID = i.INSTRUCTOR_ID
            LEFT JOIN Classroom r ON s.ROOM_ID = r.ROOM_ID
            WHERE s.SECTION_NAME = ?
            ORDER BY c.COURSE_CODE
        `, [sectionName]);
        
        // Format the response with proper defaults
        const formattedCourses = courses.map(course => ({
            section_id: course.SECTION_ID,
            course_id: course.COURSE_ID,
            course_code: course.COURSE_CODE || 'N/A',
            course_name: course.COURSE_NAME || 'Unknown Course',
            credit_hours: course.CREDIT_HOURS || 0,
            schedule: course.SCHEDULE || 'TBD',
            instructor_name: course.INSTRUCTOR_NAME || 'Not Assigned',
            instructor_id: course.INSTRUCTOR_ID,
            room_number: course.ROOM_NUMBER || 'N/A',
            building: course.BUILDING || 'N/A',
            section_name: course.SECTION_NAME
        }));
        
        res.json(formattedCourses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/section/:sectionName/add-student', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { sectionName } = req.params;
    const { student_id } = req.body;
    
    try {
        await db.query(
            'UPDATE Student SET SECTION_NAME = ? WHERE STUDENT_ID = ?',
            [sectionName, student_id]
        );
        res.status(201).json({ message: 'Student added to section' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/section/:sectionName/remove-student/:studentId', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { studentId } = req.params;
    
    try {
        await db.query(
            'UPDATE Student SET SECTION_NAME = NULL WHERE STUDENT_ID = ?',
            [studentId]
        );
        res.json({ message: 'Student removed from section' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// CLASSROOM ENDPOINTS
// =============================================

router.get('/classrooms', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        const [classrooms] = await db.query('SELECT * FROM Classroom ORDER BY BUILDING, ROOM_NUMBER');
        res.json(classrooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});





// =============================================
// ADMIN FEE MANAGEMENT ENDPOINTS (COMPLETE)
// =============================================

// Get all fees
// Get all fees with correct status calculation
router.get('/fees/all', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        const [fees] = await db.query(`
            SELECT 
                f.fee_id,
                f.semester,
                f.year,
                f.total_credits,
                f.fee_per_credit,
                f.total_amount,
                f.due_date,
                s.student_id,
                s.first_name,
                s.last_name,
                COALESCE(SUM(p.amount_paid), 0) as paid_amount,
                (f.total_amount - COALESCE(SUM(p.amount_paid), 0)) as remaining_amount,
                COUNT(p.payment_id) as payment_count,
                -- Calculate status based on actual payments
                CASE 
                    WHEN COALESCE(SUM(p.amount_paid), 0) >= f.total_amount THEN 'Paid'
                    WHEN COALESCE(SUM(p.amount_paid), 0) > 0 THEN 'Partial'
                    WHEN f.due_date < CURDATE() THEN 'Overdue'
                    ELSE 'Pending'
                END as calculated_status
            FROM Fee f
            JOIN Student s ON f.student_id = s.student_id
            LEFT JOIN Payment p ON f.fee_id = p.fee_id
            GROUP BY f.fee_id
            ORDER BY f.status, f.due_date
        `);
        
        res.json(fees);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Generate fee for a student (auto-calculates from enrolled courses)
router.post('/fees/generate', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { student_id, semester, year, fee_per_credit, due_date } = req.body;
    
    try {
        // Get total credits from enrolled courses
        const [credits] = await db.query(`
            SELECT SUM(c.credit_hours) as total_credits
            FROM Enrollment e
            JOIN Section s ON e.section_id = s.section_id
            JOIN Course c ON s.course_id = c.course_id
            WHERE e.student_id = ? AND e.semester = ? AND e.year = ?
        `, [student_id, semester, year]);
        
        const totalCredits = credits[0]?.total_credits || 0;
        
        if (totalCredits === 0) {
            return res.status(400).json({ error: 'No enrolled courses found for this semester' });
        }
        
        const totalAmount = totalCredits * parseFloat(fee_per_credit);
        
        // Check if fee already exists
        const [existing] = await db.query(
            'SELECT fee_id FROM Fee WHERE student_id = ? AND semester = ? AND year = ?',
            [student_id, semester, year]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Fee already exists for this semester' });
        }
        
        await db.query(
            `INSERT INTO Fee (student_id, semester, year, total_credits, fee_per_credit, total_amount, due_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [student_id, semester, year, totalCredits, fee_per_credit, totalAmount, due_date]
        );
        
        res.json({ 
            success: true, 
            message: `Fee generated: ${totalCredits} credits × $${fee_per_credit} = $${totalAmount}`,
            total_credits: totalCredits,
            total_amount: totalAmount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

/// =============================================
// SIMPLIFIED FEE MANAGEMENT (Per Semester)
// =============================================

// Get all fees with student details
router.get('/fees/all', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        const [fees] = await db.query(`
            SELECT 
                f.fee_id,
                f.semester,
                f.year,
                f.section_name,
                f.total_credits,
                f.fee_per_credit,
                f.total_amount,
                f.due_date,
                f.status,
                s.student_id,
                s.first_name,
                s.last_name,
                COALESCE(SUM(p.amount_paid), 0) as paid_amount,
                (f.total_amount - COALESCE(SUM(p.amount_paid), 0)) as remaining_amount,
                COUNT(p.payment_id) as payment_count
            FROM Fee f
            JOIN Student s ON f.student_id = s.student_id
            LEFT JOIN Payment p ON f.fee_id = p.fee_id
            GROUP BY f.fee_id
            ORDER BY f.year DESC, FIELD(f.semester, 'Fall', 'Spring', 'Summer'), f.status
        `);
        
        res.json(fees);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get all sections for fee generation dropdown
// Get all sections for fee generation dropdown
router.get('/fees/sections', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        const [sections] = await db.query(`
            SELECT DISTINCT 
                sec.section_name,
                d.department_name,
                COUNT(DISTINCT stu.student_id) as student_count,
                AVG(c.credit_hours) as avg_credits
            FROM Section sec
            JOIN Course c ON sec.course_id = c.course_id
            JOIN DEPARTMENTS d ON c.department_id = d.department_id
            LEFT JOIN Student stu ON stu.section_name = sec.section_name
            WHERE sec.section_name IS NOT NULL
            GROUP BY sec.section_name, d.department_name
            ORDER BY sec.section_name
        `);
        res.json(sections);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Generate fee for a section (ALL students in that section)
router.post('/fees/generate-for-section', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { section_name, semester, year, fee_per_credit, due_date } = req.body;
    
    try {
        // Get all students in this section
        const [students] = await db.query(
            'SELECT student_id FROM Student WHERE section_name = ?',
            [section_name]
        );
        
        if (students.length === 0) {
            return res.status(404).json({ error: 'No students found in this section' });
        }
        
        // For each student, calculate total credits from their enrolled courses
        let successCount = 0;
        let skipCount = 0;
        const results = [];
        
        for (const student of students) {
            // Calculate total credits for this student in the semester
            const [credits] = await db.query(`
                SELECT SUM(c.credit_hours) as total_credits
                FROM CourseRegistration cr
                JOIN SessionCourse sc ON cr.session_course_id = sc.session_course_id
                JOIN Course c ON sc.course_id = c.course_id
                WHERE cr.student_id = ? AND cr.session_id = (
                    SELECT session_id FROM AcademicSession WHERE semester = ? AND year = ? AND is_active = TRUE
                )
            `, [student.student_id, semester, year]);
            
            const totalCredits = credits[0]?.total_credits || 0;
            
            if (totalCredits === 0) {
                skipCount++;
                results.push({ student_id: student.student_id, status: 'skipped', reason: 'No enrolled courses' });
                continue;
            }
            
            const totalAmount = totalCredits * parseFloat(fee_per_credit);
            
            // Check if fee already exists
            const [existing] = await db.query(
                'SELECT fee_id FROM Fee WHERE student_id = ? AND semester = ? AND year = ?',
                [student.student_id, semester, year]
            );
            
            if (existing.length > 0) {
                // Update existing fee
                await db.query(
                    `UPDATE Fee SET total_credits = ?, fee_per_credit = ?, total_amount = ?, due_date = ?, status = 'Pending' 
                     WHERE fee_id = ?`,
                    [totalCredits, fee_per_credit, totalAmount, due_date, existing[0].fee_id]
                );
                results.push({ student_id: student.student_id, status: 'updated', credits: totalCredits, amount: totalAmount });
            } else {
                // Insert new fee
                await db.query(
                    `INSERT INTO Fee (student_id, semester, year, section_name, total_credits, fee_per_credit, total_amount, due_date, status) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
                    [student.student_id, semester, year, section_name, totalCredits, fee_per_credit, totalAmount, due_date]
                );
                results.push({ student_id: student.student_id, status: 'created', credits: totalCredits, amount: totalAmount });
            }
            successCount++;
        }
        
        res.json({
            success: true,
            message: `Fees generated for ${successCount} students (${skipCount} skipped)`,
            results: results,
            total_students: students.length,
            success_count: successCount,
            skipped_count: skipCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Generate fee for a single student
router.post('/fees/generate-single', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { student_id, semester, year, fee_per_credit, due_date } = req.body;
    
    try {
        // Get student's section
        const [student] = await db.query(
            'SELECT section_name FROM Student WHERE student_id = ?',
            [student_id]
        );
        
        if (student.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        const sectionName = student[0].section_name;
        
        // Calculate total credits
        const [credits] = await db.query(`
            SELECT SUM(c.credit_hours) as total_credits
            FROM CourseRegistration cr
            JOIN SessionCourse sc ON cr.session_course_id = sc.session_course_id
            JOIN Course c ON sc.course_id = c.course_id
            WHERE cr.student_id = ? AND cr.session_id = (
                SELECT session_id FROM AcademicSession WHERE semester = ? AND year = ? AND is_active = TRUE
            )
        `, [student_id, semester, year]);
        
        const totalCredits = credits[0]?.total_credits || 0;
        
        if (totalCredits === 0) {
            return res.status(400).json({ error: 'Student has no enrolled courses for this semester' });
        }
        
        const totalAmount = totalCredits * parseFloat(fee_per_credit);
        
        // Check if fee already exists
        const [existing] = await db.query(
            'SELECT fee_id FROM Fee WHERE student_id = ? AND semester = ? AND year = ?',
            [student_id, semester, year]
        );
        
        if (existing.length > 0) {
            await db.query(
                `UPDATE Fee SET total_credits = ?, fee_per_credit = ?, total_amount = ?, due_date = ?, status = 'Pending' 
                 WHERE fee_id = ?`,
                [totalCredits, fee_per_credit, totalAmount, due_date, existing[0].fee_id]
            );
        } else {
            await db.query(
                `INSERT INTO Fee (student_id, semester, year, section_name, total_credits, fee_per_credit, total_amount, due_date, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
                [student_id, semester, year, sectionName, totalCredits, fee_per_credit, totalAmount, due_date]
            );
        }
        
        res.json({
            success: true,
            message: `Fee generated: ${totalCredits} credits × $${fee_per_credit} = $${totalAmount}`,
            total_credits: totalCredits,
            total_amount: totalAmount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get fee summary statistics
router.get('/fees/summary', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        const [summary] = await db.query(`
            SELECT 
                COUNT(*) as total_fees,
                SUM(CASE WHEN status = 'Paid' THEN 1 ELSE 0 END) as paid_count,
                SUM(CASE WHEN status = 'Partial' THEN 1 ELSE 0 END) as partial_count,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END) as overdue_count,
                ROUND(SUM(total_amount), 2) as total_amount,
                ROUND(SUM(CASE WHEN status != 'Paid' THEN total_amount ELSE 0 END), 2) as outstanding_amount
            FROM Fee
        `);
        
        const [recentPayments] = await db.query(`
            SELECT 
                p.payment_date,
                p.amount_paid,
                p.receipt_number,
                p.payment_mode,
                s.first_name,
                s.last_name,
                f.semester,
                f.year
            FROM Payment p
            JOIN Fee f ON p.fee_id = f.fee_id
            JOIN Student s ON f.student_id = s.student_id
            ORDER BY p.payment_date DESC
            LIMIT 10
        `);
        
        res.json({ summary: summary[0], recentPayments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Record payment
router.post('/fees/record-payment', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { fee_id, amount_paid, payment_mode, transaction_id } = req.body;
    const userId = req.user.userId;
    const amountPaidNum = parseFloat(amount_paid);
    
    try {
        const [fee] = await db.query(
            'SELECT total_amount, status FROM Fee WHERE fee_id = ?',
            [fee_id]
        );
        
        if (fee.length === 0) {
            return res.status(404).json({ error: 'Fee not found' });
        }
        
        const [paid] = await db.query(
            'SELECT COALESCE(SUM(amount_paid), 0) as total FROM Payment WHERE fee_id = ?',
            [fee_id]
        );
        
        const totalPaid = parseFloat(paid[0].total);
        const feeAmount = parseFloat(fee[0].total_amount);
        const newTotalPaid = totalPaid + amountPaidNum;
        
        if (newTotalPaid > feeAmount) {
            return res.status(400).json({ 
                error: `Maximum payment is $${(feeAmount - totalPaid).toFixed(2)}` 
            });
        }
        
        const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        await db.query(
            `INSERT INTO Payment (fee_id, payment_date, amount_paid, payment_mode, transaction_id, receipt_number, recorded_by) 
             VALUES (?, CURDATE(), ?, ?, ?, ?, ?)`,
            [fee_id, amountPaidNum, payment_mode, transaction_id || null, receiptNumber, userId]
        );
        
        const newStatus = newTotalPaid >= feeAmount ? 'Paid' : 'Partial';
        await db.query('UPDATE Fee SET status = ? WHERE fee_id = ?', [newStatus, fee_id]);
        
        res.json({ 
            success: true, 
            receipt_number: receiptNumber,
            remaining: (feeAmount - newTotalPaid).toFixed(2),
            status: newStatus
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Delete fee
router.delete('/fees/delete/:feeId', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { feeId } = req.params;
    
    try {
        await db.query('DELETE FROM Payment WHERE fee_id = ?', [feeId]);
        await db.query('DELETE FROM Fee WHERE fee_id = ?', [feeId]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Update overdue fees
router.put('/fees/update-overdue', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        const [result] = await db.query(
            `UPDATE Fee SET status = 'Overdue' 
             WHERE due_date < CURDATE() AND status IN ('Pending', 'Partial')`
        );
        res.json({ message: 'Overdue fees updated', affected_rows: result.affectedRows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});





// =============================================
// SESSION COURSE MANAGEMENT
// =============================================

// Get all academic sessions (for dropdown)
router.get('/academic-sessions', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        const [sessions] = await db.query(`
            SELECT session_id, semester, year, is_active 
            FROM AcademicSession 
            ORDER BY year DESC, FIELD(semester, 'Fall', 'Spring', 'Summer')
        `);
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get available courses for session (filtered by department)
router.get('/available-courses-for-session', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { department_id } = req.query;
    
    try {
        let query = `
            SELECT c.*, d.DEPARTMENT_NAME
            FROM Course c
            JOIN DEPARTMENTS d ON c.DEPARTMENT_ID = d.DEPARTMENT_ID
        `;
        const params = [];
        
        if (department_id) {
            query += ` WHERE c.DEPARTMENT_ID = ?`;
            params.push(department_id);
        }
        
        query += ` ORDER BY d.DEPARTMENT_NAME, c.COURSE_CODE`;
        
        const [courses] = await db.query(query, params);
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get session courses filtered by department
router.get('/session-courses/:sessionId', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { sessionId } = req.params;
    const { department_id } = req.query;
    
    try {
        let query = `
            SELECT 
                sc.session_course_id,
                sc.session_id,
                sc.course_id,
                sc.instructor_id,
                sc.room_id,
                sc.schedule,
                sc.section_name,
                sc.max_capacity,
                sc.current_enrollment,
                c.COURSE_CODE,
                c.COURSE_NAME,
                c.CREDIT_HOURS,
                CONCAT(i.FIRST_NAME, ' ', i.LAST_NAME) as INSTRUCTOR_NAME,
                r.ROOM_NUMBER,
                r.BUILDING
            FROM SessionCourse sc
            JOIN Course c ON sc.course_id = c.COURSE_ID
            LEFT JOIN Instructor i ON sc.instructor_id = i.INSTRUCTOR_ID
            LEFT JOIN Classroom r ON sc.room_id = r.ROOM_ID
            WHERE sc.session_id = ?
        `;
        const params = [sessionId];
        
        if (department_id) {
            query += ` AND c.DEPARTMENT_ID = ?`;
            params.push(department_id);
        }
        
        query += ` ORDER BY c.COURSE_CODE`;
        
        const [courses] = await db.query(query, params);
        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Assign a course to a session
router.post('/assign-course-to-session', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { session_id, course_id, instructor_id, room_id, schedule, section_name, max_capacity } = req.body;
    
    try {
        // Check if already assigned
        const [existing] = await db.query(
            'SELECT session_course_id FROM SessionCourse WHERE session_id = ? AND course_id = ? AND section_name = ?',
            [session_id, course_id, section_name]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Course already assigned to this session' });
        }
        
        await db.query(`
            INSERT INTO SessionCourse (session_id, course_id, instructor_id, room_id, schedule, section_name, max_capacity)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [session_id, course_id, instructor_id || null, room_id || null, schedule, section_name, max_capacity || 30]);
        
        res.status(201).json({ message: 'Course assigned to session successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Remove a course from a session
router.delete('/remove-course-from-session/:sessionCourseId', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { sessionCourseId } = req.params;
    
    try {
        await db.query('DELETE FROM SessionCourse WHERE session_course_id = ?', [sessionCourseId]);
        res.json({ message: 'Course removed from session successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all instructors (for dropdown)
router.get('/instructors-list', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        const [instructors] = await db.query(`
            SELECT i.INSTRUCTOR_ID, i.FIRST_NAME, i.LAST_NAME, d.DEPARTMENT_NAME
            FROM Instructor i
            JOIN DEPARTMENTS d ON i.DEPARTMENT_ID = d.DEPARTMENT_ID
            ORDER BY i.FIRST_NAME
        `);
        res.json(instructors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all classrooms (for dropdown)
router.get('/classrooms-list', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        const [classrooms] = await db.query(`
            SELECT ROOM_ID, ROOM_NUMBER, BUILDING, CAPACITY
            FROM Classroom
            ORDER BY BUILDING, ROOM_NUMBER
        `);
        res.json(classrooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// Create section for a specific semester (session)
router.post('/section/create-with-session', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { course_id, instructor_id, room_id, section_name, schedule, session_id } = req.body;
    
    try {
        await db.query(
            `INSERT INTO Section (COURSE_ID, INSTRUCTOR_ID, ROOM_ID, SECTION_NAME, SCHEDULE, SESSION_ID) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [course_id, instructor_id || null, room_id || null, section_name, schedule, session_id]
        );
        res.status(201).json({ message: 'Section created for semester successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});





// =============================================
// STUDENT SECTION ASSIGNMENT
// =============================================

// Get all unassigned students (section_name IS NULL)
router.get('/students/unassigned', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        const [students] = await db.query(`
            SELECT 
                s.student_id,
                s.first_name,
                s.last_name,
                s.email,
                d.department_name,
                d.department_id
            FROM Student s
            JOIN DEPARTMENTS d ON s.department_id = d.department_id
            WHERE s.section_name IS NULL OR s.section_name = ''
            ORDER BY s.student_id
        `);
        
        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Assign student to section
router.put('/students/assign-section', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { student_id, section_name } = req.body;
    
    if (!student_id || !section_name) {
        return res.status(400).json({ error: 'Student ID and section name are required' });
    }
    
    try {
        // Check if student exists
        const [student] = await db.query(
            'SELECT student_id FROM Student WHERE student_id = ?',
            [student_id]
        );
        
        if (student.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        // Update ONLY section_name (not section_id)
        await db.query(
            'UPDATE Student SET section_name = ? WHERE student_id = ?',
            [section_name, student_id]
        );
        
        res.json({ 
            success: true, 
            message: `Student assigned to section ${section_name} successfully` 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get all available sections (for dropdown)
router.get('/sections/list', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        // Get distinct section names from existing sections
        const [sections] = await db.query(`
            SELECT DISTINCT section_name 
            FROM Section 
            WHERE section_name IS NOT NULL 
            ORDER BY section_name
        `);
        
        // Also provide common section names
        const commonSections = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B'];
        
        res.json({ 
            existingSections: sections,
            commonSections: commonSections
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});






// =============================================
// STATS ENDPOINT
// =============================================

router.get('/stats', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        const [totalStudents] = await db.query('SELECT COUNT(*) as count FROM Student');
        const [totalInstructors] = await db.query('SELECT COUNT(*) as count FROM Instructor');
        const [totalCourses] = await db.query('SELECT COUNT(*) as count FROM Course');
        const [totalSections] = await db.query('SELECT COUNT(*) as count FROM Section');
        
        res.json({
            totalStudents: totalStudents[0].count,
            totalInstructors: totalInstructors[0].count,
            totalCourses: totalCourses[0].count,
            totalSections: totalSections[0].count
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;