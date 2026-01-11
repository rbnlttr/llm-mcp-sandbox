export function buildMCPContext({
  documents,
  includeProject,
  includeReference,
  mode = "chat"
}) {
  return {
    mode,
    sources: {
      uploads: documents.map(d => ({
        name: d.name,
        content: d.content
      })),
      project: includeProject,
      reference: includeReference
    },
    constraints: {
      maxTokens: 12000,
      citationRequired: true
    }
  };
}
