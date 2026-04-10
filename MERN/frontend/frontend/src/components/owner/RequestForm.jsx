import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiInfo, FiMapPin, FiPackage, FiShield } from 'react-icons/fi';
import useLocation from '../../hooks/useLocation';
import '../../styles/owner/dashboard.css';
import LocationSearchInput from './LocationSearchInput';
import MapPicker from './MapPicker';

const STEPS = [
  { id: 1, title: 'Identity', subtitle: 'Basic item details', icon: <FiPackage size={18} /> },
  { id: 2, title: 'Context',  subtitle: 'Location & specifics', icon: <FiMapPin size={18} /> },
  { id: 3, title: 'Security', subtitle: 'Plan & protection',   icon: <FiShield size={18} /> },
];

const RequestForm = ({ plans, loading, onSubmit }) => {
  const [step, setStep] = useState(1);
  const {
    register,
    handleSubmit,
    getValues,
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
      rewardAmount: plans?.[0]?.price || 0,
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

  const watchedLat = Number(useWatch({ control, name: 'lastSeenLat' }));
  const watchedLng = Number(useWatch({ control, name: 'lastSeenLng' }));
  const watchedPlanId = useWatch({ control, name: 'servicePlanId' });
  const watchedRewardAmount = useWatch({ control, name: 'rewardAmount' });
  const watchedItemName = useWatch({ control, name: 'itemName' });
  const watchedItemCategory = useWatch({ control, name: 'itemCategory' });
  const watchedDescription = useWatch({ control, name: 'description' });
  const watchedLocation = useWatch({ control, name: 'lastSeenLocation' });

  useEffect(() => {
    if (plans.length > 0) {
      const firstPlan = plans[0];
      setValue('servicePlanId', firstPlan._id);
      setValue('rewardAmount', firstPlan.price);
    }
  }, [plans, setValue]);

  // Sync amount when plan selection changes
  useEffect(() => {
    const plan = plans.find((p) => String(p._id) === String(watchedPlanId));
    if (plan) {
      setValue('rewardAmount', plan.price);
    }
  }, [watchedPlanId, plans, setValue]);

  useEffect(() => {
    if (!Number.isFinite(location.lat) || !Number.isFinite(location.lng)) return;

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
    if (intent !== 'draft' && !hasSelectedLocation) {
      setError('lastSeenLocation', { type: 'manual', message: 'Location is required' });
      return;
    }
    onSubmit(values, intent);
  };


  const mapLat = Number.isFinite(watchedLat) ? watchedLat : (location.lat || 20.5937);
  const mapLng = Number.isFinite(watchedLng) ? watchedLng : (location.lng || 78.9629);

  const selectedPlan = useMemo(
    () => plans.find((plan) => String(plan._id) === String(watchedPlanId)),
    [plans, watchedPlanId]
  );

  const validateStep = async (currentStep) => {
    if (currentStep === 1) {
      return trigger(['itemName', 'itemCategory', 'description']);
    }
    if (currentStep === 2) {
      const valid = await trigger(['lastSeenLocation', 'lastSeenLat', 'lastSeenLng']);
      if (!hasSelectedLocation) {
        setError('lastSeenLocation', { type: 'manual', message: 'Please pinpoint the location on map.' });
        return false;
      }
      return valid;
    }
    return true;
  };

  const goNext = async () => {
    const valid = await validateStep(step);
    if (!valid) return;
    setStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const goBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const isLocationBusy = isSearching || isReverseGeocoding || isLocating;

  return (
    <form className="owner-request-form flex flex-col gap-6" onSubmit={handleSubmit((v) => handleFormSubmit(v, 'draft'))}>
      
      {/* Step Progress */}
      <div className="grid grid-cols-3 gap-4 mb-2">
        {STEPS.map((item) => {
          const isActive = step === item.id;
          const isDone = step > item.id;
          return (
            <div key={item.id} className="relative flex flex-col items-center">
              <div 
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${
                  isActive ? 'bg-amber-500 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] text-stone-900 scale-110 z-10' : 
                  isDone ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 
                  'bg-white/5 border-white/10 text-stone-500'
                }`}
              >
                {isDone ? <FiCheckCircle size={20} /> : item.icon}
              </div>
              <div className="mt-3 text-center hidden md:block">
                <p className={`text-sm font-bold ${isActive ? 'text-amber-400' : 'text-stone-400'}`}>{item.title}</p>
                <p className="text-[10px] text-stone-500 font-medium uppercase tracking-tight">{item.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="owner-section-card p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {step === 1 && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
               <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                 <FiPackage className="text-amber-500" />
                 Item Identity
               </h2>
               <p className="text-sm text-stone-400 mb-4">Briefly describe what was lost so finders can recognize it instantly.</p>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Item Name</label>
              <input className="pnf-input" placeholder="e.g., iPhone 15 Pro, Brown Wallet" {...register('itemName', { required: 'Name is required' })} />
              {errors.itemName && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.itemName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Category</label>
              <input className="pnf-input" placeholder="e.g., Electronics, Documents" {...register('itemCategory', { required: 'Category is required' })} />
              {errors.itemCategory && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.itemCategory.message}</p>}
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Visual Description</label>
              <textarea className="pnf-input min-h-[100px]" placeholder="Add distinctive features like stickers, scratches, or protective cases..." {...register('description', { required: 'Description is required' })} />
              {errors.description && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.description.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Brand (Optional)</label>
              <input className="pnf-input" placeholder="e.g., Apple, Nike" {...register('brand')} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Model (Optional)</label>
              <input className="pnf-input" placeholder="e.g., MQ2L3HN/A" {...register('model')} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-6">
            <div>
               <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                 <FiMapPin className="text-amber-500" />
                 Context & Location
               </h2>
               <p className="text-sm text-stone-400 mb-4">Help us narrow down the search area by pinpointing the last known location.</p>
            </div>

            <div className="space-y-4">
               <LocationSearchInput
                  value={searchText}
                  onChange={setSearchText}
                  suggestions={suggestions}
                  isLoading={isSearching}
                  onSelect={selectSuggestion}
                  onUseCurrentLocation={useCurrentLocation}
                  disabled={loading}
                />
                
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
                   <MapPicker lat={mapLat} lng={mapLng} onPick={pickFromMap} />
                </div>
                
                {location.address && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                     <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                       <FiMapPin size={16} />
                     </div>
                     <p className="text-sm text-stone-200 line-clamp-1">{location.address}</p>
                  </div>
                )}
                
                {errors.lastSeenLocation && <p className="text-xs text-rose-500 font-bold">{errors.lastSeenLocation.message}</p>}
                {locationError && <p className="text-xs text-amber-500/80">{locationError}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Last Seen Date & Time</label>
                  <input className="pnf-input" type="datetime-local" {...register('lastSeenDatetime')} />
               </div>
               <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Service Deadline</label>
                  <input className="pnf-input" type="date" {...register('serviceDeadline')} />
                  <p className="text-[10px] text-stone-500 ml-1 italic">When should finders stop searching?</p>
               </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-6">
            <div>
               <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                 <FiShield className="text-amber-500" />
                 Service & Protection
               </h2>
               <p className="text-sm text-stone-400 mb-4">Choose a protection plan to secure your request and incentivize finders.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Protection Plan</label>
                  <select className="pnf-input" {...register('servicePlanId', { required: 'Plan is required' })}>
                    {plans.map((p) => (
                      <option key={p._id} value={p._id}>{p.planName} (Platform Fee: Rs {p.price})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Bounty Amount (Rs)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      className="pnf-input pl-10" 
                      placeholder="e.g. 500"
                      {...register('rewardAmount', { 
                        required: 'Amount is required',
                        min: { value: 100, message: 'Minimum ₹100' }
                      })} 
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 font-bold text-sm">₹</div>
                  </div>
                  <p className="text-[10px] text-stone-500 ml-1 italic">This entire amount goes to the finder.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Payment Method</label>
                  <select className="pnf-input" {...register('paymentMethod')}>
                    <option value="upi">UPI / Scanner</option>
                    <option value="wallet">Internal Wallet</option>
                    <option value="credit_card">Credit / Debit Card</option>
                  </select>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <FiShield size={80} className="text-amber-500" />
                </div>
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                   <FiCheckCircle size={14} />
                   Request Preview
                </h3>
                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between items-end border-b border-white/5 pb-2">
                    <span className="text-xs text-stone-500 font-bold uppercase">Item</span>
                    <span className="text-sm text-stone-100 font-medium truncate ml-4">{watchedItemName || '—'}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-white/5 pb-2">
                    <span className="text-xs text-stone-500 font-bold uppercase">Category</span>
                    <span className="text-sm text-stone-100 font-medium truncate ml-4">{watchedItemCategory || '—'}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-white/5 pb-2">
                    <span className="text-xs text-stone-500 font-bold uppercase">Plan</span>
                    <span className="text-sm text-amber-400 font-bold">{selectedPlan?.planName || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-stone-500 font-bold uppercase">Total Due</span>
                    <span className="text-lg font-black text-white">Rs {Number(watchedRewardAmount || 0) + Number(selectedPlan?.price || 0)}</span>
                  </div>
                  <p className="text-[9px] text-stone-500 text-right opacity-60 italic mt-1">
                    (₹{watchedRewardAmount || 0} Reward + ₹{selectedPlan?.price || 0} Plan Fee)
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex gap-3 items-start">
               <FiInfo className="text-blue-400 shrink-0 mt-0.5" size={16} />
               <p className="text-[11px] text-stone-400 leading-relaxed italic">
                 Your payment will be held securely and only released to the finder once you verify the recovered item. You can cancel and get a refund if the item is not found within the deadline.
               </p>
            </div>
          </div>
        )}

      </div>

      {/* Form Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-2">
        <button 
          type="button" 
          onClick={goBack} 
          disabled={step === 1 || loading}
          className="flex items-center gap-2 text-sm font-bold text-stone-400 hover:text-white transition-colors disabled:opacity-0"
        >
          <FiArrowLeft /> Previous Step
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleFormSubmit(getValues(), 'draft')}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-stone-300 hover:bg-white/10 transition-all font-bold text-sm"
          >
            {loading ? 'Saving...' : 'Save Draft'}
          </button>
          {step < STEPS.length ? (
            <button 
              type="button" 
              onClick={goNext} 
              disabled={loading}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-900 px-6 py-2.5 rounded-xl font-black text-sm transition-all transform hover:scale-105 active:scale-95"
            >
              Continue <FiArrowRight />
            </button>
          ) : (
            <>
              <button 
                type="button" 
                onClick={handleSubmit((v) => handleFormSubmit(v, 'pay_now'))}
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-400 text-stone-900 px-8 py-2.5 rounded-xl font-black text-sm shadow-[0_4px_15px_rgba(245,158,11,0.3)] transition-all transform hover:scale-105 active:scale-95"
              >
                {loading ? 'Locking Payment...' : 'Finalize & Pay'}
              </button>
            </>
          )}
        </div>
      </div>

    </form>
  );
};

export default RequestForm;
