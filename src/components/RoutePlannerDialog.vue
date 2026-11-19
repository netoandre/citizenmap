<template>
  <div v-if="routingStore.isOpen" class="route-planner-container">
    <q-card class="route-planner-card shadow-14" flat>
      <!-- 1. Header (Matching Figma: PLANEJAMENTO SEGURO / Sua rota / Close button) -->
      <div class="route-header q-px-md q-pt-md q-pb-sm row items-start justify-between no-wrap">
        <div>
          <span class="route-eyebrow">PLANEJAMENTO SEGURO</span>
          <h2 class="route-title q-ma-none">Sua rota</h2>
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          size="sm"
          class="close-btn"
          @click="routingStore.isOpen = false"
        />
      </div>

      <!-- 2. Body Section -->
      <div class="route-body q-px-md q-pb-md q-gutter-y-sm">
        <!-- Origin & Destination Inputs with Vertical Dashed Connecting Stem -->
        <div class="route-inputs-wrapper">
          <div class="vertical-connecting-stem"></div>

          <!-- Origin Row -->
          <div class="input-block q-mb-sm">
            <div class="row items-center no-wrap q-mb-xs">
              <span class="origin-ring-dot q-mr-xs"></span>
              <span class="input-label">ORIGEM</span>
            </div>

            <div class="input-field-box row items-center justify-between no-wrap">
              <div
                class="col-grow text-body2 input-text-content ellipsis cursor-pointer"
                @click="routingStore.setPickingMode('origin')"
              >
                <template v-if="routingStore.origin">
                  <span class="text-weight-bold text-ink">
                    {{ routingStore.origin.label || `${routingStore.origin.lat.toFixed(4)}, ${routingStore.origin.lng.toFixed(4)}` }}
                  </span>
                </template>
                <template v-else>
                  <span class="text-muted italic">Clique para marcar a origem no mapa</span>
                </template>
              </div>

              <!-- Quick action icon buttons -->
              <div class="row items-center no-wrap q-gutter-x-xs">
                <q-btn
                  flat
                  round
                  dense
                  size="sm"
                  icon="my_location"
                  color="primary"
                  @click.stop="setOriginCurrentLocation"
                >
                  <q-tooltip>Usar meu GPS atual</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  size="sm"
                  icon="pin_drop"
                  :color="routingStore.pickingMode === 'origin' ? 'primary' : 'grey-7'"
                  :class="{ 'active-picking-btn': routingStore.pickingMode === 'origin' }"
                  @click.stop="routingStore.setPickingMode('origin')"
                >
                  <q-tooltip>Marcar ponto no mapa</q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>

          <!-- Destination Row -->
          <div class="input-block">
            <div class="row items-center no-wrap q-mb-xs">
              <span class="dest-solid-dot q-mr-xs"></span>
              <span class="input-label">DESTINO</span>
            </div>

            <div class="input-field-box row items-center justify-between no-wrap">
              <div
                class="col-grow text-body2 input-text-content ellipsis cursor-pointer"
                @click="routingStore.setPickingMode('destination')"
              >
                <template v-if="routingStore.destination">
                  <span class="text-weight-bold text-ink">
                    {{ routingStore.destination.label || `${routingStore.destination.lat.toFixed(4)}, ${routingStore.destination.lng.toFixed(4)}` }}
                  </span>
                </template>
                <template v-else>
                  <span class="text-muted italic">Clique para marcar o destino no mapa</span>
                </template>
              </div>

              <div class="row items-center no-wrap">
                <q-btn
                  flat
                  round
                  dense
                  size="sm"
                  icon="pin_drop"
                  :color="routingStore.pickingMode === 'destination' ? 'secondary' : 'grey-7'"
                  :class="{ 'active-picking-btn': routingStore.pickingMode === 'destination' }"
                  @click.stop="routingStore.setPickingMode('destination')"
                >
                  <q-tooltip>Marcar destino no mapa</q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>
        </div>

        <!-- Picking Mode Notification Pill -->
        <div v-if="routingStore.pickingMode" class="picking-mode-banner row items-center justify-between q-pa-xs">
          <div class="row items-center no-wrap">
            <q-spinner-puff size="16px" color="primary" class="q-mr-xs" />
            <span class="text-caption text-weight-bold text-primary">
              Clique em qualquer local no mapa para definir o
              {{ routingStore.pickingMode === 'origin' ? 'ponto de partida' : 'destino' }}.
            </span>
          </div>
          <q-btn flat round dense icon="close" size="xs" color="grey-7" @click="routingStore.setPickingMode(null)" />
        </div>

        <!-- Loading Spinner -->
        <div v-if="routingStore.loading" class="text-center q-pa-sm">
          <q-spinner-dots color="primary" size="32px" />
          <div class="text-caption text-muted q-mt-xs">Calculando trajeto seguro e analisando riscos...</div>
        </div>

        <!-- Route Metrics & Hazards (Matching Figma) -->
        <template v-else-if="routingStore.routeCoordinates.length > 0">
          <!-- 3. Metrics Banner: Duration + Distance + 'Rota mais segura' -->
          <div class="route-metrics-card row items-center justify-between q-pa-sm">
            <div class="row items-baseline no-wrap">
              <span class="metric-duration q-mr-xs">{{ estimatedDurationMinutes }} min</span>
              <span class="metric-distance text-muted">{{ formattedDistanceKm }} km</span>
            </div>
            <div class="route-badge-safe row items-center no-wrap">
              <q-icon name="check" size="16px" class="q-mr-xs text-primary" />
              <span>Rota mais segura</span>
            </div>
          </div>

          <!-- 4. Attention / Hazard Alert Box (Matching Figma Image 1) -->
          <div
            v-if="routingStore.hasConflicts"
            class="hazard-alert-box q-pa-sm row items-start no-wrap"
          >
            <div class="hazard-alert-icon-box q-mr-sm flex flex-center">
              <q-icon name="warning" size="20px" color="amber-9" />
            </div>
            <div class="col-grow">
              <div class="hazard-alert-title">
                Atenção em {{ routingStore.totalConflicts }} {{ routingStore.totalConflicts === 1 ? 'trecho' : 'trechos' }}
              </div>
              <div class="hazard-alert-desc">
                {{ conflictDescriptionSummary }}
              </div>

              <!-- Collapsible hazard chips -->
              <div class="row q-gutter-xs q-mt-xs">
                <span
                  v-for="conflict in routingStore.conflicts.slice(0, 3)"
                  :key="conflict.id"
                  class="hazard-chip cursor-pointer"
                  @click="focusConflict(conflict)"
                >
                  <q-icon :name="getTypeIcon(conflict.type)" size="12px" class="q-mr-xs" />
                  <span>{{ conflict.title }} ({{ conflict.distance_meters }}m)</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Safe Route (Zero hazards found) -->
          <div
            v-else
            class="safe-alert-box q-pa-sm row items-center no-wrap"
          >
            <div class="safe-alert-icon-box q-mr-sm flex flex-center">
              <q-icon name="verified_user" size="20px" color="positive" />
            </div>
            <div>
              <div class="safe-alert-title">Nenhum risco no trajeto</div>
              <div class="safe-alert-desc">Trajeto livre de alagamentos, buracos ou vias escuras registradas.</div>
            </div>
          </div>

          <!-- 5. Primary Action Button: [ Iniciar rota > ] -->
          <q-btn
            unelevated
            class="start-route-btn full-width"
            :class="{ 'btn-route-active': routingStore.userDecision === 'proceed' }"
            @click="handleStartRoute"
          >
            <span>{{ routingStore.userDecision === 'proceed' ? 'Rota em andamento ✓' : 'Iniciar rota' }}</span>
            <q-icon name="chevron_right" size="18px" class="q-ml-xs" />
          </q-btn>
        </template>

        <!-- No route yet prompt -->
        <template v-else>
          <div class="prompt-box q-pa-sm text-center">
            <q-icon name="map" size="24px" color="primary" class="q-mb-xs" />
            <div class="text-caption text-weight-bold text-ink">Defina o ponto de partida e o destino</div>
            <div class="text-caption text-muted">Ou experimente um dos trajetos pré-configurados abaixo:</div>
          </div>
        </template>

        <!-- Quick Demo Route Pills & Clear -->
        <div class="q-pt-xs">
          <div class="row items-center justify-between q-mb-xs">
            <span class="alternatives-label cursor-pointer" @click="showDemoPills = !showDemoPills">
              {{ showDemoPills ? 'Ocultar alternativas' : 'Ver rotas sugeridas na cidade' }}
              <q-icon :name="showDemoPills ? 'expand_less' : 'expand_more'" size="16px" />
            </span>
            <button
              v-if="routingStore.routeCoordinates.length > 0"
              type="button"
              class="clear-route-link"
              @click="routingStore.clearRoute"
            >
              Limpar
            </button>
          </div>

          <transition name="fade">
            <div v-if="showDemoPills" class="row q-gutter-xs q-mt-xs">
              <button
                class="demo-route-pill"
                @click="loadDemoRoute('nazare_umarizal')"
              >
                Nazaré ➔ Umarizal
              </button>
              <button
                class="demo-route-pill"
                @click="loadDemoRoute('cidade_velha_batista')"
              >
                Cidade Velha ➔ Batista Campos
              </button>
              <button
                class="demo-route-pill"
                @click="loadDemoRoute('marco_reduto')"
              >
                Marco ➔ Reduto
              </button>
            </div>
          </transition>
        </div>
      </div>
    </q-card>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoutingStore } from '../stores/routing'
