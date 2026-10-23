import { useState, useEffect } from 'react'
import { authFetch } from '../utils/api';
import type { RentalApplicationsProps, RentalApplicationDataProps, ApplicationStatus } from '../utils/props'
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

    const getStatusColor = (status: ApplicationStatus) => {
        switch (status) {
            case 'pending': return 'bg-amber-50 text-amber-700';
            case 'approved': return 'bg-emerald-50 text-emerald-700';
            case 'rejected': return 'bg-red-50 text-red-600';
            case 'withdrawn': return 'bg-gray-100 text-gray-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusLabel = (status: ApplicationStatus) => {
        if (!status) return '—';
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    return (
        <section id='rentalApplicationsContainer' className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 font-[family-name:var(--font-body)] text-[var(--text)] sm:px-6">
            <header className="relative overflow-hidden rounded-2xl bg-[url('/Background.png')] bg-cover bg-center">
                <div className="absolute inset-0 bg-orange-600/70" />

                <div className="relative flex flex-col gap-2 px-6 py-10 sm:px-10">
                    <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-white sm:text-3xl">{userRole === 'landlord' ? 'Manage Applications' : 'My Applications'}</h2>
                    <p className="max-w-2xl text-sm text-orange-50 sm:text-base">
                        {userRole === 'landlord' 
                            ? 'Review potential tenants for your properties.' 
                            : 'Track the status of your rental requests.'
                        }
                    </p>
                </div>
            </header>

            <main className="flex flex-col gap-6">
                {loading ? (
                    <p className="py-12 text-center text-sm text-gray-500">Loading applications...</p>
                ) : applications.length === 0 ? (
                    <p className="py-12 text-center text-sm text-gray-500">No applications found.</p>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-orange-100 bg-white shadow-sm">
                        <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                            <thead className="bg-[var(--primary-soft)]">
                                <tr className="border-b border-orange-100">
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Application ID</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Property Name</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Applicant Name</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Applicant Contact</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Applicant Email</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Move-in Date</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Status</th>
                                    {userRole === 'landlord' && <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Message</th>}
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary-dark)]">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {applications.map((app, index) => (
                                    <tr key={app.id} className="border-b border-orange-100 align-top transition-colors last:border-b-0 hover:bg-[var(--primary-soft)]/50">
                                        <td className="px-4 py-3 font-semibold text-[var(--text)]">{index + 1}</td>
                                        <td className="px-4 py-3 font-medium text-[var(--text)]">{app.property_name || '—'}</td>
                                        <td className="px-4 py-3 text-gray-600">{app.tenant_fullname || '—'}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-600">{app.tenant_contact || '—'}</td>
                                        <td className="px-4 py-3 text-gray-600">{app.tenant_email || '—'}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-600">{app.move_in_date ? new Date(app.move_in_date).toLocaleDateString() : '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(app.status)}`}>
                                                {getStatusLabel(app.status)}
                                            </span>
                                        </td>
                                        {userRole === 'landlord' && (
                                            <td className="max-w-xs px-4 py-3 leading-relaxed text-gray-600">
                                                {!app.message ? "No message from applicant." : app.message}
                                            </td>
                                        )}
                                        <td className="px-4 py-3">
                                            {app.status === 'pending' ? (
                                                userRole === 'landlord' ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--primary)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
                                                            onClick={() => handleViewDetails(app.property_id)}
                                                        >
                                                            <i className="fa-solid fa-eye" />
                                                            View Property
                                                        </button>
                                                        <button
                                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)]"
                                                            onClick={() => handleStatusUpdate(app.id, 'approved')}
                                                        >
                                                            <i className="fa-solid fa-check" />
                                                            Mark Approve
                                                        </button>
                                                        <button
                                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                                                            onClick={() => handleStatusUpdate(app.id, 'rejected')}
                                                        >
                                                            <i className="fa-solid fa-ban" />
                                                            Mark Reject
                                                        </button>
                                                        <button
                                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-500 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                                                            onClick={() => handleDeleteApplication(app.id)}
                                                        >
                                                            <i className="fa-solid fa-trash" />
                                                            Delete Application
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--primary)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
                                                            onClick={() => handleViewDetails(app.property_id)}
                                                        >
                                                            <i className="fa-solid fa-eye" />
                                                            View Property
                                                        </button>
                                                        <button
                                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)]"
                                                            onClick={() => handleEditApplication(app)}
                                                        >
                                                            <i className="fa-solid fa-pen-to-square" />
                                                            Update Details
                                                        </button>
                                                        <button
                                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-500 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                                                            onClick={() => handleDeleteApplication(app.id)}
                                                        >
                                                            <i className="fa-solid fa-trash" />
                                                            Delete Application
                                                        </button>
                                                    </div>
                                                )
                                            ) : app.status === 'approved' || app.status === 'rejected' || app.status === 'withdrawn' ? (
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--primary)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
                                                        onClick={() => handleViewDetails(app.property_id)}
                                                    >
                                                        <i className="fa-solid fa-eye" />
                                                        View Property
                                                    </button>
                                                    <button
                                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-500 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                                                        onClick={() => handleDeleteApplication(app.id)}
                                                    >
                                                        <i className="fa-solid fa-trash" />
                                                        Delete Application
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

export default RentalApplications