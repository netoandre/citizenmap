import { defineStore } from 'pinia'
import axios from 'axios'

export const useOccurrencesStore = defineStore('occurrences', {
  state: () => ({
    features: [],
    total: 0,
    selectedOccurrence: null,
    neighborhoods: [],
    selectedType: 'all',
    selectedNeighborhood: 'all',
    selectedStatus: 'active',
    searchQuery: '',
    showBufferRadius: false,
    loading: false,
    statistics: null,
  }),

  getters: {
    filteredFeatures: (state) => {
      return state.features.filter((f) => {
        const props = f.properties
        const matchesType = state.selectedType === 'all' || props.type === state.selectedType
        const matchesNeighborhood =
          state.selectedNeighborhood === 'all' || props.neighborhood === state.selectedNeighborhood
        const matchesStatus =
          state.selectedStatus === 'all' || props.status === state.selectedStatus
        const matchesSearch =
          !state.searchQuery ||
          props.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
          (props.description && props.description.toLowerCase().includes(state.searchQuery.toLowerCase())) ||
          (props.address && props.address.toLowerCase().includes(state.searchQuery.toLowerCase()))

        return matchesType && matchesNeighborhood && matchesStatus && matchesSearch
      })
    },

    typeCounts: (state) => {
      const counts = {
        waste_dumping: 0,
        unpaved_street: 0,
        pavement_repair: 0,
        flood_prone: 0,
        street_lighting: 0,
      }
      state.features.forEach((f) => {
        const t = f.properties.type
        if (counts[t] !== undefined) counts[t]++
      })
      return counts
    },
  },

  actions: {
    async fetchOccurrences() {
      this.loading = true
      try {
        const params = {
          format: 'geojson',
        }
        if (this.selectedType !== 'all') params.type = this.selectedType
        if (this.selectedNeighborhood !== 'all') params.neighborhood = this.selectedNeighborhood
        if (this.selectedStatus !== 'all') params.status = this.selectedStatus

        const response = await axios.get('/api/occurrences', { params })
        this.features = response.data.features || []
        this.total = response.data.total || 0
      } catch (err) {
        console.error('Error fetching occurrences:', err)
      } finally {
        this.loading = false
      }
    },

    async fetchNeighborhoods() {
      try {
        const response = await axios.get('/api/neighborhoods')
        this.neighborhoods = response.data.neighborhoods || []
      } catch (err) {
        console.error('Error fetching neighborhoods:', err)
      }
    },

    async fetchStatistics() {
      try {
        const response = await axios.get('/api/statistics')
        this.statistics = response.data
      } catch (err) {
        console.error('Error fetching statistics:', err)
      }
    },

    async createOccurrence(payload) {
      this.loading = true
      try {
        const response = await axios.post('/api/occurrences', payload)
        const newFeature = response.data.occurrence
        this.features.unshift(newFeature)
        this.total++
        await this.fetchNeighborhoods()
        return newFeature
      } catch (err) {
        throw err
      } finally {
        this.loading = false
      }
    },

    async toggleConfirmation(occurrenceId) {
      try {
        const response = await axios.post(`/api/occurrences/${occurrenceId}/confirm`)
        const { has_confirmed, confirmations_count } = response.data

        // Update in features list
        const idx = this.features.findIndex((f) => f.id === occurrenceId)
        if (idx !== -1) {
          this.features[idx].properties.has_confirmed = has_confirmed
          this.features[idx].properties.confirmations_count = confirmations_count
        }

        // Update selected if open
        if (this.selectedOccurrence && this.selectedOccurrence.id === occurrenceId) {
          this.selectedOccurrence.properties.has_confirmed = has_confirmed
          this.selectedOccurrence.properties.confirmations_count = confirmations_count
        }

        return response.data
      } catch (err) {
        throw err
      }
    },

    async deleteOccurrence(occurrenceId) {
      try {
        await axios.delete(`/api/occurrences/${occurrenceId}`)
        this.features = this.features.filter((f) => f.id !== occurrenceId)
        this.total--
        if (this.selectedOccurrence?.id === occurrenceId) {
          this.selectedOccurrence = null
        }
        await this.fetchNeighborhoods()
      } catch (err) {
        throw err
      }
    },

    selectOccurrence(feature) {
      this.selectedOccurrence = feature
    },

    clearSelection() {
      this.selectedOccurrence = null
    },
  },
})