import { useOccurrencesStore } from '../stores/occurrences'
import { useQuasar } from 'quasar'

const routingStore = useRoutingStore()
const occurrencesStore = useOccurrencesStore()
const $q = useQuasar()

const showDemoPills = ref(true)

const formattedDistanceKm = computed(() => {
  if (!routingStore.routeDistanceMeters) return '0.0'
  return (routingStore.routeDistanceMeters / 1000).toFixed(1)
})

const estimatedDurationMinutes = computed(() => {
  if (routingStore.routeDurationSeconds) {
    return Math.max(1, Math.round(routingStore.routeDurationSeconds / 60))
  }
  // Fallback estimate (~25 km/h urban average speed)
  const km = routingStore.routeDistanceMeters / 1000
  return Math.max(2, Math.round((km / 25) * 60))
})

const conflictDescriptionSummary = computed(() => {
  if (!routingStore.hasConflicts) return ''
  const types = routingStore.conflicts.map((c) => {
    switch (c.type) {
      case 'flood_prone': return 'ponto de alagamento'
      case 'pavement_repair': return 'buraco na pista'
      case 'waste_dumping': return 'descarte de lixo'
      case 'street_lighting': return 'via sem iluminação'
      default: return 'obstáculo urbano'
    }
  })
  const unique = Array.from(new Set(types))
  if (unique.length === 1) {
    return `Esta rota passa próximo a um ${unique[0]}.`
  }
  return `Esta rota passa próximo a um ${unique.slice(0, -1).join(', ')} e um ${unique[unique.length - 1]}.`
})

function setOriginCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        routingStore.setOrigin(pos.coords.latitude, pos.coords.longitude, 'Minha Localização')
        $q.notify({ type: 'info', message: 'Origem definida pelo seu GPS!' })
      },
      () => {
        $q.notify({ type: 'warning', message: 'Não foi possível obter sinal do GPS.' })
      }
    )
  }
}

function loadDemoRoute(type) {
  if (type === 'nazare_umarizal') {
    routingStore.origin = { lat: -1.4528, lng: -48.4812, label: 'Nazaré (Basílica)' }
    routingStore.destination = { lat: -1.4445, lng: -48.4862, label: 'Umarizal (Doca)' }
  } else if (type === 'cidade_velha_batista') {
    routingStore.origin = { lat: -1.4615, lng: -48.504, label: 'Cidade Velha (Forte)' }
    routingStore.destination = { lat: -1.459, lng: -48.4895, label: 'Praça Batista Campos' }
  } else {
    routingStore.origin = { lat: -1.435, lng: -48.468, label: 'Marco (Humaitá)' }
    routingStore.destination = { lat: -1.4492, lng: -48.4985, label: 'Reduto (Rui Barbosa)' }
  }
  routingStore.calculateRoute()
}

function handleStartRoute() {
  routingStore.setDecision('proceed')
  $q.notify({
    type: 'positive',
    icon: 'navigation',
    message: 'Navegação iniciada! Acompanhe a rota segura traçada no mapa.',
  })
}

function focusConflict(conflict) {
  const feat = occurrencesStore.features.find((f) => f.id === conflict.id)
  if (feat) {
    occurrencesStore.selectOccurrence(feat)
  }
}

function getTypeIcon(type) {
  switch (type) {
    case 'flood_prone': return 'waves'
    case 'pavement_repair': return 'construction'
    case 'unpaved_street': return 'terrain'
    case 'waste_dumping': return 'delete'
    case 'street_lighting': return 'lightbulb'
    default: return 'place'
  }
}
</script>

<style scoped>
.route-planner-container {
  position: absolute;
  top: 110px;
  left: 20px;
  width: 375px;
  max-width: calc(100vw - 32px);
  z-index: 950;
  font-family: 'Public Sans', sans-serif;
}

@media (max-width: 600px) {
  .route-planner-container {
    top: auto;
    bottom: 74px;
    left: 10px;
    right: 10px;
    width: auto;
    max-width: 100vw;
  }
}

