import axios from "axios";
import { extractArray, unwrapData } from "./apiUtils";

const defaultLongitude = 72.5714;
const defaultLatitude = 23.0225;

const getEntityId = (entity) => entity.id ?? entity._id;
const getRequestId = (request) => request.id ?? request.requestId ?? request._id;

export const createRequestDraft = async (requestPayload) => {
  const payload = {
    itemName: requestPayload.itemName,
    description: requestPayload.description,
    categoryId: requestPayload.categoryId,
    planId: requestPayload.planId,
    lastSeenLocation: requestPayload.lastSeenLocation,
    rewardAmount: Number(requestPayload.rewardAmount) || 0,
    lastSeenDatetime: requestPayload.lastSeenDatetime,
    serviceDeadline: requestPayload.serviceDeadline,
    location: {
      type: "Point",
      coordinates: [defaultLongitude, defaultLatitude],
    },
    // The current create request API expects image URLs/paths, not browser File objects.
    images: Array.isArray(requestPayload.images)
      ? requestPayload.images.filter((image) => typeof image === "string")
      : [],
  };

  const response = await axios.post("/api/requests", payload);

  return response.data;
};

export const getOwnerRequests = async () => {
  const response = await axios.get("/api/requests/my");
  return response.data;
};

export const getOwnerRequestById = async (requestId) => {
  if (!requestId) {
    throw new Error("Request id is required");
  }

  const ownerRequestsPayload = await getOwnerRequests();
  const ownerRequests = extractArray(unwrapData(ownerRequestsPayload), ["requests", "items"]);
  const matchingRequest = ownerRequests.find(
    (request) => String(getRequestId(request)) === String(requestId),
  );

  if (!matchingRequest) {
    throw new Error("Request not found");
  }

  return matchingRequest;
};

export const publishRequest = async (requestId) => {
  const response = await axios.patch(`/api/requests/${requestId}/publish`);
  return response.data;
};

export const updateOwnerRequest = async (requestId, updatePayload) => {
  if (!requestId) {
    throw new Error("Request id is required");
  }

  const response = await axios.put(`/api/requests/${requestId}`, updatePayload);
  return response.data;
};

export const getOpenRequests = async () => {
  const response = await axios.get("/api/requests/open");
  return response.data;
};

export const getCategoryOptions = async () => {
  const response = await axios.get("/api/categories/products");
  const categories = extractArray(response.data, ["categories", "products"]);

  return categories
    .map((category) => ({
      id: getEntityId(category),
      name: category.name ?? category.categoryName ?? "Unnamed category",
      description: category.description ?? "",
      isActive: category.isActive !== false,
    }))
    .filter((category) => Boolean(category.id) && category.isActive);
};

export const getServicePlanOptions = async () => {
  const response = await axios.get("/api/servicePlans/services");
  const plans = extractArray(response.data, ["plans", "services", "servicePlans"]);

  return plans
    .map((plan) => ({
      id: getEntityId(plan),
      name: plan.planName ?? plan.name ?? "Unnamed plan",
      description: plan.description ?? "",
      isActive: plan.isActive !== false,
      priorityLevel: plan.priorityLevel,
    }))
    .filter((plan) => Boolean(plan.id) && plan.isActive);
};
