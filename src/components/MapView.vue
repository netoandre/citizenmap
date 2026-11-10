<template>
  <div class="map-container" ref="mapElement">
    <!-- Routing Picking Hint Floating Banner -->
    <transition name="fade">
      <div v-if="routingStore.pickingMode" class="map-hint-banner shadow-4">
        <q-icon name="pin_drop" size="20px" class="q-mr-xs text-primary" />
        <span class="text-weight-bold text-caption">
          {{ routingStore.pickingMode === 'origin' ? $t('routing.pickOriginOnMap') : $t('routing.pickDestOnMap') }}
        </span>
        <q-btn
          flat
          round
          dense
          size="sm"
          icon="close"
          class="q-ml-sm"
          @click="routingStore.setPickingMode(null)"
        />
      </div>
    </transition>

    <!-- Floating Re-center / GPS Action Button -->
    <div class="map-controls-floating">
      <q-btn
        round
        color="white"
        text-color="grey-9"
        icon="my_location"
        class="shadow-2 q-mb-sm"
        @click="goToUserLocation"
      >
        <q-tooltip>{{ $t('newOccurrence.useCurrentLocation') }}</q-tooltip>
      </q-btn>
      <q-btn
        round
        color="white"
        text-color="grey-9"
        icon="zoom_in"
        class="shadow-2 q-mb-xs"
        @click="zoomIn"
      />
      <q-btn
        round
        color="white"
        text-color="grey-9"
        icon="zoom_out"
        class="shadow-2"
        @click="zoomOut"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import { useOccurrencesStore } from '../stores/occurrences'
import { useRoutingStore } from '../stores/routing'
import { useQuasar } from 'quasar'

const emit = defineEmits(['map-click', 'select-occurrence', 'request-report'])

const mapElement = ref(null)
let map = null
let markersLayerGroup = null
let buffersLayerGroup = null
let routePolyline = null
let routeBufferPolygon = null
let originMarker = null
let destinationMarker = null
let userLocationMarker = null
let userLocationCircle = null
const userLocation = ref(null)

const occurrencesStore = useOccurrencesStore()
const routingStore = useRoutingStore()
const $q = useQuasar()

// Default center: Belém do Pará
const defaultLat = -1.4558
const defaultLng = -48.4902
const defaultZoom = 14

onMounted(() => {
  initMap()
  renderOccurrences()
  autoLocateUser()
})

function initMap() {
  // Initialize Leaflet map
  map = L.map(mapElement.value, {
    center: [defaultLat, defaultLng],
    zoom: defaultZoom,
    zoomControl: false, // Custom clean zoom buttons
  })

  // Tile URL configuration with API key support
  const apiKey = import.meta.env.VITE_MAP_API_KEY || ''
  let tileUrl = import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
  tileUrl = tileUrl.replace('{r}', '')

  if (apiKey) {
    if (tileUrl.includes('{apiKey}')) {
      tileUrl = tileUrl.replace('{apiKey}', apiKey)
    } else if (tileUrl.includes('{key}')) {
      tileUrl = tileUrl.replace('{key}', apiKey)
    } else {
      const separator = tileUrl.includes('?') ? '&' : '?'
      // CARTO accepts ?key=... parameter
      tileUrl = `${tileUrl}${separator}key=${apiKey}&api_key=${apiKey}`
    }
  }

  // Base Layers
  const cartoPositron = L.tileLayer(tileUrl, {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  })

  const cartoVoyager = L.tileLayer(`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png${apiKey ? '?key=' + apiKey : ''}`, {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
  })

  const osmStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  })

  // Add default layer
  cartoPositron.addTo(map)

  // Add layer switcher control on top-right
  L.control.layers({
    'CARTO Positron (Minimalista)': cartoPositron,
    'CARTO Voyager (Cores)': cartoVoyager,
    'OpenStreetMap (Padrão)': osmStandard,
  }, null, { position: 'bottomleft' }).addTo(map)

  markersLayerGroup = L.layerGroup().addTo(map)
  buffersLayerGroup = L.layerGroup().addTo(map)

  // Map click listener
  map.on('click', (e) => {
    const { lat, lng } = e.latlng

    // Check if user is picking origin or destination for routing
    if (routingStore.pickingMode === 'origin') {
      routingStore.setOrigin(lat, lng)
      return
    }
    if (routingStore.pickingMode === 'destination') {
      routingStore.setDestination(lat, lng)
      return
    }

    emit('map-click', { lat, lng })
  })
}

