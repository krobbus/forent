import { useState, useEffect } from 'react';

function PropertyGallery({ images, variant = 'card' }: { images: string[], variant?: 'card' | 'details' }) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        document.body.style.overflow = lightboxOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [lightboxOpen]);

    if (!images || images.length === 0) return (
        <div className="flex h-full min-h-56 w-full flex-col items-center justify-center gap-2 bg-orange-50 text-sm text-gray-400">
            <i className="fa-regular fa-image text-3xl text-orange-300" />
            <span>No images available</span>
        </div>
    );

    const openLightbox = (index: number) => {
        setActiveIndex(index);
        setLightboxOpen(true);
    };

    const prev = () => setActiveIndex(i => (i - 1 + images.length) % images.length);
    const next = () => setActiveIndex(i => (i + 1) % images.length);

    const lightbox = lightboxOpen && (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setLightboxOpen(false)}
        >
            <div
                className="relative flex max-h-full w-full max-w-4xl flex-col items-center gap-4"
                onClick={e => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={() => setLightboxOpen(false)}
                    className="absolute -top-3 right-0 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 text-gray-800 transition-colors hover:bg-[var(--primary)] hover:text-white"
                >
                    <i className="fa-solid fa-xmark" />
                </button>

                <div className="relative flex w-full items-center justify-center">
                    <button
                        type="button"
                        onClick={prev}
                        className="absolute left-2 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 text-gray-800 transition-colors hover:bg-[var(--primary)] hover:text-white"
                    >
                        <i className="fa-solid fa-chevron-left" />
                    </button>

                    <img
                        src={images[activeIndex]}
                        alt={`Property ${activeIndex + 1}`}
                        className="max-h-[65vh] w-full rounded-lg object-contain"
                    />

                    <button
                        type="button"
                        onClick={next}
                        className="absolute right-2 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 text-gray-800 transition-colors hover:bg-[var(--primary)] hover:text-white"
                    >
                        <i className="fa-solid fa-chevron-right" />
                    </button>
                </div>

                <div className="text-sm font-medium text-white">{activeIndex + 1} / {images.length}</div>

                <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
                    {images.map((img, i) => (
                        <img
                            key={i}
                            src={img}
                            alt={`Thumb ${i + 1}`}
                            onClick={() => setActiveIndex(i)}
                            className={`h-14 w-20 shrink-0 cursor-pointer rounded-md border-2 object-cover transition-all ${i === activeIndex ? 'border-[var(--primary)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );

    if (variant === 'details') {
        return (
            <>
                <div className="grid grid-rows-[72px_1fr] gap-3 sm:grid-rows-[88px_1fr]">
                    <div className="flex max-w-[720px] flex gap-2 overflow-x-auto">
                        {images.map((img, i) => (
                            <div
                                key={i}
                                onClick={() => setActiveIndex(i)}
                                className={`max-h-16 max-w-26 w-full shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-all sm:h-20 ${i === activeIndex ? 'border-[var(--primary)]' : 'border-transparent opacity-70 hover:opacity-100'}`}
                            >
                                <img src={img} alt={`Thumb ${i + 1}`} className="h-full w-full object-cover" />
                            </div>
                        ))}
                    </div>

                    <div
                        onClick={() => openLightbox(activeIndex)}
                        className="aspect-[4/3] cursor-zoom-in overflow-hidden rounded-xl bg-orange-50"
                    >
                        <img
                            src={images[activeIndex]}
                            alt={`Property ${activeIndex + 1}`}
                            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                    </div>
                </div>

                {lightbox}
            </>
        );
    }

    return (
        <>
            <div className="h-full w-full">
                <div
                    onClick={() => openLightbox(0)}
                    className="relative h-full w-full cursor-zoom-in overflow-hidden"
                >
                    <img
                        src={images[0]}
                        alt="Property 1"
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />

                    {images.length > 1 && (
                        <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
                            +{images.length - 1}
                        </div>
                    )}
                </div>
            </div>

            {lightbox}
        </>
    );
}

export default PropertyGallery;