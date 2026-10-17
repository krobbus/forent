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
        pet_count: property?.pet_count || 1,
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
                        max_occupants: 1, pets_allowed: false, pet_count: 1,
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
        <section id='propertyFormContainer'>
            <header>
                <h2>{isEdit ? 'Update Property' : 'Add New Property'}</h2>
                <p>
                    {isEdit
                        ? 'Modify the details of your listed property. All changes will be reflected immediately upon saving.'
                        : 'Fill in the details below to list a new property under your account.'
                    }
                </p>
            </header>

            <main>
                <form onSubmit={handleSubmit}>
                    <fieldset>
                        <legend>Property Images {!isEdit && <span>(optional)</span>}</legend>

                        {images.length > 0 && (
                            <section className='imgPreviewGrid'>
                                {images.map((img, i) => (
                                    <section key={i} className='imgPreviewItem'>
                                        <img src={img} alt={`Preview ${i + 1}`} />

                                        <button
                                            type='button'
                                            className='removeImgBtn'
                                            onClick={() => removeImage(i)}
                                        >
                                            <i className='fa-solid fa-xmark' />
                                        </button>
                                    </section>
                                ))}
                            </section>
                        )}

                        <div className='fileInputWrapper'>
                            <input
                                type='file'
                                accept='image/*'
                                onChange={handleImageChange}
                                multiple
                            />
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend>Basic Information</legend>

                        <section className='fieldGroup'>
                            <label>Property Name <span>*</span></label>
                            <input
                                name='name'
                                type='text'
                                placeholder='Type the property name here...'
                                value={formData.name}
                                onChange={handleCapitalize}
                                required
                            />
                        </section>

                        <section className='fieldGroup'>
                            <label>Full Address <span>*</span></label>
                            <input
                                name='address'
                                type='text'
                                placeholder='Type the complete address here...'
                                value={formData.address}
                                onChange={handleCapitalize}
                                required
                            />
                        </section>

                        <section className='fieldGroup'>
                            <label>Price (₱) per month <span>*</span></label>
                            <input
                                name='price'
                                type='number'
                                step='0.01'
                                placeholder='0.00'
                                value={formData.price}
                                onChange={handleChange}
                                required
                            />
                        </section>

                        <section className='fieldGroup'>
                            <label>Description <span className='optional'>(optional)</span></label>
                            <textarea
                                name='description'
                                rows={5}
                                placeholder="e.g. Spacious balcony, quiet neighborhood..."
                                value={formData.description}
                                onChange={handleCapitalize}
                            />
                        </section>

                        <section className='fieldGroup'>
                            <label>Category <span>*</span></label>
                            <select name='category' value={formData.category} onChange={handleChange} required>
                                <option value='' className='default'>Select Category</option>
                                <option value='apartment'>Apartment</option>
                                <option value='house'>House</option>
                                <option value='condo'>Condo</option>
                            </select>
                        </section>
                    </fieldset>

                    <fieldset>
                        <legend>Rooms</legend>

                        {(['bedroom_count', 'kitchen_count', 'bathroom_count'] as const).map((field, i) => (
                            <section key={field} className='counterRow'>
                                <label>{['Bedrooms', 'Kitchen', 'Bathrooms'][i]}</label>
                                <div className='stepper'>
                                    <button type='button' onClick={() => adjustCount(field, -1)}>-</button>
                                    <span>{formData[field]}</span>
                                    <button type='button' onClick={() => adjustCount(field, 1)}>+</button>
                                </div>
                            </section>
                        ))}

                        <fieldset>
                            <legend>Other Rooms</legend>

                            <div className='counterRow'>
                                <label>How many other rooms?</label>
                                <div className='stepper'>
                                    <button type='button' onClick={() => adjustCount('other_rooms_count', -1)}>-</button>
                                    <span>{formData.other_rooms_count}</span>
                                    <button type='button' onClick={() => adjustCount('other_rooms_count', 1)}>+</button>
                                </div>
                            </div>

                            {Array.from({ length: formData.other_rooms_count }).map((_, i) => (
                                <div key={i} className='fieldGroup'>
                                    <label>Room {i + 1} Name</label>
                                    <input
                                        type='text'
                                        placeholder='e.g. Balcony, Attic, Library'
                                        value={formData.other_rooms[i] || ''}
                                        onChange={(e) => handleOtherRoomChange(i, e.target.value)}
                                        required
                                    />
                                </div>
                            ))}
                        </fieldset>
                    </fieldset>

                    <fieldset>
                        <legend>Occupants & Pets</legend>

                        <div className='counterRow'>
                            <label>Max Persons</label>
                            <div className='stepper'>
                                <button type='button' onClick={() => adjustCount('max_occupants', -1)}>-</button>
                                <span>{formData.max_occupants}</span>
                                <button type='button' onClick={() => adjustCount('max_occupants', 1)}>+</button>
                            </div>
                        </div>

                        <div className='counterRow'>
                            <label>Pets Allowed</label>
                            <div className='stepper'>
                                <button type='button' onClick={() => setFormData(prev => ({ ...prev, pet_count: Math.max(1, prev.pet_count - 1) }))}>-</button>
                                <span>{formData.pet_count}</span>
                                <button type='button' onClick={() => setFormData(prev => ({ ...prev, pet_count: prev.pet_count + 1 }))}>+</button>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend>Amenities</legend>

                        <div className='checkboxGrid'>
                            {(['wifi', 'aircon', 'parking'] as const).map(key => (
                                <label key={key} className='checkboxLabel'>
                                    <input
                                        type='checkbox'
                                        checked={formData.amenities[key]}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            amenities: { ...formData.amenities, [key]: e.target.checked }
                                        })}
                                    />
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                </label>
                            ))}
                        </div>

                        <fieldset>
                            <legend>Other Amenities</legend>

                            <div className='counterRow'>
                                <label>How many other amenities?</label>
                                <div className='stepper'>
                                    <button type='button' onClick={() => adjustCount('other_amenities_count', -1)}>-</button>
                                    <span>{formData.other_amenities_count}</span>
                                    <button type='button' onClick={() => adjustCount('other_amenities_count', 1)}>+</button>
                                </div>
                            </div>

                            {Array.from({ length: formData.other_amenities_count }).map((_, i) => (
                                <div key={i} className='fieldGroup'>
                                    <label>Amenity {i + 1}</label>
                                    <input
                                        type='text'
                                        placeholder='e.g. Appliances, 24/7 Gym, Pool'
                                        value={formData.other_amenities[i] || ''}
                                        onChange={(e) => handleOtherAmenityChange(i, e.target.value)}
                                        required
                                    />
                                </div>
                            ))}
                        </fieldset>
                    </fieldset>

                    <div className='btnWrapper'>
                        <button type='submit' className='submitBtn'>
                            {isEdit ? 'Save Changes' : '+ Add Property'}
                        </button>

                        <button type='button' className='cancelBtn' onClick={props.goBack}>
                            Cancel
                        </button>
                    </div>

                </form>
            </main>
        </section>
    );
}

export default PropertyForm;