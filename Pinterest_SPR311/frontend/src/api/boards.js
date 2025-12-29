import api from './auth'

export const boardsService = {
  createBoard: async (boardData) => {
    const response = await api.post('/boards', boardData)
    return response.data
  },

  getUserBoards: async () => {
    const response = await api.get('/boards')
    return response.data
  },

  getBoard: async (id) => {
    const response = await api.get(`/boards/${id}`)
    return response.data
  },

  addPinToBoard: async (boardId, pinId) => {
    const response = await api.post(`/boards/${boardId}/pins/${pinId}`)
    return response.data
  },
}

