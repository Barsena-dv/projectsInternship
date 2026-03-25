import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const SEARCH_DEBOUNCE_MS = 450;
const DEFAULT_FALLBACK_LOCATION = {
  lat: 20.5937,
  lng: 78.9629,
  address: '',
};

const toLocationFromNominatimItem = (item) => ({
  lat: Number(item.lat),
  lng: Number(item.lon),
  address: item.display_name || '',
});

export const useLocation = () => {
  const [location, setLocation] = useState(DEFAULT_FALLBACK_LOCATION);
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(true);
  const [locationError, setLocationError] = useState('');
  const hasGeolocatedRef = useRef(false);

  const hasSelectedLocation = useMemo(
    () => Number.isFinite(location.lat) && Number.isFinite(location.lng) && Boolean(location.address),
    [location.address, location.lat, location.lng]
  );

  const reverseGeocode = useCallback(async (lat, lng) => {
    setIsReverseGeocoding(true);

    try {
      const params = new URLSearchParams({
        format: 'jsonv2',
        lat: String(lat),
        lon: String(lng),
      });

      const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();
      const address = data?.display_name || 'Pinned location';

      setLocation((prev) => ({
        ...prev,
        lat,
        lng,
        address,
      }));
      setSearchText(address);
      setLocationError('');
      return address;
    } catch {
      const fallbackAddress = 'Pinned location';
      setLocation((prev) => ({
        ...prev,
        lat,
        lng,
        address: fallbackAddress,
      }));
      setSearchText(fallbackAddress);
      setLocationError('Could not fetch the exact address. A pinned location will be used.');
      return fallbackAddress;
    } finally {
      setIsReverseGeocoding(false);
    }
  }, []);

  const selectSuggestion = useCallback((suggestion) => {
    setLocation({
      lat: suggestion.lat,
      lng: suggestion.lng,
      address: suggestion.address,
    });
    setSearchText(suggestion.address);
    setSuggestions([]);
    setLocationError('');
  }, []);

  const pickFromMap = useCallback(
    async ({ lat, lng }) => {
      setLocation((prev) => ({
        ...prev,
        lat,
        lng,
      }));
      await reverseGeocode(lat, lng);
    },
    [reverseGeocode]
  );

  const useCurrentLocation = useCallback(async () => {
    setLocationError('');
    setIsLocating(true);

    if (!navigator.geolocation) {
      setIsLocating(false);
      setLocationError('Geolocation is not supported on this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLocation((prev) => ({
          ...prev,
          lat,
          lng,
        }));

        await reverseGeocode(lat, lng);
        setIsLocating(false);
        hasGeolocatedRef.current = true;
      },
      () => {
        setIsLocating(false);
        setLocationError('Could not access your current location. Please search or click on the map.');
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
      }
    );
  }, [reverseGeocode]);

  useEffect(() => {
    if (!hasGeolocatedRef.current) {
      useCurrentLocation();
    }
  }, [useCurrentLocation]);

  useEffect(() => {
    const query = searchText.trim();

    if (query.length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      return undefined;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setIsSearching(true);

      try {
        const params = new URLSearchParams({
          format: 'jsonv2',
          limit: '6',
          q: query,
        });

        const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = await response.json();
        const nextSuggestions = Array.isArray(data)
          ? data
              .map((item) => ({
                id: `${item.place_id}`,
                ...toLocationFromNominatimItem(item),
              }))
              .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng) && item.address)
          : [];

        setSuggestions(nextSuggestions);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setSuggestions([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [searchText]);

  return {
    location,
    searchText,
    suggestions,
    isSearching,
    isReverseGeocoding,
    isLocating,
    locationError,
    hasSelectedLocation,
    setSearchText,
    selectSuggestion,
    pickFromMap,
    useCurrentLocation,
  };
};

export default useLocation;