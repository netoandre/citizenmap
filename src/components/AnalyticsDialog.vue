<template>
  <q-dialog v-model="isOpen" class="analytics-dialog">
    <q-card class="analytics-card shadow-12" style="min-width: 340px; max-width: 580px; width: 100%">
      <!-- Header -->
      <div class="row items-center justify-between q-pa-md border-bottom">
        <div class="row items-center no-wrap">
          <div class="analytics-icon-box q-mr-sm flex flex-center">
            <q-icon name="insights" size="20px" color="white" />
          </div>
          <div>
            <div class="modal-title">{{ $t('analytics.title') }}</div>
            <div class="modal-subtitle">{{ $t('analytics.subtitle') }}</div>
          </div>
        </div>
        <q-btn flat round dense icon="close" size="sm" class="close-btn" v-close-popup />
      </div>

      <q-card-section class="q-pa-md scroll" style="max-height: 72vh">
        <!-- Loading -->
        <div v-if="loading" class="text-center q-pa-lg">
          <q-spinner-pie color="primary" size="48px" />
        </div>

        <template v-else-if="stats">
          <!-- KPI Summary Cards -->
          <div class="row q-col-gutter-sm q-mb-md">
            <div class="col-6">
              <div class="kpi-card text-center q-pa-sm kpi-green">
                <div class="kpi-value text-primary">{{ stats.total }}</div>
                <div class="kpi-label text-ink">{{ $t('analytics.totalOccurrences') }}</div>
              </div>
            </div>
            <div class="col-6">
              <div class="kpi-card text-center q-pa-sm kpi-terracotta">
                <div class="kpi-value text-secondary">
                  {{ (stats.by_type?.flood_prone || 0) + (stats.by_type?.pavement_repair || 0) }}
                </div>
                <div class="kpi-label text-ink">Alertas Críticos</div>
              </div>
            </div>
          </div>

          <!-- Type Distribution -->
          <div class="section-title q-mb-xs">
            {{ $t('analytics.byTypeDistribution') }}
          </div>
          <div class="q-gutter-y-xs q-mb-md">
            <div
              v-for="(count, type) in stats.by_type"
              :key="type"
              class="row items-center justify-between q-pa-xs rounded-borders stat-row"
            >
              <div class="row items-center no-wrap">
                <q-icon :name="getTypeIcon(type)" :style="{ color: getTypeColor(type) }" size="18px" class="q-mr-xs" />
                <span class="text-caption text-weight-medium text-ink">{{ $t(`types.${type}`) }}</span>
              </div>
              <div class="row items-center">
                <span class="count-tag">
                  {{ count }}
                </span>
              </div>
            </div>
          </div>

          <!-- Top Neighborhoods -->
          <div class="section-title q-mb-xs">
            {{ $t('analytics.topNeighborhoods') }}
          </div>
          <div class="q-gutter-y-xs q-mb-md">
            <div
              v-for="item in stats.top_neighborhoods"
              :key="item.neighborhood"
              class="row items-center justify-between q-pa-xs rounded-borders stat-row"
            >
              <div class="row items-center">
                <q-icon name="apartment" size="16px" color="primary" class="q-mr-xs" />
                <span class="text-caption text-weight-bold text-ink">{{ item.neighborhood }}</span>
              </div>
              <span class="district-badge">
                {{ item.count }} ocorrência(s)
              </span>
            </div>
          </div>

          <!-- Critical Community Hotspots -->
          <div class="section-title q-mb-xs">
            {{ $t('analytics.criticalHotspots') }}
          </div>
          <div class="hotspots-list">
            <div
              v-for="spot in stats.top_critical"
              :key="spot.id"
              class="hotspot-item row items-center justify-between cursor-pointer q-pa-xs"
              @click="focusSpot(spot)"
            >
              <div class="row items-center no-wrap col-grow q-pr-xs">
                <q-icon
                  :name="getTypeIcon(spot.properties.type)"
                  :style="{ color: getTypeColor(spot.properties.type) }"
                  size="20px"
                  class="q-mr-xs"
                />
                <div>
                  <div class="text-weight-bold text-caption text-ink leading-tight">
                    {{ spot.properties.title }}
                  </div>
                  <div class="text-caption text-muted leading-tight">
                    {{ spot.properties.neighborhood }}
                  </div>
                </div>
              </div>
              <span class="likes-badge">
                <q-icon name="thumb_up" size="12px" class="q-mr-xs text-primary" />
                {{ spot.properties.confirmations_count }}
              </span>
            </div>
          </div>
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
    case 'flood_prone': return 'waves'
    case 'pavement_repair': return 'construction'
    case 'unpaved_street': return 'terrain'
    case 'waste_dumping': return 'delete'
    case 'street_lighting': return 'lightbulb'
    default: return 'place'
  }
}

function getTypeColor(type) {
  switch (type) {
    case 'flood_prone': return '#287f9d'
    case 'pavement_repair': return '#c65d35'
    case 'unpaved_street': return '#8c7355'
    case 'waste_dumping': return '#718a35'
    case 'street_lighting': return '#e7a72f'
    default: return '#245c3a'
  }
}

defineExpose({
  open,
})
</script>

<style scoped>
.analytics-card {
  border-radius: 22px;
  background-color: rgba(255, 253, 248, 0.98);
  border: 1px solid rgba(222, 217, 206, 0.9);
  font-family: 'Public Sans', sans-serif;
  color: #1f2923;
  overflow: hidden;
}

@media (max-width: 600px) {
  .analytics-dialog :deep(.q-dialog__inner) {
    padding: 12px;
    padding-bottom: 76px;
  }
}

.analytics-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background-color: #245c3a;
}

.modal-title {
  font-size: 15px;
  font-weight: 800;
  color: #1f2923;
  line-height: 1.2;
}

.modal-subtitle {
  font-size: 11px;
  color: #677069;
}

.border-bottom {
  border-bottom: 1px solid #ded9ce;
}

.close-btn {
  color: #677069;
}

.kpi-card {
  border-radius: 14px;
  border: 1px solid #ded9ce;
}

.kpi-green {
  background-color: #edf3ea;
  border-color: #c8dbc5;
}

.kpi-terracotta {
  background-color: #fdf2ee;
  border-color: #f8cdbf;
}

.kpi-value {
  font-size: 1.5rem;
  font-weight: 800;
}

.kpi-label {
  font-size: 11px;
  font-weight: 600;
}

.section-title {
  font-size: 11.5px;
  font-weight: 800;
  color: #1f2923;
}

.stat-row {
  background-color: #fffdf8;
  border: 1px solid #ded9ce;
  border-radius: 10px;
  padding: 6px 10px;
}

.count-tag {
  background-color: #f0ede7;
  color: #1f2923;
  font-weight: 700;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
}

.district-badge {
  background-color: #245c3a;
  color: #ffffff;
  font-weight: 700;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
}

.hotspots-list {
  background-color: #fffdf8;
  border: 1px solid #ded9ce;
  border-radius: 12px;
  overflow: hidden;
}

.hotspot-item {
  border-bottom: 1px solid #f0ede7;
  padding: 6px 10px;
  transition: background 0.15s ease;
}

.hotspot-item:last-child {
  border-bottom: none;
}

.hotspot-item:hover {
  background-color: #f7f4ed;
}

.likes-badge {
  background-color: #edf3ea;
  border: 1px solid #c8dbc5;
  color: #245c3a;
  font-weight: 700;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
}

.text-ink {
  color: #1f2923;
}

.text-muted {
  color: #677069;
}
</style>