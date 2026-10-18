import { useEffect, useState } from 'react';
import { authFetch } from '../utils/api';
import type { MarketplaceProps, PropertyDataProps, RentalApplicationDataProps, FilterState } from '../utils/props';
import { usePropertySearch, defaultFilters } from '../utils/filter';
import { usePagination } from '../utils/pagination';

import PropertyGallery from '../components/PropertyGallery';
import PropertySearch from '../components/PropertySearch';
import Pagination from '../components/Pagination';

const getImages = (p: PropertyDataProps): string[] => {
    if (Array.isArray(p.images)) return p.images;
    try {
        return JSON.parse(p.images || '[]');
    } catch {
        return [];
    }
};

function Marketplace({ userId, userRole, onViewDetails, onViewApplyRental, onViewRentalApplications }: MarketplaceProps) {
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
                <p>No properties found for your search. Try different keywords or filters.</p>
            );
        }

        if (matchedKeywords.length > 0) {
            return (
                <p>
                    Based on your search{' '}
                    {matchedKeywords.map((kw, i) => (
                        <span key={i} className='searchKeyword'>"{kw}"</span>
                    )).reduce((prev, curr, i) => (
                        <>{prev}{i > 0 ? ' and ' : ''}{curr}</>
                    ) as any)}
                    , we found <strong>{filtered.length}</strong> propert{filtered.length === 1 ? 'y' : 'ies'}.
                </p>
            );
        }

        return (
            <p>Showing <strong>{filtered.length}</strong> propert{filtered.length === 1 ? 'y' : 'ies'} based on your filters.</p>
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
        <section id='marketplaceContainer'>
            <header className='fr-page-header'>
                <span className='fr-badge-icon'><i className='fa-solid fa-store' /></span>
                <h2>Marketplace</h2>
                <p>Explore our wide range of rental properties to find your perfect home.</p>
            </header>

            <PropertySearch
                query={query}
                onQueryChange={handleQueryChange}
                filters={filters}
                onFiltersChange={handleFiltersChange}
                renderSearchSummary={renderSearchSummary}
            />

            <main>
                {loading ? (
                    <div className='fr-state loadingText'>
                        <div className='spinner-border text-primary mb-3' role='status' />
                        <p>Loading marketplace...</p>
                    </div>
                ) : paginated.length === 0 ? (
                    <div className='fr-state fr-card'>
                        <i className='fa-solid fa-house-circle-xmark' />
                        <p>No properties to show right now.</p>
                    </div>
                ) : (
                    <>
                        <div className='propertyGrid d-flex flex-column gap-3'>
                            {paginated.map((p: PropertyDataProps) => {
                                const images = getImages(p);
                                const isAvailable = p.status === 'available';

                                const rooms = [
                                    p.bedroom_count > 0 ? 'Bedroom' : '',
                                    p.kitchen_count > 0 ? 'Kitchen' : '',
                                    p.bathroom_count > 0 ? 'Bathroom' : '',
                                    ...(p.other_rooms 
                                        ? p.other_rooms.split(',').map((r: string) => r.trim()).filter(Boolean)
                                        : []
                                    )
                                ].filter(Boolean);

                                const visibleRooms = rooms.slice(0, 2);
                                const remainingRooms = rooms.length - 2;

                                const allAmenities: string[] = Array.isArray(p.amenities)
                                    ? p.amenities
                                        .flatMap(a => a.split(','))
                                        .map(a => a.trim())
                                        .filter(Boolean)
                                    : [];
                                const visibleAmenities = allAmenities.slice(0, 2);
                                const remainingAmenities = allAmenities.length - 2;

                                return (
                                    <div key={p.id} className='propertyCard fr-listing'>
                                        <div className='row g-0'>
                                            <div className='col-md-4 col-lg-3'>
                                                <section className='galleryWrapper fr-listing-media'>
                                                    <PropertyGallery images={images} />

                                                    <span id='statusLabel' className={`fr-media-chip status ${isAvailable ? 'available' : 'unavailable'}`}>
                                                        <i className='fa-solid fa-circle' />
                                                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                                                    </span>

                                                    {images.length > 0 && (
                                                        <span className='fr-media-chip count'>
                                                            <i className='fa-solid fa-camera' />{images.length}
                                                        </span>
                                                    )}
                                                </section>
                                            </div>

                                            <div className='col-md-8 col-lg-9 d-flex flex-column p-3 p-lg-4'>
                                                <div className='d-flex flex-wrap align-items-start justify-content-between gap-2'>
                                                    <p id='priceLabel' className='fr-listing-price'>
                                                        ₱ {Number(p.price).toLocaleString()} <small>/mo</small>
                                                    </p>

                                                    <span className='pill'>
                                                        <i className='fa-solid fa-building me-1' />
                                                        {p.category.charAt(0).toUpperCase() + p.category.slice(1)}
                                                    </span>
                                                </div>

                                                <section className='propertyInfo'>
                                                    <h3 className='fr-listing-title'>{p.property_name}</h3>
                                                    <p className='fr-listing-loc'>
                                                        <i className='fa-solid fa-location-dot' />
                                                        {p.address ? `${p.address}` : 'No address available'}
                                                    </p>
                                                </section>

                                                <div className='fr-listing-stats'>
                                                    <span title='Bedrooms'><i className='fa-solid fa-bed' />{p.bedroom_count}</span>
                                                    <span title='Bathrooms'><i className='fa-solid fa-bath' />{p.bathroom_count}</span>
                                                    <span title='Kitchens'><i className='fa-solid fa-kitchen-set' />{p.kitchen_count}</span>
                                                    <span title='Max occupants'><i className='fa-solid fa-users' />{p.max_occupants}</span>
                                                    {p.pets_allowed && <span title='Pets allowed'><i className='fa-solid fa-paw' />Pets OK</span>}
                                                </div>

                                                {p.description && <p className='fr-listing-desc'>{p.description}</p>}

                                                <section className='propertyDetails d-flex flex-wrap gap-3 mb-3'>
                                                    <div className='detailSection fr-pill-group' title='Available Rooms'>
                                                        <i className='fa-solid fa-door-open' />
                                                        {rooms.length > 0 ? (
                                                            <>
                                                                {visibleRooms.map((room, i) => <span key={i} className='pill'>{room}</span>)}
                                                                {remainingRooms > 0 && <span className='pill'>+{remainingRooms}</span>}
                                                            </>
                                                        ) : <span className='pill'>No rooms listed</span>}
                                                    </div>

                                                    <div className='detailSection fr-pill-group' title='Occupancy'>
                                                        <i className='fa-solid fa-user-group' />
                                                        {p.pets_allowed && <span className='pill'>Pet-friendly</span>}
                                                        <span className='pill'>{getOccupancyLabel(p.max_occupants)}</span>
                                                    </div>

                                                    <div className='detailSection fr-pill-group' title='Amenities'>
                                                        <i className='fa-solid fa-wifi' />
                                                        {allAmenities.length > 0 ? (
                                                            <>
                                                                {visibleAmenities.map((a, i) => <span key={i} className='pill'>{a}</span>)}
                                                                {remainingAmenities > 0 && <span className='pill'>+{remainingAmenities}</span>}
                                                            </>
                                                        ) : <span className='pill'>No amenities listed</span>}
                                                    </div>
                                                </section>

                                                <section className='actionBtnWrapper fr-listing-actions'>
                                                    <button className='detailBtn btn btn-outline-primary' onClick={() => onViewDetails(p)}>
                                                        <i className='fa-solid fa-eye' />View Details
                                                    </button>

                                                    {isAvailable ? (
                                                        <>
                                                            {applications.some(app => app.property_id === p.id) ? (
                                                                <button className='applyBtn btn btn-primary' onClick={onViewRentalApplications}>
                                                                    <i className='fa-solid fa-clipboard-check' />Check Application
                                                                </button>
                                                            ) : (
                                                                <button className='applyBtn btn btn-primary' onClick={() => onViewApplyRental(p)}>
                                                                    <i className='fa-solid fa-file-signature' />Apply Now
                                                                </button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <button className='disabledBtn btn btn-light border' disabled>
                                                            <i className='fa-solid fa-lock' />Currently Occupied
                                                        </button>
                                                    )}
                                                </section>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {filtered.length > 0 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        )}
                    </>
                )}
            </main>
        </section>
    )
}

export default Marketplace;
