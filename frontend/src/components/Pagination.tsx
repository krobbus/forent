import type { PaginationProps } from '../utils/props'

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    const getPages = () => {
        const pages: (number | '...')[] = [];

        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        pages.push(1);
        if (currentPage > 3) pages.push('...');

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) pages.push(i);

        if (currentPage < totalPages - 2) pages.push('...');
        pages.push(totalPages);

        return pages;
    };

    return (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>

            <div className="flex flex-wrap items-center gap-1.5">
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <i className="fa-solid fa-chevron-left text-xs" />
                    Prev
                </button>

                {getPages().map((page, i) =>
                    page === '...' ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-gray-400">...</span>
                    ) : (
                        <button
                            key={page}
                            type="button"
                            onClick={() => onPageChange(page as number)}
                            className={`h-9 min-w-9 cursor-pointer rounded-lg border px-3 text-sm font-semibold transition-colors ${currentPage === page
                                ? 'border-[var(--primary)] bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-[var(--primary-soft)] hover:text-[var(--primary-dark)]'}`}
                        >
                            {page}
                        </button>
                    )
                )}

                <button
                    type="button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Next
                    <i className="fa-solid fa-chevron-right text-xs" />
                </button>
            </div>
        </div>
    );
}

export default Pagination;