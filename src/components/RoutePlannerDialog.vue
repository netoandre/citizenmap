<template>
  <div v-if="routingStore.isOpen" class="route-planner-container">
    <q-card class="route-planner-card shadow-8" flat>
      <!-- Header -->
      <div class="row items-center justify-between q-px-md q-py-sm border-bottom">
        <div class="row items-center no-wrap">
          <q-avatar size="34px" color="primary" text-color="white" class="q-mr-sm">
            <q-icon name="alt_route" size="20px" />
          </q-avatar>
          <div>
            <div class="text-subtitle2 text-weight-bold">{{ $t('routing.title') }}</div>
            <div class="text-caption text-grey-7">{{ $t('routing.subtitle') }}</div>
          </div>
        </div>
        <q-btn flat round dense icon="close" size="sm" @click="routingStore.isOpen = false" />
      </div>

      <q-card-section class="q-pa-md scroll" style="max-height: 75vh">
        <!-- Origin & Destination Inputs -->
        <div class="route-inputs-box q-pa-sm rounded-borders bg-grey-1 q-mb-md">
          <!-- Origin (A) -->
          <div class="row items-center no-wrap q-mb-xs">
            <div class="point-badge origin-badge q-mr-sm">A</div>
            <div class="col-grow text-caption">
              <template v-if="routingStore.origin">
                <span class="text-weight-bold text-grey-9">
                  {{ routingStore.origin.label || `${routingStore.origin.lat.toFixed(4)}, ${routingStore.origin.lng.toFixed(4)}` }}
                </span>
              </template>
              <template v-else>
                <span class="text-grey-6 italic">{{ $t('routing.origin') }}</span>
              </template>
            </div>
            <q-btn
              flat
              dense
              round
              size="sm"
              icon="pin_drop"
              color="primary"
              :class="{ 'bg-blue-1': routingStore.pickingMode === 'origin' }"
              @click="routingStore.setPickingMode('origin')"
            >
              <q-tooltip>{{ $t('routing.pickOriginOnMap') }}</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              round
              size="sm"
              icon="my_location"
              color="grey-8"
              @click="setOriginCurrentLocation"
            >
              <q-tooltip>{{ $t('routing.useCurrentLocation') }}</q-tooltip>
            </q-btn>
          </div>

          <q-separator spaced="xs" />

          <!-- Destination (B) -->
          <div class="row items-center no-wrap">
            <div class="point-badge dest-badge q-mr-sm">B</div>
            <div class="col-grow text-caption">
              <template v-if="routingStore.destination">
                <span class="text-weight-bold text-grey-9">
                  {{ routingStore.destination.label || `${routingStore.destination.lat.toFixed(4)}, ${routingStore.destination.lng.toFixed(4)}` }}
                </span>
              </template>
              <template v-else>
                <span class="text-grey-6 italic">{{ $t('routing.destination') }}</span>
              </template>
            </div>
            <q-btn
              flat
              dense
              round
              size="sm"
              icon="pin_drop"
              color="negative"
              :class="{ 'bg-red-1': routingStore.pickingMode === 'destination' }"
              @click="routingStore.setPickingMode('destination')"
            >
              <q-tooltip>{{ $t('routing.pickDestOnMap') }}</q-tooltip>
            </q-btn>
          </div>
        </div>

        <!-- Quick Demo Routes Buttons -->
        <div class="row q-gutter-x-xs q-mb-md">
          <q-btn
            outline
            rounded
            dense
            size="sm"
            color="primary"
            label="Nazaré ➔ Umarizal"
            class="text-caption q-px-sm"
            @click="loadDemoRoute('nazare_umarizal')"
          />
          <q-btn
            outline
            rounded
            dense
            size="sm"
            color="primary"
            label="Cidade Velha ➔ Batista Campos"
            class="text-caption q-px-sm"
            @click="loadDemoRoute('cidade_velha_batista')"
          />
          <q-btn
            outline
            rounded
            dense
            size="sm"
            color="primary"
            label="Marco ➔ Reduto"
            class="text-caption q-px-sm"
            @click="loadDemoRoute('marco_reduto')"
          />
        </div>

        <!-- Buffer Slider -->
        <div class="q-mb-md bg-grey-1 q-pa-sm rounded-borders">
          <div class="row items-center justify-between text-caption text-grey-8 q-mb-xs">
            <span>Raio de Análise de Risco (Buffer)</span>
            <span class="text-weight-bold text-primary">{{ routingStore.bufferMeters }}m</span>
          </div>
          <q-slider
            v-model="routingStore.bufferMeters"
            :min="15"
            :max="150"
            :step="5"
            dense
            color="primary"
            @change="routingStore.calculateRoute"
          />
        </div>

        <!-- Loading State -->
        <div v-if="routingStore.loading" class="text-center q-pa-md">
          <q-spinner-dots color="primary" size="36px" />
          <div class="text-caption text-grey-7 q-mt-xs">{{ $t('routing.analyzing') }}</div>
        </div>

        <!-- Route Hazard Analysis Results -->
        <template v-else-if="routingStore.routeCoordinates.length > 0">
          <!-- Status Banner -->
          <div
            class="analysis-banner q-pa-sm rounded-borders q-mb-md row items-center no-wrap"
            :class="bannerStatusClass"
          >
            <q-avatar size="32px" :color="bannerIconBg" text-color="white" class="q-mr-sm">
              <q-icon :name="bannerIcon" size="18px" />
            </q-avatar>
            <div class="col-grow">
              <div class="text-weight-bolder text-subtitle2 leading-tight">
                {{ isPt ? routingStore.recommendation?.title_pt : routingStore.recommendation?.title_en }}
              </div>
              <div class="text-caption leading-tight q-mt-xs">
                {{ isPt ? routingStore.recommendation?.description_pt : routingStore.recommendation?.description_en }}
              </div>
            </div>
          </div>

          <!-- Hazards List if conflicts found -->
          <div v-if="routingStore.hasConflicts" class="q-mb-md">
            <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">
              {{ $t('routing.hazardListTitle') }}
            </div>
            <q-list separator dense class="rounded-borders border-grey overflow-hidden bg-white">
              <q-item
                v-for="conflict in routingStore.conflicts"
                :key="conflict.id"
                clickable
                v-ripple
                class="q-py-xs"
                @click="focusConflict(conflict)"
              >
                <q-item-section avatar style="min-width: 32px">
                  <q-icon
                    :name="getTypeIcon(conflict.type)"
                    :color="getTypeColor(conflict.type)"
                    size="18px"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold text-caption">{{ conflict.title }}</q-item-label>
                  <q-item-label caption class="text-grey-7">
                    {{ conflict.neighborhood }} • {{ conflict.impact_alert }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge color="grey-3" text-color="grey-9" class="text-weight-bold">
                    {{ conflict.distance_meters }}m
                  </q-badge>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Decision Action Section -->
          <div class="decision-box bg-blue-grey-1 q-pa-sm rounded-borders q-mb-sm">
            <div class="text-caption text-weight-bold text-grey-9 q-mb-xs">
              {{ $t('routing.decisionTitle') }}
            </div>
            <div class="row q-gutter-x-sm">
              <!-- Proceed Button -->
              <q-btn
                unelevated
                rounded
                dense
                size="sm"
                :color="routingStore.userDecision === 'proceed' ? 'positive' : 'grey-9'"
                :label="$t('routing.proceedAnyway')"
                icon="navigation"
                class="col-grow text-weight-bold q-py-xs"
                @click="handleDecision('proceed')"
              />
              <!-- Modify / Detour Button -->
              <q-btn
                flat
                rounded
                dense
                size="sm"
                color="primary"
                :label="$t('routing.changeRoute')"
                icon="edit_road"
                class="text-weight-bold"
                @click="routingStore.setPickingMode('origin')"
              />
            </div>
            <div v-if="routingStore.userDecision === 'proceed'" class="text-caption text-positive text-weight-medium q-mt-xs">
              ✓ Rota aceita. Dirija com atenção aos alertas no mapa.
            </div>
          </div>
        </template>

        <!-- Clear / Action Footer -->
        <div class="row items-center justify-between q-mt-sm">
          <q-btn
            flat
            dense
            size="sm"
            color="negative"
            icon="delete_sweep"
            :label="$t('routing.clearRoute')"
            @click="routingStore.clearRoute"
          />
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoutingStore } from '../stores/routing'
import { useOccurrencesStore } from '../stores/occurrences'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'

