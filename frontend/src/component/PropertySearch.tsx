import { useState } from 'react';
import type { FilterState, PropertySearchProps } from '../utils/props';
import { defaultFilters } from '../utils/filter';

function PropertySearch({ query, onQueryChange, filters, onFiltersChange, renderSearchSummary }: PropertySearchProps) {
    const [showFilters, setShowFilters] = useState(false);
    const summary = renderSearchSummary ? renderSearchSummary() : null;

    const activeFilterCount = [
        filters.priceMin, filters.priceMax, filters.category,
        filters.hasWifi, filters.hasAircon, filters.hasParking, filters.hasOtherAmenities,
        filters.hasBedroom, filters.hasKitchen, filters.hasBathroom, filters.hasOtherRooms,
        filters.occupancy, filters.hasPets
    ].filter(Boolean).length;

    const resetFilters = () => onFiltersChange(defaultFilters);

    const toggle = (key: keyof FilterState) => {
        onFiltersChange({ ...filters, [key]: !filters[key as keyof FilterState] });
    };

    return (
        <div className='propertySearchWrapper'>
            <div className='searchBar'>
                <input
                    type='text'
                    placeholder='Search by name, room, amenity, location... (e.g. "2 bedroom with wifi near Makati")'
                    value={query}
                    onChange={e => onQueryChange(e.target.value)}
                />

                <div className='searchBtnWrapper'>
                    {query && (
                        <button className='clearBtn' onClick={() => onQueryChange('')}>✕ Clear</button>
                    )}

                    <button
                        className={`filterToggleBtn ${showFilters ? 'clicked' : ''}`}
                        onClick={() => setShowFilters(prev => !prev)}
                    >   
                        <i className='fa-solid fa-cog' />
                        <span className='filterText'>Filters</span>
                        {activeFilterCount > 0 && <span className='filterBadge'>({activeFilterCount})</span>}
                    </button>
                </div>
            </div>

            <div className={`filterPanel ${showFilters ? 'open' : ''}`}>
                <div className='filterInner'>
                    <div className='filterHeader'>
                        <h4>Filter Properties</h4>
                        
                        {activeFilterCount > 0 && (
                            <button className='resetFilters' onClick={resetFilters}>Reset All</button>
                        )}
                    </div>

                    {summary && (
                        <div className='searchSummary'>
                            <span className='dashedLine' />
                            <span>{summary}</span>
                            <span className='dashedLine' />
                        </div>
                    )}
                    
                    <div className='filterContainer'>
                        <div className='inputField'>
                            <div className='inputWrapper'>
                                <label>Price Range (₱)</label>
                                <div className='priceInputs'>
                                    <input
                                        type='number'
                                        placeholder='Min'
                                        value={filters.priceMin}
                                        onChange={e => onFiltersChange({ ...filters, priceMin: e.target.value })}
                                    />

                                    <span>—</span>

                                    <input
                                        type='number'
                                        placeholder='Max'
                                        value={filters.priceMax}
                                        onChange={e => onFiltersChange({ ...filters, priceMax: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className='inputWrapper'>
                                <label>Category</label>
                                <select
                                    value={filters.category}
                                    onChange={e => onFiltersChange({ ...filters, category: e.target.value })}
                                >
                                    <option value='' className='default'>All Categories</option>
                                    <option value='apartment'>Apartment</option>
                                    <option value='house'>House</option>
                                    <option value='condo'>Condo</option>
                                </select>
                            </div>

                            <div className='inputWrapper'>
                                <label>Occupancy</label>
                                <select
                                    value={filters.occupancy}
                                    onChange={e => onFiltersChange({ ...filters, occupancy: e.target.value })}
                                >
                                    <option value='' className='default'>Any</option>
                                    <option value='solo'>Solo (1 person)</option>
                                    <option value='couple'>Couple (2 persons)</option>
                                    <option value='small'>Small Group (3–4)</option>
                                    <option value='family'>Family (5–6)</option>
                                    <option value='large'>Large Group (7+)</option>
                                </select>
                            </div>
                        </div>

                        <div className='checkboxField'>
                            <div className='checkboxWrapper'>
                                <label>Pets</label>
                                <div className='checkboxGroup'>
                                    <label><input type='checkbox' checked={filters.hasPets} onChange={() => toggle('hasPets')} /> Allowed Pets</label>
                                </div>
                            </div>

                            <div className='checkboxWrapper'>
                                <label>Rooms</label>
                                <div className='checkboxGroup'>
                                    <label><input type='checkbox' checked={filters.hasBedroom} onChange={() => toggle('hasBedroom')} /> Bedroom</label>
                                    <label><input type='checkbox' checked={filters.hasKitchen} onChange={() => toggle('hasKitchen')} /> Kitchen</label>
                                    <label><input type='checkbox' checked={filters.hasBathroom} onChange={() => toggle('hasBathroom')} /> Bathroom</label>
                                    <label><input type='checkbox' checked={filters.hasOtherRooms} onChange={() => toggle('hasOtherRooms')} /> Others</label>
                                </div>
                            </div>

                            <div className='checkboxWrapper'>
                                <label>Amenities</label>
                                <div className='checkboxGroup'>
                                    <label><input type='checkbox' checked={filters.hasWifi} onChange={() => toggle('hasWifi')} /> WiFi</label>
                                    <label><input type='checkbox' checked={filters.hasAircon} onChange={() => toggle('hasAircon')} /> Aircon</label>
                                    <label><input type='checkbox' checked={filters.hasParking} onChange={() => toggle('hasParking')} /> Parking</label>
                                    <label><input type='checkbox' checked={filters.hasOtherAmenities} onChange={() => toggle('hasOtherAmenities')} /> Others</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PropertySearch;