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
        <div className="flex flex-col gap-3">
            <div className="flex flex-col justify-end gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />

                    <input
                        type="text"
                        placeholder='Search by name, room, amenity, location...'
                        value={query}
                        onChange={e => onQueryChange(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 pl-10 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                </div>

                <div className="flex gap-2">
                    {query && (
                        <button
                            type="button"
                            onClick={() => onQueryChange('')}
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                        >
                            <i className="fa-solid fa-xmark" />
                            Clear
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setShowFilters(prev => !prev)}
                        className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${showFilters
                            ? 'border-[var(--primary)] bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]'
                            : 'border-[var(--primary)] bg-white text-[var(--primary)] hover:bg-[var(--primary-soft)]'}`}
                    >
                        <i className="fa-solid fa-sliders" />
                        Filters
                        {activeFilterCount > 0 && <span className="text-xs">({activeFilterCount})</span>}
                    </button>
                </div>
            </div>

            <div className={`bg-[var(--primary)]/10 py-4 px-6 rounded-md grid transition-all duration-300 ${showFilters ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden" inert={!showFilters}>
                    <div className="flex flex-col gap-4 border-t border-orange-100 pt-4">
                        <div className="flex items-center justify-center gap-3">
                            <h4 className="font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--primary-dark)]">Filter Properties</h4>
                            
                            {activeFilterCount > 0 && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                                >
                                    <i className="fa-solid fa-rotate-left" />
                                    Reset All
                                </button>
                            )}
                        </div>

                        {summary && (
                            <div className="flex items-center gap-3">
                                <span className="h-px flex-1 border-t border-dashed border-orange-200" />
                                <div className="text-center">{summary}</div>
                                <span className="h-px flex-1 border-t border-dashed border-orange-200" />
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Price Range (₱)</label>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={filters.priceMin}
                                        onChange={e => onFiltersChange({ ...filters, priceMin: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                    />

                                    <span className="text-gray-400">—</span>

                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.priceMax}
                                        onChange={e => onFiltersChange({ ...filters, priceMax: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Category</label>
                                <select
                                    value={filters.category}
                                    onChange={e => onFiltersChange({ ...filters, category: e.target.value })}
                                    className="w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                >
                                    <option value=''>All Categories</option>
                                    <option value='apartment'>Apartment</option>
                                    <option value='house'>House</option>
                                    <option value='condo'>Condo</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Occupancy</label>
                                <select
                                    value={filters.occupancy}
                                    onChange={e => onFiltersChange({ ...filters, occupancy: e.target.value })}
                                    className="w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                >
                                    <option value=''>Any</option>
                                    <option value='solo'>Solo (1 person)</option>
                                    <option value='couple'>Couple (2 persons)</option>
                                    <option value='small'>Small Group (3–4)</option>
                                    <option value='family'>Family (5–6)</option>
                                    <option value='large'>Large Group (7+)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700">Pets</label>

                                <div className="flex flex-wrap gap-x-4 gap-y-2">
                                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[var(--primary-dark)]"><input type="checkbox" className="h-4 w-4 cursor-pointer accent-[var(--primary)]" checked={filters.hasPets} onChange={() => toggle('hasPets')} /> Allowed Pets</label>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700">Rooms</label>

                                <div className="flex flex-wrap gap-x-4 gap-y-2">
                                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[var(--primary-dark)]"><input type="checkbox" className="h-4 w-4 cursor-pointer accent-[var(--primary)]" checked={filters.hasBedroom} onChange={() => toggle('hasBedroom')} /> Bedroom</label>
                                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[var(--primary-dark)]"><input type="checkbox" className="h-4 w-4 cursor-pointer accent-[var(--primary)]" checked={filters.hasKitchen} onChange={() => toggle('hasKitchen')} /> Kitchen</label>
                                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[var(--primary-dark)]"><input type="checkbox" className="h-4 w-4 cursor-pointer accent-[var(--primary)]" checked={filters.hasBathroom} onChange={() => toggle('hasBathroom')} /> Bathroom</label>
                                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[var(--primary-dark)]"><input type="checkbox" className="h-4 w-4 cursor-pointer accent-[var(--primary)]" checked={filters.hasOtherRooms} onChange={() => toggle('hasOtherRooms')} /> Others</label>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700">Amenities</label>

                                <div className="flex flex-wrap gap-x-4 gap-y-2">
                                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[var(--primary-dark)]"><input type="checkbox" className="h-4 w-4 cursor-pointer accent-[var(--primary)]" checked={filters.hasWifi} onChange={() => toggle('hasWifi')} /> WiFi</label>
                                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[var(--primary-dark)]"><input type="checkbox" className="h-4 w-4 cursor-pointer accent-[var(--primary)]" checked={filters.hasAircon} onChange={() => toggle('hasAircon')} /> Aircon</label>
                                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[var(--primary-dark)]"><input type="checkbox" className="h-4 w-4 cursor-pointer accent-[var(--primary)]" checked={filters.hasParking} onChange={() => toggle('hasParking')} /> Parking</label>
                                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[var(--primary-dark)]"><input type="checkbox" className="h-4 w-4 cursor-pointer accent-[var(--primary)]" checked={filters.hasOtherAmenities} onChange={() => toggle('hasOtherAmenities')} /> Others</label>
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