const routingStore = useRoutingStore()
const occurrencesStore = useOccurrencesStore()
const { t, locale } = useI18n()
const $q = useQuasar()

const isPt = computed(() => locale.value === 'pt')

const bannerStatusClass = computed(() => {
  if (!routingStore.hasConflicts) return 'bg-positive-soft text-positive-dark'
  if (routingStore.criticalConflicts > 0) return 'bg-negative-soft text-negative-dark'
  return 'bg-warning-soft text-warning-dark'
})

const bannerIconBg = computed(() => {
  if (!routingStore.hasConflicts) return 'positive'
  if (routingStore.criticalConflicts > 0) return 'negative'
  return 'warning'
})

const bannerIcon = computed(() => {
  if (!routingStore.hasConflicts) return 'verified'
  if (routingStore.criticalConflicts > 0) return 'warning'
  return 'info'
})

function setOriginCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      routingStore.setOrigin(pos.coords.latitude, pos.coords.longitude, 'Minha Localização')
      $q.notify({ type: 'info', message: 'Origem definida com seu GPS!' })
    })
  }
}

function loadDemoRoute(type) {
  if (type === 'nazare_umarizal') {
    routingStore.origin = { lat: -1.4528, lng: -48.4812, label: 'Nazaré (Basílica)' }
    routingStore.destination = { lat: -1.4445, lng: -48.4862, label: 'Umarizal (Doca)' }
  } else if (type === 'cidade_velha_batista') {
    routingStore.origin = { lat: -1.4615, lng: -48.5040, label: 'Cidade Velha (Forte)' }
    routingStore.destination = { lat: -1.4590, lng: -48.4895, label: 'Praça Batista Campos' }
  } else {
    routingStore.origin = { lat: -1.4350, lng: -48.4680, label: 'Marco (Humaitá)' }
    routingStore.destination = { lat: -1.4492, lng: -48.4985, label: 'Reduto (Rui Barbosa)' }
  }
  routingStore.calculateRoute()
}

