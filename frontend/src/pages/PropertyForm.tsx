import React, { useState } from 'react';
import { authFetch } from '../utils/api';
import type { AddPropertyProps, UpdatePropertyProps, PropertyFormProps } from '../utils/props';

function PropertyForm(props: PropertyFormProps) {
    const isEdit = props.mode === 'update';
    const property = isEdit ? props.property : null;
    const [images, setImages] = useState<string[]>(() => {
        if (!isEdit || !property?.images) return [];
        return Array.isArray(property.images) ? property.images : JSON.parse(property.images || '[]');
    });
    const existingAmenities = Array.isArray(property?.amenities) ? (property.amenities as unknown as string[]) : [];
    const knownAmenities = ['Wifi', 'Aircon', 'Parking'];

    const [formData, setFormData] = useState({
        name: property?.property_name || '',
        address: property?.address || '',
        price:  property?.price?.toString() || '',
        description:  property?.description || '',
        category: property?.category || '',
        bedroom_count: property?.bedroom_count || 0,
        kitchen_count: property?.kitchen_count || 0,
        bathroom_count: property?.bathroom_count || 0,
        other_rooms:  property?.other_rooms ? property.other_rooms.split(', ') : [] as string[],
        other_rooms_count: property?.other_rooms ? property.other_rooms.split(', ').length : 0,
        max_occupants: property?.max_occupants || 1,
        pets_allowed: property?.pets_allowed || false,
        amenities: {
            wifi: existingAmenities.includes('Wifi'),
            aircon: existingAmenities.includes('Aircon'),
            parking: existingAmenities.includes('Parking'),
        },
        other_amenities: existingAmenities.filter(a => !knownAmenities.includes(a)),
        other_amenities_count: existingAmenities.filter(a => !knownAmenities.includes(a)).length,
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        
        files.forEach(file => {
            const reader = new FileReader();

            reader.onload = (event) => {
                const base64 = event.target?.result as string;

                setImages(prev => {
                    if (prev.includes(base64)) {
                        alert(`"${file.name}" is already selected.`);
                        return prev;
                    }
                    return [...prev, base64];
                });
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCapitalize = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.value;
        setFormData({ ...formData, [e.target.name]: value.charAt(0).toUpperCase() + value.slice(1) });
    };

    const adjustCount = (field: string, delta: number) => {
        setFormData(prev => ({
            ...prev,
            [field]: Math.max(0, (prev[field as keyof typeof prev] as number) + delta)
        }));
    };

    const handleOtherRoomChange = (index: number, value: string) => {
        const updated = [...formData.other_rooms];
        updated[index] = value.charAt(0).toUpperCase() + value.slice(1);
        setFormData({ ...formData, other_rooms: updated });
    };

    const handleOtherAmenityChange = (index: number, value: string) => {
        const updated = [...formData.other_amenities];
        updated[index] = value.charAt(0).toUpperCase() + value.slice(1);
        setFormData({ ...formData, other_amenities: updated });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const payload = {
            ...formData,
            images,
            amenities: {
                ...formData.amenities,
                other_amenities: formData.other_amenities.join(', ')
            },
            ...(!isEdit && { landlord_id: (props as AddPropertyProps).userId, status: 'available' })
        };

        try {
            const url = isEdit
                ? `${import.meta.env.VITE_API_URL}/api/properties/${property!.id}`
                : `${import.meta.env.VITE_API_URL}/api/properties`;

            const response = await authFetch(url, {
                method: isEdit ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert(isEdit ? 'Property updated successfully!' : 'Property added successfully!');
                if (isEdit) {
                    (props as UpdatePropertyProps).onSuccess();
                } else {
                    setFormData({
                        name: '', address: '', price: '', description: '', category: '',
                        bedroom_count: 0, kitchen_count: 0, bathroom_count: 0,
                        other_rooms: [], other_rooms_count: 0,
                        max_occupants: 1, pets_allowed: false,
                        amenities: { wifi: false, aircon: false, parking: false },
                        other_amenities: [], other_amenities_count: 0,
                    });
                    setImages([]);
                    props.goBack();
                }
            } else {
                const errorData = await response.json();
                alert(`Failed to ${isEdit ? 'update' : 'add'} property: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Submit error:', error);
        }
    };

    return (
        <section id='propertyFormContainer' className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 font-[family-name:var(--font-body)] text-[var(--text)] sm:px-6">
            <header className="relative overflow-hidden rounded-2xl bg-[url('/Background.png')] bg-cover bg-center">
                <div className="absolute inset-0 bg-orange-600/70" />

                <div className="relative flex flex-col gap-2 px-6 py-10 sm:px-10">
                    <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-white sm:text-3xl">{isEdit ? 'Update Property' : 'Add New Property'}</h2>
                    <p className="max-w-2xl text-sm text-orange-50 sm:text-base">
                        {isEdit
                            ? 'Modify the details of your listed property. All changes will be reflected immediately upon saving.'
                            : 'Fill in the details below to list a new property under your account.'
                        }
                    </p>
                </div>
            </header>

            <main>
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <fieldset className="flex flex-col gap-4 rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
                        <legend className="px-2 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--primary-dark)]">Property Images {!isEdit && <span className="text-xs font-normal text-gray-400">(optional)</span>}</legend>

                        {images.length > 0 && (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {images.map((img, i) => (
                                    <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-lg border border-orange-100 bg-orange-50">
                                        <img src={img} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" />

                                        <button
                                            type='button'
                                            onClick={() => removeImage(i)}
                                            className="absolute right-1.5 top-1.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/90 text-gray-800 transition-colors hover:bg-[var(--primary)] hover:text-white"
                                        >
                                            <i className='fa-solid fa-xmark text-xs' />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <input
                            type='file'
                            accept='image/*'
                            onChange={handleImageChange}
                            multiple
                            className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-white text-sm text-gray-600 file:mr-4 file:cursor-pointer file:border-0 file:bg-[var(--primary)] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-[var(--primary-dark)]"
                        />
                    </fieldset>

                    <fieldset className="flex flex-col gap-4 rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
                        <legend className="px-2 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--primary-dark)]">Basic Information</legend>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Property Name <span className="text-red-500">*</span></label>
                            <input
                                name='name'
                                type='text'
                                placeholder='Type the property name here...'
                                value={formData.name}
                                onChange={handleCapitalize}
                                required
                                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Full Address <span className="text-red-500">*</span></label>
                            <input
                                name='address'
                                type='text'
                                placeholder='Type the complete address here...'
                                value={formData.address}
                                onChange={handleCapitalize}
                                required
                                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Price (₱) per month <span className="text-red-500">*</span></label>
                                <input
                                    name='price'
                                    type='number'
                                    step='0.01'
                                    placeholder='0.00'
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Category <span className="text-red-500">*</span></label>
                                <select
                                    name='category'
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                    className="w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                >
                                    <option value=''>Select Category</option>
                                    <option value='apartment'>Apartment</option>
                                    <option value='house'>House</option>
                                    <option value='condo'>Condo</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Description <span className="text-xs font-normal text-gray-400">(optional)</span></label>
                            <textarea
                                name='description'
                                rows={5}
                                placeholder="e.g. Spacious balcony, quiet neighborhood..."
                                value={formData.description}
                                onChange={handleCapitalize}
                                className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                            />
                        </div>
                    </fieldset>

                    <fieldset className="flex flex-col gap-4 rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
                        <legend className="px-2 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--primary-dark)]">Rooms</legend>

                        {(['bedroom_count', 'kitchen_count', 'bathroom_count'] as const).map((field, i) => (
                            <div key={field} className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
                                <label className="text-sm font-medium text-gray-700">{['Bedrooms', 'Kitchen', 'Bathrooms'][i]}</label>

                                <div className="inline-flex items-center gap-3">
                                    <button
                                        type='button'
                                        onClick={() => adjustCount(field, -1)}
                                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--primary)] bg-white text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
                                    >
                                        <i className="fa-solid fa-minus text-xs" />
                                    </button>

                                    <span className="min-w-6 text-center text-sm font-semibold text-[var(--text)]">{formData[field]}</span>

                                    <button
                                        type='button'
                                        onClick={() => adjustCount(field, 1)}
                                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--primary)] bg-white text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
                                    >
                                        <i className="fa-solid fa-plus text-xs" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <fieldset className="flex flex-col gap-4 rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
                            <legend className="px-2 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--primary-dark)]">Other Rooms</legend>

                            <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
                                <label className="text-sm font-medium text-gray-700">How many other rooms?</label>

                                <div className="inline-flex items-center gap-3">
                                    <button
                                        type='button'
                                        onClick={() => adjustCount('other_rooms_count', -1)}
                                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--primary)] bg-white text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
                                    >
                                        <i className="fa-solid fa-minus text-xs" />
                                    </button>

                                    <span className="min-w-6 text-center text-sm font-semibold text-[var(--text)]">{formData.other_rooms_count}</span>

                                    <button
                                        type='button'
                                        onClick={() => adjustCount('other_rooms_count', 1)}
                                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--primary)] bg-white text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
                                    >
                                        <i className="fa-solid fa-plus text-xs" />
                                    </button>
                                </div>
                            </div>

                            {Array.from({ length: formData.other_rooms_count }).map((_, i) => (
                                <div key={i} className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">Room {i + 1} Name</label>
                                    <input
                                        type='text'
                                        placeholder='e.g. Balcony, Attic, Library'
                                        value={formData.other_rooms[i] || ''}
                                        onChange={(e) => handleOtherRoomChange(i, e.target.value)}
                                        required
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                    />
                                </div>
                            ))}
                        </fieldset>
                    </fieldset>

                    <fieldset className="flex flex-col gap-4 rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
                        <legend className="px-2 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--primary-dark)]">Occupants & Pets</legend>

                        <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
                            <label className="text-sm font-medium text-gray-700">Max Persons</label>

                            <div className="inline-flex items-center gap-3">
                                <button
                                    type='button'
                                    onClick={() => adjustCount('max_occupants', -1)}
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--primary)] bg-white text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
                                >
                                    <i className="fa-solid fa-minus text-xs" />
                                </button>

                                <span className="min-w-6 text-center text-sm font-semibold text-[var(--text)]">{formData.max_occupants}</span>

                                <button
                                    type='button'
                                    onClick={() => adjustCount('max_occupants', 1)}
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--primary)] bg-white text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
                                >
                                    <i className="fa-solid fa-plus text-xs" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
                            <span className="text-sm font-medium text-gray-700">Are pets allowed?</span>

                            <div className="inline-flex items-center gap-2" role="group" aria-label="Are pets allowed?">
                                {[true, false].map(allowed => (
                                    <button
                                        key={String(allowed)}
                                        type="button"
                                        aria-pressed={formData.pets_allowed === allowed}
                                        onClick={() => setFormData(prev => ({ ...prev, pets_allowed: allowed }))}
                                        className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                                            formData.pets_allowed === allowed
                                                ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        {allowed ? 'Yes' : 'No'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </fieldset>

                    <fieldset className="flex flex-col gap-4 rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
                        <legend className="px-2 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--primary-dark)]">Amenities</legend>

                        <div className="flex flex-wrap gap-x-6 gap-y-3">
                            {(['wifi', 'aircon', 'parking'] as const).map(key => (
                                <label key={key} className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[var(--primary-dark)]">
                                    <input
                                        type='checkbox'
                                        checked={formData.amenities[key]}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            amenities: { ...formData.amenities, [key]: e.target.checked }
                                        })}
                                        className="h-4 w-4 cursor-pointer accent-[var(--primary)]"
                                    />
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                </label>
                            ))}
                        </div>

                        <fieldset className="flex flex-col gap-4 rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
                            <legend className="px-2 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--primary-dark)]">Other Amenities</legend>

                            <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
                                <label className="text-sm font-medium text-gray-700">How many other amenities?</label>

                                <div className="inline-flex items-center gap-3">
                                    <button
                                        type='button'
                                        onClick={() => adjustCount('other_amenities_count', -1)}
                                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--primary)] bg-white text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
                                    >
                                        <i className="fa-solid fa-minus text-xs" />
                                    </button>

                                    <span className="min-w-6 text-center text-sm font-semibold text-[var(--text)]">{formData.other_amenities_count}</span>

                                    <button
                                        type='button'
                                        onClick={() => adjustCount('other_amenities_count', 1)}
                                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--primary)] bg-white text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
                                    >
                                        <i className="fa-solid fa-plus text-xs" />
                                    </button>
                                </div>
                            </div>

                            {Array.from({ length: formData.other_amenities_count }).map((_, i) => (
                                <div key={i} className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">Amenity {i + 1}</label>
                                    <input
                                        type='text'
                                        placeholder='e.g. Appliances, 24/7 Gym, Pool'
                                        value={formData.other_amenities[i] || ''}
                                        onChange={(e) => handleOtherAmenityChange(i, e.target.value)}
                                        required
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                    />
                                </div>
                            ))}
                        </fieldset>
                    </fieldset>

                    <div className="flex flex-wrap justify-end gap-3">
                        <button
                            type='submit'
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <i className={`fa-solid ${isEdit ? 'fa-floppy-disk' : 'fa-plus'}`} />
                            {isEdit ? 'Save Changes' : 'Add Property'}
                        </button>

                        <button
                            type='button'
                            onClick={props.goBack}
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                        >
                            <i className="fa-solid fa-xmark" />
                            Cancel
                        </button>
                    </div>

                </form>
            </main>
        </section>
    );
}

export default PropertyForm;