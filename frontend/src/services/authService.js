import apiClient from "./apiClient";

const AUTH_API = "/api/auth";

export function loginUser(
  credentials
) {
  return apiClient.post(
    `${AUTH_API}/login`,
    credentials
  );
}

export function getCurrentUser() {
  return apiClient.get(
    `${AUTH_API}/me`
  );
}

export function getUsers() {
  return apiClient.get(
    `${AUTH_API}/users`
  );
}

export function createUser(
  userData
) {
  return apiClient.post(
    `${AUTH_API}/users`,
    userData
  );
}