function handleDecision(decision) {
  routingStore.setDecision(decision)
  $q.notify({
    type: 'positive',
    message: 'Decisão registrada. O mapa exibe seu corredor de navegação.',
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
    case 'flood_prone': return 'tsunami'
    case 'pavement_repair': return 'report_problem'
    case 'unpaved_street': return 'terrain'
    case 'waste_dumping': return 'delete_sweep'
    case 'street_lighting': return 'lightbulb'
    default: return 'place'
  }
}

function getTypeColor(type) {
  switch (type) {
    case 'flood_prone': return 'blue-8'
    case 'pavement_repair': return 'red-8'
    case 'unpaved_street': return 'brown-7'
    case 'waste_dumping': return 'amber-9'
    case 'street_lighting': return 'purple-8'
    default: return 'primary'
  }
}
</script>

<style scoped>
.route-planner-container {
  position: absolute;
  top: 140px;
  left: 14px;
  width: 360px;
  max-width: calc(100vw - 28px);
  z-index: 950;
}

.route-planner-card {
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.point-badge {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.origin-badge {
  background: #2D5A27;
}

.dest-badge {
  background: #C05C33;
}

.route-planner-container {
  position: absolute;
  top: 110px;
  left: 14px;
  width: 380px;
  max-width: calc(100vw - 28px);
  z-index: 950;
}

@media (max-width: 600px) {
  .route-planner-container {
    top: auto;
    bottom: 76px;
    left: 8px;
    right: 8px;
    width: auto;
    max-width: 100vw;
  }
}

.route-planner-card {
  border-radius: 24px;
  background: rgba(247, 242, 238, 0.96); /* Bege Claro */
  backdrop-filter: blur(14px);
  border: 1px solid #D9C5B2;
}

.border-bottom {
  border-bottom: 1px solid #D9C5B2;
}

.border-grey {
  border: 1px solid #D9C5B2;
}

.bg-positive-soft {
  background: #EAF0E8;
  border: 1px solid #76A035;
}

.text-positive-dark {
  color: #2D5A27;
}

.bg-warning-soft {
  background: #FEF7EC;
  border: 1px solid #E5A93C;
}

.text-warning-dark {
  color: #8C5B14;
}

.bg-negative-soft {
  background: #FBEFEA;
  border: 1px solid #C05C33;
}

.text-negative-dark {
  color: #943A1B;
}
</style>
