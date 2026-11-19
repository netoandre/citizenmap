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
        @open-auth="openAuthDialog"
      />
      <FilterBar />
    </div>

    <!-- Figma Floating Map Widgets -->
    <!-- 1. Map Live Status Badge (Top-left below filterbar on desktop) -->
    <div class="map-status gt-xs shadow-2">
      <span class="live-dot"></span>
      <strong>{{ (occurrencesStore.filteredOccurrences?.length ?? occurrencesStore.filteredFeatures?.length ?? 0) }}</strong>
      <span>ocorrências nesta área</span>
    </div>

    <!-- 2. Map Welcome Card (Bottom-left on desktop when no modal is open) -->
    <transition name="fade">
      <div
        v-if="!occurrencesStore.selectedOccurrence && !routingStore.isOpen"
        class="map-welcome gt-xs shadow-6"
      >
        <span class="eyebrow">{{ occurrencesStore.selectedNeighborhood === 'all' ? 'Belém' : occurrencesStore.selectedNeighborhood }}</span>
        <strong>Veja o que acontece perto de você</strong>
        <p>Selecione um marcador para consultar e confirmar uma ocorrência.</p>
      </div>
    </transition>

    <!-- 3. Desktop Floating Report Button (Bottom-right on desktop) -->
    <button class="report-fab gt-xs shadow-6" @click="openReportDialog">
      <span class="report-fab-icon"><q-icon name="add" size="24px" /></span>
      <span>Reportar ocorrência</span>
    </button>

    <!-- Bottom Navigation Bar (Figma Mobile Bottom Nav) -->
    <BottomNavbar
      @open-report="openReportDialog"
      @open-analytics="openAnalyticsDialog"
      @open-auth="openAuthDialog"
      @reset-view="resetMapView"
      @toggle-routes="toggleRoutingDialog"
      class="lt-sm"
    />

    <!-- Map Position Click Action Dialog -->
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
      @request-login="openAuthDialog"
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
  background: #f4f1e9;
  color: #1f2923;
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

/* Floating Widgets from Figma */
.map-status {
  position: absolute;
  top: 130px;
  left: 20px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 253, 248, 0.94);
  border: 1px solid rgba(220, 216, 206, 0.85);
  border-radius: 999px;
  padding: 7px 14px;
  font-size: 11.5px;
  color: #1f2923;
  backdrop-filter: blur(8px);
  pointer-events: auto;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #5d985e;
  box-shadow: 0 0 0 3px rgba(93, 152, 94, 0.2);
}

.map-welcome {
  position: absolute;
  bottom: 24px;
  left: 24px;
  z-index: 20;
  width: 295px;
  background: rgba(255, 253, 248, 0.94);
  border: 1px solid rgba(220, 216, 206, 0.85);
  border-radius: 18px;
  padding: 16px 18px;
  backdrop-filter: blur(12px);
  pointer-events: auto;
}

.map-welcome .eyebrow {
  display: block;
  color: #245c3a;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.11em;
  margin-bottom: 4px;
}

.map-welcome strong {
  display: block;
  font-size: 13.5px;
  font-weight: 700;
  color: #1f2923;
  margin-bottom: 4px;
}

.map-welcome p {
  font-size: 11.5px;
  color: #677069;
  line-height: 1.4;
  margin: 0;
}

.report-fab {
  position: absolute;
  bottom: 24px;
  right: 24px;
  z-index: 20;
  height: 50px;
  display: flex;
  align-items: center;
  padding: 0 18px 0 8px;
  border-radius: 16px;
  background: #245c3a;
  color: #ffffff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 10px 24px rgba(28, 77, 47, 0.3);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  pointer-events: auto;
}

.report-fab:hover {
  background: #173d29;
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(28, 77, 47, 0.38);
}

.report-fab-icon {
  width: 34px;
  height: 34px;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
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
