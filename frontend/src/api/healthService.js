import { apiClient } from "./apiClient";

export const getHealth = async () => {
  const { data } = await apiClient.get("/health");
  return data;
};
