// frontend/src/components/Dashboard/Student/FeeStatus.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

function FeeStatus() {
    const [fees, setFees] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFee, setSelectedFee] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
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
            const res = await api.get('/fees/my-fees');
            setFees(res.data.fees || []);
            setPayments(res.data.payments || []);
        } catch (error) {
            console.error('Error loading fees:', error);
            toast.error('Failed to load fee information');
        } finally {
            setLoading(false);
        }
    };

    const handleMakePayment = async (e) => {
        e.preventDefault();
        const amount = parseFloat(paymentData.amount_paid);
        
        if (isNaN(amount) || amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        
        if (amount > selectedFee.remaining_amount) {
            toast.error(`Amount cannot exceed remaining balance of $${selectedFee.remaining_amount.toFixed(2)}`);
            return;
        }
        
        try {
            const res = await api.post('/fees/pay', {
                fee_id: selectedFee.fee_id,
                amount_paid: amount,
                payment_mode: paymentData.payment_mode,
                transaction_id: paymentData.transaction_id || null
            });
            toast.success(`Payment successful! Receipt: ${res.data.receipt_number}`);
            setShowPaymentModal(false);
            setPaymentData({ fee_id: '', amount_paid: '', payment_mode: 'Cash', transaction_id: '' });
            loadFees();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Payment failed');
        }
    };

    const getStatusBadge = (status) => {
        if (!status) return <span className="status-badge status-pending">Pending</span>;
        
        const colors = {
            'Paid': '#10b981',
            'Partial': '#f59e0b',
            'Pending': '#6b7280',
            'Overdue': '#ef4444'
        };
        return (
            <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                backgroundColor: colors[status] || '#6b7280',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold'
            }}>
                {status}
            </span>
        );
    };

    useEffect(() => {
        loadFees();
    }, []);

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading fee information...</div>;

    return (
        <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>💰 Fee Management</h3>
            <p style={{ marginBottom: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                Fees are calculated per semester based on your total enrolled credits.
            </p>
            
            {fees.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: '0.75rem' }}>
                    <p style={{ color: '#64748b' }}>No fee records found for your account.</p>
                </div>
            ) : (
                <>
                    <div className="table-wrapper" style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Semester</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Credits</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Rate/Credit</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Total</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Paid</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Remaining</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Due Date</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fees.map(fee => (
                                    <tr key={fee.fee_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '0.75rem' }}>
                                            <strong>{fee.semester} {fee.year}</strong>
                                            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Section: {fee.section_name}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>{fee.total_credits} credits</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>${parseFloat(fee.fee_per_credit).toFixed(2)}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>${parseFloat(fee.total_amount).toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center', color: '#10b981' }}>${parseFloat(fee.paid_amount).toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>${parseFloat(fee.remaining_amount).toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>{new Date(fee.due_date).toLocaleDateString()}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>{getStatusBadge(fee.status)}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                            {fee.status !== 'Paid' && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedFee(fee);
                                                        setPaymentData({ ...paymentData, fee_id: fee.fee_id });
                                                        setShowPaymentModal(true);
                                                    }}
                                                    style={{
                                                        padding: '0.25rem 0.75rem',
                                                        backgroundColor: '#2563eb',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '0.375rem',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    Pay Now
                                                </button>
                                            )}
                                            {fee.status === 'Paid' && (
                                                <span style={{ color: '#10b981', fontSize: '0.75rem' }}>✓ Paid</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {payments.length > 0 && (
                        <>
                            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginTop: '1.5rem', marginBottom: '0.75rem', color: '#1e293b' }}>Payment History</h4>
                            <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Semester</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Amount</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Mode</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Receipt</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map(payment => (
                                            <tr key={payment.payment_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                <td style={{ padding: '0.75rem' }}>{new Date(payment.payment_date).toLocaleDateString()}</td>
                                                <td style={{ padding: '0.75rem' }}>{payment.semester} {payment.year}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>${parseFloat(payment.amount_paid).toLocaleString()}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{payment.payment_mode}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}><span style={{ fontSize: '0.7rem', color: '#64748b' }}>{payment.receipt_number}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedFee && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '1.5rem',
                        borderRadius: '1rem',
                        width: '400px',
                        maxWidth: '90%'
                    }}>
                        <h3 style={{ marginBottom: '1rem' }}>Make Payment</h3>
                        <p><strong>Semester:</strong> {selectedFee.semester} {selectedFee.year}</p>
                        <p><strong>Total Credits:</strong> {selectedFee.total_credits} credits</p>
                        <p><strong>Fee per Credit:</strong> ${parseFloat(selectedFee.fee_per_credit).toFixed(2)}</p>
                        <p><strong>Total Amount:</strong> ${parseFloat(selectedFee.total_amount).toLocaleString()}</p>
                        <p><strong>Already Paid:</strong> ${parseFloat(selectedFee.paid_amount).toLocaleString()}</p>
                        <p><strong>Remaining:</strong> <span style={{ color: '#ef4444', fontWeight: 'bold' }}>${parseFloat(selectedFee.remaining_amount).toLocaleString()}</span></p>
                        
                        <form onSubmit={handleMakePayment}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Amount to Pay ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={selectedFee.remaining_amount}
                                    value={paymentData.amount_paid}
                                    onChange={(e) => setPaymentData({...paymentData, amount_paid: e.target.value})}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.375rem'
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Payment Mode</label>
                                <select
                                    value={paymentData.payment_mode}
                                    onChange={(e) => setPaymentData({...paymentData, payment_mode: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.375rem'
                                    }}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Card</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Online">Online</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Transaction ID (Optional)</label>
                                <input
                                    type="text"
                                    value={paymentData.transaction_id}
                                    onChange={(e) => setPaymentData({...paymentData, transaction_id: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.375rem'
                                    }}
                                    placeholder="Enter transaction reference"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowPaymentModal(false)} style={{
                                    padding: '0.5rem 1rem',
                                    background: '#e2e8f0',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer'
                                }}>Cancel</button>
                                <button type="submit" style={{
                                    padding: '0.5rem 1rem',
                                    background: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer'
                                }}>Pay Now</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FeeStatus;