import { useEffect, useState } from 'react';
import { authFetch } from '../utils/api';
import type { PropertyDataProps, RentalApplicationDataProps, ViewDetailsProps } from '../utils/props';
import PropertyGallery from '../components/PropertyGallery';

function ViewDetails({ goBack, userRole, userId, property, showHeader = true, showActions = true, onViewApplyRental, onViewRentalApplications, onTerminateLease }: ViewDetailsProps) {
    const [loading, setLoading] = useState(true);
    const [properties, setProperties] = useState<PropertyDataProps[]>([])
    const [applications, checkApplications] = useState<RentalApplicationDataProps[]>([])

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/properties`);
                const data = await response.json();
                setProperties(data);
            } catch (error) {
                console.error("Error fetching properties:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, []);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const fetchApplications = async () => {
            setLoading(true);

            try {
                const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/applications/view?userId=${userId}&userRole=${userRole}`);
                const data = await response.json();
                checkApplications(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Failed to load applications", error);
            } finally {
                setLoading(false);
            }
        }

        fetchApplications();
    }, []);

    useEffect(() => {
        if (!property?.id) return;

        fetch(`${import.meta.env.VITE_API_URL}/api/analytics/properties/${property.id}/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ viewer_user_id: userId || null }),
        }).catch(() => {});
    }, [property?.id]);

    return (
        <section id='viewDetailsContainer' className={`mx-auto flex w-full max-w-6xl flex-col gap-6 font-[family-name:var(--font-body)] text-[var(--text)] ${showHeader ? 'px-4 py-8 sm:px-6' : ''}`}>
            {showHeader && (
                <header className="relative overflow-hidden rounded-2xl bg-[url('/Background.png')] bg-cover bg-center">
                    <div className="absolute inset-0 bg-orange-600/70" />

                    <div className="relative flex flex-col gap-2 px-6 py-10 sm:px-10">
                        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-white sm:text-3xl">View Property Details</h2>
                        <p className="max-w-2xl text-sm text-orange-50 sm:text-base">Review the complete information and specifications of this property listing.</p>
                    </div>
                </header>
            )}

            {loading ? (
                <p className="py-12 text-center text-sm text-gray-500">Loading property details...</p>
            ) : !property ? (
                <p className="py-12 text-center text-sm text-gray-500">No property selected.</p>
            ) : (
                <>
                    {properties.length > 0 &&
                        <>
                            <div className="grid grid-cols-1 gap-6 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm lg:grid-cols-2">
                                <div className="flex flex-col gap-5">
                                    <PropertyGallery
                                        variant='details'
                                        images={Array.isArray(property.images) 
                                            ? property.images 
                                            : JSON.parse(property.images || '[]'
                                        )}
                                    />

                                    <div className="flex flex-col gap-1">
                                        <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--text)]">{property.property_name}</h3>
                                        <p className="flex items-center gap-2 text-sm text-gray-500">
                                            <i className="fa-solid fa-location-dot text-[var(--primary)]" />
                                            {property.address ? `${property.address}` : 'No address available'}
                                        </p>
                                        <p className="flex items-center gap-2 text-sm text-gray-500">
                                            <i className="fa-solid fa-house text-[var(--primary)]" />
                                            {property.category.charAt(0).toUpperCase() + property.category.slice(1)}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 border-t border-orange-100 pt-4">
                                        <p className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--primary)]">
                                            ₱ {Number(property.price).toLocaleString()}
                                            <span className="text-xs font-medium text-gray-400"> /mo</span>
                                        </p>

                                        <p className={`rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm ${property.status === 'available' ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                                            {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                                        </p>

                                        {property.status === 'rented' && property.tenant_first_name && (
                                            <p className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-[var(--primary-dark)]">
                                                <i className="fa-solid fa-user" />
                                                <strong>
                                                    {[property.tenant_first_name, property.tenant_last_name, property.tenant_ext_name]
                                                        .filter(Boolean).join(' ')}
                                                </strong>
                                            </p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-5">
                                    <div className="flex flex-col gap-1.5">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Description</p>
                                        <p className="text-sm leading-relaxed text-gray-600">{property.description ? `${property.description}` : 'No description available'}</p>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Available Rooms</p>

                                        <div className="flex flex-wrap gap-2">
                                            <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-[var(--primary-dark)]">
                                                <i className="fa-solid fa-bed" />
                                                {property.bedroom_count > 0 ? `${property.bedroom_count} Bedroom` : 'No available bedrooms'}
                                            </span>
                                            
                                            <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-[var(--primary-dark)]">
                                                <i className="fa-solid fa-utensils" />
                                                {property.kitchen_count > 0 ? `${property.kitchen_count} Kitchen` : 'No available kitchens'}
                                            </span>
                                            
                                            <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-[var(--primary-dark)]">
                                                <i className="fa-solid fa-bath" />
                                                {property.bathroom_count > 0 ? `${property.bathroom_count} Bathroom` : 'No available bathrooms'}
                                            </span>

                                            {property.other_rooms && property.other_rooms.length > 0 ? (
                                                <>
                                                    {(Array.isArray(property.other_rooms)
                                                        ? property.other_rooms
                                                        : property.other_rooms.split(',')
                                                    ).map((room: string, i: number) => (
                                                        <span key={i} className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-[var(--primary-dark)]">
                                                            <i className="fa-solid fa-door-open" />
                                                            {room.trim()}
                                                        </span>
                                                    ))}
                                                </>
                                            ) : (
                                                <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-[var(--primary-dark)]">
                                                    <i className="fa-solid fa-door-open" />
                                                    No other rooms listed
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="flex flex-col gap-1.5">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Max Occupants</p>

                                            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-[var(--primary-dark)]">
                                                <i className="fa-solid fa-users" />
                                                {property.max_occupants ? `${property.max_occupants}` : 'Not specified'}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Allowed Pets</p>

                                            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-[var(--primary-dark)]">
                                                <i className="fa-solid fa-paw" />
                                                {property.pet_count ? `${property.pet_count}` : 'Pets not allowed'}
                                            </span>
                                        </div>
                                    </div>
                                                
                                    <div className="flex flex-col gap-1.5">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Amenities</p>
                                        
                                        <div className="flex flex-wrap gap-2">
                                            {Array.isArray(property.amenities) && property.amenities.length > 0 ? (
                                                property.amenities
                                                    .flatMap((a: string) => a.split(','))
                                                    .map((a: string, i: number) => (
                                                        <span key={i} className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-[var(--primary-dark)]">
                                                            <i className="fa-solid fa-star" />
                                                            {a.trim()}
                                                        </span>
                                                    ))
                                            ) : (
                                                <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-[var(--primary-dark)]">
                                                    <i className="fa-solid fa-star" />
                                                    No amenities listed
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        
                            {showActions && (
                                <div className="flex flex-wrap gap-3">
                                    {userRole === 'tenant' && (
                                        <>
                                            {property.status === 'available' && (
                                                applications.some(app => app.property_id === property.id)
                                                    ? (
                                                        <button
                                                            onClick={onViewRentalApplications}
                                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            <i className="fa-solid fa-clipboard-check" />
                                                            Check Application
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={onViewApplyRental}
                                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            <i className="fa-solid fa-paper-plane" />
                                                            Apply Now
                                                        </button>
                                                    )
                                            )}

                                            {property.status === 'rented' && Number(property.tenant_id) === Number(userId) && (
                                                <>
                                                    <button
                                                        onClick={onViewRentalApplications}
                                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        <i className="fa-solid fa-clipboard-check" />
                                                        View Application
                                                    </button>

                                                    <button
                                                        onClick={onTerminateLease}
                                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-500 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                                                    >
                                                        <i className="fa-solid fa-right-from-bracket" />
                                                        Terminate Lease
                                                    </button>
                                                </>
                                            )}

                                            {property.status === 'rented' && Number(property.tenant_id) !== Number(userId) && (
                                                <button
                                                    disabled
                                                    className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-500"
                                                >
                                                    <i className="fa-solid fa-lock" />
                                                    This property is currently occupied.
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {userRole === 'landlord' && (
                                        <>
                                            {property.status === 'available' && (
                                                <button
                                                    onClick={onViewRentalApplications}
                                                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <i className="fa-solid fa-clipboard-list" />
                                                    View Applications
                                                </button>
                                            )}
                                            {property.status === 'rented' && (
                                                <button
                                                    onClick={onViewRentalApplications}
                                                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <i className="fa-solid fa-clipboard-list" />
                                                    View Tenant Application
                                                </button>
                                            )}
                                        </>
                                    )}

                                    <button
                                        onClick={goBack}
                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                                    >
                                        <i className="fa-solid fa-arrow-left" />
                                        Go Back
                                    </button>
                                </div>
                            )}
                        </>
                    }
                </>
            )}
        </section>
    )
}

export default ViewDetails