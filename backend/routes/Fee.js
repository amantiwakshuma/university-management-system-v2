const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/AuthMiddleware');
const db = require('../database/db');

// Helper: Calculate total credits for a student in a semester
async function getStudentTotalCredits(studentId, semester, year) {
    const [result] = await db.query(`
        SELECT SUM(c.credit_hours) as total_credits
        FROM Enrollment e
        JOIN Section s ON e.section_id = s.section_id
        JOIN Course c ON s.course_id = c.course_id
        WHERE e.student_id = ? AND e.semester = ? AND e.year = ?
    `, [studentId, semester, year]);
    return result[0]?.total_credits || 0;
}

// Get fees for logged-in student
router.get('/my-fees', verifyToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const studentId = req.user.studentId;
    
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
                COALESCE(SUM(p.amount_paid), 0) as paid_amount,
                (f.total_amount - COALESCE(SUM(p.amount_paid), 0)) as remaining_amount
            FROM Fee f
            LEFT JOIN Payment p ON f.fee_id = p.fee_id
            WHERE f.student_id = ?
            GROUP BY f.fee_id
            ORDER BY f.year DESC, FIELD(f.semester, 'Fall', 'Spring', 'Summer')
        `, [studentId]);
        
        // Get payment history
        const [payments] = await db.query(`
            SELECT 
                p.payment_id,
                p.payment_date,
                p.amount_paid,
                p.payment_mode,
                p.transaction_id,
                p.receipt_number,
                f.semester,
                f.year
            FROM Payment p
            JOIN Fee f ON p.fee_id = f.fee_id
            WHERE f.student_id = ?
            ORDER BY p.payment_date DESC
        `, [studentId]);
        
        res.json({ fees, payments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Record a payment (Student)
router.post('/pay', verifyToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const studentId = req.user.studentId;
    const { fee_id, amount_paid, payment_mode, transaction_id } = req.body;
    const amountPaidNum = parseFloat(amount_paid);
    
    try {
        const [fee] = await db.query(
            'SELECT total_amount, status FROM Fee WHERE fee_id = ? AND student_id = ?',
            [fee_id, studentId]
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
                error: `Maximum payable amount is $${(feeAmount - totalPaid).toFixed(2)}` 
            });
        }
        
        const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        await db.query(
            `INSERT INTO Payment (fee_id, payment_date, amount_paid, payment_mode, transaction_id, receipt_number) 
             VALUES (?, CURDATE(), ?, ?, ?, ?)`,
            [fee_id, amountPaidNum, payment_mode, transaction_id || null, receiptNumber]
        );
        
        const newStatus = newTotalPaid >= feeAmount ? 'Paid' : 'Partial';
        await db.query('UPDATE Fee SET status = ? WHERE fee_id = ?', [newStatus, fee_id]);
        
        res.json({ 
            success: true, 
            receipt_number: receiptNumber,
            remaining: (feeAmount - newTotalPaid).toFixed(2)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Auto-generate fee for a student based on enrolled credits (Admin)
router.post('/generate', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { student_id, semester, year, fee_per_credit, due_date } = req.body;
    
    try {
        const totalCredits = await getStudentTotalCredits(student_id, semester, year);
        
        if (totalCredits === 0) {
            return res.status(400).json({ error: 'Student has no enrolled courses for this semester' });
        }
        
        const totalAmount = totalCredits * parseFloat(fee_per_credit);
        
        const [existing] = await db.query(
            'SELECT fee_id FROM Fee WHERE student_id = ? AND semester = ? AND year = ?',
            [student_id, semester, year]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Fee already exists for this semester' });
        }
        
        await db.query(
            `INSERT INTO Fee (student_id, semester, year, total_credits, fee_per_credit, total_amount, due_date, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
            [student_id, semester, year, totalCredits, fee_per_credit, totalAmount, due_date]
        );
        
        res.json({ 
            success: true, 
            message: `Fee generated: ${totalCredits} credits × $${fee_per_credit} = $${totalAmount}` 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;