import api from "./axios";

export async function fetchGraphQL(query: string, variables = {}) {
  const res = await api.post("/graphql", { query, variables });
  return res.data.data;
}
