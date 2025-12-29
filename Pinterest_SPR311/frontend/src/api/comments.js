import api from "./auth";

export const commentsService = {
  getComments: async (pinId) => {
    const response = await api.get(`/comments/pin/${pinId}`);
    return response.data;
  },

  createComment: async (pinId, text) => {
    const response = await api.post(`/comments/pin/${pinId}`, { text });
    return response.data;
  },

  deleteComment: async (commentId) => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },
};

