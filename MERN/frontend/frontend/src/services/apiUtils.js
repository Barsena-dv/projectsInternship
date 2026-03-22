export const extractArray = (payload, candidateKeys = []) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  for (const key of candidateKeys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
};

export const unwrapData = (payload) => {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "data") && payload.data !== undefined) {
    return unwrapData(payload.data);
  }

  return payload;
};

export const extractObject = (payload, candidateKeys = []) => {
  const normalizedPayload = unwrapData(payload);

  if (normalizedPayload && typeof normalizedPayload === "object" && !Array.isArray(normalizedPayload)) {
    for (const key of candidateKeys) {
      const candidateValue = normalizedPayload[key];

      if (candidateValue && typeof candidateValue === "object" && !Array.isArray(candidateValue)) {
        return candidateValue;
      }
    }

    return normalizedPayload;
  }

  return {};
};
