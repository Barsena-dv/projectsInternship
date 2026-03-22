import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { uploadEvidenceFile } from "../../services/evidenceService";

export const UploadEvidence = () => {
  const { assignmentId: assignmentIdParam } = useParams();
  const navigate = useNavigate();

  const [formState, setFormState] = useState({
    assignmentId: assignmentIdParam ?? "",
    fileType: "photo",
    file: null,
    caption: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFormState((previousState) => ({
      ...previousState,
      assignmentId: assignmentIdParam ?? "",
    }));
  }, [assignmentIdParam]);

  const handleChange = (event) => {
    const { name, value, files } = event.target;

    if (name === "file") {
      setFormState((previousState) => ({
        ...previousState,
        file: files?.[0] ?? null,
      }));
      return;
    }

    setFormState((previousState) => ({
      ...previousState,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formState.file) {
      toast.error("Please select a file");
      return;
    }

    try {
      setSubmitting(true);
      await uploadEvidenceFile(formState);
      toast.success("Evidence uploaded");
      navigate("/finder/my-assignments");
    } catch (error) {
      const message = error.response?.data?.message ?? "Failed to upload evidence";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="surface-panel mx-auto w-full max-w-2xl rounded-3xl p-6 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Finder Workflow</p>
      <h3 className="mt-1 text-2xl font-bold text-slate-900">Upload Evidence</h3>
      <p className="mt-1 text-sm text-slate-600">Attach proof for this assignment.</p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
          Assignment Id
          <input
            required
            name="assignmentId"
            value={formState.assignmentId}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:bg-white"
            readOnly
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
          File Type
          <select
            name="fileType"
            value={formState.fileType}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:bg-white"
          >
            <option value="photo">photo</option>
            <option value="video">video</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
          File
          <input
            required
            type="file"
            name="file"
            accept="image/*,video/*"
            onChange={handleChange}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:font-medium file:text-slate-700 hover:file:bg-slate-300"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
          Caption
          <textarea
            required
            name="caption"
            rows={4}
            value={formState.caption}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:bg-white"
            placeholder="Briefly describe the evidence"
          />
        </label>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {submitting ? "Uploading..." : "Upload Evidence"}
          </button>
        </div>
      </form>
    </section>
  );
};
