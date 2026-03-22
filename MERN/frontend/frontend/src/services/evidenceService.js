import axios from "axios";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

const getBaseUrl = () => String(axios.defaults.baseURL ?? "").replace(/\/$/, "");

export const resolveEvidenceUrl = (rawUrl) => {
  if (!rawUrl) {
    return "";
  }

  if (/^(https?:)?\/\//i.test(rawUrl) || rawUrl.startsWith("data:")) {
    return rawUrl;
  }

  const baseUrl = getBaseUrl();

  if (!baseUrl) {
    return rawUrl;
  }

  return `${baseUrl}/${String(rawUrl).replace(/^\//, "")}`;
};

export const uploadEvidenceFile = async (evidencePayload) => {
  const formData = new FormData();

  formData.append("assignmentId", evidencePayload.assignmentId);
  formData.append("caption", evidencePayload.caption ?? "");
  formData.append("file", evidencePayload.file);

  if (evidencePayload.fileType) {
    formData.append("fileType", evidencePayload.fileType);
  }

  const response = await axios.post("/api/evidence", formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const getEvidenceByAssignmentId = async (assignmentId) => {
  if (!assignmentId) {
    throw new Error("Assignment id is required");
  }

  const response = await axios.get(`/api/evidence/${assignmentId}`, {
    headers: getAuthHeaders(),
  });

  return response.data;
};