// Marker style and colors based on brand identity (from mockup)
function getTypeColor(type) {
  switch (type) {
    case 'flood_prone': return '#428CA7' // Azul Alagamento
    case 'pavement_repair': return '#C05C33' // Terracota Buracos
    case 'unpaved_street': return '#8C7355' // Terra/Areia
    case 'waste_dumping': return '#889E58' // Verde Oliva Lixo
    case 'street_lighting': return '#E5A93C' // Amarelo Quente Iluminação
    default: return '#2D5A27'
  }
}

function getTypeIcon(type) {
  switch (type) {
    case 'flood_prone': return 'waves'
    case 'pavement_repair': return 'report_problem'
    case 'unpaved_street': return 'terrain'
    case 'waste_dumping': return 'delete'
    case 'street_lighting': return 'lightbulb'
    default: return 'place'
  }
}

function createCustomMarkerIcon(feature) {
  const props = feature.properties
  const color = getTypeColor(props.type)
  const icon = getTypeIcon(props.type)

  const html = `
    <div class="brand-map-pin" style="--pin-color: ${color};">
      <div class="pin-head shadow-3">
        <i class="material-icons">${icon}</i>
      </div>
      <div class="pin-stem"></div>
    </div>
  `

  return L.divIcon({
    className: 'leaflet-brand-div-icon',
    html,
    iconSize: [36, 44],
    iconAnchor: [18, 42],
    popupAnchor: [0, -42],
  })
}

function renderOccurrences() {
  if (!markersLayerGroup || !buffersLayerGroup) return

  markersLayerGroup.clearLayers()
  buffersLayerGroup.clearLayers()

  const features = occurrencesStore.filteredFeatures

  features.forEach((feature) => {
    const [lon, lat] = feature.geometry.coordinates
    const props = feature.properties
    const color = getTypeColor(props.type)

    // 1. Create Marker with Brand Pin
    const icon = createCustomMarkerIcon(feature)
    const marker = L.marker([lat, lon], { icon })

    // Speech bubble popup matching Image 1
    const likes = props.confirmations_count || 1
    const popupContent = `
      <div class="marker-speech-bubble">
        <div class="bubble-title">${props.title}</div>
        <div class="bubble-meta">
          <span>Confirmado por ${likes} ${likes === 1 ? 'pessoa' : 'pessoas'}</span>
          <i class="material-icons bubble-check">check_circle</i>
        </div>
      </div>
    `
    marker.bindPopup(popupContent, {
      className: 'custom-leaflet-popup',
      closeButton: false,
      offset: [0, -10],
    })

    marker.on('click', () => {
      occurrencesStore.selectOccurrence(feature)
      emit('select-occurrence', feature)
    })

    markersLayerGroup.addLayer(marker)

    // 2. Spatial Hazard Buffers
    if (occurrencesStore.showBufferRadius) {
      const radiusMeters = props.type === 'flood_prone' ? 65 : 40
      const circle = L.circle([lat, lon], {
        radius: radiusMeters,
        color: color,
        fillColor: color,
        fillOpacity: 0.16,
        weight: 1.5,
        dashArray: '3, 4',
      })
      buffersLayerGroup.addLayer(circle)
    }
  })
}

// Watch changes in filtered occurrences or buffer visibility
watch(
  () => [occurrencesStore.filteredFeatures, occurrencesStore.showBufferRadius],
  () => {
    renderOccurrences()
  },
  { deep: true }
)

