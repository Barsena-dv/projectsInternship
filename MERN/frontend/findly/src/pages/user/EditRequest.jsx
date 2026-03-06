import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../../utils/axiosInstance';

const CATEGORIES = ['Electronics', 'Wallet', 'Documents', 'Bags', 'Keys', 'Jewelry', 'Other'];

const EditRequest = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm();

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const res = await axiosInstance.get(`/requests/${id}`);
                // Backend returns: { success: true, data: request }
                const data = res.data?.data || res.data?.request || res.data;
                reset({
                    title: data.title || '',
                    category: data.category || '',
                    description: data.description || '',
                    lostDate: data.lostDate ? data.lostDate.split('T')[0] : '',
                    generalLocation: data.generalLocation || '',
                    exactLocation: data.exactLocation || '',
                    rewardAmount: data.rewardAmount ?? '',
                });
            } catch (error) {
                toast.error('Failed to load request for editing.');
                navigate('/user/requests');
            } finally {
                setLoading(false);
            }
        };
        fetchRequest();
    }, [id, navigate, reset]);

    const onSubmit = async (data) => {
        setSubmitting(true);
        try {
            await axiosInstance.put(`/requests/${id}`, data);
            toast.success('Request updated successfully.');
            navigate('/user/requests');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update request.');
        } finally {
            setSubmitting(false);
        }
    };

    const inputCls = (err) =>
        `w-full px-4 py-2.5 rounded-lg border bg-white outline-none transition-all ${err ? 'border-error ring-1 ring-error/20'
            : 'border-gray-200 focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/10'
        }`;

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto animate-pulse flex flex-col gap-5">
                <div className="h-8 w-48 bg-gray-100 rounded-lg" />
                <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col gap-4">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto flex flex-col gap-5">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Link to="/user/requests" className="hover:text-primary-blue">My Requests</Link>
                <span>›</span>
                <Link to={`/user/requests/${id}`} className="hover:text-primary-blue">Request Details</Link>
                <span>›</span>
                <span className="text-text-primary font-medium">Edit</span>
            </div>

            <div>
                <h1 className="text-2xl font-bold text-text-primary">Edit Request</h1>
                <p className="text-text-secondary mt-1">Update your lost item request details.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5">
                    <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest pb-3 border-b border-gray-100">Item Details</h2>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-text-primary">Title <span className="text-error">*</span></label>
                        <input type="text" {...register('title', { required: 'Title is required' })} className={inputCls(errors.title)} />
                        {errors.title && <p className="text-xs text-error">{errors.title.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-text-primary">Category <span className="text-error">*</span></label>
                            <select {...register('category', { required: 'Category is required' })}
                                className={inputCls(errors.category) + ' appearance-none cursor-pointer'}>
                                <option value="">Select…</option>
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
                        <textarea rows={4} {...register('description', { required: 'Description is required', minLength: { value: 20, message: 'Min 20 characters' } })}
                            className={inputCls(errors.description) + ' resize-none'} />
                        {errors.description && <p className="text-xs text-error">{errors.description.message}</p>}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5">
                    <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest pb-3 border-b border-gray-100">Location & Reward</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-text-primary">General Location <span className="text-error">*</span></label>
                            <input type="text" {...register('generalLocation', { required: 'Location is required' })}
                                className={inputCls(errors.generalLocation)} />
                            {errors.generalLocation && <p className="text-xs text-error">{errors.generalLocation.message}</p>}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-text-primary">Exact Location</label>
                            <input type="text" {...register('exactLocation')} className={inputCls(false)} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-text-primary">Reward Amount (₹) <span className="text-error">*</span></label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-text-secondary">₹</span>
                            <input type="number" min={0} {...register('rewardAmount', { required: 'Reward is required', min: { value: 0, message: 'Must be ≥ 0' } })}
                                className={inputCls(errors.rewardAmount) + ' pl-8'} />
                        </div>
                        {errors.rewardAmount && <p className="text-xs text-error">{errors.rewardAmount.message}</p>}
                    </div>
                </div>

                <div className="flex gap-3 pb-4">
                    <Link to={`/user/requests/${id}`}
                        className="px-5 py-2.5 rounded-lg border border-gray-200 text-text-primary text-sm font-semibold hover:bg-gray-50 transition-colors">
                        Cancel
                    </Link>
                    <button type="submit" disabled={submitting || !isDirty}
                        className="flex-1 px-5 py-2.5 rounded-lg bg-primary-blue hover:bg-deep-indigo text-white text-sm font-semibold shadow-md shadow-primary-blue/20 transition-all disabled:opacity-60">
                        {submitting ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditRequest;
