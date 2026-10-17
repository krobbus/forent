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
        <div id='paginationWrapper'>
            <span className='pageInfo'>Page {currentPage} of {totalPages}</span>

            <div className='pageNav'>
                <button
                    className='pageBtn prevNext'
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    ‹ Prev
                </button>

                {getPages().map((page, i) =>
                    page === '...' ? (
                        <span key={`ellipsis-${i}`} className='pageEllipsis'>...</span>
                    ) : (
                        <button
                            key={page}
                            className={`pageBtn ${currentPage === page ? 'activePage' : ''}`}
                            onClick={() => onPageChange(page as number)}
                        >
                            {page}
                        </button>
                    )
                )}

                <button
                    className='pageBtn prevNext'
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Next ›
                </button>
            </div>
        </div>
    );
}

export default Pagination;