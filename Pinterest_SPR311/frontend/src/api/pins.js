import api from "./auth";

export const pinsService = {
  getPins: async (page = 1, pageSize = 20, useApi = true) => {
    const response = await api.get("/pins", {
      params: { page, pageSize, useApi },
    });
    return response.data;
  },

  searchPins: async (query = "", page = 1, pageSize = 20) => {
    const response = await api.get("/pins/search", {
      params: { query, page, pageSize },
    });
    return response.data;
  },

  getPin: async (id) => {
    const response = await api.get(`/pins/${id}`);
    return response.data;
  },

  createPin: async (formData) => {
    const response = await api.post("/pins", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  createCollage: async (formData) => {
    const response = await api.post("/pins/collage", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getMyPins: async (page = 1, pageSize = 20) => {
    const response = await api.get("/pins/my", {
      params: { page, pageSize },
    });
    return response.data;
  },

  getMyCollages: async (page = 1, pageSize = 20) => {
    const response = await api.get("/pins/my/collages", {
      params: { page, pageSize },
    });
    return response.data;
  },
};
