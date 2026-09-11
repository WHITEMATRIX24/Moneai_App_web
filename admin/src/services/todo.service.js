import api from "./api.js";

export const todoService = {
  list: (params) => api.get("/todos", { params }),
  summary: () => api.get("/todos/summary"),
  create: (data) => api.post("/todos", data),
  update: (id, data) => api.patch(`/todos/${id}`, data),
  complete: (id) => api.post(`/todos/${id}/complete`),
  reopen: (id) => api.post(`/todos/${id}/reopen`),
  remove: (id) => api.delete(`/todos/${id}`),
};