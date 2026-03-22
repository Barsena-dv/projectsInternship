import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AssignmentCard } from "../../components/common/AssignmentCard";
import { extractArray } from "../../services/apiUtils";
import { getFinderAssignments } from "../../services/assignmentService";

const getAssignmentId = (assignment) => assignment.id ?? assignment.assignmentId ?? assignment._id;

export const FinderAssignments = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const responsePayload = await getFinderAssignments();
      setAssignments(extractArray(responsePayload, ["assignments"]));
    } catch (error) {
      const message = error.response?.data?.message ?? "Failed to fetch assignments";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleUploadNavigation = (assignment) => {
    const assignmentId = getAssignmentId(assignment);

    if (!assignmentId) {
      toast.error("Assignment id missing");
      return;
    }

    navigate(`/finder/upload-evidence/${assignmentId}`);
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading assignments...</p>;
  }

  if (assignments.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        No assignments accepted yet.
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      {assignments.map((assignment) => {
        const assignmentId = getAssignmentId(assignment);

        return (
          <AssignmentCard
            key={String(assignmentId ?? assignment.itemName)}
            assignment={assignment}
            onUpload={() => handleUploadNavigation(assignment)}
          />
        );
      })}
    </section>
  );
};
