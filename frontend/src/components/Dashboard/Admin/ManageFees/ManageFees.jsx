import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './ManageFees.css';

function ManageFees() {
    const [fees, setFees] = useState([]);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showSingleModal, setShowSingleModal] = useState(false);
    const [selectedFee, setSelectedFee] = useState(null);
    const [summary, setSummary] = useState(null);
    const [recentPayments, setRecentPayments] = useState([]);
    const [students, setStudents] = useState([]);
    const [generateData, setGenerateData] = useState({
        section_name: '',
        semester: 'Fall',
        year: new Date().getFullYear(),
        fee_per_credit: '100',
        due_date: ''
    });
    const [singleStudentData, setSingleStudentData] = useState({
        student_id: '',
        semester: 'Fall',
        year: new Date().getFullYear(),
        fee_per_credit: '100',
        due_date: ''
    });
    const [paymentData, setPaymentData] = useState({
        fee_id: '',
        amount_paid: '',
        payment_mode: 'Cash',
        transaction_id: ''
    });

    const token = localStorage.getItem('token');
    const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { Authorization: `Bearer ${token}` }
    });

    const loadFees = async () => {
        try {
            const res = await api.get('/admin/fees/all');
            setFees(res.data);
        } catch (error) {
            console.error('Error loading fees:', error);
            toast.error('Failed to load fees');
        }
    };

    const loadSections = async () => {
        try {
            const res = await api.get('/admin/fees/sections');
            setSections(res.data);
        } catch (error) {
            console.error('Error loading sections:', error);
        }
    };

    const loadStudents = async () => {
        try {
            const res = await api.get('/admin/students');
            setStudents(res.data);
        } catch (error) {
            console.error('Error loading students:', error);
        }
    };

    const loadSummary = async () => {
        try {
            const res = await api.get('/admin/fees/summary');
            setSummary(res.data.summary);
            setRecentPayments(res.data.recentPayments);
        } catch (error) {
            console.error('Error loading summary:', error);
        }
    };

    const handleGenerateForSection = async (e) => {
        e.preventDefault();
        
        if (!generateData.section_name) {
            toast.error('Please select a section');
            return;
        }
        
        if (!generateData.due_date) {
            toast.error('Please select a due date');
            return;
        }
        
        const feePerCredit = parseFloat(generateData.fee_per_credit);
        if (isNaN(feePerCredit) || feePerCredit <= 0) {
            toast.error('Please enter a valid fee per credit amount');
            return;
        }
        
        try {
            const res = await api.post('/admin/fees/generate-for-section', {
                section_name: generateData.section_name,
                semester: generateData.semester,
                year: parseInt(generateData.year),
                fee_per_credit: feePerCredit,
                due_date: generateData.due_date
            });
            
            toast.success(res.data.message);
            setShowGenerateModal(false);
            setGenerateData({
                section_name: '',
                semester: 'Fall',
                year: new Date().getFullYear(),
                fee_per_credit: '100',
                due_date: ''
            });
            loadFees();
            loadSummary();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to generate fees');
        }
    };

    const handleGenerateSingle = async (e) => {
        e.preventDefault();
        
        if (!singleStudentData.student_id) {
            toast.error('Please select a student');
            return;
        }
        
        if (!singleStudentData.due_date) {
            toast.error('Please select a due date');
            return;
        }
        
        const feePerCredit = parseFloat(singleStudentData.fee_per_credit);
        if (isNaN(feePerCredit) || feePerCredit <= 0) {
            toast.error('Please enter a valid fee per credit amount');
            return;
        }
        
        try {
            const res = await api.post('/admin/fees/generate-single', {
                student_id: parseInt(singleStudentData.student_id),
                semester: singleStudentData.semester,
                year: parseInt(singleStudentData.year),
                fee_per_credit: feePerCredit,
                due_date: singleStudentData.due_date
            });
            
            toast.success(res.data.message);
            setShowSingleModal(false);
            setSingleStudentData({
                student_id: '',
                semester: 'Fall',
                year: new Date().getFullYear(),
                fee_per_credit: '100',
                due_date: ''
            });
            loadFees();
            loadSummary();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to generate fee');
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        const amountPaid = parseFloat(paymentData.amount_paid);
        
        if (isNaN(amountPaid) || amountPaid <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        
        if (amountPaid > selectedFee.remaining_amount) {
            toast.error(`Amount cannot exceed remaining balance of $${selectedFee.remaining_amount.toFixed(2)}`);
            return;
        }
        
        try {
            const res = await api.post('/admin/fees/record-payment', {
                fee_id: selectedFee.fee_id,
                amount_paid: amountPaid,
                payment_mode: paymentData.payment_mode,
                transaction_id: paymentData.transaction_id || null
            });
            toast.success(`Payment recorded! Receipt: ${res.data.receipt_number}`);
            setShowPaymentModal(false);
            setPaymentData({ fee_id: '', amount_paid: '', payment_mode: 'Cash', transaction_id: '' });
            loadFees();
            loadSummary();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to record payment');
        }
    };

    const handleDeleteFee = async (feeId) => {
        if (confirm('Delete this fee? This will also delete all payment records.')) {
            try {
                await api.delete(`/admin/fees/delete/${feeId}`);
                toast.success('Fee deleted successfully');
                loadFees();
                loadSummary();
            } catch (error) {
                toast.error('Failed to delete fee');
            }
        }
    };

    const handleUpdateOverdue = async () => {
        try {
            const res = await api.put('/admin/fees/update-overdue');
            toast.success(`${res.data.affected_rows || 0} fees marked as overdue`);
            loadFees();
            loadSummary();
        } catch (error) {
            toast.error('Failed to update overdue fees');
        }
    };

    const getStatusBadge = (status) => {
        if (!status) return <span className="status-badge status-pending">Pending</span>;
        
        const statusLower = status.toLowerCase();
        let bgColor = '#6b7280';
        if (statusLower === 'paid') bgColor = '#10b981';
        else if (statusLower === 'partial') bgColor = '#f59e0b';
        else if (statusLower === 'overdue') bgColor = '#ef4444';
        else bgColor = '#6b7280';
        
        return (
            <span className="status-badge" style={{ backgroundColor: bgColor }}>
                {status}
            </span>
        );
    };

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            await Promise.all([
                loadFees(),
                loadSections(),
                loadStudents(),
                loadSummary()
            ]);
            setLoading(false);
        };
        loadAll();
    }, []);

    if (loading) return <div className="fee-loading">Loading fee management...</div>;

    return (
        <div className="fee-management-container">
            <div className="fee-header">
                <h1>💰 Fee Management</h1>
                <p>Generate semester fees by section, manage payments, and track financial status</p>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="fee-summary-grid">
                    <div className="summary-card"><div className="summary-number">{summary.total_fees || 0}</div><div className="summary-label">Total Fees</div></div>
                    <div className="summary-card paid"><div className="summary-number">{summary.paid_count || 0}</div><div className="summary-label">Paid</div></div>
                    <div className="summary-card partial"><div className="summary-number">{summary.partial_count || 0}</div><div className="summary-label">Partial</div></div>
                    <div className="summary-card pending"><div className="summary-number">{summary.pending_count || 0}</div><div className="summary-label">Pending</div></div>
                    <div className="summary-card overdue"><div className="summary-number">{summary.overdue_count || 0}</div><div className="summary-label">Overdue</div></div>
                    <div className="summary-card outstanding"><div className="summary-number">${parseFloat(summary.outstanding_amount || 0).toLocaleString()}</div><div className="summary-label">Outstanding</div></div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="fee-actions">
                <button className="btn-generate" onClick={() => setShowGenerateModal(true)}>📋 Generate Fees for Section</button>
                <button className="btn-single" onClick={() => { loadStudents(); setShowSingleModal(true); }}>👤 Generate for Single Student</button>
                <button className="btn-overdue" onClick={handleUpdateOverdue}>⚠️ Update Overdue Status</button>
            </div>

            {/* Fees Table */}
            <div className="fee-table-wrapper">
                <table className="fee-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Semester</th>
                            <th>Credits</th>
                            <th>Rate/Credit</th>
                            <th>Total</th>
                            <th>Paid</th>
                            <th>Remaining</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fees.length === 0 ? (
                            <tr><td colSpan="10" className="no-data">No fees found. Generate fees for a section.</td></tr>
                        ) : (
                            fees.map(fee => (
                                <tr key={fee.fee_id}>
                                    <td><strong>{fee.first_name} {fee.last_name}</strong><div className="student-id">Roll: {fee.roll_number || fee.student_id}</div></td>
                                    <td className="text-center"><strong>{fee.semester} {fee.year}</strong><div className="section-name">{fee.section_name}</div></td>
                                    <td className="text-center">{fee.total_credits} credits</td>
                                    <td className="text-center">${parseFloat(fee.fee_per_credit).toFixed(2)}</td>
                                    <td className="text-center">${parseFloat(fee.total_amount).toLocaleString()}</td>
                                    <td className="text-center text-success">${parseFloat(fee.paid_amount).toLocaleString()}</td>
                                    <td className="text-center text-bold">${parseFloat(fee.remaining_amount).toLocaleString()}</td>
                                    <td className="text-center">{new Date(fee.due_date).toLocaleDateString()}</td>
                                    <td className="text-center">{getStatusBadge(fee.status)}</td>
                                    <td className="text-center">
                                        <button className="btn-pay" onClick={() => { setSelectedFee(fee); setPaymentData({ ...paymentData, fee_id: fee.fee_id }); setShowPaymentModal(true); }} disabled={fee.status === 'Paid'}>Pay</button>
                                        <button className="btn-delete" onClick={() => handleDeleteFee(fee.fee_id)}>Delete</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Recent Payments */}
            {recentPayments && recentPayments.length > 0 && (
                <div className="recent-payments">
                    <h2>Recent Payments</h2>
                    <div className="payments-table-wrapper">
                        <table className="payments-table">
                            <thead><tr><th>Date</th><th>Student</th><th>Amount</th><th>Mode</th><th>Receipt</th></tr></thead>
                            <tbody>
                                {recentPayments.map((payment, idx) => (
                                    <tr key={idx}>
                                        <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                                        <td>{payment.first_name} {payment.last_name}</td>
                                        <td className="text-center">${parseFloat(payment.amount_paid).toLocaleString()}</td>
                                        <td className="text-center">{payment.payment_mode}</td>
                                        <td className="text-center">{payment.receipt_number}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Generate for Section Modal */}
            {showGenerateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Generate Fees for Section</h3>
                        <p className="modal-note">This will generate fees for ALL students in the selected section based on their enrolled credits.</p>
                        <form onSubmit={handleGenerateForSection}>
                            <div className="form-group"><label>Select Section *</label>
                                <select value={generateData.section_name} onChange={(e) => setGenerateData({...generateData, section_name: e.target.value})} required>
                                    <option value="">Select Section</option>
                                    {sections.map(s => <option key={s.section_name} value={s.section_name}>{s.section_name} - {s.department_name} ({s.student_count} students)</option>)}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Semester</label><select value={generateData.semester} onChange={(e) => setGenerateData({...generateData, semester: e.target.value})}><option value="Fall">Fall</option><option value="Spring">Spring</option><option value="Summer">Summer</option></select></div>
                                <div className="form-group"><label>Year</label><input type="number" value={generateData.year} onChange={(e) => setGenerateData({...generateData, year: e.target.value})} required /></div>
                            </div>
                            <div className="form-group"><label>Fee per Credit ($) *</label><input type="number" step="0.01" min="0.01" value={generateData.fee_per_credit} onChange={(e) => setGenerateData({...generateData, fee_per_credit: e.target.value})} required /></div>
                            <div className="form-group"><label>Due Date *</label><input type="date" value={generateData.due_date} onChange={(e) => setGenerateData({...generateData, due_date: e.target.value})} required /></div>
                            <div className="modal-actions"><button type="button" className="btn-cancel" onClick={() => setShowGenerateModal(false)}>Cancel</button><button type="submit" className="btn-submit">Generate Fees</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Generate Single Student Modal */}
            {showSingleModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Generate Fee for Single Student</h3>
                        <form onSubmit={handleGenerateSingle}>
                            <div className="form-group"><label>Student *</label>
                                <select value={singleStudentData.student_id} onChange={(e) => setSingleStudentData({...singleStudentData, student_id: e.target.value})} required>
                                    <option value="">Select Student</option>
                                    {students.map(s => <option key={s.student_id} value={s.student_id}>{s.first_name} {s.last_name} (Roll: {s.roll_number})</option>)}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Semester</label><select value={singleStudentData.semester} onChange={(e) => setSingleStudentData({...singleStudentData, semester: e.target.value})}><option value="Fall">Fall</option><option value="Spring">Spring</option><option value="Summer">Summer</option></select></div>
                                <div className="form-group"><label>Year</label><input type="number" value={singleStudentData.year} onChange={(e) => setSingleStudentData({...singleStudentData, year: e.target.value})} required /></div>
                            </div>
                            <div className="form-group"><label>Fee per Credit ($) *</label><input type="number" step="0.01" min="0.01" value={singleStudentData.fee_per_credit} onChange={(e) => setSingleStudentData({...singleStudentData, fee_per_credit: e.target.value})} required /></div>
                            <div className="form-group"><label>Due Date *</label><input type="date" value={singleStudentData.due_date} onChange={(e) => setSingleStudentData({...singleStudentData, due_date: e.target.value})} required /></div>
                            <div className="modal-actions"><button type="button" className="btn-cancel" onClick={() => setShowSingleModal(false)}>Cancel</button><button type="submit" className="btn-submit">Generate Fee</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Record Payment Modal */}
            {showPaymentModal && selectedFee && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Record Payment</h3>
                        <p><strong>Student:</strong> {selectedFee.first_name} {selectedFee.last_name}</p>
                        <p><strong>Semester:</strong> {selectedFee.semester} {selectedFee.year}</p>
                        <p><strong>Total Credits:</strong> {selectedFee.total_credits} credits × ${parseFloat(selectedFee.fee_per_credit).toFixed(2)} = ${parseFloat(selectedFee.total_amount).toLocaleString()}</p>
                        <p><strong>Already Paid:</strong> ${parseFloat(selectedFee.paid_amount).toLocaleString()}</p>
                        <p><strong>Remaining:</strong> <span className="text-danger">${parseFloat(selectedFee.remaining_amount).toLocaleString()}</span></p>
                        <form onSubmit={handleRecordPayment}>
                            <div className="form-group"><label>Amount to Pay ($)</label><input type="number" step="0.01" min="0.01" max={selectedFee.remaining_amount} value={paymentData.amount_paid} onChange={(e) => setPaymentData({...paymentData, amount_paid: e.target.value})} required /></div>
                            <div className="form-group"><label>Payment Mode</label><select value={paymentData.payment_mode} onChange={(e) => setPaymentData({...paymentData, payment_mode: e.target.value})}><option value="Cash">Cash</option><option value="Card">Card</option><option value="Bank Transfer">Bank Transfer</option><option value="Online">Online</option></select></div>
                            <div className="form-group"><label>Transaction ID (Optional)</label><input type="text" value={paymentData.transaction_id} onChange={(e) => setPaymentData({...paymentData, transaction_id: e.target.value})} /></div>
                            <div className="modal-actions"><button type="button" className="btn-cancel" onClick={() => setShowPaymentModal(false)}>Cancel</button><button type="submit" className="btn-submit">Record Payment</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageFees;