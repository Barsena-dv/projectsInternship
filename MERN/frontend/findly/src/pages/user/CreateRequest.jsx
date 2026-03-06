import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import LocationAutocomplete from '../../components/ui/LocationAutocomplete';
import { useAuth } from '../../hooks/useAuth';
import axiosInstance from '../../utils/axiosInstance';

// Fix Leaflet marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CATEGORIES = ['Electronics', 'Wallet', 'Documents', 'Bags', 'Keys', 'Jewelry', 'Other'];
const DEFAULT_CENTER = [23.0225, 72.5714]; // Ahmedabad

const STEPS = [
    { id: 1, label: 'Item Details', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 2, label: 'Location', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 3, label: 'Reward & Images', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01' },
];

// ─── Smoothly fly the map to new coordinates ─────────────────────────────────
const FlyToLocation = ({ target, zoom = 15 }) => {
    const map = useMap();
    useEffect(() => {
        if (target) map.flyTo([target[1], target[0]], zoom, { duration: 1.2 });
    }, [target, map, zoom]);
    return null;
};

// ─── Click on map to manually reposition the pin ─────────────────────────────
const ClickMarker = ({ position, onSelect }) => {
    useMapEvents({ click(e) { onSelect([e.latlng.lng, e.latlng.lat]); } });
    return position ? <Marker position={[position[1], position[0]]} /> : null;
};

const CreateRequest = () => {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ─── Location state ───────────────────────────────────────────────────────
    const [generalText, setGeneralText] = useState(''); // display text
    const [exactText, setExactText] = useState(''); // display text
    const [coordinates, setCoordinates] = useState(null); // [lng, lat]
    const [generalBBox, setGeneralBBox] = useState(null); // viewbox for exact search
    const [flyZoom, setFlyZoom] = useState(13);

    // ─── Images ───────────────────────────────────────────────────────────────
    const [imagePreviews, setImagePreviews] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);

    const { register, handleSubmit, trigger, setValue, getValues, formState: { errors } } = useForm({ mode: 'onChange' });

    // ─── Validation step map ─────────────────────────────────────────────────
    const STEP_FIELDS = {
        1: ['title', 'category', 'description', 'lostDate'],
    };

    const handleNext = async () => {
        const fields = STEP_FIELDS[step];
        const valid = fields ? await trigger(fields) : true;
        if (!valid) return;

        if (step === 2 && !coordinates) {
            toast.warn('Please select a location using the search fields or click on the map.');
            return;
        }

        setStep(s => s + 1);
    };

    const handleBack = () => setStep(s => s - 1);

    // ─── General Location selected ────────────────────────────────────────────
    const handleGeneralSelect = ({ displayName, coordinates: coords, boundingBox }) => {
        setGeneralText(displayName);
        setValue('generalLocation', displayName);
        setCoordinates(coords);
        setGeneralBBox(boundingBox);   // use as viewbox for exact search
        setExactText('');              // reset exact when general changes
        setValue('exactLocation', '');
        setFlyZoom(14);
    };

    // ─── Exact Location selected (search constrained to generalBBox) ──────────
    const handleExactSelect = ({ displayName, coordinates: coords }) => {
        setExactText(displayName);
        setValue('exactLocation', displayName);
        setCoordinates(coords);        // refine pin to the precise spot
        setFlyZoom(17);
    };

    // ─── Map click: manual override ───────────────────────────────────────────
    const handleMapClick = (coords) => {
        setCoordinates(coords);
        setFlyZoom(prev => prev); // don't change zoom on manual click
    };

    // ─── Images ───────────────────────────────────────────────────────────────
    const handleImageChange = useCallback((e) => {
        const files = Array.from(e.target.files).slice(0, 5);
        setImageFiles(files);
        setImagePreviews(files.map(f => URL.createObjectURL(f)));
    }, []);

    const removeImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    // ─── Submit ───────────────────────────────────────────────────────────────
    const onSubmit = async (data) => {
        if (!coordinates) { toast.warn('Please select a location.'); return; }
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('category', data.category);
        formData.append('description', data.description);
        formData.append('lostDate', data.lostDate);
        formData.append('generalLocation', generalText);
        formData.append('exactLocation', exactText);
        formData.append('rewardAmount', data.rewardAmount);
        formData.append('coordinates', JSON.stringify(coordinates));
        imageFiles.forEach(f => formData.append('images', f));

        try {
            await axiosInstance.post('/requests', formData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
            });
            toast.success('Request created successfully');
            navigate('/user/requests');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create request.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputCls = (err) =>
        `w-full px-4 py-2.5 rounded-lg border bg-white outline-none transition-all ${err ? 'border-error ring-1 ring-error/20'
            : 'border-gray-200 focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/10'
        }`;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-primary">Create Lost Item Request</h1>
                <p className="text-text-secondary mt-1">Fill out each section to post your recovery request.</p>
            </div>

            {/* ── Step Indicator ── */}
            <div className="flex items-center gap-0 mb-8">
                {STEPS.map((s, idx) => {
                    const done = step > s.id, active = step === s.id;
                    return (
                        <React.Fragment key={s.id}>
                            <div className="flex flex-col items-center gap-1.5 flex-1">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300
                                    ${done ? 'bg-success text-white shadow-sm' :
                                        active ? 'bg-primary-blue text-white shadow-md shadow-primary-blue/20' :
                                            'bg-gray-100 text-gray-400'}`}>
                                    {done ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={s.icon} />
                                        </svg>
                                    )}
                                </div>
                                <span className={`text-xs font-semibold whitespace-nowrap ${active ? 'text-primary-blue' : done ? 'text-success' : 'text-gray-400'}`}>
                                    {s.label}
                                </span>
                            </div>
                            {idx < STEPS.length - 1 && (
                                <div className={`h-[2px] flex-1 mb-5 transition-all duration-500 ${step > s.id ? 'bg-success' : 'bg-gray-200'}`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>

                {/* ══ STEP 1: Item Details ══ */}
                {step === 1 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5">
                        <h2 className="text-base font-semibold text-text-primary pb-3 border-b border-gray-100">Step 1 — Item Details</h2>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-text-primary">Title <span className="text-error">*</span></label>
                            <input type="text" placeholder="e.g. Lost black leather wallet near City Mall"
                                {...register('title', { required: 'Title is required' })}
                                className={inputCls(errors.title)} />
                            {errors.title && <p className="text-xs text-error">{errors.title.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-text-primary">Category <span className="text-error">*</span></label>
                                <select {...register('category', { required: 'Category is required' })}
                                    className={inputCls(errors.category) + ' appearance-none cursor-pointer'}>
                                    <option value="">Select category…</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                {errors.category && <p className="text-xs text-error">{errors.category.message}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-text-primary">Date Lost <span className="text-error">*</span></label>
                                <input type="date" max={new Date().toISOString().split('T')[0]}
                                    {...register('lostDate', { required: 'Date is required' })}
                                    className={inputCls(errors.lostDate)} />
                                {errors.lostDate && <p className="text-xs text-error">{errors.lostDate.message}</p>}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-text-primary">Description <span className="text-error">*</span></label>
                            <textarea rows={4} placeholder="Describe the item — color, brand, distinguishing marks…"
                                {...register('description', { required: 'Description is required', minLength: { value: 20, message: 'Minimum 20 characters' } })}
                                className={inputCls(errors.description) + ' resize-none'} />
                            {errors.description && <p className="text-xs text-error">{errors.description.message}</p>}
                        </div>

                        <StepNav step={step} total={STEPS.length} onBack={handleBack} onNext={handleNext} navigate={navigate} />
                    </div>
                )}

                {/* ══ STEP 2: Location ══ */}
                {step === 2 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5">
                        <h2 className="text-base font-semibold text-text-primary pb-3 border-b border-gray-100">Step 2 — Location</h2>

                        {/* Instruction banner */}
                        <div className="flex items-start gap-3 bg-primary-blue/5 border border-primary-blue/15 rounded-lg px-4 py-3">
                            <svg className="w-4 h-4 text-primary-blue mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs text-primary-blue leading-relaxed">
                                <strong>Search General Location first</strong> (area / road / landmark), then narrow down with Exact Location (building / block). The map updates live.
                            </p>
                        </div>

                        {/* General Location (area-level search — taluka / suburb) */}
                        <LocationAutocomplete
                            label="General Location"
                            placeholder="Search area, taluka, suburb, road…"
                            required
                            value={generalText}
                            onChange={setGeneralText}
                            onSelect={handleGeneralSelect}
                            areaOnly={true}
                            error={errors.generalLocation?.message}
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            }
                        />
                        {/* Hidden RHF field */}
                        <input type="hidden" {...register('generalLocation', { required: 'General location is required' })} />

                        {/* Exact Location (constrained within generalBBox) */}
                        <LocationAutocomplete
                            label="Exact Location"
                            placeholder={generalText ? `Search building / block within ${generalText.split(',')[0]}…` : 'Search exact address, building…'}
                            value={exactText}
                            onChange={setExactText}
                            onSelect={handleExactSelect}
                            viewbox={generalBBox}    // constrain to selected general area
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            }
                        />
                        <input type="hidden" {...register('exactLocation')} />

                        {/* Map */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-text-primary">
                                    Live Map Preview
                                </label>
                                {coordinates && (
                                    <span className="text-[11px] font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full">
                                        ✓ Pin set — {coordinates[1].toFixed(4)}, {coordinates[0].toFixed(4)}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-text-secondary -mt-1">
                                Select from the fields above or click the map to fine-tune the pin.
                            </p>
                            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm h-[320px]">
                                <MapContainer center={DEFAULT_CENTER} zoom={12} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <FlyToLocation target={coordinates} zoom={flyZoom} />
                                    <ClickMarker position={coordinates} onSelect={handleMapClick} />
                                </MapContainer>
                            </div>
                        </div>

                        <StepNav step={step} total={STEPS.length} onBack={handleBack} onNext={handleNext} navigate={navigate} />
                    </div>
                )}

                {/* ══ STEP 3: Reward & Images ══ */}
                {step === 3 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5">
                        <h2 className="text-base font-semibold text-text-primary pb-3 border-b border-gray-100">Step 3 — Reward & Images</h2>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-text-primary">Reward Amount (₹) <span className="text-error">*</span></label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-text-secondary">₹</span>
                                <input type="number" min={0} placeholder="0"
                                    {...register('rewardAmount', { required: 'Reward is required', min: { value: 0, message: 'Must be ≥ 0' } })}
                                    className={inputCls(errors.rewardAmount) + ' pl-8'} />
                            </div>
                            {errors.rewardAmount && <p className="text-xs text-error">{errors.rewardAmount.message}</p>}
                        </div>

                        {/* Image upload */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-text-primary">Images <span className="text-gray-400 font-normal">(max 5)</span></label>
                            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-primary-blue/50 hover:bg-primary-blue/5 transition-all">
                                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm text-text-secondary">Click to upload images</span>
                                <span className="text-xs text-gray-400">JPG, PNG, WEBP — up to 5</span>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                            </label>
                            {imagePreviews.length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-1">
                                    {imagePreviews.map((src, i) => (
                                        <div key={i} className="relative group rounded-lg overflow-hidden aspect-square border border-gray-200">
                                            <img src={src} alt={`preview-${i}`} className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => removeImage(i)}
                                                className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Review summary */}
                        <div className="bg-gray-50 rounded-lg border border-gray-100 p-4 text-sm flex flex-col gap-1.5">
                            <p className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-1">Summary</p>
                            <p><span className="font-semibold text-text-primary">Title:</span> <span className="text-text-secondary">{getValues('title')}</span></p>
                            <p><span className="font-semibold text-text-primary">Category:</span> <span className="text-text-secondary">{getValues('category')}</span></p>
                            <p><span className="font-semibold text-text-primary">General Area:</span> <span className="text-text-secondary">{generalText || '—'}</span></p>
                            {exactText && <p><span className="font-semibold text-text-primary">Exact Spot:</span> <span className="text-text-secondary">{exactText}</span></p>}
                            {coordinates && <p><span className="font-semibold text-text-primary">Coordinates:</span> <span className="text-text-secondary">{coordinates[1].toFixed(5)}, {coordinates[0].toFixed(5)}</span></p>}
                        </div>

                        <StepNav step={step} total={STEPS.length} onBack={handleBack} onNext={handleNext} navigate={navigate} isSubmitting={isSubmitting} />
                    </div>
                )}
            </form>
        </div>
    );
};

// ─── Step Navigation ──────────────────────────────────────────────────────────
const StepNav = ({ step, total, onBack, onNext, navigate, isSubmitting = false }) => (
    <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button type="button" onClick={step === 1 ? () => navigate(-1) : onBack}
            className="px-5 py-2.5 rounded-lg border border-gray-200 text-text-primary text-sm font-semibold hover:bg-gray-50 transition-colors">
            {step === 1 ? 'Cancel' : '← Back'}
        </button>
        {step < total ? (
            <button type="button" onClick={onNext}
                className="flex-1 px-5 py-2.5 rounded-lg bg-primary-blue hover:bg-deep-indigo text-white text-sm font-semibold shadow-md shadow-primary-blue/20 transition-all active:scale-[0.98]">
                Continue →
            </button>
        ) : (
            <button type="submit" disabled={isSubmitting}
                className="flex-1 px-5 py-2.5 rounded-lg bg-primary-blue hover:bg-deep-indigo text-white text-sm font-semibold shadow-md shadow-primary-blue/20 transition-all active:scale-[0.98] disabled:opacity-60">
                {isSubmitting ? 'Submitting…' : 'Submit Request'}
            </button>
        )}
    </div>
);

export default CreateRequest;
