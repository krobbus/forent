import { useState, useEffect } from 'react'
import { authFetch } from '../utils/api'
import type { MaintenanceRequestsDataProps, MaintenanceRequestsProps, PriorityLevel, RequestStatus } from '../utils/props'
import CreateRequests from './CreateRequests'

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
                alert("Request deleted successfully.");
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

    const getPriorityColor = (priority: PriorityLevel) => {
        switch (priority) {
            case 'low': return 'bg-emerald-50 text-emerald-700';
            case 'medium': return 'bg-amber-50 text-amber-700';
            case 'high': return 'bg-orange-100 text-[var(--primary-dark)]';
            case 'emergency': return 'bg-red-50 text-red-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusColor = (status: RequestStatus) => {
        switch (status) {
            case 'pending': return 'bg-amber-50 text-amber-700';
            case 'in_progress': return 'bg-blue-50 text-blue-700';
            case 'finished': return 'bg-emerald-50 text-emerald-700';
            case 'cancelled': return 'bg-gray-100 text-gray-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusLabel = (status: RequestStatus) => {
        if (!status) return '—';
        const label = status.replace('_', ' ');
        return label.charAt(0).toUpperCase() + label.slice(1);
    };

    return (
        <section id='maintenanceRequestsContainer' className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 font-[family-name:var(--font-body)] text-[var(--text)] sm:px-6">
            <header className="relative overflow-hidden rounded-2xl bg-[url('/Background.png')] bg-cover bg-center">
                <div className="absolute inset-0 bg-orange-600/70" />

                <div className="relative flex flex-col gap-2 px-6 py-10 sm:px-10">
                    <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-white sm:text-3xl">Maintenance Requests</h2>
                    <p className="max-w-2xl text-sm text-orange-50 sm:text-base">Submit, track, and manage maintenance concerns related to your property or rental unit.</p>
                </div>
            </header>
            
            <main className="flex flex-col gap-6">
                {loading ? (
                    <p className="py-12 text-center text-sm text-gray-500">Loading requests...</p>
                ) : requests.length === 0 ? (
                    <p className="py-12 text-center text-sm text-gray-500">No requests found.</p>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-orange-100 bg-white shadow-sm">
                        <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                            <thead className="bg-[var(--primary-soft)]">
                                <tr className="border-b border-orange-100">
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Request ID</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Property Name</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Title of Issue</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Field of Issue</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Description</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Priority Level</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Status</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Date of Request</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Date of Accomplish</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {requests.map((req, index) => (
                                    <tr key={req.id} className="border-b border-orange-100 align-top transition-colors last:border-b-0 hover:bg-[var(--primary-soft)]/50">
                                        <td className="px-4 py-3 font-semibold text-[var(--text)]">{index + 1}</td>
                                        <td className="px-4 py-3 text-gray-600">{req.property_name || '—'}</td>
                                        <td className="px-4 py-3 font-medium text-[var(--text)]">{req.issue_title ? req.issue_title.charAt(0).toUpperCase() + req.issue_title.slice(1) : '—'}</td>
                                        <td className="px-4 py-3 text-gray-600">{req.issue_field ? req.issue_field.charAt(0).toUpperCase() + req.issue_field.slice(1) : '—'}</td>
                                        <td className="max-w-xs px-4 py-3 leading-relaxed text-gray-600">{req.issue_description ? req.issue_description.charAt(0).toUpperCase() + req.issue_description.slice(1) : 'No description of the issue available'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getPriorityColor(req.priority)}`}>
                                                {getPriorityLabel(req.priority) || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(req.status)}`}>
                                                {getStatusLabel(req.status)}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-600">{req.request_date ? new Date(req.request_date).toLocaleDateString() : '—'}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-600">{req.resolved_date ? new Date(req.resolved_date).toLocaleDateString() : 'Not yet resolved'}</td>
                                        <td className="px-4 py-3">
                                            {req.status === 'pending' ? (
                                                userRole === 'landlord' ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--primary)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
                                                            onClick={() => handleViewDetails(req.property_id)}
                                                        >
                                                            <i className="fa-solid fa-eye" />
                                                            View Property
                                                        </button>
                                                        <button
                                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)]"
                                                            onClick={() => handleStatusUpdate(req.id, 'finished')}
                                                        >
                                                            <i className="fa-solid fa-check" />
                                                            Mark Finished
                                                        </button>
                                                        <button
                                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                                                            onClick={() => handleStatusUpdate(req.id, 'cancelled')}
                                                        >
                                                            <i className="fa-solid fa-ban" />
                                                            Mark Cancelled
                                                        </button>
                                                        <button
                                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-500 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                                                            onClick={() => handleDeleteRequest(req.id)}
                                                        >
                                                            <i className="fa-solid fa-trash" />
                                                            Delete Request
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--primary)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
                                                            onClick={() => handleViewDetails(req.property_id)}
                                                        >
                                                            <i className="fa-solid fa-eye" />
                                                            View Property
                                                        </button>
                                                        <button
                                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)]"
                                                            onClick={() => handleEditRequest(req)}
                                                        >
                                                            <i className="fa-solid fa-pen-to-square" />
                                                            Update Details
                                                        </button>
                                                        <button
                                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                                                            onClick={() => handleStatusUpdate(req.id, 'cancelled')}
                                                        >
                                                            <i className="fa-solid fa-ban" />
                                                            Cancel Request
                                                        </button>
                                                        <button
                                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-500 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                                                            onClick={() => handleDeleteRequest(req.id)}
                                                        >
                                                            <i className="fa-solid fa-trash" />
                                                            Delete Request
                                                        </button>
                                                    </div>
                                                )
                                            ) : req.status === 'finished' || req.status === 'cancelled' ? (
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--primary)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
                                                        onClick={() => handleViewDetails(req.property_id)}
                                                    >
                                                        <i className="fa-solid fa-eye" />
                                                        View Property
                                                    </button>
                                                    <button
                                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-500 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                                                        onClick={() => handleDeleteRequest(req.id)}
                                                    >
                                                        <i className="fa-solid fa-trash" />
                                                        Delete Request
                                                    </button>
                                                </div>
                                            ) : null}
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
    )
}

export default MaintenanceRequests