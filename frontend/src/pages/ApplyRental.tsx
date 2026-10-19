import { useState, useEffect, useMemo } from 'react';
import { authFetch } from '../utils/api';
import type { ProfileDataProps, ApplyRentalProps } from '../utils/props';
import ViewDetails from './ViewDetails';

function ApplyRental({ property, userId, userRole, onSuccess, onCancel, editMode = false, existingApplication = null }: ApplyRentalProps) {
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<ProfileDataProps | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        moveInDate: existingApplication?.move_in_date ? existingApplication.move_in_date.slice(0, 10) : '',
        leaseTerm: existingApplication?.lease_term != null ? String(existingApplication.lease_term) : '',
        message: existingApplication?.message ?? '',
        tenantContact: existingApplication?.tenant_contact ?? '',
        tenantEmail: existingApplication?.tenant_email ?? ''
    });

    const full_name = useMemo(() => {
        return[
            profile?.first_name, 
            profile?.middle_name, 
            profile?.last_name, 
            profile?.ext_name
        ].filter(Boolean).join(' ');
    }, [profile]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/tenants/${userId}`);
                if (response.ok) {
                    const data = await response.json();
                    setProfile(data);
                    if (!editMode) {
                        setFormData(prev => ({ 
                            ...prev, tenantContact: data.contact_num || '', tenantEmail: data.email || '' 
                        }))
                    };
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        userId ? fetchProfile() : setLoading(false);
    }, [userId]);
   
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);

        const applicationData = {
            move_in_date: formData.moveInDate,
            tenant_contact: formData.tenantContact,
            tenant_email: formData.tenantEmail,
            lease_term: formData.leaseTerm,
            message: formData.message,
        };

        try {
            const url = editMode
                ? `${import.meta.env.VITE_API_URL}/api/applications/${existingApplication?.id}`
                : `${import.meta.env.VITE_API_URL}/api/applications`;
            
            const method = editMode ? 'PATCH' : 'POST';
            const body = editMode ? applicationData : {
                property_id: property?.id,
                tenant_id: userId,
                tenant_fullname: full_name,
                status: 'pending',
                ...applicationData,
            };

            const response = await authFetch(url, {
                method,
                body: JSON.stringify(body),
            });

            if (response.ok) {
                alert(editMode 
                    ? 'Application updated successfully!' 
                    : `Application for ${property?.property_name} submitted successfully!`
                );
                onSuccess();
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error || 'Failed to submit'}`);
            }
        } catch (error) {
            console.error("Submission failed", error);
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };

    return (
        <section id="applyRentalContainer" className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 font-[family-name:var(--font-body)] text-[var(--text)] sm:px-6">
            <header className="relative overflow-hidden rounded-2xl bg-[url('/Background.png')] bg-cover bg-center">
                <div className="absolute inset-0 bg-orange-600/70" />

                <div className="relative flex flex-col gap-2 px-6 py-10 sm:px-10">
                    <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-white sm:text-3xl">{editMode ? 'Update Application' : 'Apply For Rental'}</h2>
                    <p className="max-w-2xl text-sm text-orange-50 sm:text-base">You're applying for <strong>{property?.property_name ?? 'this Property'}</strong></p>
                </div>
            </header>

            {property && (
                <ViewDetails 
                    property={property}
                    showHeader={false}
                    showActions={false}
                />
            )}

            {loading ? (
                <p className="py-12 text-center text-sm text-gray-500">Loading Details...</p>
            ) : userRole !== 'tenant' ? (
                <p className="py-12 text-center text-sm text-gray-500">Only verified tenants are allowed to apply for properties.</p>
            ) : (
                <main className="mx-auto w-full max-w-3xl">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <fieldset className="flex flex-col gap-4 rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
                            <legend className="px-2 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--primary-dark)]">Account Verification</legend>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">Tenant ID</label>
                                    <input 
                                        type="text" 
                                        value={userId} 
                                        disabled 
                                        className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500"
                                    />
                                </div>
                                
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                                    <input 
                                        type="text" 
                                        value={full_name} 
                                        disabled 
                                        className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">Application Email <span className="text-red-500">*</span></label>
                                    <input 
                                        type="email" 
                                        placeholder="XXXXXXX@XXXXX.com"
                                        value={formData.tenantEmail}
                                        onChange={(e) => setFormData({...formData, tenantEmail: e.target.value})}
                                        required
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">Application Contact Number (Optional)</label>
                                    <input 
                                        type="tel" 
                                        placeholder="09XXXXXXXXX"
                                        value={formData.tenantContact}
                                        onChange={(e) => setFormData({...formData, tenantContact: e.target.value})}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                    />
                                </div>
                            </div>
                        </fieldset>

                        <fieldset className="flex flex-col gap-4 rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
                            <legend className="px-2 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--primary-dark)]">Lease Information</legend>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">Preferred Move-in Date <span className="text-red-500">*</span></label>
                                    <input 
                                        type="date" 
                                        required 
                                        value={formData.moveInDate}
                                        onChange={(e) => setFormData({...formData, moveInDate: e.target.value})}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">Lease Duration (Months) <span className="text-red-500">*</span></label>
                                    <select 
                                        value={formData.leaseTerm}
                                        onChange={(e) => setFormData({...formData, leaseTerm: e.target.value})}
                                        required
                                        className="w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                    >
                                        <option value="">Select Lease Term</option>
                                        <option value="6">6 Months</option>
                                        <option value="12">12 Months</option>
                                        <option value="24">24 Months</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Message to Landlord (Optional)</label>
                                <textarea 
                                    placeholder="Tell the landlord a bit about yourself..."
                                    rows={4}
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                    className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                />
                            </div>
                        </fieldset>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <i className={`fa-solid ${editMode ? 'fa-floppy-disk' : 'fa-paper-plane'}`} />
                                {submitting 
                                ? 'Saving...' : editMode 
                                ? 'Save Changes' : 'Submit Application'}
                            </button>

                            <button
                                type="button"
                                onClick={onCancel}
                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                            >
                                <i className="fa-solid fa-xmark" />
                                Cancel
                            </button>
                        </div>
                    </form>
                </main>
            )}
        </section>
    );
}

export default ApplyRental