import { useState, useEffect } from 'react'
import { authFetch } from '../utils/api'
import type { MaintenanceRequestsDataProps, MaintenanceRequestsProps, PriorityLevel } from '../utils/props'
import CreateRequests from './CreateRequests'

const capitalize = (value?: string | null) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1) : '';

const statusIcons: Record<string, string> = {
    pending: 'fa-hourglass-half',
    finished: 'fa-circle-check',
    cancelled: 'fa-ban',
};

const priorityIcons: Record<string, string> = {
    low: 'fa-arrow-down',
    medium: 'fa-minus',
    high: 'fa-arrow-up',
    emergency: 'fa-triangle-exclamation',
};

function MaintenanceRequests({ goBack, userId, userRole, onViewDetails }: MaintenanceRequestsProps) {
    const [requests, setRequests] = useState<MaintenanceRequestsDataProps[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingRequest, setEditingRequest] = useState<MaintenanceRequestsDataProps | null>(null);
    const [editingProperty, setEditingProperty] = useState<any | null>(null);

    const fetchRequests = async () => {
        setLoading(true);

        try{
            const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/maintenance/view?userId=${userId}&userRole=${userRole}`)
            const data = await response.json();
            setRequests(Array.isArray(data) ? data : []);
        } catch(error) {
            console.log("Failed to load requests", error)
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

    const handleEditRequest = async (req: MaintenanceRequestsDataProps) => {
        try {
            const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/properties/${req.property_id}`);
            if (response.ok) {
                const propertyData = await response.json();
                setEditingProperty(propertyData);
                setEditingRequest(req);
            }
        } catch (error) {
            console.error("Failed to fetch property details", error);
        }
    };

    useEffect(() => {
        if (userId) fetchRequests();
    }, [userId, userRole]);

    if (editingRequest) {
        return (
            <CreateRequests
                property={editingProperty}
                userId={userId}
                userRole={userRole}
                editMode={true}
                existingRequest={editingRequest}
                onSuccess={() => { setEditingRequest(null); setEditingProperty(null); fetchRequests(); }}
                onCancel={() => { setEditingRequest(null); setEditingProperty(null); }}
            />
        );
    }

    const handleStatusUpdate = async (reqId: number, newStatus: string) => {
        const confirmed = window.confirm(
            `Are you sure you want to mark request #${reqId} as ${
                newStatus === 'finished' ? 'finished' :
                newStatus === 'cancelled' ? 'cancelled' : newStatus
            }? This cannot be undone.`
        );
        if (!confirmed) return;

        try {
            const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/maintenance/${reqId}/status`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ status: newStatus }),
                }
            );

            if (response.ok) {
                setRequests(prev =>
                    prev.map(req => req.id === reqId ? { ...req, status: newStatus as any } : req)
                );
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error || 'Failed to update status'}`);
            }
        } catch (error) {
            console.error("Status update failed", error);
            alert("An error occurred while updating the request status.");
        }
    };

    const handleDeleteRequest = async (reqId: number) => {
        const confirmed = window.confirm("Are you sure you want to delete this request? This cannot be undone.");
        if (!confirmed) return;

        try {
            const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/maintenance/${reqId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert("Application deleted successfully.");
                fetchRequests();
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error || 'Failed to delete request'}`);
            }
        } catch (error) {
            console.error("Delete failed", error);
            alert("An error occurred while deleting the request.");
        }
    };

    const getPriorityLabel = (priority: PriorityLevel) => {
        switch (priority) {
            case 'low': return 'Low (Routine)';
            case 'medium': return 'Moderate (Repair Soon)';
            case 'high': return 'High (Urgent)';
            case 'emergency': return 'Emergency (Critical)';
            default: return 'N/A';
        }
    };

    return (
        <section id='maintenanceRequestsContainer' className='fr-page container py-5'>
            <header className='fr-page-header'>
                <span className='fr-badge-icon'><i className='fa-solid fa-screwdriver-wrench' /></span>
                <h2>Maintenance Requests</h2>
                <p>Submit, track, and manage maintenance concerns related to your property or rental unit.</p>
            </header>
            
            <main>
                {loading ? (
                    <div className='fr-state loadingText'>
                        <div className='spinner-border text-primary mb-3' role='status' />
                        <p>Loading requests...</p>
                    </div>
                ) : requests.length === 0 ? (
                    <div className='fr-state fr-card loadingText'>
                        <i className='fa-solid fa-clipboard-list' />
                        <p>No requests found.</p>
                    </div>
                ) : (
                    <div className='tableWrapper fr-card overflow-hidden'>
                        <div className='d-flex align-items-center justify-content-between px-4 py-3 border-bottom'>
                            <span className='fw-semibold'><i className='fa-solid fa-list-check text-primary me-2' />All Requests</span>
                            <span className='fr-badge tone-pending'>{requests.length} total</span>
                        </div>

                        <div className='table-responsive'>
                            <table className='table table-hover align-middle fr-table'>
                                <thead>
                                    <tr>
                                        <th>Request ID</th>
                                        <th>Property Name</th>
                                        <th>Title of Issue</th>
                                        <th>Field of Issue</th>
                                        <th>Description</th>
                                        <th>Priority Level</th>
                                        <th>Status</th>
                                        <th>Date of Request</th>
                                        <th>Date of Accomplish</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {requests.map((req, index) => (
                                        <tr key={req.id}>
                                            <td className='fw-semibold text-secondary'>#{index + 1}</td>
                                            <td className='fw-semibold'>{req.property_name || '—'}</td>
                                            <td>{capitalize(req.issue_title) || '—'}</td>
                                            <td>{capitalize(req.issue_field) || '—'}</td>
                                            <td><span className='fr-desc'>{capitalize(req.issue_description) || 'No description of the issue available'}</span></td>
                                            <td>
                                                <span className={`statusBadge fr-badge tone-${req.priority}`}>
                                                    <i className={`fa-solid ${priorityIcons[req.priority] ?? 'fa-minus'}`} />
                                                    {getPriorityLabel(req.priority) || '—'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`statusBadge ${req.status} fr-badge tone-${req.status}`}>
                                                    <i className={`fa-solid ${statusIcons[req.status] ?? 'fa-circle'}`} />
                                                    {capitalize(req.status) || '—'}
                                                </span>
                                            </td>
                                            <td className='text-nowrap'>{req.request_date ? new Date(req.request_date).toLocaleDateString() : '—'}</td>
                                            <td className='text-nowrap'>{req.resolved_date || 'Not yet resolved'}</td>
                                            <td>
                                                {req.status === 'pending' ? (
                                                    userRole === 'landlord' ? (
                                                        <div className="actionBtnWrapper d-flex flex-wrap gap-1">
                                                            <button className="viewBtn btn btn-sm btn-outline-secondary" onClick={() => handleViewDetails(req.property_id)}>
                                                                <i className='fa-solid fa-eye' />View Property
                                                            </button>
                                                            <button className="finishedBtn btn btn-sm btn-success" onClick={() => handleStatusUpdate(req.id, 'finished')}>
                                                                <i className='fa-solid fa-circle-check' />Mark Finished
                                                            </button>
                                                            <button className="cancelledBtn btn btn-sm btn-outline-warning" onClick={() => handleStatusUpdate(req.id, 'cancelled')}>
                                                                <i className='fa-solid fa-ban' />Mark Cancelled
                                                            </button>
                                                            <button className="deleteBtn btn btn-sm btn-outline-danger" onClick={() => handleDeleteRequest(req.id)}>
                                                                <i className='fa-solid fa-trash' />Delete Request
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="actionBtnWrapper d-flex flex-wrap gap-1">
                                                            <button className="viewBtn btn btn-sm btn-outline-secondary" onClick={() => handleViewDetails(req.property_id)}>
                                                                <i className='fa-solid fa-eye' />View Property
                                                            </button>
                                                            <button className="updateBtn btn btn-sm btn-primary" onClick={() => handleEditRequest(req)}>
                                                                <i className='fa-solid fa-pen-to-square' />Update Details
                                                            </button>
                                                            <button className="cancelRequestBtn btn btn-sm btn-outline-warning" onClick={() => handleStatusUpdate(req.id, 'cancelled')}>
                                                                <i className='fa-solid fa-xmark' />Cancel Request
                                                            </button>
                                                            <button className="deleteBtn btn btn-sm btn-outline-danger" onClick={() => handleDeleteRequest(req.id)}>
                                                                <i className='fa-solid fa-trash' />Delete Request
                                                            </button>
                                                        </div>
                                                    )
                                                ) : req.status === 'finished' || req.status === 'cancelled' ? (
                                                    <div className="actionBtnWrapper d-flex flex-wrap gap-1">
                                                        <button className="viewBtn btn btn-sm btn-outline-secondary" onClick={() => handleViewDetails(req.property_id)}>
                                                            <i className='fa-solid fa-eye' />View Property
                                                        </button>
                                                        <button className="deleteBtn btn btn-sm btn-outline-danger" onClick={() => handleDeleteRequest(req.id)}>
                                                            <i className='fa-solid fa-trash' />Delete Request
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="btnWrapper d-flex justify-content-center mt-4">
                    <button type="button" className="backBtn btn btn-outline-primary px-4" onClick={goBack}>
                        <i className='fa-solid fa-arrow-left' />Go Back
                    </button>
                </div>
            </main>
        </section>
    )
}

export default MaintenanceRequests
