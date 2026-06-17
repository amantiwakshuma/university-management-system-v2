const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/AuthMiddleware");
const db = require("../database/db");

// =============================================
// ACADEMIC SESSION MANAGEMENT
// =============================================

// Get current active session (Admin & Student)
router.get("/current-session", verifyToken, async (req, res) => {
  try {
    const [session] = await db.query(`
            SELECT * FROM AcademicSession 
            WHERE is_active = TRUE 
            LIMIT 1
        `);

    const [regPeriod] = await db.query(
      `
            SELECT * FROM RegistrationPeriod 
            WHERE session_id = ? AND is_open = TRUE
        `,
      [session[0]?.session_id],
    );

    res.json({
      session: session[0] || null,
      registration_open: regPeriod.length > 0,
      regPeriod: regPeriod[0] || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Create/Update Academic Session
router.post("/admin/session", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  const {
    semester,
    year,
    registration_start_date,
    registration_end_date,
    classes_start_date,
    classes_end_date,
  } = req.body;

  try {
    // Deactivate previous active session
    await db.query("UPDATE AcademicSession SET is_active = FALSE");

    const [result] = await db.query(
      `
            INSERT INTO AcademicSession 
            (semester, year, registration_open, registration_start_date, registration_end_date, classes_start_date, classes_end_date, is_active) 
            VALUES (?, ?, FALSE, ?, ?, ?, ?, TRUE)
            ON DUPLICATE KEY UPDATE
            registration_start_date = VALUES(registration_start_date),
            registration_end_date = VALUES(registration_end_date),
            classes_start_date = VALUES(classes_start_date),
            classes_end_date = VALUES(classes_end_date),
            is_active = TRUE
        `,
      [
        semester,
        year,
        registration_start_date,
        registration_end_date,
        classes_start_date,
        classes_end_date,
      ],
    );

    res.json({ success: true, message: "Academic session created/updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Open/Close Registration
router.put("/admin/registration-status", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { session_id, is_open, start_date, end_date } = req.body;

  try {
    if (is_open) {
      await db.query(
        `
                INSERT INTO RegistrationPeriod (session_id, start_date, end_date, is_open)
                VALUES (?, ?, ?, TRUE)
                ON DUPLICATE KEY UPDATE
                start_date = VALUES(start_date),
                end_date = VALUES(end_date),
                is_open = TRUE
            `,
        [session_id, start_date, end_date],
      );
    } else {
      await db.query(
        "UPDATE RegistrationPeriod SET is_open = FALSE WHERE session_id = ?",
        [session_id],
      );
    }

    res.json({
      success: true,
      message: is_open ? "Registration opened" : "Registration closed",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Student: Check if registration is open
router.get("/can-register", verifyToken, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ error: "Access denied" });
  }

  const studentId = req.user.studentId;

  try {
    // Get current active session
    const [session] = await db.query(
      "SELECT * FROM AcademicSession WHERE is_active = TRUE LIMIT 1",
    );

    if (session.length === 0) {
      return res.json({
        can_register: false,
        reason: "No active academic session",
      });
    }

    // Check registration period
    const [regPeriod] = await db.query(
      "SELECT * FROM RegistrationPeriod WHERE session_id = ? AND is_open = TRUE AND CURDATE() BETWEEN start_date AND end_date",
      [session[0].session_id],
    );

    if (regPeriod.length === 0) {
      return res.json({
        can_register: false,
        reason: "Registration is currently closed",
      });
    }

    // Check if student is promoted from previous semester
    const [prevStatus] = await db.query(
      `
            SELECT is_promoted, status FROM StudentAcademicStatus 
            WHERE student_id = ? 
            ORDER BY year DESC, FIELD(semester, 'Fall', 'Spring', 'Summer')
            LIMIT 1
        `,
      [studentId],
    );

    if (
      prevStatus.length > 0 &&
      !prevStatus[0].is_promoted &&
      prevStatus[0].status !== "Enrolled"
    ) {
      return res.json({
        can_register: false,
        reason: "You are not promoted to the next semester",
      });
    }

    res.json({
      can_register: true,
      session: session[0],
      regPeriod: regPeriod[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Student: Get courses available for registration (based on their section and promotion)
router.get("/available-for-registration", verifyToken, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ error: "Access denied" });
  }

  const studentId = req.user.studentId;

  try {
    // Get student's section
    const [student] = await db.query(
      "SELECT SECTION_NAME, SECTION_ID FROM Student WHERE STUDENT_ID = ?",
      [studentId],
    );

    const sectionName = student[0]?.SECTION_NAME;

    // Get current session
    const [session] = await db.query(
      "SELECT session_id, semester, year FROM AcademicSession WHERE is_active = TRUE LIMIT 1",
    );

    if (session.length === 0) {
      return res.json([]);
    }

    // Get courses for this section in current semester
    const [courses] = await db.query(
      `
            SELECT 
                s.SECTION_ID,
                s.SECTION_NAME,
                c.COURSE_ID,
                c.COURSE_CODE,
                c.COURSE_NAME,
                c.CREDIT_HOURS,
                s.SCHEDULE,
                CONCAT(i.FIRST_NAME, ' ', i.LAST_NAME) as INSTRUCTOR_NAME,
                CASE WHEN cr.registration_id IS NOT NULL THEN 'registered' ELSE 'available' END as STATUS
            FROM Section s
            JOIN Course c ON s.COURSE_ID = c.COURSE_ID
            JOIN Instructor i ON s.INSTRUCTOR_ID = i.INSTRUCTOR_ID
            LEFT JOIN CourseRegistration cr ON cr.SECTION_ID = s.SECTION_ID 
                AND cr.STUDENT_ID = ? 
                AND cr.SESSION_ID = ?
            WHERE s.SECTION_NAME = ?
            ORDER BY c.COURSE_CODE
        `,
      [studentId, session[0].session_id, sectionName],
    );

    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Student: Register for a course
router.post("/register", verifyToken, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ error: "Access denied" });
  }

  const studentId = req.user.studentId;
  const { section_id, session_id } = req.body;

  try {
    // Check registration eligibility
    const [canReg] = await db.query(
      "SELECT * FROM RegistrationPeriod WHERE session_id = ? AND is_open = TRUE AND CURDATE() BETWEEN start_date AND end_date",
      [session_id],
    );

    if (canReg.length === 0) {
      return res.status(400).json({ error: "Registration is not open" });
    }

    // Check if already registered
    const [existing] = await db.query(
      "SELECT * FROM CourseRegistration WHERE student_id = ? AND section_id = ? AND session_id = ?",
      [studentId, section_id, session_id],
    );

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ error: "Already registered for this course" });
    }

    // Register
    await db.query(
      `INSERT INTO CourseRegistration (student_id, section_id, session_id) 
             VALUES (?, ?, ?)`,
      [studentId, section_id, session_id],
    );

    res.json({ success: true, message: "Successfully registered for course" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Student: Get my registered courses for current semester
// Get my registered courses for current semester
router.get('/my-registered-courses', verifyToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const studentId = req.user.studentId;
    
    try {
        // Get current active session
        const [session] = await db.query(
            'SELECT session_id, semester, year FROM AcademicSession WHERE is_active = TRUE LIMIT 1'
        );
        
        if (session.length === 0) {
            return res.json([]);
        }
        
        const [courses] = await db.query(`
            SELECT 
                cr.registration_id,
                sc.session_course_id,
                c.COURSE_CODE,
                c.COURSE_NAME,
                c.CREDIT_HOURS,
                sc.schedule,
                CONCAT(i.FIRST_NAME, ' ', i.LAST_NAME) as INSTRUCTOR_NAME,
                cr.status as registration_status,
                cr.grade,
                cr.grade_points,
                sc.section_name
            FROM CourseRegistration cr
            JOIN SessionCourse sc ON cr.session_course_id = sc.session_course_id
            JOIN Course c ON sc.course_id = c.COURSE_ID
            LEFT JOIN Instructor i ON sc.instructor_id = i.INSTRUCTOR_ID
            WHERE cr.student_id = ? AND cr.session_id = ?
            ORDER BY c.COURSE_CODE
        `, [studentId, session[0].session_id]);
        
        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Calculate Semester GPA and Promotion Status (Called when grades are finalized)
router.post("/calculate-semester-gpa", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { student_id, semester, year } = req.body;

  try {
    // Get session_id
    const [session] = await db.query(
      "SELECT session_id FROM AcademicSession WHERE semester = ? AND year = ?",
      [semester, year],
    );

    if (session.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Calculate GPA for this student in this semester
    const [grades] = await db.query(
      `
            SELECT 
                SUM(c.CREDIT_HOURS) as total_credits,
                SUM(cr.grade_points * c.CREDIT_HOURS) as total_points
            FROM CourseRegistration cr
            JOIN Section s ON cr.section_id = s.SECTION_ID
            JOIN Course c ON s.COURSE_ID = c.COURSE_ID
            WHERE cr.student_id = ? AND cr.session_id = ? AND cr.grade IS NOT NULL
        `,
      [student_id, session[0].session_id],
    );

    const semesterGpa =
      grades[0].total_credits > 0
        ? (grades[0].total_points / grades[0].total_credits).toFixed(2)
        : 0;

    // Get cumulative GPA from previous semesters
    const [cumulative] = await db.query(
      `
            SELECT AVG(semester_gpa) as cumulative_gpa, SUM(earned_credits) as total_credits
            FROM StudentAcademicStatus
            WHERE student_id = ? AND (year < ? OR (year = ? AND FIELD(semester, 'Fall', 'Spring', 'Summer') < FIELD(?, 'Fall', 'Spring', 'Summer')))
        `,
      [student_id, year, year, semester],
    );

    const cumulativeGpa = cumulative[0].cumulative_gpa || semesterGpa;

    // Promotion rule: GPA >= 2.0 to be promoted
    const isPromoted = parseFloat(semesterGpa) >= 2.0;

    // Update or insert academic status
    await db.query(
      `
            INSERT INTO StudentAcademicStatus 
            (student_id, semester, year, semester_gpa, cumulative_gpa, earned_credits, is_promoted, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            semester_gpa = VALUES(semester_gpa),
            cumulative_gpa = VALUES(cumulative_gpa),
            earned_credits = VALUES(earned_credits),
            is_promoted = VALUES(is_promoted),
            status = VALUES(status)
        `,
      [
        student_id,
        semester,
        year,
        semesterGpa,
        cumulativeGpa,
        grades[0].total_credits || 0,
        isPromoted,
        isPromoted ? "Promoted" : "Probation",
      ],
    );

    res.json({
      success: true,
      semester_gpa: semesterGpa,
      cumulative_gpa: cumulativeGpa,
      is_promoted: isPromoted,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// STUDENT REGISTRATION ENDPOINTS
// =============================================

// Get courses available for registration (from SessionCourse table)
// Get courses available for registration
router.get('/available-courses', verifyToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const studentId = req.user.studentId;
    
    try {
        // Get current active session
        const [session] = await db.query(`
            SELECT * FROM AcademicSession WHERE is_active = TRUE LIMIT 1
        `);
        
        if (session.length === 0) {
            return res.json({ 
                can_register: false, 
                courses: [], 
                reason: 'No active academic session' 
            });
        }
        
        // Check if registration is open - FIXED QUERY
        const [regPeriod] = await db.query(`
            SELECT * FROM RegistrationPeriod 
            WHERE session_id = ? 
            AND is_open = 1 
            AND CURDATE() BETWEEN start_date AND end_date
        `, [session[0].session_id]);
        
        console.log('Registration period found:', regPeriod); // DEBUG
        
        const isRegistrationOpen = regPeriod.length > 0;
        
        if (!isRegistrationOpen) {
            return res.json({ 
                can_register: false, 
                courses: [], 
                reason: 'Registration is currently closed',
                session: session[0],
                regPeriod: null
            });
        }
        
        // Get student's section
        const [student] = await db.query(
            'SELECT SECTION_NAME FROM Student WHERE STUDENT_ID = ?',
            [studentId]
        );
        
        const sectionName = student[0]?.SECTION_NAME;
        
        if (!sectionName) {
            return res.json({ 
                can_register: false, 
                courses: [], 
                reason: 'You have not been assigned to a section yet' 
            });
        }
        
        // Get available courses for this section
        const [courses] = await db.query(`
            SELECT 
                sc.session_course_id,
                sc.course_id,
                sc.section_name,
                sc.schedule,
                sc.max_capacity,
                sc.current_enrollment,
                c.COURSE_CODE,
                c.COURSE_NAME,
                c.CREDIT_HOURS,
                CONCAT(i.FIRST_NAME, ' ', i.LAST_NAME) as INSTRUCTOR_NAME,
                CASE WHEN cr.registration_id IS NOT NULL THEN 'registered' ELSE 'available' END as STATUS
            FROM SessionCourse sc
            JOIN Course c ON sc.course_id = c.COURSE_ID
            LEFT JOIN Instructor i ON sc.instructor_id = i.INSTRUCTOR_ID
            LEFT JOIN CourseRegistration cr ON cr.session_course_id = sc.session_course_id 
                AND cr.student_id = ? 
                AND cr.session_id = ?
            WHERE sc.session_id = ? AND sc.section_name = ?
            ORDER BY c.COURSE_CODE
        `, [studentId, session[0].session_id, session[0].session_id, sectionName]);
        
        res.json({
            can_register: true,
            session: session[0],
            regPeriod: regPeriod[0],
            courses: courses
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Register for a course
// Register for a course (FIXED - uses section_id)
// Register for a course (FIXED - no section_id required)
router.post('/register-course', verifyToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const studentId = req.user.studentId;
    const { session_course_id, session_id } = req.body;
    
    try {
        // Check if registration is open
        const [regPeriod] = await db.query(`
            SELECT * FROM RegistrationPeriod 
            WHERE session_id = ? AND is_open = TRUE AND CURDATE() BETWEEN start_date AND end_date
        `, [session_id]);
        
        if (regPeriod.length === 0) {
            return res.status(400).json({ error: 'Registration is not open' });
        }
        
        // Get session course details to check capacity
        const [sessionCourse] = await db.query(`
            SELECT max_capacity, current_enrollment 
            FROM SessionCourse 
            WHERE session_course_id = ?
        `, [session_course_id]);
        
        if (sessionCourse.length === 0) {
            return res.status(404).json({ error: 'Course not found for this session' });
        }
        
        // Check capacity
        if (sessionCourse[0].current_enrollment >= sessionCourse[0].max_capacity) {
            return res.status(400).json({ error: 'This course is full' });
        }
        
        // Check if already registered
        const [existing] = await db.query(
            `SELECT * FROM CourseRegistration 
             WHERE student_id = ? AND session_course_id = ? AND session_id = ?`,
            [studentId, session_course_id, session_id]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Already registered for this course' });
        }
        
        // Register (without section_id)
        await db.query(
            `INSERT INTO CourseRegistration (student_id, session_course_id, session_id, registration_date) 
             VALUES (?, ?, ?, CURDATE())`,
            [studentId, session_course_id, session_id]
        );
        
        // Update enrollment count in SessionCourse
        await db.query(
            `UPDATE SessionCourse 
             SET current_enrollment = current_enrollment + 1 
             WHERE session_course_id = ?`,
            [session_course_id]
        );
        
        res.json({ success: true, message: 'Successfully registered for course' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Drop a course (before deadline)
// Drop a course
router.delete('/drop-course/:registration_id', verifyToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { registration_id } = req.params;
    const studentId = req.user.studentId;
    
    try {
        // Get session_course_id before deleting
        const [reg] = await db.query(
            'SELECT session_course_id FROM CourseRegistration WHERE registration_id = ? AND student_id = ?',
            [registration_id, studentId]
        );
        
        if (reg.length === 0) {
            return res.status(404).json({ error: 'Registration not found' });
        }
        
        const sessionCourseId = reg[0].session_course_id;
        
        // Delete registration
        await db.query('DELETE FROM CourseRegistration WHERE registration_id = ?', [registration_id]);
        
        // Decrease enrollment count
        await db.query(
            `UPDATE SessionCourse 
             SET current_enrollment = current_enrollment - 1 
             WHERE session_course_id = ?`,
            [sessionCourseId]
        );
        
        res.json({ success: true, message: 'Course dropped successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});



// =============================================
// END SEMESTER PROCESSING
// =============================================

// Admin: End current semester and calculate all results
router.post('/admin/end-semester', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        // Get current active session
        const [session] = await db.query(
            'SELECT session_id, semester, year FROM AcademicSession WHERE is_active = TRUE LIMIT 1'
        );
        
        if (session.length === 0) {
            return res.status(404).json({ error: 'No active semester found' });
        }
        
        // Get all students with registrations in this semester
        const [students] = await db.query(`
            SELECT DISTINCT cr.student_id 
            FROM CourseRegistration cr
            WHERE cr.session_id = ? AND cr.status = 'Registered'
        `, [session[0].session_id]);
        
        let results = [];
        
        for (const student of students) {
            const result = await calculateStudentSemesterResult(student.student_id, session[0].session_id);
            results.push(result);
        }
        
        // Deactivate current session
        await db.query('UPDATE AcademicSession SET is_active = FALSE WHERE session_id = ?', [session[0].session_id]);
        
        // Create next semester session (automatically)
        const nextSemester = getNextSemester(session[0].semester);
        const nextYear = nextSemester === 'Fall' ? session[0].year + 1 : session[0].year;
        
        await db.query(`
            INSERT INTO AcademicSession (semester, year, is_active, registration_open)
            VALUES (?, ?, FALSE, FALSE)
        `, [nextSemester, nextYear]);
        
        res.json({
            success: true,
            message: `Semester ${session[0].semester} ${session[0].year} ended`,
            results: results,
            next_semester: { semester: nextSemester, year: nextYear }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Helper function to calculate student's semester result
async function calculateStudentSemesterResult(studentId, sessionId) {
    // Get all registered courses for this student in this semester
    const [courses] = await db.query(`
        SELECT 
            cr.registration_id,
            cr.grade,
            cr.grade_points,
            c.CREDIT_HOURS,
            sc.max_capacity
        FROM CourseRegistration cr
        JOIN SessionCourse sc ON cr.session_course_id = sc.session_course_id
        JOIN Course c ON sc.course_id = c.COURSE_ID
        WHERE cr.student_id = ? AND cr.session_id = ? AND cr.status = 'Registered'
    `, [studentId, sessionId]);
    
    let totalPoints = 0;
    let totalCredits = 0;
    let completedCourses = 0;
    
    for (const course of courses) {
        if (course.grade_points !== null) {
            totalPoints += course.grade_points * course.CREDIT_HOURS;
            totalCredits += course.CREDIT_HOURS;
            completedCourses++;
            
            // Mark as completed
            await db.query(
                'UPDATE CourseRegistration SET semester_completed = TRUE, completed_date = CURDATE() WHERE registration_id = ?',
                [course.registration_id]
            );
        }
    }
    
    const semesterGpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
    const isPromoted = semesterGpa >= 2.0 && completedCourses === courses.length;
    
    // Get cumulative GPA from previous semesters
    const [prevResults] = await db.query(`
        SELECT AVG(semester_gpa) as cumulative_gpa 
        FROM SemesterResult 
        WHERE student_id = ? AND session_id < ?
    `, [studentId, sessionId]);
    
    const cumulativeGpa = prevResults[0]?.cumulative_gpa || semesterGpa;
    
    // Save semester result
    await db.query(`
        INSERT INTO SemesterResult (student_id, session_id, semester_gpa, cumulative_gpa, total_credits_earned, is_promoted, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        semester_gpa = VALUES(semester_gpa),
        cumulative_gpa = VALUES(cumulative_gpa),
        total_credits_earned = VALUES(total_credits_earned),
        is_promoted = VALUES(is_promoted),
        status = VALUES(status)
    `, [studentId, sessionId, semesterGpa, cumulativeGpa, totalCredits, isPromoted, isPromoted ? 'Passed' : 'Probation']);
    
    // Update student's promotion status
    await db.query(
        'UPDATE Student SET promotion_status = ? WHERE student_id = ?',
        [isPromoted ? 'Eligible' : 'Probation', studentId]
    );
    
    return {
        student_id: studentId,
        semester_gpa: semesterGpa,
        cumulative_gpa: cumulativeGpa,
        total_credits: totalCredits,
        completed_courses: completedCourses,
        total_courses: courses.length,
        is_promoted: isPromoted
    };
}

// Helper function to get next semester
function getNextSemester(currentSemester) {
    switch(currentSemester) {
        case 'Fall': return 'Spring';
        case 'Spring': return 'Fall';
        default: return 'Fall';
    }
}

// Student: Check promotion status for next semester
router.get('/check-promotion-status', verifyToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const studentId = req.user.studentId;
    
    try {
        // Get student's promotion status
        const [student] = await db.query(
            'SELECT promotion_status FROM Student WHERE student_id = ?',
            [studentId]
        );
        
        // Get latest semester result
        const [latestResult] = await db.query(`
            SELECT sr.*, a.semester, a.year
            FROM SemesterResult sr
            JOIN AcademicSession a ON sr.session_id = a.session_id
            WHERE sr.student_id = ?
            ORDER BY a.year DESC, FIELD(a.semester, 'Fall', 'Spring', 'Summer') DESC
            LIMIT 1
        `, [studentId]);
        
        // Check if next semester registration is open
        const [nextSession] = await db.query(`
            SELECT * FROM AcademicSession 
            WHERE is_active = FALSE AND (
                (semester = 'Spring' AND year = (SELECT MAX(year) FROM AcademicSession)) OR
                (semester = 'Fall' AND year = (SELECT MAX(year) + 1 FROM AcademicSession))
            )
            LIMIT 1
        `);
        
        res.json({
            is_eligible: student[0]?.promotion_status === 'Eligible',
            latest_result: latestResult[0] || null,
            next_session: nextSession[0] || null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


// Get all completed courses (with grades) for a student
router.get('/all-completed-courses', verifyToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const studentId = req.user.studentId;
    
    try {
        const [courses] = await db.query(`
            SELECT 
                c.COURSE_CODE,
                c.COURSE_NAME,
                c.CREDIT_HOURS,
                cr.grade,
                cr.grade_points,
                a.semester,
                a.year,
                CONCAT(i.FIRST_NAME, ' ', i.LAST_NAME) as INSTRUCTOR_NAME
            FROM CourseRegistration cr
            JOIN SessionCourse sc ON cr.session_course_id = sc.session_course_id
            JOIN Course c ON sc.course_id = c.COURSE_ID
            JOIN AcademicSession a ON cr.session_id = a.session_id
            LEFT JOIN Instructor i ON sc.instructor_id = i.INSTRUCTOR_ID
            WHERE cr.student_id = ? AND cr.grade IS NOT NULL AND cr.grade != ''
            ORDER BY a.year DESC, FIELD(a.semester, 'Fall', 'Spring', 'Summer'), c.COURSE_CODE
        `, [studentId]);
        
        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get my registered courses for current semester
// router.get("/my-registered-courses", verifyToken, async (req, res) => {
//   if (req.user.role !== "student") {
//     return res.status(403).json({ error: "Access denied" });
//   }

//   const studentId = req.user.studentId;

//   try {
//     // Get current active session
//     const [session] = await db.query(
//       "SELECT session_id, semester, year FROM AcademicSession WHERE is_active = TRUE LIMIT 1",
//     );

//     if (session.length === 0) {
//       return res.json([]);
//     }

//     const [courses] = await db.query(
//       `
//             SELECT 
//                 cr.registration_id,
//                 c.COURSE_CODE,
//                 c.COURSE_NAME,
//                 c.CREDIT_HOURS,
//                 s.SCHEDULE,
//                 CONCAT(i.FIRST_NAME, ' ', i.LAST_NAME) as INSTRUCTOR_NAME,
//                 cr.status as registration_status,
//                 cr.grade,
//                 cr.grade_points
//             FROM CourseRegistration cr
//             JOIN Section s ON cr.section_id = s.SECTION_ID
//             JOIN Course c ON s.COURSE_ID = c.COURSE_ID
//             JOIN Instructor i ON s.INSTRUCTOR_ID = i.INSTRUCTOR_ID
//             WHERE cr.student_id = ? AND cr.session_id = ?
//             ORDER BY c.COURSE_CODE
//         `,
//       [studentId, session[0].session_id],
//     );

//     res.json(courses);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: error.message });
//   }
// });

module.exports = router;