// Watch route calculations to draw route polyline on the map
watch(
  () => [routingStore.routeCoordinates, routingStore.origin, routingStore.destination, routingStore.hasConflicts],
  () => {
    updateRouteOnMap()
  },
  { deep: true }
)

function updateRouteOnMap() {
  if (!map) return

  // 1. Update Origin Marker
  if (originMarker) map.removeLayer(originMarker)
  if (routingStore.origin) {
    const originIcon = L.divIcon({
      className: 'leaflet-route-point',
      html: `<div class="route-point-badge origin shadow-3">A</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })
    originMarker = L.marker([routingStore.origin.lat, routingStore.origin.lng], { icon: originIcon }).addTo(map)
  }

  // 2. Update Destination Marker
  if (destinationMarker) map.removeLayer(destinationMarker)
  if (routingStore.destination) {
    const destIcon = L.divIcon({
      className: 'leaflet-route-point',
      html: `<div class="route-point-badge destination shadow-3">B</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })
    destinationMarker = L.marker([routingStore.destination.lat, routingStore.destination.lng], { icon: destIcon }).addTo(map)
  }

  // 3. Update Route Polyline
  if (routePolyline) map.removeLayer(routePolyline)
  if (routeBufferPolygon) map.removeLayer(routeBufferPolygon)

  if (routingStore.routeCoordinates.length > 1) {
    const latLngs = routingStore.routeCoordinates.map((pt) => [pt[1], pt[0]])

    // Route color decision: Green if safe, Amber if moderate, Terracotta if critical
    let routeColor = '#2D5A27' // Verde Floresta
    if (routingStore.hasConflicts) {
      routeColor = routingStore.criticalConflicts > 0 ? '#C05C33' : '#E5A93C'
    }

    // Outer glow / buffer corridor
    routeBufferPolygon = L.polyline(latLngs, {
      color: routeColor,
      weight: 14,
      opacity: 0.22,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map)

    // Inner route line
    routePolyline = L.polyline(latLngs, {
      color: routeColor,
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map)

    // Fit map bounds to encompass route
    map.fitBounds(routePolyline.getBounds(), { padding: [80, 80] })
  }
}

function updateUserLocationMarker(lat, lng, accuracy = 30) {
  userLocation.value = { lat, lng }

  if (userLocationMarker) map.removeLayer(userLocationMarker)
  if (userLocationCircle) map.removeLayer(userLocationCircle)

  // Pulsing blue circle icon for user location
  const userIcon = L.divIcon({
    className: 'leaflet-user-location-marker',
    html: `
      <div class="user-location-pulse">
        <div class="user-location-core"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })

  userLocationCircle = L.circle([lat, lng], {
    radius: Math.max(accuracy, 25),
    color: '#1A73E8',
    fillColor: '#1A73E8',
    fillOpacity: 0.14,
    weight: 1,
  }).addTo(map)

  userLocationMarker = L.marker([lat, lng], {
    icon: userIcon,
    zIndexOffset: 1000,
  }).addTo(map)

  userLocationMarker.bindTooltip('Sua Localização', {
    direction: 'top',
    offset: [0, -10],
  })
}

function autoLocateUser() {
  if (!navigator.geolocation) return

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords
      updateUserLocationMarker(latitude, longitude, accuracy)
      map.flyTo([latitude, longitude], 15, { duration: 1.5 })
    },
    (err) => {
      console.info('Geolocalização não autorizada pelo navegador, mantendo centro padrão (Belém).')
    },
    { enableHighAccuracy: true, timeout: 5000 }
  )
}

function goToUserLocation() {
  if (!navigator.geolocation) {
    $q.notify({ type: 'warning', message: 'Geolocalização não suportada.' })
    return
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords
      updateUserLocationMarker(latitude, longitude, accuracy)
      map.flyTo([latitude, longitude], 16)
      $q.notify({ type: 'info', message: 'Centralizado na sua localização atual!' })
    },
    (err) => {
      $q.notify({ type: 'warning', message: 'Não foi possível obter sua localização.' })
    },
    { enableHighAccuracy: true }
  )
}

function zoomIn() {
  if (map) map.zoomIn()
}

function zoomOut() {
  if (map) map.zoomOut()
}

function resetView() {
  if (userLocation.value) {
    map.flyTo([userLocation.value.lat, userLocation.value.lng], 15)
  } else {
    map.flyTo([defaultLat, defaultLng], defaultZoom)
  }
}

defineExpose({
  resetView,
  goToUserLocation,
})
</script>

<style>
.map-container {
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

/* Custom Marker Styling */
/* Warm Earthy Map Aesthetics matching brand guidelines */
.leaflet-tile-pane {
  filter: sepia(0.24) saturate(0.92) hue-rotate(-6deg) brightness(1.02);
}

/* Brand Pin Styling matching Mockup */
.brand-map-pin {
  position: relative;
  width: 36px;
  height: 44px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.brand-map-pin:hover {
  transform: scale(1.18) translateY(-4px);
  z-index: 1000 !important;
}

.pin-head {
  width: 34px;
  height: 34px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  background: var(--pin-color, #2D5A27);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #ffffff;
  box-shadow: 0 4px 12px rgba(59, 35, 20, 0.35);
}

.pin-head i {
  transform: rotate(45deg);
  color: #ffffff;
  font-size: 19px;
}

/* Speech bubble popup matching Image 1 */
.custom-leaflet-popup .leaflet-popup-content-wrapper {
  background: #FFFFFF;
  border-radius: 14px;
  box-shadow: 0 4px 20px rgba(59, 35, 20, 0.22);
  border: 1px solid #D9C5B2;
  padding: 0;
}

.custom-leaflet-popup .leaflet-popup-content {
  margin: 0;
  line-height: 1.3;
}

.custom-leaflet-popup .leaflet-popup-tip {
  background: #FFFFFF;
  border: 1px solid #D9C5B2;
}

.marker-speech-bubble {
  font-family: 'Public Sans', sans-serif;
  padding: 8px 12px;
  min-width: 175px;
  max-width: 240px;
}

.bubble-title {
  font-weight: 700;
  color: #3B2314;
  font-size: 0.84rem;
  line-height: 1.25;
  margin-bottom: 4px;
}

.bubble-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #665B53;
  font-size: 0.72rem;
  font-weight: 500;
}

.bubble-check {
  color: #76A035;
  font-size: 16px;
  margin-left: 4px;
}

/* Route Origin & Destination Marker Badges */
.route-point-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: #fff;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #ffffff;
}

.route-point-badge.origin {
  background: #2D5A27;
}

.route-point-badge.destination {
  background: #C05C33;
}

/* Floating controls placed cleanly above bottom navbar */
.map-controls-floating {
  position: absolute;
  right: 16px;
  bottom: 82px;
  z-index: 900;
  display: flex;
  flex-direction: column;
}

@media (min-width: 600px) {
  .map-controls-floating {
    bottom: 96px;
  }
}

.map-hint-banner {
  position: absolute;
  top: 140px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-radius: 30px;
  padding: 8px 18px;
  z-index: 1000;
  display: flex;
  align-items: center;
  border: 1px solid rgba(0, 0, 0, 0.1);
  animation: pulse-banner 2s infinite ease-in-out;
}

@keyframes pulse-banner {
  0%, 100% { box-shadow: 0 4px 14px rgba(26, 115, 232, 0.25); }
  50% { box-shadow: 0 4px 22px rgba(26, 115, 232, 0.45); }
}

/* User Location Pulsing Marker */
.user-location-pulse {
  width: 24px;
  height: 24px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-location-pulse::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(26, 115, 232, 0.45);
  animation: user-loc-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.user-location-core {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #1A73E8;
  border: 2.5px solid #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  position: relative;
  z-index: 2;
}

@keyframes user-loc-ping {
  0% { transform: scale(0.6); opacity: 1; }
  75%, 100% { transform: scale(2.6); opacity: 0; }
}
</style>
