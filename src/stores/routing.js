import { defineStore } from 'pinia'
import axios from 'axios'

export const useRoutingStore = defineStore('routing', {
  state: () => ({
    isOpen: false,
    origin: null, // { lat, lng, label }
    destination: null, // { lat, lng, label }
    pickingMode: null, // 'origin' | 'destination' | null
    routeCoordinates: [], // [[lng, lat], ...]
    routeDistanceMeters: 0,
    routeDurationSeconds: 0,
    hasConflicts: false,
    totalConflicts: 0,
    criticalConflicts: 0,
    conflicts: [],
    hazardSummary: {},
    recommendation: null,
    bufferMeters: 40,
    userDecision: null, // 'proceed' | 'modify' | null
    loading: false,
    error: null,
  }),

  actions: {
    setPickingMode(mode) {
      this.pickingMode = mode
    },

    setOrigin(lat, lng, label = 'Ponto de Partida (A)') {
      this.origin = { lat, lng, label }
      this.pickingMode = null
      if (this.destination) {
        this.calculateRoute()
      }
    },

    setDestination(lat, lng, label = 'Ponto de Chegada (B)') {
      this.destination = { lat, lng, label }
      this.pickingMode = null
      if (this.origin) {
        this.calculateRoute()
      }
    },

    async calculateRoute() {
      if (!this.origin || !this.destination) return

      this.loading = true
      this.error = null
      this.userDecision = null

      try {
        let coords = []
        let distance = 0
        let duration = 0
        let analysisData = null

        // 1. Try unified backend route calculation & spatial hazard analysis (OSRM server-to-server)
        try {
          const res = await axios.post('/api/routes/calculate', {
            origin_lat: this.origin.lat,
            origin_lng: this.origin.lng,
            dest_lat: this.destination.lat,
            dest_lng: this.destination.lng,
            buffer_meters: this.bufferMeters,
          })
          if (res.data && res.data.coordinates && res.data.coordinates.length > 1) {
            coords = res.data.coordinates
            distance = res.data.distance_meters || 0
            duration = res.data.duration_seconds || 0
            analysisData = res.data
          }
        } catch (backendRouteErr) {
          console.warn('Backend route calculation fallback to client OSRM', backendRouteErr)
        }

        // 2. Client-side fallback using clean fetch() (avoids Axios Bearer token CORS blockage)
        if (coords.length <= 2) {
          try {
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${this.origin.lng},${this.origin.lat};${this.destination.lng},${this.destination.lat}?overview=full&geometries=geojson`
            const osrmRes = await fetch(osrmUrl)
            if (osrmRes.ok) {
              const data = await osrmRes.json()
              if (data?.routes?.[0]) {
                const r = data.routes[0]
                coords = r.geometry.coordinates
                distance = r.distance
                duration = r.duration
              }
            }
          } catch (fetchErr) {
            console.warn('OSRM public mirror failed:', fetchErr)
          }
        }

        // If analysisData was not yet fetched, query /api/routes/analyze
        if (!analysisData && coords.length > 1) {
          const analysisRes = await axios.post('/api/routes/analyze', {
            coordinates: coords,
            buffer_meters: this.bufferMeters,
          })
          analysisData = analysisRes.data
        }

        if (coords.length > 1) {
          this.routeCoordinates = coords
          this.routeDistanceMeters = distance
          this.routeDurationSeconds = duration
        }

        if (analysisData) {
          this.hasConflicts = analysisData.has_conflicts
          this.totalConflicts = analysisData.total_conflicts
          this.criticalConflicts = analysisData.critical_conflicts || 0
          this.conflicts = analysisData.conflicts || []
          this.hazardSummary = analysisData.hazard_summary || {}
          this.recommendation = analysisData.recommendation
        }

        this.isOpen = true
      } catch (err) {
        console.error('Route calculation error:', err)
        this.error = 'Não foi possível calcular a rota pelas vias.'
      } finally {
        this.loading = false
      }
    },

    clearRoute() {
      this.origin = null
      this.destination = null
      this.pickingMode = null
      this.routeCoordinates = []
      this.routeDistanceMeters = 0
      this.routeDurationSeconds = 0
      this.hasConflicts = false
      this.totalConflicts = 0
      this.criticalConflicts = 0
      this.conflicts = []
      this.hazardSummary = {}
      this.recommendation = null
      this.userDecision = null
      this.error = null
    },

    setDecision(decision) {
      this.userDecision = decision
    },
  },
})
