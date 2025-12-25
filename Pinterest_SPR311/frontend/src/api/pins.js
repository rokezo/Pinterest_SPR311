import api from './auth'

export const pinsService = {
  getPins: async (page = 1, pageSize = 20, useApi = true) => {
    const response = await api.get('/pins', {
      params: { page, pageSize, useApi },
    })
    return response.data
  },

  searchPins: async (query = '', page = 1, pageSize = 20) => {
    const response = await api.get('/pins/search', {
      params: { query, page, pageSize },
    })
    return response.data
  },

  getPin: async (id) => {
    const response = await api.get(`/pins/${id}`)
    return response.data
  },
}

