<template>
  <div class="citizenmap-app">
    <!-- Fullscreen Interactive Map with Warm Earthy Aesthetics -->
    <MapView
      ref="mapRef"
      @map-click="handleMapClick"
      @select-occurrence="handleSelectOccurrence"
    />

    <!-- Full-Width Top Header Area & Horizontal Filters -->
    <div class="top-header-area">
      <AppNavbar
        @open-analytics="openAnalyticsDialog"
        @reset-view="resetMapView"
      />
      <FilterBar />
    </div>

    <!-- Bottom Navigation Bar (Matching Image 1 & 3: Explorar, Reportar, '+', Rotas, Painel, Perfil) -->
    <BottomNavbar
      @open-report="openReportDialog"
      @open-analytics="openAnalyticsDialog"
      @open-auth="openAuthDialog"
      @reset-view="resetMapView"
      @toggle-routes="toggleRoutingDialog"
    />

    <!-- Map Position Click Action Dialog (Image 3: "O que deseja fazer aqui?") -->
    <MapActionDialog
      ref="mapActionDialogRef"
      @start-report="onStartReportFromMap"
      @open-auth="openAuthDialog"
    />

    <!-- Route Planner Panel / Drawer -->
    <RoutePlannerDialog />

    <!-- Occurrence Detail View Dialog (Bottom Sheet / Popup) -->
    <OccurrenceDetailDialog @request-login="openAuthDialog" />

    <!-- New Occurrence Submission Dialog -->
    <NewOccurrenceDialog
      ref="newOccurrenceRef"
      @occurrence-created="onOccurrenceCreated"
    />

    <!-- Authentication Dialog (Login / Register) -->
    <AuthDialog ref="authDialogRef" />

    <!-- Analytics & Decision-Making Dashboard -->
    <AnalyticsDialog ref="analyticsDialogRef" />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useOccurrencesStore } from './stores/occurrences'
import { useAuthStore } from './stores/auth'
import { useRoutingStore } from './stores/routing'
import { useQuasar } from 'quasar'

import MapView from './components/MapView.vue'
import AppNavbar from './components/AppNavbar.vue'
import FilterBar from './components/FilterBar.vue'
import BottomNavbar from './components/BottomNavbar.vue'
import MapActionDialog from './components/MapActionDialog.vue'
import RoutePlannerDialog from './components/RoutePlannerDialog.vue'
import OccurrenceDetailDialog from './components/OccurrenceDetailDialog.vue'
import NewOccurrenceDialog from './components/NewOccurrenceDialog.vue'
import AuthDialog from './components/AuthDialog.vue'
import AnalyticsDialog from './components/AnalyticsDialog.vue'

const occurrencesStore = useOccurrencesStore()
const authStore = useAuthStore()
const routingStore = useRoutingStore()
const $q = useQuasar()

const mapRef = ref(null)
const mapActionDialogRef = ref(null)
const newOccurrenceRef = ref(null)
const authDialogRef = ref(null)
const analyticsDialogRef = ref(null)

onMounted(async () => {
  try {
    await Promise.all([
      occurrencesStore.fetchOccurrences(),
      occurrencesStore.fetchNeighborhoods(),
    ])
  } catch (e) {
    $q.notify({
      type: 'warning',
      position: 'top',
      timeout: 8000,
      message: 'Backend offline em http://127.0.0.1:8000',
      caption: 'Inicie o backend em outro terminal com: cd backend && php artisan serve',
      icon: 'cloud_off',
    })
  }
})

function handleMapClick(coords) {
  // If user is currently picking origin or destination for routing, handled by MapView
  if (routingStore.pickingMode) return

  // Opens the dedicated Action Dialog matching Image 3!
  mapActionDialogRef.value?.open(coords)
}

function onStartReportFromMap(coords) {
  newOccurrenceRef.value?.open(coords)
}

function handleSelectOccurrence(feature) {
  occurrencesStore.selectOccurrence(feature)
}

function openReportDialog() {
  if (!authStore.isAuthenticated) {
    $q.notify({
      type: 'warning',
      message: 'Faça login para registrar ocorrências.',
    })
    openAuthDialog()
    return
  }
  newOccurrenceRef.value?.open()
}

function toggleRoutingDialog() {
  routingStore.isOpen = !routingStore.isOpen
}

function openAuthDialog() {
  authDialogRef.value?.open()
}

function openAnalyticsDialog() {
  analyticsDialogRef.value?.open()
}

function resetMapView() {
  mapRef.value?.resetView()
}

function onOccurrenceCreated(newOcc) {
  occurrencesStore.selectOccurrence(newOcc)
}
</script>

<style>
* {
  box-sizing: border-box;
}

body, html {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #F5EBE6; /* Bege Claro */
  color: #3B2314; /* Terra Escuro */
}

.citizenmap-app {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  font-family: 'Public Sans', sans-serif;
}

.top-header-area {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 1000;
  pointer-events: none;
  display: flex;
  flex-direction: column;
}

/* Custom Dialog Card Styling to match brand */
.q-dialog__inner {
  padding: 12px;
}

.leading-tight {
  line-height: 1.25;
}

.leading-snug {
  line-height: 1.35;
}
</style>
