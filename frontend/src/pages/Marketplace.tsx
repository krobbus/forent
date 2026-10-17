import { useEffect, useState } from 'react';
import { authFetch } from '../utils/api';
import type { MarketplaceProps, PropertyDataProps, RentalApplicationDataProps, FilterState } from '../utils/props';
import { usePropertySearch, defaultFilters } from '../utils/filter';
import { usePagination } from '../utils/pagination';

import PropertyGallery from '../component/PropertyGallery';
import PropertySearch from '../component/PropertySearch';
import Pagination from '../component/Pagination';

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
            <header>
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
                    <p className='loadingText'>Loading marketplace...</p>
                ) : (
                    <>
                        <div className='propertyGrid'>
                            {paginated.map((p: PropertyDataProps) => (
                                <div key={p.id} className='propertyCard'>
                                    <p id='priceLabel'>₱ {Number(p.price).toLocaleString()} /mo</p>

                                    <section className='galleryWrapper'>
                                        <PropertyGallery
                                            images={Array.isArray(p.images) 
                                                ? p.images 
                                                : JSON.parse(p.images || '[]'
                                            )}
                                        />

                                        <p id='statusLabel'>{p.status.charAt(0).toUpperCase() + p.status.slice(1)}</p>
                                    </section>
                                    
                                    <section className='propertyInfo'>
                                        <h2>{p.property_name}</h2>
                                        <p>{p.address ? `${p.address}` : 'No address available'}</p>
                                        <p>{p.category.charAt(0).toUpperCase() + p.category.slice(1)}</p>
                                    </section>

                                    <section className='propertyDetails'>
                                        <div className='detailSection'>
                                            <p className='detailSectionLabel'>Available Rooms</p>

                                            <div className='pillRow'>
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
                                                            {visible.map((room, i) => <span key={i} className='pill'>{room}</span>)}
                                                            {remaining > 0 && <span className='pill'>+{remaining}</span>}
                                                        </>
                                                        : <span className='pill'>No rooms listed</span>;
                                                })()}
                                            </div>
                                        </div>

                                        <div className='detailSection'>
                                            <p className='detailSectionLabel'>Occupancy</p>
                                            
                                            <div className='pillRow'>
                                                {p.pets_allowed && <span className='pill'>Pet-friendly</span>}
                                                <span className='pill'>{getOccupancyLabel(p.max_occupants)}</span>
                                            </div>
                                        </div>

                                        <div className='detailSection'>
                                            <p className='detailSectionLabel'>Amenities</p>
                                            
                                            <div className='pillRow'>
                                                {(() => {
                                                    if (!Array.isArray(p.amenities) || p.amenities.length === 0)
                                                        return <span className='pill'>No amenities listed</span>;

                                                    const all = p.amenities
                                                        .flatMap(a => a.split(','))
                                                        .map(a => a.trim())
                                                        .filter(Boolean);

                                                    const visible = all.slice(0, 2);
                                                    const remaining = all.length - 2;

                                                    return (
                                                        <>
                                                            {visible.map((a, i) => <span key={i} className='pill'>{a}</span>)}
                                                            {remaining > 0 && <span className='pill'>+{remaining}</span>}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </section>

                                    <section className='actionBtnWrapper'>
                                        {p.status === 'available' ? (
                                            <>
                                                {applications.some(app => app.property_id === p.id) ? (
                                                    <button className='applyBtn' onClick={onViewRentalApplications}>
                                                        Check Application
                                                    </button>
                                                ) : (
                                                    <button className='applyBtn' onClick={() => onViewApplyRental(p)}>
                                                        Apply Now
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <button className='disabledBtn' disabled>Currently Occupied</button>
                                        )}

                                        <button className='detailBtn' onClick={() => onViewDetails(p)}>
                                            View Details
                                        </button>
                                    </section>
                                </div>
                            ))}
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