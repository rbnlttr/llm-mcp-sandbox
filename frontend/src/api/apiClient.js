import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL ?? "http://localhost:8000",
  timeout: 60000,
});

apiClient.interceptors.response.use(
  res => res,
  err => {
    const message =
      err.response?.data?.detail ||
      err.message ||
      "Unbekannter Fehler";
    return Promise.reject(new Error(message));
  }
);
