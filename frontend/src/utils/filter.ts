import { useMemo } from 'react';
import type { PropertyDataProps, FilterState } from './props';

const extractKeywords = (sentence: string): string[] => {
    const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'i', 'me', 'my', 'want', 'need', 'looking', 'find', 'show', 'have', 'that', 'has', 'is', 'are', 'can', 'do', 'please', 'something', 'any', 'some']);
    return sentence
        .toLowerCase()
        .split(/\s+/)
        .map(w => w.replace(/[^a-z0-9]/g, ''))
        .filter(w => w.length > 1 && !stopWords.has(w));
};

const propertyMatchesKeyword = (p: PropertyDataProps, keyword: string): boolean => {
    const amenities = Array.isArray(p.amenities) ? p.amenities.join(' ').toLowerCase() : '';
    const searchable = [
        p.property_name,
        p.address,
        p.description,
        p.category,
        p.other_rooms,
        amenities,
        p.bedroom_count > 0 ? 'bedroom' : '',
        p.kitchen_count > 0 ? 'kitchen' : '',
        p.bathroom_count > 0 ? 'bathroom' : '',
        p.pets_allowed ? 'pet dog cat animal' : '',
    ].join(' ').toLowerCase();

    return searchable.includes(keyword);
};

export const defaultFilters: FilterState = {
    priceMin: '',
    priceMax: '',
    category: '',
    hasBedroom: false,
    hasKitchen: false,
    hasBathroom: false,
    hasOtherRooms: false,
    hasWifi: false,
    hasAircon: false,
    hasParking: false,
    hasOtherAmenities: false,
    occupancy: '',
    hasPets: false
}

export const usePropertySearch = (
    properties: PropertyDataProps[],
    query: string,
    filters: FilterState
) => {
    const keywords = useMemo(() => extractKeywords(query), [query]);

    const filtered = useMemo(() => {
        return properties.filter(p => {
            if (keywords.length > 0) {
                const matchedAny = keywords.some(kw => propertyMatchesKeyword(p, kw));
                if (!matchedAny) return false;
            }

            if (filters.priceMin && p.price < Number(filters.priceMin)) return false;
            if (filters.priceMax && p.price > Number(filters.priceMax)) return false;

            if (filters.category && p.category !== filters.category) return false;

            if (filters.hasBedroom && p.bedroom_count === 0) return false;
            if (filters.hasKitchen && p.kitchen_count === 0) return false;
            if (filters.hasBathroom && p.bathroom_count === 0) return false;
            if (filters.hasOtherRooms && (!p.other_rooms || p.other_rooms.trim() === '')) return false;

            const amenityStr = Array.isArray(p.amenities) ? p.amenities.join(' ').toLowerCase() : '';
            if (filters.hasWifi && !amenityStr.includes('wifi')) return false;
            if (filters.hasAircon && !amenityStr.includes('aircon')) return false;
            if (filters.hasParking && !amenityStr.includes('parking')) return false;
            if (filters.hasOtherAmenities) {
                const otherAmenities = Array.isArray(p.amenities)
                    ? (p.amenities as unknown as string[])
                        .flatMap(a => a.split(','))
                        .map(a => a.trim())
                        .filter(a => a !== 'Wifi' && a !== 'Aircon' && a !== 'Parking' && a !== '')
                    : [];
                if (otherAmenities.length === 0) return false;
            }

            if (filters.occupancy) {
                const max = p.max_occupants;
                if (filters.occupancy === 'solo' && max > 1) return false;
                if (filters.occupancy === 'couple' && (max < 2 || max > 2)) return false;
                if (filters.occupancy === 'small' && (max < 3 || max > 4)) return false;
                if (filters.occupancy === 'family' && (max < 5 || max > 6)) return false;
                if (filters.occupancy === 'large' && max < 7) return false;
            }

            if (filters.hasPets && !p.pets_allowed === true) return false;

            return true;
        });
    }, [properties, keywords, filters]);

    const matchedKeywords = useMemo(() => {
        if (keywords.length === 0) return [];
        return keywords.filter(kw =>
            properties.some(p => propertyMatchesKeyword(p, kw))
        );
    }, [properties, keywords]);

    return { filtered, keywords, matchedKeywords };
};