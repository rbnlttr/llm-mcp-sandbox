import { apiClient } from "./apiClient";

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await apiClient.post(
    "/documents/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return data;
}
