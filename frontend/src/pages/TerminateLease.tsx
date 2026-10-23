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
        <section id='terminateLeaseContainer' className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 font-[family-name:var(--font-body)] text-[var(--text)] sm:px-6">
            <header className="relative overflow-hidden rounded-2xl bg-[url('/Background.png')] bg-cover bg-center">
                <div className="absolute inset-0 bg-orange-600/70" />

                <div className="relative flex flex-col gap-2 px-6 py-10 sm:px-10">
                    {userRole === 'tenant' ? (
                        <>
                            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-white sm:text-3xl">Terminate Lease</h2>
                            <p className="max-w-2xl text-sm text-orange-50 sm:text-base">
                                You are about to terminate your lease for <strong>{property?.property_name}</strong>.
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-white sm:text-3xl">Access Denied</h2>
                            <p className="max-w-2xl text-sm text-orange-50 sm:text-base">
                                Only tenants can terminate leases. Please contact support if you believe this is an error.
                            </p>
                        </>
                    )}
                </div>
            </header>

            <main className="flex flex-col gap-6">
                {userRole === 'tenant' && (
                    <fieldset className="flex flex-col gap-4 rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
                        <legend className="px-2 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--primary-dark)]">Termination Details</legend>
                        <small className="text-sm text-gray-500">Once submitted, your lease will be ended and the property status will return to available.</small>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Reason for Termination <span className="text-red-500">*</span></label>
                            <textarea
                                rows={4}
                                placeholder="Provide your reason for terminating the lease..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                required
                                className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                            />
                        </div>
                    </fieldset>
                )}

                <div className="flex flex-wrap justify-end gap-3">
                    {userRole === 'tenant' && (
                        <button
                            type="button"
                            onClick={handleTerminate}
                            disabled={submitting}
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-500 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <i className="fa-solid fa-right-from-bracket" />
                            {submitting ? 'Processing...' : 'Confirm Termination'}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onCancel}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                    >
                        <i className="fa-solid fa-xmark" />
                        Cancel
                    </button>
                </div>
            </main>
        </section>
    );
}

export default TerminateLease;