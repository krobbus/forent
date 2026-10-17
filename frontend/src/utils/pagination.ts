import { useMemo } from 'react';

export const usePagination = <T,>(items: T[], page: number, perPage: number = 3) => {
    const totalPages = Math.ceil(items.length / perPage);
    const paginated = useMemo(() => {
        const start = (page - 1) * perPage;
        return items.slice(start, start + perPage);
    }, [items, page, perPage]);

    return { paginated, totalPages };
};