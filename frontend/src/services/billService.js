import apiClient, {
  createQuery,
} from "./apiClient";

const BILL_API = "/api/bills";

export function getBills(
  filters = {}
) {
  return apiClient.get(
    `${BILL_API}${createQuery(filters)}`
  );
}

export function getBillById(billId) {
  return apiClient.get(
    `${BILL_API}/${billId}`
  );
}

export function generateBill(
  billData
) {
  return apiClient.post(
    `${BILL_API}/generate`,
    billData
  );
}

export function generateAllBills(
  billData
) {
  return apiClient.post(
    `${BILL_API}/generate-all`,
    billData
  );
}

export function deleteBill(billId) {
  return apiClient.delete(
    `${BILL_API}/${billId}`
  );
}