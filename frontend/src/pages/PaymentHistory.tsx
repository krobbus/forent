import { useState, useEffect } from 'react';
import { authFetch } from '../utils/api';
import type { PaymentHistoryDataProps, PaymentHistoryProps, PaymentStatus } from '../utils/props';

function PaymentHistory({ goBack, userId, userRole, onViewDetails }: PaymentHistoryProps) {
    const [payments, setPayments] = useState<PaymentHistoryDataProps[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [rentedProperties, setRentedProperties] = useState<{ id: number; property_name: string }[]>([]);

    const [formData, setFormData] = useState({
        property_id: '',
        amount: '',
        payment_method: '',
        period_covered: '',
        notes: '',
    });

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const response = await authFetch(
                `${import.meta.env.VITE_API_URL}/api/payment/view?userId=${userId}&userRole=${userRole}`
            );
            const data = await response.json();
            setPayments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load payments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) fetchPayments();
    }, [userId, userRole]);

    useEffect(() => {
        const fetchRentedProperties = async () => {
            if (userRole !== 'tenant') return;

            try {
                const response = await authFetch(
                    `${import.meta.env.VITE_API_URL}/api/properties/rented?userId=${userId}`
                );
                const data = await response.json();
                setRentedProperties(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Failed to load rented properties", error);
            }
        };

        if (userId) fetchRentedProperties();
    }, [userId]);

    const getStatusLabel = (status: PaymentStatus) => {
        switch (status) {
            case 'paid': return 'Paid';
            case 'pending': return 'Pending';
            case 'failed': return 'Failed';
            case 'refunded': return 'Refunded';
            default: return '';
        }
    };

    const getStatusColor = (status: PaymentStatus) => {
        switch (status) {
            case 'paid': return 'bg-emerald-50 text-emerald-700';
            case 'pending': return 'bg-amber-50 text-amber-700';
            case 'failed': return 'bg-red-50 text-red-600';
            case 'refunded': return 'bg-gray-100 text-gray-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getMethodLabel = (method: string) => {
        switch (method) {
            case 'cash': return 'Cash';
            case 'bank_transfer': return 'Bank Transfer';
            case 'gcash': return 'GCash';
            case 'card': return 'Card';
            case 'other': return 'Other';
            default: return '';
        }
    };

    const handleViewDetails = async (propertyId: number) => {
        try {
            const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/properties/${propertyId}`);
            if (response.ok) {
                const propertyData = await response.json();
                onViewDetails(propertyData);
            }
        } catch (error) {
            console.error("Failed to fetch property", error);
        }
    };

    const handleStripePayment = async () => {
        if (!formData.property_id || !formData.amount || !formData.period_covered) {
            alert('Please fill in Property, Amount, and Period Covered before paying by card.');
            return;
        }

        const selectedProperty = rentedProperties.find(p => p.id === Number(formData.property_id));

        try {
            const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/payment/create-checkout-session`, {
                method: 'POST',
                body: JSON.stringify({
                    property_id: formData.property_id,
                    tenant_id: userId,
                    amount: formData.amount,
                    period_covered: formData.period_covered,
                    notes: formData.notes,
                    property_name: selectedProperty?.property_name ?? 'Property',
                }),
            });

            if (response.ok) {
                const data = await response.json();
                window.location.href = data.url;
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error || 'Failed to create checkout session'}`);
            }
        } catch (error) {
            console.error("Stripe checkout failed", error);
            alert("An error occurred while initiating payment.");
        }
    };

    const handleStatusUpdate = async (paymentId: number, newStatus: string) => {
        const confirmed = window.confirm(
            `Mark this payment as ${newStatus}? This cannot be undone.`
        );
        if (!confirmed) return;

        try {
            const response = await authFetch(
                `${import.meta.env.VITE_API_URL}/api/payment/${paymentId}/status`,
                { method: 'PATCH', body: JSON.stringify({ status: newStatus }) }
            );

            if (response.ok) {
                setPayments(prev =>
                    prev.map(p => p.id === paymentId ? { ...p, status: newStatus as PaymentStatus } : p)
                );
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error || 'Failed to update status'}`);
            }
        } catch (error) {
            console.error("Status update failed", error);
        }
    };

    const handleDelete = async (paymentId: number) => {
        const confirmed = window.confirm("Delete this payment record? This cannot be undone.");
        if (!confirmed) return;

        try {
            const response = await authFetch(
                `${import.meta.env.VITE_API_URL}/api/payment/${paymentId}`,
                { method: 'DELETE' }
            );
            if (response.ok) {
                fetchPayments();
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error || 'Failed to delete'}`);
            }
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/payment`, {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    tenant_id: userId,
                    recorded_by: userRole,
                }),
            });

            if (response.ok) {
                alert('Payment record submitted successfully!');
                setShowForm(false);
                setFormData({ property_id: '', amount: '', payment_method: '', period_covered: '', notes: '' });
                fetchPayments();
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error || 'Failed to submit'}`);
            }
        } catch (error) {
            console.error("Submission failed", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section id='paymentHistoryContainer' className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 font-[family-name:var(--font-body)] text-[var(--text)] sm:px-6">
            <header className="relative overflow-hidden rounded-2xl bg-[url('/Background.png')] bg-cover bg-center">
                <div className="absolute inset-0 bg-orange-600/70" />

                <div className="relative flex flex-col gap-2 px-6 py-10 sm:px-10">
                    <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-white sm:text-3xl">{userRole === 'landlord' ? 'Payment History' : 'My Payments'}</h2>
                    <p className="max-w-2xl text-sm text-orange-50 sm:text-base">Access and review a complete record of your past transactions and rental payments.</p>
                </div>
            </header>

            <main className="flex flex-col gap-6">
                {userRole === 'tenant' && !showForm && (
                    <div className="flex flex-wrap justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowForm(true)}
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <i className="fa-solid fa-plus" />
                            Submit Payment
                        </button>
                    </div>
                )}

                {showForm && (
                    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                        <fieldset className="flex flex-col gap-4 rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
                            <legend className="px-2 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--primary-dark)]">Submit Payment Record</legend>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Property <span className="text-red-500">*</span></label>
                                <select
                                    value={formData.property_id}
                                    onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                                    required
                                    className="w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                >
                                    {rentedProperties.length === 0 ? (
                                        <>
                                            <option value="">Select Property</option>
                                            <option value="" disabled>No rented properties found.</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="">Select Property</option>
                                            {rentedProperties.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.property_name}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">Amount (₱) <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">Payment Method <span className="text-red-500">*</span></label>
                                    <select
                                        value={formData.payment_method}
                                        onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                        required
                                        className="w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                    >
                                        <option value="">Select Method</option>
                                        <option value="cash">Cash</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="gcash">GCash</option>
                                        <option value="card">Card</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Period Covered <span className="text-red-500">*</span></label>
                                <input
                                    type="month"
                                    value={formData.period_covered}
                                    onChange={(e) => setFormData({ ...formData, period_covered: e.target.value })}
                                    required
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Notes <span className="text-xs font-normal text-gray-400">(optional)</span></label>
                                <textarea
                                    rows={3}
                                    value={formData.notes}
                                    placeholder="Any additional notes..."
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                />
                            </div>
                        </fieldset>

                        <div className="flex flex-wrap justify-end gap-3">
                            {formData.payment_method === 'card' ? (
                                <button
                                    type="button"
                                    onClick={handleStripePayment}
                                    disabled={submitting}
                                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <i className="fa-solid fa-credit-card" />
                                    {submitting ? 'Redirecting...' : 'Pay with Card'}
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <i className="fa-solid fa-paper-plane" />
                                    {submitting ? 'Submitting...' : 'Submit'}
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                            >
                                <i className="fa-solid fa-xmark" />
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {loading ? (
                    <p className="py-12 text-center text-sm text-gray-500">Loading payments...</p>
                ) : payments.length === 0 ? (
                    <p className="py-12 text-center text-sm text-gray-500">No payment records found.</p>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-orange-100 bg-white shadow-sm">
                        <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                            <thead className="bg-[var(--primary-soft)]">
                                <tr className="border-b border-orange-100">
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Payment ID</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Property Name</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Amount</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Method</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Period Covered</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Payment Date</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Status</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Recorded By</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Notes</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {payments.map((payment, index) => (
                                    <tr key={payment.id} className="border-b border-orange-100 align-top transition-colors last:border-b-0 hover:bg-[var(--primary-soft)]/50">
                                        <td className="px-4 py-3 font-semibold text-[var(--text)]">{index + 1}</td>
                                        <td className="px-4 py-3 font-medium text-[var(--text)]">{payment.property_name || '—'}</td>
                                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-[var(--primary-dark)]">₱{Number(payment.amount).toLocaleString()}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-600">{getMethodLabel(payment.payment_method) || '—'}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-600">{payment.period_covered || '—'}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-600">{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(payment.status)}`}>
                                                {getStatusLabel(payment.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{payment.recorded_by ? payment.recorded_by.charAt(0).toUpperCase() + payment.recorded_by.slice(1) : '—'}</td>
                                        <td className="max-w-xs px-4 py-3 leading-relaxed text-gray-600">{payment.notes || '—'}</td>
                                        <td className="px-4 py-3">
                                            {payment.status === 'pending' && userRole === 'landlord' && (
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--primary)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
                                                        onClick={() => handleViewDetails(payment.property_id)}
                                                    >
                                                        <i className="fa-solid fa-eye" />
                                                        View Property
                                                    </button>
                                                    <button
                                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)]"
                                                        onClick={() => handleStatusUpdate(payment.id, 'paid')}
                                                    >
                                                        <i className="fa-solid fa-check" />
                                                        Confirm Paid
                                                    </button>
                                                    <button
                                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                                                        onClick={() => handleStatusUpdate(payment.id, 'failed')}
                                                    >
                                                        <i className="fa-solid fa-ban" />
                                                        Mark Failed
                                                    </button>
                                                </div>
                                            )}

                                            {payment.status === 'paid' && userRole === 'landlord' && (
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--primary)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
                                                        onClick={() => handleViewDetails(payment.property_id)}
                                                    >
                                                        <i className="fa-solid fa-eye" />
                                                        View Property
                                                    </button>
                                                    <button
                                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                                                        onClick={() => handleStatusUpdate(payment.id, 'refunded')}
                                                    >
                                                        <i className="fa-solid fa-rotate-left" />
                                                        Refund
                                                    </button>
                                                </div>
                                            )}

                                            {(
                                                (payment.status === 'paid' && userRole === 'tenant') ||
                                                payment.status === 'failed' ||
                                                payment.status === 'refunded'
                                            ) && (
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--primary)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
                                                        onClick={() => handleViewDetails(payment.property_id)}
                                                    >
                                                        <i className="fa-solid fa-eye" />
                                                        View Property
                                                    </button>
                                                    <button
                                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-500 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                                                        onClick={() => handleDelete(payment.id)}
                                                    >
                                                        <i className="fa-solid fa-trash" />
                                                        Delete Record
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex flex-wrap justify-end gap-3">
                    <button
                        type="button"
                        onClick={goBack}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                    >
                        <i className="fa-solid fa-arrow-left" />
                        Go Back
                    </button>
                </div>
            </main>
        </section>
    );
}

export default PaymentHistory;