.route-planner-card {
  border-radius: 22px;
  background: rgba(255, 253, 248, 0.99);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(222, 217, 206, 0.95);
  color: #1f2923;
  overflow: hidden;
}

.route-header {
  background: #fffdf8;
}

.route-eyebrow {
  font-size: 10.5px;
  font-weight: 800;
  color: #245c3a;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.route-title {
  font-size: 22px;
  font-weight: 800;
  color: #1f2923;
  letter-spacing: -0.3px;
  line-height: 1.2;
}

.close-btn {
  color: #677069;
}

/* Vertical dashed line between origin and destination */
.route-inputs-wrapper {
  position: relative;
}

.vertical-connecting-stem {
  position: absolute;
  left: 6px;
  top: 14px;
  bottom: 14px;
  width: 2px;
  border-left: 2px dashed #ded9ce;
}

.input-block {
  position: relative;
  z-index: 1;
}

.input-label {
  font-size: 10px;
  font-weight: 800;
  color: #677069;
  letter-spacing: 0.06em;
}

.origin-ring-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2.5px solid #245c3a;
  background: #fffdf8;
  display: inline-block;
  flex-shrink: 0;
}

.dest-solid-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #245c3a;
  display: inline-block;
  flex-shrink: 0;
}

.input-field-box {
  background: #ffffff;
  border: 1.5px solid #ded9ce;
  border-radius: 12px;
  padding: 6px 10px;
  transition: all 0.2s ease;
}

.input-field-box:hover {
  border-color: #245c3a;
}

.input-text-content {
  font-size: 13px;
  line-height: 1.3;
}

.active-picking-btn {
  background-color: #e7efe7;
}

.picking-mode-banner {
  background: #edf3ea;
  border: 1px solid #c8dbc5;
  border-radius: 10px;
}

/* Metrics Banner */
.route-metrics-card {
  background: #eef5ee;
  border-radius: 14px;
  border: 1px solid #d5e5d3;
}

.metric-duration {
  font-size: 21px;
  font-weight: 800;
  color: #1f2923;
}

.metric-distance {
  font-size: 13px;
  font-weight: 700;
}

.route-badge-safe {
  color: #245c3a;
  font-size: 12.5px;
  font-weight: 800;
}

/* Hazard Alert Box */
.hazard-alert-box {
  background: #fef8ed;
  border: 1px solid #fae8c8;
  border-radius: 14px;
}

.hazard-alert-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: #faecd0;
  flex-shrink: 0;
}

.hazard-alert-title {
  font-size: 13.5px;
  font-weight: 800;
  color: #1f2923;
}

.hazard-alert-desc {
  font-size: 11.5px;
  color: #677069;
  line-height: 1.35;
}

.hazard-chip {
  background: #ffffff;
  border: 1px solid #fae8c8;
  border-radius: 8px;
  padding: 2px 7px;
  font-size: 10px;
  font-weight: 700;
  color: #8c5b14;
}

/* Safe Alert Box */
.safe-alert-box {
  background: #edf7ec;
  border: 1px solid #c8dbc5;
  border-radius: 14px;
}

.safe-alert-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: #d8ebd6;
  flex-shrink: 0;
}

.safe-alert-title {
  font-size: 13.5px;
  font-weight: 800;
  color: #245c3a;
}

.safe-alert-desc {
  font-size: 11.5px;
  color: #4a5c4e;
}

/* Start Route Primary Button */
.start-route-btn {
  height: 48px;
  border-radius: 14px;
  background: #245c3a !important;
  color: #ffffff !important;
  font-weight: 800;
  font-size: 14px;
  box-shadow: 0 4px 14px rgba(36, 92, 58, 0.28);
  text-transform: none;
}

.start-route-btn:hover {
  background: #173d29 !important;
}

.btn-route-active {
  background: #173d29 !important;
}

.prompt-box {
  background: #f7f4ed;
  border: 1px dashed #ded9ce;
  border-radius: 12px;
}

.alternatives-label {
  font-size: 11px;
  font-weight: 700;
  color: #245c3a;
}

.clear-route-link {
  background: none;
  border: none;
  color: #8c7355;
  font-weight: 700;
  font-size: 11px;
  cursor: pointer;
}

.clear-route-link:hover {
  color: #c65d35;
  text-decoration: underline;
}

.demo-route-pill {
  border: 1px solid #ded9ce;
  background: #ffffff;
  color: #245c3a;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.demo-route-pill:hover {
  background: #e7efe7;
  border-color: #245c3a;
}

.text-ink {
  color: #1f2923;
}

.text-muted {
  color: #677069;
}
</style>
