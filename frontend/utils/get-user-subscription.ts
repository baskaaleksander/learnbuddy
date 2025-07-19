import api from "./axios";

export function getUserSubscription() {
  return api.get("/billing/get-user-subscription");
}
