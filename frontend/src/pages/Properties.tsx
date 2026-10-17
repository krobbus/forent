import { useEffect, useState } from 'react';
import { authFetch } from '../utils/api';
import type { PropertyDataProps, PropertiesProps, FilterState } from '../utils/props';
import PropertyGallery from '../component/PropertyGallery';
import { usePropertySearch, defaultFilters } from '../utils/filter';
import { usePagination } from '../utils/pagination';

import PropertySearch from '../component/PropertySearch';
import Pagination from '../component/Pagination';

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
        <section id='propertyContainer'>
            <header>
                <h2>{userRole === 'landlord' ? 'My Properties' : 'My Current Rentals'}</h2>
                <p>
                    {userRole === 'landlord'
                        ? 'Oversee and manage all properties listed under your account.'
                        : 'View and manage the properties you are currently renting.'
                    }
                </p>
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
                    <p className='loadingText'>Loading properties...</p>
                ) : (
                    <>
                        {userRole === 'landlord' && (
                            <section className='landlordView'>
                                {landlordProperties.length === 0 ? (
                                    <p className='loadingText'>You have no current rentals. Start looking for your next home!</p>
                                ) : (
                                    <>
                                        <div className='propertyGrid'>
                                            {paginated.map(p => (
                                                <div key={p.id} className='propertyCard'>
                                                    <p id='priceLabel'>₱ {Number(p.price).toLocaleString()} /mo</p>

                                                    <div className='galleryWrapper'>
                                                        <PropertyGallery
                                                            images={Array.isArray(p.images) 
                                                                ? p.images 
                                                                : JSON.parse(p.images || '[]'
                                                            )}
                                                        />

                                                        <p id='statusLabel'>{p.status.charAt(0).toUpperCase() + p.status.slice(1)}</p>
                                                    </div>

                                                    <div className='propertyInfo'>
                                                        <h2>{p.property_name}</h2>
                                                        <p>{p.address ? `${p.address}` : 'No address available'}</p>
                                                        <p>{p.category.charAt(0).toUpperCase() + p.category.slice(1)}</p>
                                                    </div>

                                                    <div className='propertyDetails'>
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
                                                                {p.pet_count > 0 && <span className='pill'>Pet-friendly</span>}
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
                                                    </div>

                                                    <div className='actionBtnWrapper'>
                                                        <button className='updateBtn' onClick={() => onUpdateProperty(p)}>Update Details</button>
                                                        {p.status !== 'rented' && <button className='deleteBtn' onClick={() => deleteProperty(p.id)}>Delete Property</button>}
                                                    </div>
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
                            </section>
                        )}

                        {userRole === 'tenant' && (
                            <section className='tenantView'>
                                {tenantRentals.length === 0 ? (
                                    <p className='loadingText'>You have no current rentals. Start looking for your next home!</p>
                                ) : (
                                    <>
                                        <div className='propertyGrid'>
                                            {tenantRentals.map(p => (
                                                <div key={p.id} className='propertyCard rented'>
                                                    <p id='priceLabel'>₱ {Number(p.price).toLocaleString()} /mo</p>

                                                    <div className='galleryWrapper'>
                                                        <PropertyGallery
                                                            images={Array.isArray(p.images) 
                                                                ? p.images 
                                                                : JSON.parse(p.images || '[]'
                                                            )}
                                                        />

                                                        <p id='statusLabel'>{p.status.charAt(0).toUpperCase() + p.status.slice(1)}</p>
                                                    </div>
                                                    
                                                    <div className='propertyInfo'>
                                                        <h2>{p.property_name}</h2>
                                                        <p>{p.address ? `${p.address}` : 'No address available'}</p>
                                                        <p>{p.category.charAt(0).toUpperCase() + p.category.slice(1)}</p>
                                                    </div>

                                                    <div className='propertyDetails'>
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
                                                    </div>

                                                    <div className='actionBtnWrapper'>
                                                        <button className='detailBtn' onClick={() => onViewDetails(p)}>View Details</button>
                                                        {p.status === 'rented' && (
                                                            <>
                                                                <button className='paymentBtn' onClick={() => onViewPayment(p)}>Check Payment</button>
                                                                <button className='requestBtn' onClick={() => onCreateRequest(p)}>Request Maintenance</button>
                                                                <button className='terminateBtn' onClick={() => onTerminateLease(p)}>Terminate Lease</button>
                                                            </>
                                                        )}
                                                    </div>
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
                            </section>
                        )}

                        <div className="btnWrapper">
                            <button type="button" className="backBtn" onClick={goBack}>Go Back</button>
                        </div>
                    </>
                )}
            </main>
        </section>
    )
}

export default Properties