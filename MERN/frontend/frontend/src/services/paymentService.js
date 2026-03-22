import axios from "axios";
import { extractArray } from "./apiUtils";

const PAYMENT_STATUS_OVERRIDE_STORAGE_KEY = "pnf-payment-status-overrides";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

const parseStatusOverrides = () => {
  const rawValue = sessionStorage.getItem(PAYMENT_STATUS_OVERRIDE_STORAGE_KEY);

  if (!rawValue) {
    return {};
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (parsedValue && typeof parsedValue === "object") {
      return parsedValue;
    }

    return {};
  } catch {
    return {};
  }
};

export const getPaymentStatusOverrides = () => parseStatusOverrides();

export const setPaymentStatusOverride = (requestId, paymentStatus) => {
  if (!requestId || !paymentStatus) {
    return;
  }

  const currentOverrides = parseStatusOverrides();

  currentOverrides[String(requestId)] = String(paymentStatus).toLowerCase();
  sessionStorage.setItem(PAYMENT_STATUS_OVERRIDE_STORAGE_KEY, JSON.stringify(currentOverrides));
};

export const lockPaymentForRequest = async ({ requestId, amount }) => {
  const response = await axios.post(
    "/api/payments",
    {
      requestId,
      amount,
    },
    {
      headers: getAuthHeaders(),
    },
  );

  return response.data;
};

export const getPaymentRecords = async () => {
  const response = await axios.get("/api/payments/payments", {
    headers: getAuthHeaders(),
  });

  return extractArray(response.data, ["payments"]);
};

const getPaymentRequestId = (payment) =>
  payment.requestId?._id ?? payment.requestId?.id ?? payment.requestId;

const getPaymentStatus = (payment) =>
  String(payment.paymentStatus ?? payment.status ?? "").toLowerCase();

export const getPaymentByRequestId = async (requestId) => {
  if (!requestId) {
    return null;
  }

  const records = await getPaymentRecords();
  const matchingRecords = records.filter(
    (record) => String(getPaymentRequestId(record)) === String(requestId),
  );

  if (matchingRecords.length === 0) {
    return null;
  }

  matchingRecords.sort((leftRecord, rightRecord) => {
    const leftDate = new Date(leftRecord.updatedAt ?? leftRecord.createdAt ?? 0).getTime();
    const rightDate = new Date(rightRecord.updatedAt ?? rightRecord.createdAt ?? 0).getTime();

    return rightDate - leftDate;
  });

  const latestRecord = matchingRecords[0];

  return {
    ...latestRecord,
    paymentStatus: getPaymentStatus(latestRecord),
  };
};
