import { useState, useEffect, useMemo } from 'react';
import { authFetch } from '../utils/api';
import type { ProfileDataProps, CreateRequestsProps } from '../utils/props';
import ViewDetails from './ViewDetails';

function CreateRequests({ property, userId, userRole, onSuccess, onCancel, editMode = false, existingRequest = null }: CreateRequestsProps) {
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<ProfileDataProps | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        priorityLevel: existingRequest?.priority != null ? String(existingRequest.priority) : '',
        issueTitle: existingRequest?.issue_title ?? '',
        issueField: existingRequest?.issue_field != null ? String(existingRequest.issue_field) : '',
        issueDescription: existingRequest?.issue_description ?? '',
        tenantEmail: existingRequest?.tenant_email ?? '',
        tenantContact: existingRequest?.tenant_contact ?? '',
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

        const requestsData = {
            priority: formData.priorityLevel,
            issue_title: formData.issueTitle,
            issue_field: formData.issueField,
            issue_description: formData.issueDescription,
            tenant_contact: formData.tenantContact,
            tenant_email: formData.tenantEmail
        };

        try {
            const url = editMode
                ? `${import.meta.env.VITE_API_URL}/api/maintenance/${existingRequest?.id}`
                : `${import.meta.env.VITE_API_URL}/api/maintenance`;
            
            const method = editMode ? 'PATCH' : 'POST';
            const body = editMode ? requestsData : {
                property_id: property?.id,
                tenant_id: userId,
                tenant_fullname: full_name,
                status: 'pending',
                ...requestsData,
            };

            const response = await authFetch(url, {
                method,
                body: JSON.stringify(body),
            });

            if (response.ok) {
                alert(editMode 
                    ? 'Request updated successfully!' 
                    : `Request for ${property?.property_name} submitted successfully!`
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
        <section id="applyMaintenanceContainer" className="fr-page container py-5">
            <header className="fr-page-header">
                <span className="fr-badge-icon"><i className="fa-solid fa-screwdriver-wrench" /></span>
                <h2>{editMode ? 'Update' : 'Create'} Maintenance Request</h2>
                <p>You're creating maintenance request for <strong>{property?.property_name ?? 'this Property'}</strong></p>
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
                    <p>Only verified tenants are allowed to create for requests.</p>
                </div>
            ) : (
                <main>
                    <form onSubmit={handleSubmit}>
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
                                    <legend><i className="fa-solid fa-clipboard-list" />Request Information</legend>

                                    <div className="formGroup mb-3">
                                        <label className="form-label">Title of Issue <span className="text-danger">*</span></label>
                                        <div className="input-group">
                                            <span className="input-group-text"><i className="fa-solid fa-heading" /></span>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                placeholder="Enter the title of your issue..."
                                                value={formData.issueTitle}
                                                onChange={(e) => setFormData({...formData, issueTitle: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="row g-3 mb-3">
                                        <div className="formGroup col-md-6">
                                            <label className="form-label">Category of Issue <span className="text-danger">*</span></label>
                                            <div className="input-group">
                                                <span className="input-group-text"><i className="fa-solid fa-toolbox" /></span>
                                                <select 
                                                    className="form-select"
                                                    value={formData.issueField}
                                                    onChange={(e) => setFormData({...formData, issueField: e.target.value})}
                                                    required
                                                >
                                                    <option value="" className='default'>Select Category</option>
                                                    <option value='plumbing'>Plumbing</option>
                                                    <option value='electrical'>Electrical</option>
                                                    <option value='hvac'>Heating/Cooling</option>
                                                    <option value='appliances'>Appliances</option>
                                                    <option value='structural'>Structural/Carpentry</option>
                                                    <option value='safety'>Safety & Security</option>
                                                    <option value='other'>Other</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="formGroup col-md-6">
                                            <label className="form-label">Priority Level <span className="text-danger">*</span></label>
                                            <div className="input-group">
                                                <span className="input-group-text"><i className="fa-solid fa-flag" /></span>
                                                <select 
                                                    className="form-select"
                                                    value={formData.priorityLevel}
                                                    onChange={(e) => setFormData({...formData, priorityLevel: e.target.value})}
                                                    required
                                                >
                                                    <option value="" className='default'>Select Priority</option>
                                                    <option value='low'>Low (Routine)</option>
                                                    <option value='medium'>Moderate (Repair Soon)</option>
                                                    <option value='high'>High (Urgent)</option>
                                                    <option value='emergency'>Emergency (Safety Risk)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="formGroup">
                                        <label className="form-label">Description of the Issue <span className="text-danger">*</span></label>
                                        <textarea 
                                            className="form-control"
                                            placeholder="Tell the issue or concern on your property..."
                                            rows={5}
                                            value={formData.issueDescription}
                                            onChange={(e) => setFormData({...formData, issueDescription: e.target.value})}
                                            required
                                        />
                                    </div>
                                </fieldset>
                            </div>
                        </div>

                        <div className="btnWrapper d-flex flex-wrap justify-content-center gap-2 mt-4">
                            {userRole !== 'tenant' ? (
                                <button type="button" className="cancelBtn btn btn-outline-secondary btn-lg px-4" onClick={onCancel}>
                                    <i className="fa-solid fa-xmark" />Cancel
                                </button>
                            ) : (
                                <>
                                    <button type="submit" className="submitBtn btn btn-primary btn-lg px-4" disabled={submitting}>
                                        <i className={`fa-solid ${submitting ? 'fa-spinner fa-spin' : editMode ? 'fa-floppy-disk' : 'fa-paper-plane'}`} />
                                        {submitting 
                                        ? 'Saving...' : editMode 
                                        ? 'Save Changes' : 'Submit Request'}
                                    </button>

                                    <button type="button" className="cancelBtn btn btn-outline-secondary btn-lg px-4" onClick={onCancel}>
                                        <i className="fa-solid fa-xmark" />Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    </form>
                </main>
            )}
        </section>
    );
}

export default CreateRequests
