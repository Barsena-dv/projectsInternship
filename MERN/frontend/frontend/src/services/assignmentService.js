import axios from "axios";
import { extractArray, extractObject, unwrapData } from "./apiUtils";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const acceptAssignment = async (requestId) => {
  const response = await axios.post(`/api/assignments/${requestId}/accept`);
  return response.data;
};

export const getFinderAssignments = async () => {
  try {
    const response = await axios.get("/api/assignments/assignments");
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      const fallbackResponse = await axios.get("/api/assignments/my");
      return fallbackResponse.data;
    }

    throw error;
  }
};

export const confirmAssignmentDecision = async (assignmentId, decision) => {
  const response = await axios.patch(
    `/api/assignments/${assignmentId}/confirm`,
    { decision },
    {
      headers: getAuthHeaders(),
    },
  );

  return response.data;
};

const getAssignmentId = (assignment) => assignment.id ?? assignment.assignmentId ?? assignment._id;

const getRequestIdFromAssignment = (assignment) =>
  assignment.requestId?.id ??
  assignment.requestId?._id ??
  assignment.requestId ??
  assignment.request?.id ??
  assignment.request?._id ??
  assignment.request ??
  assignment.requestObjId;

export const getFinderAssignmentById = async (assignmentId) => {
  if (!assignmentId) {
    throw new Error("Assignment id is required");
  }

  try {
    const response = await axios.get(`/api/assignments/${assignmentId}`, {
      headers: getAuthHeaders(),
    });
    const assignment = extractObject(response.data, ["assignment", "item"]);

    if (Object.keys(assignment).length > 0) {
      return assignment;
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      throw error;
    }
  }

  const finderAssignmentsPayload = await getFinderAssignments();
  const finderAssignments = extractArray(unwrapData(finderAssignmentsPayload), ["assignments", "items"]);
  const matchingAssignment = finderAssignments.find(
    (assignment) => String(getAssignmentId(assignment)) === String(assignmentId),
  );

  if (!matchingAssignment) {
    throw new Error("Assignment not found");
  }

  return matchingAssignment;
};

export const getLatestAssignmentByRequestId = async (requestId) => {
  if (!requestId) {
    return null;
  }

  const response = await axios.get("/api/assignments/assignments", {
    headers: getAuthHeaders(),
  });

  const assignments = extractArray(response.data, ["assignments"]);
  const matchingAssignments = assignments.filter(
    (assignment) => String(getRequestIdFromAssignment(assignment)) === String(requestId),
  );

  if (matchingAssignments.length === 0) {
    return null;
  }

  matchingAssignments.sort((leftAssignment, rightAssignment) => {
    const leftDate = new Date(leftAssignment.updatedAt ?? leftAssignment.createdAt ?? 0).getTime();
    const rightDate = new Date(rightAssignment.updatedAt ?? rightAssignment.createdAt ?? 0).getTime();

    return rightDate - leftDate;
  });

  const latestAssignment = matchingAssignments[0];
  const latestAssignmentId = getAssignmentId(latestAssignment);

  if (!latestAssignmentId) {
    return null;
  }

  return {
    ...latestAssignment,
    resolvedAssignmentId: String(latestAssignmentId),
  };
};
