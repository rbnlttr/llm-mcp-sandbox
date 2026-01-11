import { apiClient } from "./apiClient";

export const getModels = async () => {
  const { data } = await apiClient.get("/models");
  return data.models;
};
