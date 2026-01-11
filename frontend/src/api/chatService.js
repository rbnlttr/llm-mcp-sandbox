import { apiClient } from "./apiClient";

export async function sendChat({
  message,
  mcpContext,
  llm = "local"
}) {
  const { data } = await apiClient.post("/chat/completions", {
    message,
    llm,
    context: mcpContext
  });

  return data;
}
