import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import useLocation from '../../hooks/useLocation';
import LocationSearchInput from './LocationSearchInput';
import MapPicker from './MapPicker';

const STEPS = [
  { id: 1, title: 'Minimal Information', subtitle: 'Card-ready details' },
  { id: 2, title: 'More Details', subtitle: 'Extra identification info' },
  { id: 3, title: 'Payment & Submit', subtitle: 'Plan, payment, and final submit' },
];

const RequestForm = ({ plans, loading, onSubmit }) => {
  const [step, setStep] = useState(1);
  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    setValue,
    trigger,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      itemName: '',
      itemCategory: '',
      description: '',
      brand: '',
      model: '',
      color: '',
      uniqueIdentifiers: '',
      serialNumber: '',
      lastSeenLocation: '',
      lastSeenLat: '',
      lastSeenLng: '',
      lastSeenDatetime: '',
      serviceDeadline: '',
      servicePlanId: plans?.[0]?._id || '',
      paymentMethod: 'upi',
    },
  });

  const {
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
  } = useLocation();

  useEffect(() => {
    if (plans.length > 0) {
      setValue('servicePlanId', plans[0]._id);
    }
  }, [plans, setValue]);

  useEffect(() => {
    if (!Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
      return;
    }

    setValue('lastSeenLat', location.lat.toFixed(6), { shouldValidate: true, shouldDirty: true });
    setValue('lastSeenLng', location.lng.toFixed(6), { shouldValidate: true, shouldDirty: true });
    setValue('lastSeenLocation', location.address || '', { shouldValidate: true, shouldDirty: true });

    if (location.address) {
      clearErrors('lastSeenLocation');
      clearErrors('lastSeenLat');
      clearErrors('lastSeenLng');
    }
  }, [clearErrors, location.address, location.lat, location.lng, setValue]);

  const handleFormSubmit = (values, intent = 'draft') => {
    if (!hasSelectedLocation) {
      setError('lastSeenLocation', { type: 'manual', message: 'Please select a location from search or map.' });
      setError('lastSeenLat', { type: 'manual', message: 'Latitude is required.' });
      setError('lastSeenLng', { type: 'manual', message: 'Longitude is required.' });
      return;
    }

    onSubmit(values, intent);
  };

  const isLocationBusy = isSearching || isReverseGeocoding || isLocating;
  const watchedLat = Number(useWatch({ control, name: 'lastSeenLat' }));
  const watchedLng = Number(useWatch({ control, name: 'lastSeenLng' }));
  const watchedPlanId = useWatch({ control, name: 'servicePlanId' });
  const watchedItemName = useWatch({ control, name: 'itemName' });
  const watchedItemCategory = useWatch({ control, name: 'itemCategory' });
  const watchedDescription = useWatch({ control, name: 'description' });
  const watchedLocation = useWatch({ control, name: 'lastSeenLocation' });

  const mapLat = Number.isFinite(watchedLat) ? watchedLat : location.lat;
  const mapLng = Number.isFinite(watchedLng) ? watchedLng : location.lng;
  const selectedPlan = useMemo(
    () => plans.find((plan) => String(plan._id) === String(watchedPlanId)),
    [plans, watchedPlanId]
  );

  const validateStep = async (currentStep) => {
    if (currentStep === 1) {
      const valid = await trigger(['itemName', 'itemCategory', 'description', 'lastSeenLocation', 'lastSeenLat', 'lastSeenLng']);
      if (!hasSelectedLocation) {
        setError('lastSeenLocation', { type: 'manual', message: 'Please select a location from search or map.' });
        setError('lastSeenLat', { type: 'manual', message: 'Latitude is required.' });
        setError('lastSeenLng', { type: 'manual', message: 'Longitude is required.' });
        return false;
      }
      return valid;
    }

    if (currentStep === 3) {
      return trigger(['servicePlanId']);
    }

    return true;
  };

  const goNext = async () => {
    const valid = await validateStep(step);
    if (!valid) return;
    setStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const goBack = () => setStep((prev) => Math.max(prev - 1, 1));

  return (
    <form className="pnf-card p-5" onSubmit={handleSubmit((values) => handleFormSubmit(values, 'draft'))}>
      <div className="mb-5 grid gap-2 md:grid-cols-3">
        {STEPS.map((item) => {
          const isActive = step === item.id;
          const isDone = step > item.id;

          return (
            <div
              key={item.id}
              className={`rounded-lg border p-3 ${isActive ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white'}`}
            >
              <p className={`text-xs font-semibold ${isDone ? 'text-emerald-700' : 'text-slate-600'}`}>
                Step {item.id}
              </p>
              <p className="text-sm font-medium text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500">{item.subtitle}</p>
            </div>
          );
        })}
      </div>

      {step === 1 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Item Name</label>
            <input className="pnf-input" {...register('itemName', { required: 'Item name is required' })} />
            {errors.itemName ? <p className="mt-1 text-xs text-rose-600">{errors.itemName.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Item Category</label>
            <input className="pnf-input" {...register('itemCategory', { required: 'Category is required' })} />
            {errors.itemCategory ? <p className="mt-1 text-xs text-rose-600">{errors.itemCategory.message}</p> : null}
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea className="pnf-input" rows={3} {...register('description', { required: 'Description is required' })} />
            {errors.description ? <p className="mt-1 text-xs text-rose-600">{errors.description.message}</p> : null}
          </div>

          <div className="md:col-span-2">
            <LocationSearchInput
              value={searchText}
              onChange={setSearchText}
              suggestions={suggestions}
              isLoading={isSearching}
              onSelect={selectSuggestion}
              onUseCurrentLocation={useCurrentLocation}
              disabled={loading}
            />

            <input type="hidden" {...register('lastSeenLocation', { required: 'Location is required' })} />
            <input type="hidden" {...register('lastSeenLat', { required: 'Latitude is required' })} />
            <input type="hidden" {...register('lastSeenLng', { required: 'Longitude is required' })} />

            {location.address ? (
              <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                Selected location: {location.address}
              </p>
            ) : null}

            {errors.lastSeenLocation ? <p className="mt-1 text-xs text-rose-600">{errors.lastSeenLocation.message}</p> : null}
            {errors.lastSeenLat ? <p className="mt-1 text-xs text-rose-600">{errors.lastSeenLat.message}</p> : null}
            {errors.lastSeenLng ? <p className="mt-1 text-xs text-rose-600">{errors.lastSeenLng.message}</p> : null}
            {locationError ? <p className="mt-1 text-xs text-amber-600">{locationError}</p> : null}
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Pick Location From Map</label>
            <p className="mb-2 text-xs text-slate-500">Search or click on the map to set location details.</p>
            <MapPicker lat={mapLat} lng={mapLng} onPick={pickFromMap} />
            {isLocationBusy ? <p className="mt-2 text-xs text-slate-500">Loading location data...</p> : null}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Brand</label>
            <input className="pnf-input" placeholder="e.g., Apple, Samsung" {...register('brand')} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Model</label>
            <input className="pnf-input" placeholder="e.g., iPhone 14 Pro" {...register('model')} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Color</label>
            <input className="pnf-input" placeholder="e.g., Black" {...register('color')} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Serial Number</label>
            <input className="pnf-input" placeholder="If available" {...register('serialNumber')} />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Unique Identifiers</label>
            <textarea
              className="pnf-input"
              rows={2}
              placeholder="Any unique marks, scratches, stickers, engravings, or identifiers"
              {...register('uniqueIdentifiers')}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Last Seen Date & Time</label>
            <input className="pnf-input" type="datetime-local" {...register('lastSeenDatetime')} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Service Deadline</label>
            <input className="pnf-input" type="date" {...register('serviceDeadline')} />
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Service Plan</label>
            <select className="pnf-input" {...register('servicePlanId', { required: 'Plan is required' })}>
              {plans.map((plan) => (
                <option key={plan._id} value={plan._id}>{plan.planName}</option>
              ))}
            </select>
            {errors.servicePlanId ? <p className="mt-1 text-xs text-rose-600">{errors.servicePlanId.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Preferred Payment Method</label>
            <select className="pnf-input" {...register('paymentMethod')}>
              <option value="upi">UPI</option>
              <option value="wallet">Wallet</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
            </select>
          </div>

          <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">Request Preview</p>
            <div className="mt-2 grid gap-1 text-sm text-slate-700 md:grid-cols-2">
              <p><span className="font-medium">Item:</span> {watchedItemName || '-'}</p>
              <p><span className="font-medium">Category:</span> {watchedItemCategory || '-'}</p>
              <p className="md:col-span-2"><span className="font-medium">Description:</span> {watchedDescription || '-'}</p>
              <p className="md:col-span-2"><span className="font-medium">Location:</span> {watchedLocation || '-'}</p>
              <p><span className="font-medium">Plan:</span> {selectedPlan?.planName || '-'}</p>
              <p><span className="font-medium">Price:</span> Rs {Number(selectedPlan?.price || selectedPlan?.amount || selectedPlan?.rewardAmount || 0)}</p>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="flex flex-wrap gap-2">
              <button
                className="pnf-btn-outline rounded-lg px-4 py-2 text-sm font-medium"
                type="button"
                disabled={loading}
                onClick={handleSubmit((values) => handleFormSubmit(values, 'draft'))}
              >
                {loading ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                className="pnf-btn-primary rounded-lg px-4 py-2 text-sm font-medium"
                type="button"
                disabled={loading}
                onClick={handleSubmit((values) => handleFormSubmit(values, 'pay_now'))}
              >
                {loading ? 'Processing...' : 'Create & Pay Now'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-4">
        <button className="pnf-btn-outline rounded-lg px-4 py-2 text-sm font-medium" type="button" onClick={goBack} disabled={loading || step === 1}>
          Back
        </button>

        {step < STEPS.length ? (
          <button className="pnf-btn-primary rounded-lg px-4 py-2 text-sm font-medium" type="button" onClick={goNext} disabled={loading}>
            Continue
          </button>
        ) : (
          <p className="self-center text-xs text-slate-500">Review details above and choose draft or pay now.</p>
        )}
      </div>
    </form>
  );
};

export default RequestForm;
