import { useState, useEffect } from 'react'
import { authFetch } from '../utils/api';
import type { RentalApplicationsProps, RentalApplicationDataProps } from '../utils/props'
import ApplyRental from './ApplyRental';

function RentalApplications({ goBack, userId, userRole, onViewDetails }: RentalApplicationsProps) {
    const [applications, setApplications] = useState<RentalApplicationDataProps[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingApplication, setEditingApplication] = useState<RentalApplicationDataProps | null>(null);
    const [editingProperty, setEditingProperty] = useState<any | null>(null);

    const fetchApplications = async () => {
        setLoading(true);

        try {
            const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/applications/view?userId=${userId}&userRole=${userRole}`);
            const data = await response.json();
            setApplications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load applications", error);
        } finally {
            setLoading(false);
        }
    }

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

    const handleEditApplication = async (app: RentalApplicationDataProps) => {
        try {
            const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/properties/${app.property_id}`);
            if (response.ok) {
                const propertyData = await response.json();
                setEditingProperty(propertyData);
                setEditingApplication(app);
            }
        } catch (error) {
            console.error("Failed to fetch property details", error);
        }
    };

    useEffect(() => {
        if (userId) fetchApplications();
    }, [userId, userRole]);

    if (editingApplication) {
        return (
            <ApplyRental
                property={editingProperty}
                userId={userId}
                userRole={userRole}
                editMode={true}
                existingApplication={editingApplication}
                onSuccess={() => { setEditingApplication(null); setEditingProperty(null); fetchApplications(); }}
                onCancel={() => { setEditingApplication(null); setEditingProperty(null); }}
            />
        );
    }

    const handleStatusUpdate = async (appId: number, newStatus: string) => {
        const confirmed = window.confirm(
            `Are you sure you want to ${newStatus === 'approved' ? 'approve' : 'reject'} this application? This cannot be undone.`
        );
        if (!confirmed) return;

        try {
            const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/applications/${appId}/status`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ status: newStatus }),
                }
            );

            if (response.ok) {
                setApplications(prev =>
                    prev.map(app => app.id === appId ? { ...app, status: newStatus as any } : app)
                );
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error || 'Failed to update status'}`);
            }
        } catch (error) {
            console.error("Status update failed", error);
            alert("An error occurred while updating the application status.");
        }
    };

    const handleDeleteApplication = async (appId: number) => {
        const confirmed = window.confirm("Are you sure you want to delete this application? This cannot be undone.");
        if (!confirmed) return;

        try {
            const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/applications/${appId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert("Application deleted successfully.");
                fetchApplications();
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error || 'Failed to delete application'}`);
            }
        } catch (error) {
            console.error("Delete failed", error);
            alert("An error occurred while deleting the application.");
        }
    };

    return (
        <section id='rentalApplicationsContainer'>
            <header>
                <h2>{userRole === 'landlord' ? 'Manage Applications' : 'My Applications'}</h2>
                <p>
                    {userRole === 'landlord' 
                        ? 'Review potential tenants for your properties.' 
                        : 'Track the status of your rental requests.'
                    }
                </p>
            </header>

            <main className="appGrid">
                {loading ? (
                    <p className='loadingText'>Loading applications...</p>
                ) : applications.length === 0 ? (
                    <p className='loadingText'>No applications found.</p>
                ) : (
                    <div className='tableWrapper'>
                        <table>
                            <thead>
                                <tr>
                                    <th>Application ID</th>
                                    <th>Property Name</th>
                                    <th>Applicant Name</th>
                                    <th>Applicant Contact</th>
                                    <th>Applicant Email</th>
                                    <th>Date Applied</th>
                                    <th>Status</th>
                                    {userRole === 'landlord' && <th>Message</th>}
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {applications.map((app, index) => (
                                    <tr key={app.id}>
                                        <td>{index + 1}</td>
                                        <td>{app.property_name || '—'}</td>
                                        <td>{app.tenant_fullname || '—'}</td>
                                        <td>{app.tenant_contact || '—'}</td>
                                        <td>{app.tenant_email || '—'}</td>
                                        <td>{new Date(app.move_in_date || '—').toLocaleDateString()}</td>
                                        <td>
                                            <span className={`statusBadge ${app.status}`}>{app.status.charAt(0).toUpperCase() + app.status.slice(1) || '—'}</span>
                                        </td>
                                        {userRole === 'landlord' && <td>{!app.message ? "No message from applicant." : app.message }</td>}
                                        <td>
                                            {app.status === 'pending' ? (
                                                userRole === 'landlord' ? (
                                                    <div className="actionBtnWrapper">
                                                        <button className='viewBtn' onClick={() => handleViewDetails(app.property_id)}>View Property</button>
                                                        <button className="approveBtn" onClick={() => handleStatusUpdate(app.id, 'approved')}>Mark Approve</button>
                                                        <button className="rejectBtn" onClick={() => handleStatusUpdate(app.id, 'rejected')}>Mark Reject</button>
                                                        <button className="deleteBtn" onClick={() => handleDeleteApplication(app.id)}>Delete Application</button>
                                                    </div>
                                                ) : (
                                                    <div className="actionBtnWrapper">
                                                        <button className='viewBtn' onClick={() => handleViewDetails(app.property_id)}>View Property</button>
                                                        <button className="updateBtn" onClick={() => handleEditApplication(app)}>Update Details</button>
                                                        <button className="deleteBtn" onClick={() => handleDeleteApplication(app.id)}>Delete Application</button>
                                                    </div>
                                                )
                                            ) : app.status === 'approved' || app.status === 'rejected' || app.status === 'withdrawn' ? (
                                                <div className="actionBtnWrapper">
                                                    <button className='viewBtn' onClick={() => handleViewDetails(app.property_id)}>View Property</button>
                                                    <button className="deleteBtn" onClick={() => handleDeleteApplication(app.id)}>Delete Application</button>
                                                </div>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="btnWrapper">
                    <button type="button" className="backBtn" onClick={goBack}>Go Back</button>
                </div>
            </main>
        </section>
    )
}

export default RentalApplications