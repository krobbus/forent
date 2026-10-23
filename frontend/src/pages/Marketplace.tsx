import { useEffect, useState } from 'react';
import { authFetch } from '../utils/api';
import type { MarketplaceProps, PropertyDataProps, RentalApplicationDataProps, FilterState } from '../utils/props';
import { usePropertySearch, defaultFilters } from '../utils/filter';
import { usePagination } from '../utils/pagination';

import PropertyGallery from '../components/PropertyGallery';
import PropertySearch from '../components/PropertySearch';
import Pagination from '../components/Pagination';

function Marketplace({ userId, userRole, onViewDetails, onViewApplyRental, onViewRentalApplications, onUpdateProperty }: MarketplaceProps) {
    const [loading, setLoading] = useState(true);
    const [properties, setProperties] = useState<PropertyDataProps[]>([]);
    const [applications, checkApplications] = useState<RentalApplicationDataProps[]>([]);
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

    const { filtered, matchedKeywords } = usePropertySearch(properties, query, filters);
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

    const fetchApplications = async () => {
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

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/properties`);
                if (!response.ok) {
                    throw new Error(`Properties request failed with status ${response.status}`);
                }

                const data = await response.json();
                setProperties(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching properties:", error);
                setProperties([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, []);

    useEffect(() => {
        if (userId) fetchApplications();
    }, [userId, userRole]); 

    return (
        <section id='marketplaceContainer' className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 font-[family-name:var(--font-body)] text-[var(--text)] sm:px-6">
            <header className="flex flex-col gap-2 pt-10">
                <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-black sm:text-3xl">Marketplace</h2>
                <p className="max-w-2xl text-sm text-black-50 sm:text-base">Explore our wide range of rental properties to find your perfect home.</p>
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
                    <p className="py-12 text-center text-sm text-gray-500">Loading marketplace...</p>
                ) : filtered.length === 0 ? (
                    <p className="py-12 text-center text-sm text-gray-500">No properties found.</p>
                ) : (
                    <>
                        <div className="flex flex-col gap-5">
                            {paginated.map((p: PropertyDataProps) => (
                                <div
                                    key={p.id}
                                    className="flex flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm transition-shadow hover:shadow-md md:grid md:grid-cols-[320px_1fr]"
                                >
                                    <section className="relative h-56 bg-orange-50 md:h-full md:min-h-64">
                                        <PropertyGallery images={parseImages(p.images)} />

                                        <p className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm ${p.status === 'available' ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                                            {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                                        </p>

                                        <p className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm bg-[var(--primary)]">
                                            <i className="fa-solid fa-house text-white" />
                                            {p.category.charAt(0).toUpperCase() + p.category.slice(1)}
                                        </p>
                                    </section>

                                    <div className="flex flex-col gap-4 p-6">
                                        <section className="flex flex-col gap-4">
                                            <div className="flex justify-between items-center gap-4">
                                                <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--text)]">{p.property_name}</h3>
                                                <p className="shrink-0 font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--primary)]">
                                                    ₱ {Number(p.price).toLocaleString()}
                                                    <span className="text-xs font-medium text-gray-400"> /mo</span>
                                                </p>
                                            </div>  

                                            <p className="flex items-center gap-2 text-sm text-gray-500">
                                                <i className="fa-solid fa-location-dot text-[var(--primary)]" />
                                                {p.address ? `${p.address}` : 'No address available'}
                                            </p>
                                        </section>

                                        <section className="flex flex-col gap-4">
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
                                                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-[var(--primary-dark)]">
                                                        {p.pets_allowed ? 'Pets are allowed' : 'Pets not allowed'}
                                                    </span>
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

                                        <section className="mt-auto flex flex-wrap justify-end gap-2 border-t border-orange-200 pt-4">
                                            {userRole === 'landlord' ? (
                                                <button
                                                    onClick={() => onUpdateProperty(p)}
                                                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <i className="fa-solid fa-pen-to-square" />
                                                    Update Details
                                                </button>
                                            ) : (
                                                p.status === 'available' ? (
                                                    <>
                                                        {applications.some(app => app.property_id === p.id) ? (
                                                            <button
                                                                onClick={onViewRentalApplications}
                                                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                <i className="fa-solid fa-clipboard-check" />
                                                                Check Application
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => onViewApplyRental(p)}
                                                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                <i className="fa-solid fa-paper-plane" />
                                                                Apply Now
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <button
                                                        disabled
                                                        className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-500"
                                                    >
                                                        <i className="fa-solid fa-lock" />
                                                        Currently Occupied
                                                    </button>
                                                )
                                            )}

                                            <button
                                                onClick={() => onViewDetails(p)}
                                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--primary)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
                                            >
                                                <i className="fa-solid fa-eye" />
                                                View Details
                                            </button>
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
            </main>
        </section>
    )
}

export default Marketplace;