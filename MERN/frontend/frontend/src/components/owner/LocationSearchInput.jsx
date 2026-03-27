import { useMemo, useState } from 'react';

const LocationSearchInput = ({
  value,
  onChange,
  suggestions,
  isLoading,
  onSelect,
  onUseCurrentLocation,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasSuggestions = useMemo(() => suggestions.length > 0, [suggestions.length]);

  return (
    <div className="relative">
      <label className="mb-1 block text-sm font-medium">Last Seen Location</label>

      <div className="flex gap-2">
        <input
          className="pnf-input"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search location (min 3 characters)"
          autoComplete="off"
          disabled={disabled}
        />

        <button
          type="button"
          className="pnf-btn-outline rounded-lg px-3 py-2 text-sm"
          onClick={onUseCurrentLocation}
          disabled={disabled}
        >
          Use current
        </button>
      </div>

      {isLoading ? <p className="mt-1 text-xs text-stone-500">Searching locations...</p> : null}

      {isOpen && hasSuggestions ? (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-white/10 bg-stone-900 shadow-xl" style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <button
                type="button"
                className="w-full px-4 py-3 text-left text-sm text-stone-200 transition-colors hover:bg-amber-500/10 hover:text-amber-400"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(suggestion);
                  setIsOpen(false);
                }}
              >
                {suggestion.address}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {isOpen && hasSuggestions ? (
        <button
          type="button"
          className="fixed inset-0 z-10 h-full w-full cursor-default"
          onClick={() => setIsOpen(false)}
          aria-label="Close suggestions"
        />
      ) : null}
    </div>
  );
};

export default LocationSearchInput;