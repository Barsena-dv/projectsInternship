import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import {
    createRequestDraft,
    getCategoryOptions,
    getServicePlanOptions,
} from "../../services/requestService";

const initialFormState = {
  itemName: "",
  description: "",
  categoryId: "",
  planId: "",
  lastSeenLocation: "",
  rewardAmount: "",
  lastSeenDatetime: "",
  serviceDeadline: "",
  images: [],
};

export const OwnerCreateRequest = () => {
  const [fileInputKey, setFileInputKey] = useState(0);
  const [categories, setCategories] = useState([]);
  const [servicePlans, setServicePlans] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: initialFormState,
  });

  const selectedCategoryId = watch("categoryId");
  const selectedPlanId = watch("planId");

  const selectedCategory = useMemo(
    () => categories.find((category) => String(category.id) === String(selectedCategoryId)),
    [categories, selectedCategoryId],
  );

  const selectedPlan = useMemo(
    () => servicePlans.find((plan) => String(plan.id) === String(selectedPlanId)),
    [servicePlans, selectedPlanId],
  );

  const fetchLookupOptions = async () => {
    try {
      setLoadingOptions(true);
      setLookupError("");

      const [categoriesResponse, plansResponse] = await Promise.all([
        getCategoryOptions(),
        getServicePlanOptions(),
      ]);

      setCategories(categoriesResponse);
      setServicePlans(plansResponse);
    } catch (error) {
      const message = error.response?.data?.message ?? "Failed to fetch categories and plans";
      setLookupError(message);
      toast.error(message);
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    fetchLookupOptions();
  }, []);

  const onSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        images: values.images ? Array.from(values.images) : [],
      };

      await createRequestDraft(payload);
      toast.success("Request saved as draft");
      reset(initialFormState);
      setFileInputKey((previousKey) => previousKey + 1);
    } catch (error) {
      const message = error.response?.data?.message ?? "Failed to save request";
      toast.error(message);
    }
  };

  return (
    <section className="mesh-backdrop surface-panel mx-auto w-full max-w-5xl rounded-3xl p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-(--primary) text-xs font-semibold uppercase tracking-[0.16em]">Owner Workflow</p>
          <h3 className="theme-text mt-1 text-2xl font-bold">Create New Lost Item Request</h3>
          <p className="theme-muted mt-1 text-sm">
            Fill details clearly so finders can verify and submit evidence faster.
          </p>
        </div>

        <span className="theme-muted rounded-full border border-(--border) bg-(--bg-soft) px-3 py-1 text-xs font-semibold">
          Draft Mode
        </span>
      </div>

      {lookupError ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <span>{lookupError}</span>
          <button
            type="button"
            onClick={fetchLookupOptions}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
          >
            Retry
          </button>
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="theme-text flex flex-col gap-2 text-sm font-semibold">
          Item Name
          <input
            {...register("itemName", { required: "Item name is required" })}
            className="rounded-xl border border-(--border) bg-(--bg) px-3 py-2.5 outline-none transition focus:border-(--primary)"
            placeholder="Wallet, Laptop, Document..."
          />
          {errors.itemName ? <p className="text-xs text-red-600">{errors.itemName.message}</p> : null}
        </label>

        <label className="theme-text flex flex-col gap-2 text-sm font-semibold">
          Category
          <select
            {...register("categoryId", { required: "Please select a category" })}
            disabled={loadingOptions || categories.length === 0}
            className="rounded-xl border border-(--border) bg-(--bg) px-3 py-2.5 outline-none transition focus:border-(--primary) disabled:cursor-not-allowed disabled:bg-(--bg-soft)"
          >
            <option value="">{loadingOptions ? "Loading categories..." : "Select category"}</option>
            {categories.map((category) => (
              <option key={String(category.id)} value={String(category.id)}>
                {category.name}
              </option>
            ))}
          </select>
          {selectedCategory?.description ? (
            <p className="theme-muted text-xs">{selectedCategory.description}</p>
          ) : null}
          {errors.categoryId ? <p className="text-xs text-red-600">{errors.categoryId.message}</p> : null}
        </label>

        <label className="theme-text flex flex-col gap-2 text-sm font-semibold">
          Service Plan
          <select
            {...register("planId", { required: "Please select a service plan" })}
            disabled={loadingOptions || servicePlans.length === 0}
            className="rounded-xl border border-(--border) bg-(--bg) px-3 py-2.5 outline-none transition focus:border-(--primary) disabled:cursor-not-allowed disabled:bg-(--bg-soft)"
          >
            <option value="">{loadingOptions ? "Loading plans..." : "Select service plan"}</option>
            {servicePlans.map((plan) => (
              <option key={String(plan.id)} value={String(plan.id)}>
                {String(plan.name).toUpperCase()}
              </option>
            ))}
          </select>
          {selectedPlan ? (
            <p className="theme-muted text-xs">
              {selectedPlan.description}
              {selectedPlan.priorityLevel ? ` | Priority: ${selectedPlan.priorityLevel}` : ""}
            </p>
          ) : null}
          {errors.planId ? <p className="text-xs text-red-600">{errors.planId.message}</p> : null}
        </label>

        <label className="theme-text flex flex-col gap-2 text-sm font-semibold md:col-span-2">
          Description
          <textarea
            {...register("description", { required: "Description is required" })}
            rows={4}
            className="rounded-xl border border-(--border) bg-(--bg) px-3 py-2.5 outline-none transition focus:border-(--primary)"
            placeholder="Describe the lost item and identifying marks"
          />
          {errors.description ? <p className="text-xs text-red-600">{errors.description.message}</p> : null}
        </label>

        <label className="theme-text flex flex-col gap-2 text-sm font-semibold">
          Last Seen Location
          <input
            {...register("lastSeenLocation", { required: "Last seen location is required" })}
            className="rounded-xl border border-(--border) bg-(--bg) px-3 py-2.5 outline-none transition focus:border-(--primary)"
            placeholder="Area, city, landmark"
          />
          {errors.lastSeenLocation ? <p className="text-xs text-red-600">{errors.lastSeenLocation.message}</p> : null}
        </label>

        <label className="theme-text flex flex-col gap-2 text-sm font-semibold">
          Reward Amount
          <input
            min="0"
            step="1"
            type="number"
            {...register("rewardAmount", {
              min: {
                value: 0,
                message: "Reward amount cannot be negative",
              },
            })}
            className="rounded-xl border border-(--border) bg-(--bg) px-3 py-2.5 outline-none transition focus:border-(--primary)"
            placeholder="0"
          />
          {errors.rewardAmount ? <p className="text-xs text-red-600">{errors.rewardAmount.message}</p> : null}
        </label>

        <label className="theme-text flex flex-col gap-2 text-sm font-semibold">
          Last Seen Datetime
          <input
            type="datetime-local"
            {...register("lastSeenDatetime", { required: "Last seen datetime is required" })}
            className="rounded-xl border border-(--border) bg-(--bg) px-3 py-2.5 outline-none transition focus:border-(--primary)"
          />
          {errors.lastSeenDatetime ? <p className="text-xs text-red-600">{errors.lastSeenDatetime.message}</p> : null}
        </label>

        <label className="theme-text flex flex-col gap-2 text-sm font-semibold">
          Service Deadline
          <input
            type="datetime-local"
            {...register("serviceDeadline", { required: "Service deadline is required" })}
            className="rounded-xl border border-(--border) bg-(--bg) px-3 py-2.5 outline-none transition focus:border-(--primary)"
          />
          {errors.serviceDeadline ? <p className="text-xs text-red-600">{errors.serviceDeadline.message}</p> : null}
        </label>

        <label className="theme-text flex flex-col gap-2 text-sm font-semibold md:col-span-2">
          Reference Images (optional)
          <input
            key={fileInputKey}
            type="file"
            {...register("images")}
            multiple
            accept="image/*"
            className="rounded-xl border border-(--border) bg-(--bg) px-3 py-2.5 text-sm outline-none transition file:mr-3 file:rounded-md file:border-0 file:bg-(--bg-soft) file:px-3 file:py-1.5 file:font-medium file:text-(--text) hover:file:bg-(--bg)"
          />
          <p className="theme-muted text-xs">
            Images are accepted for item reference context and can be updated in later workflow steps.
          </p>
        </label>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={
              isSubmitting ||
              loadingOptions ||
              categories.length === 0 ||
              servicePlans.length === 0
            }
            className="gradient-primary rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Saving Draft..." : "Save Draft"}
          </button>
        </div>
      </form>
    </section>
  );
};
