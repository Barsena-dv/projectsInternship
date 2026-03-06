import { useCallback, useEffect, useRef, useState } from 'react';

// Classes/types that represent broad areas (taluka / suburb / district level)
const AREA_TYPES = new Set([
    'suburb', 'quarter', 'neighbourhood', 'residential',
    'village', 'town', 'city', 'municipality',
    'county', 'district', 'state_district', 'region',
    'administrative', 'hamlet', 'locality', 'borough',
]);

/**
 * LocationAutocomplete
 *
 * Props:
 *  label, placeholder, required, value, onChange, onSelect, viewbox, icon, error
 *  areaOnly   bool  — if true, only shows suburb/town/district level results (for General Location)
 */
const LocationAutocomplete = ({
    label,
    placeholder = 'Search location…',
    required = false,
    value = '',
    onChange,
    onSelect,
    viewbox = null,
    icon = null,
    error = null,
    areaOnly = false,
}) => {
    const [query, setQuery] = useState(value);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const debounceRef = useRef(null);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => { setQuery(value); }, [value]);

    const fetchSuggestions = useCallback(async (q) => {
        if (!q || q.trim().length < 3) { setSuggestions([]); return; }

        setLoading(true);
        try {
            let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=8&addressdetails=1`;
            if (viewbox) url += `&viewbox=${viewbox.join(',')}&bounded=1`;

            const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
            let data = await res.json();

            // Filter to area-level types if areaOnly is set
            if (areaOnly) {
                const filtered = data.filter(item =>
                    AREA_TYPES.has(item.type) || AREA_TYPES.has(item.class)
                );
                // If nothing passed filter, still show top 4 results so the user isn't stuck
                data = filtered.length > 0 ? filtered : data.slice(0, 4);
            }

            setSuggestions(data.slice(0, 6));
            setOpen(data.length > 0);
        } catch (_) {
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    }, [viewbox, areaOnly]);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        onChange?.(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(val), 500);
    };

    const handleSelect = (item) => {
        const displayName = areaOnly ? buildAreaLabel(item) : buildDetailLabel(item);
        setQuery(displayName);
        onChange?.(displayName);
        setOpen(false);
        setSuggestions([]);

        onSelect?.({
            displayName,
            fullName: item.display_name,
            coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
            boundingBox: item.boundingbox
                ? [
                    parseFloat(item.boundingbox[2]), // west lon
                    parseFloat(item.boundingbox[0]), // south lat
                    parseFloat(item.boundingbox[3]), // east lon
                    parseFloat(item.boundingbox[1]), // north lat
                ]
                : null,
        });
    };

    return (
        <div className="flex flex-col gap-1.5 relative" ref={wrapperRef}>
            {label && (
                <label className="text-sm font-medium text-text-primary">
                    {label} {required && <span className="text-error">*</span>}
                </label>
            )}

            <div className="relative">
                {icon && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        {icon}
                    </span>
                )}

                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => suggestions.length > 0 && setOpen(true)}
                    placeholder={placeholder}
                    autoComplete="off"
                    className={`w-full py-2.5 rounded-lg border bg-white outline-none transition-all
                        ${icon ? 'pl-9' : 'pl-4'} pr-9
                        ${error
                            ? 'border-error ring-1 ring-error/20'
                            : 'border-gray-200 focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/10'}
                    `}
                />

                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {loading ? (
                        <svg className="w-4 h-4 text-primary-blue animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    )}
                </span>

                {open && suggestions.length > 0 && (
                    <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                        {suggestions.map((item) => {
                            const { icon: typeIcon, typeLabel } = getTypeInfo(item.type, item.class);
                            const label = areaOnly ? buildAreaLabel(item) : buildDetailLabel(item);
                            return (
                                <li
                                    key={item.place_id}
                                    onMouseDown={() => handleSelect(item)}
                                    className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-primary-blue/5 border-b border-gray-50 last:border-none transition-colors"
                                >
                                    <span className="mt-0.5 text-base shrink-0">{typeIcon}</span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-text-primary">{label}</p>
                                        <p className="text-xs text-text-secondary truncate">{item.display_name}</p>
                                        <span className="text-[10px] font-semibold uppercase tracking-wide text-primary-blue/70">{typeLabel}</span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {error && <p className="text-xs text-error">{error}</p>}
        </div>
    );
};

// ─── Label builders ───────────────────────────────────────────────────────────

/** Area-level: show suburb/area name + city + state — NOT full address */
function buildAreaLabel(item) {
    const a = item.address || {};
    const parts = [
        a.suburb || a.quarter || a.neighbourhood || a.hamlet || a.locality || a.village || a.town,
        a.city || a.county || a.state_district,
        a.state,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
    return item.display_name.split(',').slice(0, 3).join(',').trim();
}

/** Detail-level: show road / building + area + city */
function buildDetailLabel(item) {
    const a = item.address || {};
    const parts = [
        a.amenity || a.building || a.shop || a.office,
        a.road || a.pedestrian || a.footway,
        a.neighbourhood || a.suburb || a.quarter,
        a.city || a.town || a.village,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
    return item.display_name.split(',').slice(0, 4).join(',').trim();
}

function getTypeInfo(type, cls) {
    const map = {
        residential: { icon: '🏘️', typeLabel: 'Residential' },
        house: { icon: '🏠', typeLabel: 'House' },
        building: { icon: '🏢', typeLabel: 'Building' },
        apartments: { icon: '🏬', typeLabel: 'Apartments' },
        road: { icon: '🛣️', typeLabel: 'Road' },
        primary: { icon: '🛣️', typeLabel: 'Main Road' },
        secondary: { icon: '🛤️', typeLabel: 'Road' },
        tertiary: { icon: '🛤️', typeLabel: 'Street' },
        suburb: { icon: '📍', typeLabel: 'Suburb' },
        quarter: { icon: '📍', typeLabel: 'Quarter' },
        neighbourhood: { icon: '📍', typeLabel: 'Neighbourhood' },
        hamlet: { icon: '🏡', typeLabel: 'Hamlet' },
        village: { icon: '🌳', typeLabel: 'Village' },
        town: { icon: '🏙️', typeLabel: 'Town' },
        city: { icon: '🏙️', typeLabel: 'City' },
        county: { icon: '🗺️', typeLabel: 'District' },
        district: { icon: '🗺️', typeLabel: 'District' },
        municipality: { icon: '🏛️', typeLabel: 'Municipality' },
        administrative: { icon: '🏛️', typeLabel: 'Administrative' },
        school: { icon: '🏫', typeLabel: 'School' },
        university: { icon: '🎓', typeLabel: 'University' },
        hospital: { icon: '🏥', typeLabel: 'Hospital' },
        mall: { icon: '🛍️', typeLabel: 'Mall' },
        park: { icon: '🌿', typeLabel: 'Park' },
        bus_station: { icon: '🚌', typeLabel: 'Bus Station' },
        station: { icon: '🚉', typeLabel: 'Station' },
    };
    return map[type] || map[cls] || { icon: '📌', typeLabel: cls || 'Place' };
}

export default LocationAutocomplete;
