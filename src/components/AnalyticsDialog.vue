<template>
  <q-dialog v-model="isOpen" class="analytics-dialog">
    <q-card class="analytics-card shadow-10" style="min-width: 340px; max-width: 580px; width: 100%">
      <!-- Header -->
      <q-card-section class="row items-center justify-between q-pb-none">
        <div class="row items-center no-wrap">
          <q-avatar size="38px" class="q-mr-sm" style="background-color: #2D5A27; color: white">
            <q-icon name="insights" size="22px" />
          </q-avatar>
          <div>
            <div class="text-subtitle1 text-weight-bolder" style="color: #3B2314">{{ $t('analytics.title') }}</div>
            <div class="text-caption" style="color: #8C7355">{{ $t('analytics.subtitle') }}</div>
          </div>
        </div>
        <q-btn flat round dense icon="close" size="sm" style="color: #3B2314" v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-md scroll" style="max-height: 72vh">
        <!-- Loading -->
        <div v-if="loading" class="text-center q-pa-lg">
          <q-spinner-pie color="primary" size="48px" />
        </div>

        <template v-else-if="stats">
          <!-- KPI Summary Cards -->
          <div class="row q-col-gutter-sm q-mb-md">
            <div class="col-6">
              <q-card flat class="kpi-card text-center q-pa-sm" style="background-color: #EAF0E8; border: 1px solid #D9C5B2">
                <div class="text-h5 text-weight-bolder" style="color: #2D5A27">{{ stats.total }}</div>
                <div class="text-caption text-weight-medium" style="color: #3B2314">{{ $t('analytics.totalOccurrences') }}</div>
              </q-card>
            </div>
            <div class="col-6">
              <q-card flat class="kpi-card text-center q-pa-sm" style="background-color: #FBEFEA; border: 1px solid #D9C5B2">
                <div class="text-h5 text-weight-bolder" style="color: #C05C33">
                  {{ (stats.by_type?.flood_prone || 0) + (stats.by_type?.pavement_repair || 0) }}
                </div>
                <div class="text-caption text-weight-medium" style="color: #3B2314">Alertas de Pavimento e Alagamento</div>
              </q-card>
            </div>
          </div>

          <!-- Type Distribution -->
          <div class="text-caption text-weight-bolder q-mb-xs" style="color: #3B2314">
            {{ $t('analytics.byTypeDistribution') }}
          </div>
          <div class="q-gutter-y-xs q-mb-md">
            <div
              v-for="(count, type) in stats.by_type"
              :key="type"
              class="row items-center justify-between q-pa-xs rounded-borders"
              style="background-color: #ffffff; border: 1px solid #EFE7DE"
            >
              <div class="row items-center no-wrap">
                <q-icon :name="getTypeIcon(type)" :style="{ color: getTypeColor(type) }" size="18px" class="q-mr-xs" />
                <span class="text-caption text-weight-medium" style="color: #3B2314">{{ $t(`types.${type}`) }}</span>
              </div>
              <div class="row items-center">
                <q-badge style="background-color: #EFE7DE; color: #3B2314" class="text-weight-bold">
                  {{ count }}
                </q-badge>
              </div>
            </div>
          </div>

          <!-- Top Neighborhoods -->
          <div class="text-caption text-weight-bolder q-mb-xs" style="color: #3B2314">
            {{ $t('analytics.topNeighborhoods') }}
          </div>
          <div class="q-gutter-y-xs q-mb-md">
            <div
              v-for="item in stats.top_neighborhoods"
              :key="item.neighborhood"
              class="row items-center justify-between q-pa-xs rounded-borders"
              style="background-color: #ffffff; border: 1px solid #EFE7DE"
            >
              <div class="row items-center">
                <q-icon name="apartment" size="16px" style="color: #2D5A27" class="q-mr-xs" />
                <span class="text-caption text-weight-bold" style="color: #3B2314">{{ item.neighborhood }}</span>
              </div>
              <q-badge style="background-color: #2D5A27; color: white" class="text-weight-bold">
                {{ item.count }} ocorrência(s)
              </q-badge>
            </div>
          </div>

          <!-- Critical Community Hotspots -->
          <div class="text-caption text-weight-bolder q-mb-xs" style="color: #3B2314">
            {{ $t('analytics.criticalHotspots') }}
          </div>
          <q-list separator dense class="rounded-borders overflow-hidden" style="background-color: #ffffff; border: 1px solid #D9C5B2">
            <q-item
              v-for="spot in stats.top_critical"
              :key="spot.id"
              clickable
              v-ripple
              @click="focusSpot(spot)"
            >
              <q-item-section avatar style="min-width: 32px">
                <q-icon
                  :name="getTypeIcon(spot.properties.type)"
                  :style="{ color: getTypeColor(spot.properties.type) }"
                  size="20px"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold text-caption leading-tight" style="color: #3B2314">
                  {{ spot.properties.title }}
                </q-item-label>
                <q-item-label caption style="color: #8C7355">
                  {{ spot.properties.neighborhood }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge style="background-color: #FAF4EF; color: #2D5A27; border: 1px solid #D9C5B2" class="text-weight-bolder">
                  <q-icon name="thumb_up" size="12px" class="q-mr-xs" style="color: #2D5A27" />
                  {{ spot.properties.confirmations_count }}
                </q-badge>
              </q-item-section>
            </q-item>
          </q-list>
        </template>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useOccurrencesStore } from '../stores/occurrences'

const occurrencesStore = useOccurrencesStore()
const isOpen = ref(false)
const loading = ref(false)
const stats = ref(null)

async function open() {
  isOpen.value = true
  loading.value = true
  try {
    await occurrencesStore.fetchStatistics()
    stats.value = occurrencesStore.statistics
  } finally {
    loading.value = false
  }
}

function focusSpot(feature) {
  isOpen.value = false
  occurrencesStore.selectOccurrence(feature)
}

function getTypeIcon(type) {
  switch (type) {
    case 'flood_prone': return 'water_drop'
    case 'pavement_repair': return 'construction'
    case 'unpaved_street': return 'terrain'
    case 'waste_dumping': return 'delete'
    case 'street_lighting': return 'lightbulb'
    default: return 'place'
  }
}

function getTypeColor(type) {
  switch (type) {
    case 'flood_prone': return '#428CA7'
    case 'pavement_repair': return '#C05C33'
    case 'unpaved_street': return '#8C7355'
    case 'waste_dumping': return '#889E58'
    case 'street_lighting': return '#E5A93C'
    default: return '#2D5A27'
  }
}

defineExpose({
  open,
})
</script>

<style scoped>
.analytics-card {
  border-radius: 24px;
  background-color: #F7F2EE;
  border: 1px solid #D9C5B2;
  font-family: 'Public Sans', sans-serif;
  color: #3B2314;
}

@media (max-width: 600px) {
  .analytics-dialog :deep(.q-dialog__inner) {
    padding: 12px;
    padding-bottom: 76px;
  }
}

.kpi-card {
  border-radius: 14px;
}
</style>
