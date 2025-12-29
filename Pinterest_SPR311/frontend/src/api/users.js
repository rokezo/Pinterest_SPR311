import api from "./auth";

export const usersService = {
  getUserProfile: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  getUserPins: async (userId, page = 1, pageSize = 20) => {
    const response = await api.get(`/users/${userId}/pins`, {
      params: { page, pageSize },
    });
    return response.data;
  },

  getUserSavedPins: async (userId, page = 1, pageSize = 20) => {
    const response = await api.get(`/users/${userId}/saved`, {
      params: { page, pageSize },
    });
    return response.data;
  },

  followUser: async (userId) => {
    const response = await api.post(`/users/${userId}/follow`);
    return response.data;
  },

  unfollowUser: async (userId) => {
    const response = await api.delete(`/users/${userId}/follow`);
    return response.data;
  },

  getFollowers: async (userId, page = 1, pageSize = 50) => {
    const response = await api.get(`/users/${userId}/followers`, {
      params: { page, pageSize },
    });
    return response.data;
  },

  getFollowing: async (userId, page = 1, pageSize = 50) => {
    const response = await api.get(`/users/${userId}/following`, {
      params: { page, pageSize },
    });
    return response.data;
  },
};

