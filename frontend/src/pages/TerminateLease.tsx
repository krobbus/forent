import { useState } from 'react';
import { authFetch } from '../utils/api';
import type { TerminateLeaseProps } from '../utils/props';

function TerminateLease({ property, userId, userRole, onSuccess, onCancel }: TerminateLeaseProps) {
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleTerminate = async () => {
        if (!reason.trim()) {
            alert("Please provide a reason for termination.");
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to terminate your lease for "${property?.property_name}"? This action cannot be undone.`
        );
        if (!confirmed) return;

        setSubmitting(true);
        try {
            const response = await authFetch(
                `${import.meta.env.VITE_API_URL}/api/properties/${property.id}/terminate`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ tenant_id: userId, reason }),
                }
            );

            if (response.ok) {
                alert("Lease terminated successfully. The property is now available.");
                onSuccess();
            } else {
                const data = await response.json();
                alert(data.error || "Failed to terminate lease.");
            }
        } catch (error) {
            console.error("Termination error:", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (     
        <section id='terminateLeaseContainer'>
            <header>
                {userRole === 'tenant' ? (
                    <>
                        <h2>Terminate Lease</h2>
                        <p>You are about to terminate your lease for <strong>{property?.property_name}</strong>.</p>
                    </>
                ) : (
                    <>
                        <h2>Access Denied</h2>
                        <p>Only tenants can terminate leases. Please contact support if you believe this is an error.</p>
                    </>
                )}
            </header>

            <main>
                <fieldset>
                    <legend>Termination Details</legend>
                    <small>Once submitted, your lease will be ended and the property status will return to available.</small>

                    <div className='fieldGroup'>
                        <label>Reason for Termination <span style={{ color: 'red' }}>*</span></label>
                        <textarea
                            rows={4}
                            placeholder="Provide your reason for terminating the lease..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        />
                    </div>
                </fieldset>

                <div className='btnWrapper'>
                    {userRole === 'tenant' && (
                        <button
                            className='deleteBtn'
                            onClick={handleTerminate}
                            disabled={submitting}
                        >
                            {submitting ? 'Processing...' : 'Confirm Termination'}
                        </button>
                    )}

                    <button className='cancelBtn' onClick={onCancel}>Cancel</button>
                </div>
            </main>
        </section>
    );
}

export default TerminateLease;