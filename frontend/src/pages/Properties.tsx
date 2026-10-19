import { useEffect, useState } from 'react';
import { authFetch } from '../utils/api';
import type { PropertyDataProps, PropertiesProps, FilterState } from '../utils/props';
import { usePropertySearch, defaultFilters } from '../utils/filter';
import { usePagination } from '../utils/pagination';

import PropertyGallery from '../components/PropertyGallery';
import PropertySearch from '../components/PropertySearch';
import Pagination from '../components/Pagination';

function Properties({ goBack, userId, userRole,  onViewDetails, onCreateRequest, onUpdateProperty, onViewPayment, onTerminateLease }: PropertiesProps) {
    const [properties, setProperties] = useState<PropertyDataProps[]>([]);
    const [loading, setLoading] = useState(true);
    const landlordProperties = properties.filter(p => Number(p.landlord_id) === Number(userId));
    const tenantRentals = properties.filter(p => Number(p.tenant_id) === Number(userId));
    const ownedProperties = userRole === 'landlord' ? landlordProperties : tenantRentals;
    const [query, setQuery] = useState('');
    const [filters, setFilters] = useState<FilterState>(defaultFilters);

    const getOccupancyLabel = (max: number) => {
        if (max <= 1) return 'Solo-friendly';
        if (max <= 2) return 'Couple-friendly';
        if (max <= 4) return 'Small group-friendly';
        if (max <= 6) return 'Family-friendly';
        if (max <= 10) return 'Large family-friendly';
        return 'Group-friendly';
    };

    const parseImages = (images: PropertyDataProps['images']): string[] => {
        if (!images) return [];
        if (Array.isArray(images)) return images;

        try {
            return JSON.parse(images);
        } catch {
            return [];
        }
    };

    const { filtered, matchedKeywords } = usePropertySearch(ownedProperties, query, filters);
    const [currentPage, setCurrentPage] = useState(1);
    const { paginated, totalPages } = usePagination(filtered, currentPage, 3);

    const handleQueryChange = (q: string) => {
        setQuery(q);
        setCurrentPage(1);
    };

    const handleFiltersChange = (f: FilterState) => {
        setFilters(f);
        setCurrentPage(1);
    };

    const renderSearchSummary = () => {
        if (matchedKeywords.length === 0 && !Object.values(filters).some(Boolean)) return null;
        
        if (filtered.length === 0) {
            return (
                <p className="text-sm text-gray-600">No properties found for your search. Try different keywords or filters.</p>
            );
        }

        if (matchedKeywords.length > 0) {
            return (
                <p className="text-sm text-gray-600">
                    Based on your search{' '}
                    {matchedKeywords.map((kw, i) => (
                        <span key={i} className="font-semibold text-[var(--primary-dark)]">"{kw}"</span>
                    )).reduce((prev, curr, i) => (
                        <>{prev}{i > 0 ? ' and ' : ''}{curr}</>
                    ) as any)}
                    , we found <strong>{filtered.length}</strong> propert{filtered.length === 1 ? 'y' : 'ies'}.
                </p>
            );
        }

        return (
            <p className="text-sm text-gray-600">Showing <strong>{filtered.length}</strong> propert{filtered.length === 1 ? 'y' : 'ies'} based on your filters.</p>
        );
    };

    const deleteProperty = async (propertyId: number) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this property? This action cannot be undone.");
        
        if (confirmDelete) {
            try {
                const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/properties/${propertyId}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    setProperties(prev => prev.filter(prop => prop.id !== propertyId));
                    alert("Property deleted.");
                } else {
                    const data = await response.json();
                    alert(data.error || "Failed to delete.");
                }
            } catch (error) {
                console.error("Delete error:", error);
            }
        }
    };

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/properties`);
                const data = await response.json();
                setProperties(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching properties:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, []);

    return (
        <section id='propertyContainer' className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 font-[family-name:var(--font-body)] text-[var(--text)] sm:px-6">
            <header className="relative overflow-hidden rounded-2xl bg-[url('/Background.png')] bg-cover bg-center">
                <div className="absolute inset-0 bg-orange-600/70" />

                <div className="relative flex flex-col gap-2 px-6 py-10 sm:px-10">
                    <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-white sm:text-3xl">{userRole === 'landlord' ? 'My Properties' : 'My Current Rentals'}</h2>
                    <p className="max-w-2xl text-sm text-orange-50 sm:text-base">
                        {userRole === 'landlord'
                            ? 'Oversee and manage all properties listed under your account.'
                            : 'View and manage the properties you are currently renting.'
                        }
                    </p>
                </div>
            </header>

            <PropertySearch
                query={query}
                onQueryChange={handleQueryChange}
                filters={filters}
                onFiltersChange={handleFiltersChange}
                renderSearchSummary={renderSearchSummary}
            />
            
            <main className="flex flex-col gap-6">
                {loading ? (
                    <p className="py-12 text-center text-sm text-gray-500">Loading properties...</p>
                ) : ownedProperties.length === 0 ? (
                    <p className="py-12 text-center text-sm text-gray-500">
                        {userRole === 'landlord'
                            ? 'You have no listed properties yet. Use "Add New Property" to get started.'
                            : 'You have no current rentals. Start looking for your next home!'
                        }
                    </p>
                ) : filtered.length === 0 ? (
                    <p className="py-12 text-center text-sm text-gray-500">No properties match your search.</p>
                ) : (
                    <>
                        <div className="flex flex-col gap-5">
                            {paginated.map(p => (
                                <div
                                    key={p.id}
                                    className="flex flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm transition-shadow hover:shadow-md md:grid md:grid-cols-[320px_1fr]"
                                >
                                    <section className="relative h-56 bg-orange-50 md:h-full md:min-h-64">
                                        <PropertyGallery images={parseImages(p.images)} />

                                        <p className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm ${p.status === 'available' ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                                            {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                                        </p>
                                    </section>

                                    <div className="flex flex-col gap-4 p-5">
                                        <section className="flex items-start justify-between gap-4">
                                            <div className="flex flex-col gap-1">
                                                <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--text)]">{p.property_name}</h3>
                                                <p className="flex items-center gap-2 text-sm text-gray-500">
                                                    <i className="fa-solid fa-location-dot text-[var(--primary)]" />
                                                    {p.address ? `${p.address}` : 'No address available'}
                                                </p>
                                                <p className="flex items-center gap-2 text-sm text-gray-500">
                                                    <i className="fa-solid fa-house text-[var(--primary)]" />
                                                    {p.category.charAt(0).toUpperCase() + p.category.slice(1)}
                                                </p>
                                            </div>

                                            <p className="shrink-0 font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--primary)]">
                                                ₱ {Number(p.price).toLocaleString()}
                                                <span className="text-xs font-medium text-gray-400"> /mo</span>
                                            </p>
                                        </section>

                                        <section className="flex flex-col gap-3">
                                            <div className="flex flex-col gap-1.5">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Available Rooms</p>

                                                <div className="flex flex-wrap gap-2">
                                                    {(() => {
                                                        const rooms = [
                                                            p.bedroom_count > 0 ? 'Bedroom' : '',
                                                            p.kitchen_count > 0 ? 'Kitchen' : '',
                                                            p.bathroom_count > 0 ? 'Bathroom' : '',
                                                            ...(p.other_rooms 
                                                                ? p.other_rooms.split(',').map((r: string) => r.trim()).filter(Boolean)
                                                                : []
                                                            )
                                                        ].filter(Boolean);

                                                        const visible = rooms.slice(0, 2);
                                                        const remaining = rooms.length - 2;

                                                        return rooms.length > 0
                                                            ?
                                                            <>
                                                                {visible.map((room, i) => <span key={i} className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-[var(--primary-dark)]">{room}</span>)}
                                                                {remaining > 0 && <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-[var(--primary-dark)]">+{remaining}</span>}
                                                            </>
                                                            : <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-[var(--primary-dark)]">No rooms listed</span>;
                                                    })()}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Occupancy</p>
                                                
                                                <div className="flex flex-wrap gap-2">
                                                    {(p.pets_allowed || p.pet_count > 0) && <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-[var(--primary-dark)]">Pet-friendly</span>}
                                                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-[var(--primary-dark)]">{getOccupancyLabel(p.max_occupants)}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Amenities</p>
                                                
                                                <div className="flex flex-wrap gap-2">
                                                    {(() => {
                                                        if (!Array.isArray(p.amenities) || p.amenities.length === 0)
                                                            return <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-[var(--primary-dark)]">No amenities listed</span>;

                                                        const all = p.amenities
                                                            .flatMap(a => a.split(','))
                                                            .map(a => a.trim())
                                                            .filter(Boolean);

                                                        const visible = all.slice(0, 2);
                                                        const remaining = all.length - 2;

                                                        return (
                                                            <>
                                                                {visible.map((a, i) => <span key={i} className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-[var(--primary-dark)]">{a}</span>)}
                                                                {remaining > 0 && <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-[var(--primary-dark)]">+{remaining}</span>}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </section>

                                        <section className="mt-auto flex flex-wrap gap-2 border-t border-orange-100 pt-4">
                                            {userRole === 'landlord' ? (
                                                <>
                                                    <button
                                                        onClick={() => onUpdateProperty(p)}
                                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        <i className="fa-solid fa-pen-to-square" />
                                                        Update Details
                                                    </button>

                                                    {p.status !== 'rented' && (
                                                        <button
                                                            onClick={() => deleteProperty(p.id)}
                                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-500 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                                                        >
                                                            <i className="fa-solid fa-trash" />
                                                            Delete Property
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => onViewDetails(p)}
                                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        <i className="fa-solid fa-eye" />
                                                        View Details
                                                    </button>

                                                    {p.status === 'rented' && (
                                                        <>
                                                            <button
                                                                onClick={() => onViewPayment(p)}
                                                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--primary)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
                                                            >
                                                                <i className="fa-solid fa-credit-card" />
                                                                Check Payment
                                                            </button>

                                                            <button
                                                                onClick={() => onCreateRequest(p)}
                                                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--primary)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
                                                            >
                                                                <i className="fa-solid fa-screwdriver-wrench" />
                                                                Request Maintenance
                                                            </button>

                                                            <button
                                                                onClick={() => onTerminateLease(p)}
                                                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-500 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                                                            >
                                                                <i className="fa-solid fa-right-from-bracket" />
                                                                Terminate Lease
                                                            </button>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </section>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}

                <div className="flex flex-wrap gap-3">
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

export default Properties