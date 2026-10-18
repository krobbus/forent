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
   
     const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
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
        <section id="applyRentalContainer" className="fr-page container py-5">
            <header className="fr-page-header">
                <span className="fr-badge-icon"><i className={`fa-solid ${editMode ? 'fa-pen-to-square' : 'fa-file-signature'}`} /></span>
                <h2>{editMode ? 'Update Application' : 'Apply For Rental'}</h2>
                <p>You're applying for <strong>{property?.property_name ?? 'this Property'}</strong></p>
            </header>

            {property && (
                <div className="fr-card p-3 p-md-4 mb-4">
                    <ViewDetails 
                        property={property}
                        showHeader={false}
                        showActions={false}
                    />
                </div>
            )}

            {loading ? (
                <div className="fr-state loadingText">
                    <div className="spinner-border text-primary mb-3" role="status" />
                    <p>Loading Details...</p>
                </div>
            ) : userRole !== 'tenant' ? (
                <div className="fr-state loadingText">
                    <i className="fa-solid fa-user-lock" />
                    <p>Only verified tenants are allowed to apply for properties.</p>
                </div>
            ) : (
                <main>
                    <form className="applyForm" onSubmit={handleSubmit}>
                        <div className="row g-4">
                            <div className="col-lg-5">
                                <fieldset className="verificationSection fr-fieldset">
                                    <legend><i className="fa-solid fa-user-shield" />Account Verification</legend>

                                    <div className="formGroup mb-3">
                                        <label className="form-label">Tenant ID</label>
                                        <div className="input-group">
                                            <span className="input-group-text"><i className="fa-solid fa-hashtag" /></span>
                                            <input 
                                                type="text" 
                                                value={userId} 
                                                disabled 
                                                className="disabledInput form-control"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="formGroup mb-3">
                                        <label className="form-label">Full Name</label>
                                        <div className="input-group">
                                            <span className="input-group-text"><i className="fa-solid fa-user" /></span>
                                            <input 
                                                type="text" 
                                                value={full_name} 
                                                disabled 
                                                className="disabledInput form-control"
                                            />
                                        </div>
                                    </div>

                                    <div className="formGroup mb-3">
                                        <label className="form-label">Application Email <span className="text-danger">*</span></label>
                                        <div className="input-group">
                                            <span className="input-group-text"><i className="fa-solid fa-envelope" /></span>
                                            <input 
                                                type="email" 
                                                className="form-control"
                                                placeholder="XXXXXXX@XXXXX.com"
                                                value={formData.tenantEmail}
                                                onChange={(e) => setFormData({...formData, tenantEmail: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="formGroup">
                                        <label className="form-label">Application Contact Number (Optional)</label>
                                        <div className="input-group">
                                            <span className="input-group-text"><i className="fa-solid fa-phone" /></span>
                                            <input 
                                                type="tel" 
                                                className="form-control"
                                                placeholder="09XXXXXXXXX"
                                                value={formData.tenantContact}
                                                onChange={(e) => setFormData({...formData, tenantContact: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </fieldset>
                            </div>

                            <div className="col-lg-7">
                                <fieldset className="applicationDetails fr-fieldset">
                                    <legend><i className="fa-solid fa-file-contract" />Lease Information</legend>

                                    <div className="formGroup mb-3">
                                        <label className="form-label">Preferred Move-in Date <span className="text-danger">*</span></label>
                                        <div className="input-group">
                                            <span className="input-group-text"><i className="fa-solid fa-calendar-days" /></span>
                                            <input 
                                                type="date" 
                                                className="form-control"
                                                required 
                                                value={formData.moveInDate}
                                                onChange={(e) => setFormData({...formData, moveInDate: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="formGroup mb-3">
                                        <label className="form-label">Lease Duration (Months) <span className="text-danger">*</span></label>
                                        <div className="input-group">
                                            <span className="input-group-text"><i className="fa-solid fa-hourglass-half" /></span>
                                            <select 
                                                className="form-select"
                                                value={formData.leaseTerm}
                                                onChange={(e) => setFormData({...formData, leaseTerm: e.target.value})}
                                            >
                                                <option value="">Select Lease Term</option>
                                                <option value="6">6 Months</option>
                                                <option value="12">12 Months</option>
                                                <option value="24">24 Months</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="formGroup">
                                        <label className="form-label">Message to Landlord (Optional)</label>
                                        <textarea 
                                            className="form-control"
                                            placeholder="Tell the landlord a bit about yourself..."
                                            rows={6}
                                            value={formData.message}
                                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                                        />
                                    </div>
                                </fieldset>
                            </div>
                        </div>

                        <div className="btnWrapper d-flex flex-wrap justify-content-center gap-2 mt-4">
                            {userRole === 'tenant' ? (
                                <>
                                    <button type="submit" className="submitBtn btn btn-primary btn-lg px-4" disabled={submitting}>
                                        <i className={`fa-solid ${submitting ? 'fa-spinner fa-spin' : editMode ? 'fa-floppy-disk' : 'fa-paper-plane'}`} />
                                        {submitting 
                                        ? 'Saving...' : editMode 
                                        ? 'Save Changes' : 'Submit Application'}
                                    </button>

                                    <button type="button" className="cancelBtn btn btn-outline-secondary btn-lg px-4" onClick={onCancel}>
                                        <i className="fa-solid fa-xmark" />Cancel
                                    </button>
                                </>
                            ) : (
                                <button type="button" className="cancelBtn btn btn-outline-secondary btn-lg px-4" onClick={onCancel}>
                                    <i className="fa-solid fa-xmark" />Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </main>
            )}
        </section>
    );
}

export default ApplyRental
