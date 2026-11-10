import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('citizenmap_user') || 'null'),
    token: localStorage.getItem('citizenmap_token') || null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userName: (state) => state.user?.name || '',
    userEmail: (state) => state.user?.email || '',
  },

  actions: {
    initAuth() {
      if (this.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        this.fetchMe()
      }
    },

    async login(email, password) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post('/api/auth/login', { email, password })
        this.token = response.data.token
        this.user = response.data.user
        localStorage.setItem('citizenmap_token', this.token)
        localStorage.setItem('citizenmap_user', JSON.stringify(this.user))
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        return response.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Erro ao realizar login'
        throw err
      } finally {
        this.loading = false
      }
    },

    async register(name, email, password) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post('/api/auth/register', { name, email, password })
        this.token = response.data.token
        this.user = response.data.user
        localStorage.setItem('citizenmap_token', this.token)
        localStorage.setItem('citizenmap_user', JSON.stringify(this.user))
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        return response.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Erro ao realizar cadastro'
        throw err
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        if (this.token) {
          await axios.post('/api/auth/logout')
        }
      } catch (err) {
        // ignore logout errors
      } finally {
        this.token = null
        this.user = null
        localStorage.removeItem('citizenmap_token')
        localStorage.removeItem('citizenmap_user')
        delete axios.defaults.headers.common['Authorization']
      }
    },

    async fetchMe() {
      if (!this.token) return
      try {
        const response = await axios.get('/api/auth/me')
        this.user = response.data.user
        localStorage.setItem('citizenmap_user', JSON.stringify(this.user))
      } catch (err) {
        if (err.response?.status === 401) {
          this.logout()
        }
      }
    },
  },
})
