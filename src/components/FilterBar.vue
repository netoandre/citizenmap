<template>
  <div class="filter-bar-wrapper">
    <div class="filter-outer-box row items-center no-wrap">
      <!-- Left Scroll Arrow (Desktop) -->
      <transition name="fade">
        <button
          v-if="canScrollLeft"
          class="scroll-arrow-btn arrow-left shadow-2"
          @click="scrollByOffset(-200)"
          aria-label="Rolar para esquerda"
        >
          <q-icon name="chevron_left" size="22px" style="color: #3B2314" />
        </button>
      </transition>

      <!-- Scrollable Pills Container -->
      <div
        ref="scrollContainerRef"
        class="filter-scroll-container row items-center no-wrap q-gutter-x-xs"
        :class="{ 'is-grabbing': isMouseDown && isDragging }"
        @wheel.passive="onWheel"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseLeave"
        @scroll.passive="checkScroll"
      >
        <!-- 1. Todos -->
        <button
          class="filter-pill-btn pill-todos"
          :class="{ active: occurrencesStore.selectedType === 'all' }"
          @click="handlePillClick(() => setTypeFilter('all'))"
        >
          <span class="pill-dot"></span>
          <span>{{ $t('app.allTypes') || 'Todos' }}</span>
        </button>

        <!-- 2. Iluminação -->
        <button
          class="filter-pill-btn pill-lighting"
          :class="{ active: occurrencesStore.selectedType === 'street_lighting' }"
          @click="handlePillClick(() => setTypeFilter('street_lighting'))"
        >
          <q-icon name="lightbulb" size="16px" class="q-mr-xs" />
          <span>{{ $t('types.street_lighting') || 'Iluminação' }}</span>
          <span v-if="occurrencesStore.typeCounts.street_lighting" class="pill-badge">
            {{ occurrencesStore.typeCounts.street_lighting }}
          </span>
        </button>

        <!-- 3. Pavimentação (Buracos) -->
        <button
          class="filter-pill-btn pill-pavement"
          :class="{ active: occurrencesStore.selectedType === 'pavement_repair' }"
          @click="handlePillClick(() => setTypeFilter('pavement_repair'))"
        >
          <q-icon name="report_problem" size="16px" class="q-mr-xs" />
          <span>{{ $t('types.pavement_repair') || 'Pavimentação' }}</span>
          <span v-if="occurrencesStore.typeCounts.pavement_repair" class="pill-badge">
            {{ occurrencesStore.typeCounts.pavement_repair }}
          </span>
        </button>

        <!-- 4. Alagamento -->
        <button
          class="filter-pill-btn pill-flood"
          :class="{ active: occurrencesStore.selectedType === 'flood_prone' }"
          @click="handlePillClick(() => setTypeFilter('flood_prone'))"
        >
          <q-icon name="waves" size="16px" class="q-mr-xs" />
          <span>{{ $t('types.flood_prone') || 'Alagamento' }}</span>
          <span v-if="occurrencesStore.typeCounts.flood_prone" class="pill-badge">
            {{ occurrencesStore.typeCounts.flood_prone }}
          </span>
        </button>

        <!-- 5. Lixo irregular -->
        <button
          class="filter-pill-btn pill-waste"
          :class="{ active: occurrencesStore.selectedType === 'waste_dumping' }"
          @click="handlePillClick(() => setTypeFilter('waste_dumping'))"
        >
          <q-icon name="delete" size="16px" class="q-mr-xs" />
          <span>{{ $t('types.waste_dumping') || 'Lixo irregular' }}</span>
          <span v-if="occurrencesStore.typeCounts.waste_dumping" class="pill-badge">
            {{ occurrencesStore.typeCounts.waste_dumping }}
          </span>
        </button>

        <!-- 6. Rua sem pavimentação -->
        <button
          class="filter-pill-btn pill-unpaved"
          :class="{ active: occurrencesStore.selectedType === 'unpaved_street' }"
          @click="handlePillClick(() => setTypeFilter('unpaved_street'))"
        >
          <q-icon name="terrain" size="16px" class="q-mr-xs" />
          <span>{{ $t('types.unpaved_street') || 'Sem pavimentação' }}</span>
          <span v-if="occurrencesStore.typeCounts.unpaved_street" class="pill-badge">
            {{ occurrencesStore.typeCounts.unpaved_street }}
          </span>
        </button>

        <!-- 7. Filtrar por Bairro (Sand Pill Dropdown as in Image 1) -->
        <div class="neighborhood-dropdown-wrapper">
          <q-btn-dropdown
            rounded
            dense
            no-caps
            class="filter-pill-btn pill-neighborhood"
            :label="currentNeighborhoodLabel"
          >
            <q-list dense class="bg-light text-dark">
              <q-item
                clickable
                v-close-popup
                @click="setNeighborhoodFilter('all')"
                :class="{ 'text-weight-bold text-primary': occurrencesStore.selectedNeighborhood === 'all' }"
              >
                <q-item-section>{{ $t('app.allNeighborhoods') || 'Todos os Bairros' }}</q-item-section>
              </q-item>
              <q-separator />
              <q-item
                v-for="item in occurrencesStore.neighborhoods"
                :key="item.neighborhood"
                clickable
                v-close-popup
                @click="setNeighborhoodFilter(item.neighborhood)"
                :class="{ 'text-weight-bold text-primary': occurrencesStore.selectedNeighborhood === item.neighborhood }"
              >
                <q-item-section>
                  {{ item.neighborhood }} ({{ item.occurrences_count }})
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </div>

      <!-- Right Scroll Arrow (Desktop) -->
      <transition name="fade">
        <button
          v-if="canScrollRight"
          class="scroll-arrow-btn arrow-right shadow-2"
          @click="scrollByOffset(200)"
          aria-label="Rolar para direita"
        >
          <q-icon name="chevron_right" size="22px" style="color: #3B2314" />
        </button>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOccurrencesStore } from '../stores/occurrences'

const { t } = useI18n()
const occurrencesStore = useOccurrencesStore()

const scrollContainerRef = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

// Mouse drag state
const isMouseDown = ref(false)
const isDragging = ref(false)
const draggedDistance = ref(0)
const startX = ref(0)
const scrollLeftStart = ref(0)

const currentNeighborhoodLabel = computed(() => {
  if (occurrencesStore.selectedNeighborhood === 'all') {
    return 'Filtrar por Bairro'
  }
  return occurrencesStore.selectedNeighborhood
})

function checkScroll() {
  const el = scrollContainerRef.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 6
  canScrollRight.value = el.scrollLeft < (el.scrollWidth - el.clientWidth - 6)
}

function scrollByOffset(offset) {
  if (!scrollContainerRef.value) return
  scrollContainerRef.value.scrollBy({
    left: offset,
    behavior: 'smooth',
  })
  setTimeout(checkScroll, 250)
}

function onWheel(e) {
  if (!scrollContainerRef.value) return
  const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
  scrollContainerRef.value.scrollLeft += delta * 0.9
  checkScroll()
}

function onMouseDown(e) {
  if (e.button !== 0) return // Only left button
  isMouseDown.value = true
  isDragging.value = false
  draggedDistance.value = 0
  startX.value = e.pageX
  scrollLeftStart.value = scrollContainerRef.value.scrollLeft
}

function onMouseMove(e) {
  if (!isMouseDown.value || !scrollContainerRef.value) return
  const currentX = e.pageX
  const diff = currentX - startX.value
  draggedDistance.value = Math.abs(diff)
  if (Math.abs(diff) > 4) {
    isDragging.value = true
  }
  scrollContainerRef.value.scrollLeft = scrollLeftStart.value - diff
  checkScroll()
}

function onMouseUp() {
  isMouseDown.value = false
  setTimeout(() => {
    isDragging.value = false
    draggedDistance.value = 0
  }, 60)
}

function onMouseLeave() {
  isMouseDown.value = false
  isDragging.value = false
}

function handlePillClick(callback) {
  if (isDragging.value || draggedDistance.value > 5) {
    return // User dragged to scroll, do not toggle pill
  }
  callback()
}

function setTypeFilter(type) {
  occurrencesStore.selectedType = type
  occurrencesStore.fetchOccurrences()
}

function setNeighborhoodFilter(neighborhood) {
  occurrencesStore.selectedNeighborhood = neighborhood
  occurrencesStore.fetchOccurrences()
}

onMounted(() => {
  nextTick(() => {
    checkScroll()
  })
  window.addEventListener('resize', checkScroll)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScroll)
})
</script>

<style scoped>
.filter-bar-wrapper {
  width: 100%;
  pointer-events: none;
  display: flex;
  justify-content: center;
  padding: 6px 8px;
}

.filter-outer-box {
  pointer-events: auto;
  position: relative;
  max-width: 100%;
  display: flex;
  align-items: center;
}

.filter-scroll-container {
  max-width: 960px;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none;
  padding: 4px 6px;
  cursor: grab;
  user-select: none;
  -webkit-overflow-scrolling: touch;
}

.filter-scroll-container.is-grabbing {
  cursor: grabbing !important;
}

.filter-scroll-container::-webkit-scrollbar {
  display: none;
}

/* Scroll Arrows for Desktop */
.scroll-arrow-btn {
  background: #F7F2EE;
  border: 1px solid #D9C5B2;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  flex-shrink: 0;
  transition: transform 0.15s ease, background 0.15s ease;
  margin: 0 4px;
}

.scroll-arrow-btn:hover {
  background: #EFE7DE;
  transform: scale(1.1);
}

.scroll-arrow-btn:active {
  transform: scale(0.95);
}

/* Individual Filter Pills Matching Image 1 */
.filter-pill-btn {
  font-family: 'Public Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 700;
  border-radius: 20px;
  height: 32px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
  user-select: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.filter-pill-btn:active {
  transform: scale(0.96);
}

/* 1. Todos: Dark Green */
.pill-todos {
  background: #2D5A27;
  color: #FFFFFF;
}
.pill-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #FFFFFF;
  margin-right: 6px;
}

/* 2. Iluminação: Warm Yellow */
.pill-lighting {
  background: #E5A93C;
  color: #3B2314;
}

/* 3. Pavimentação: Terracotta */
.pill-pavement {
  background: #C05C33;
  color: #FFFFFF;
}

/* 4. Alagamento: Ocean Blue */
.pill-flood {
  background: #428CA7;
  color: #FFFFFF;
}

/* 5. Lixo irregular: Olive */
.pill-waste {
  background: #889E58;
  color: #263316;
}

/* 6. Sem pavimentação: Muted Earth Brown */
.pill-unpaved {
  background: #8C7355;
  color: #FFFFFF;
}

/* 7. Filtrar por Bairro: Sand / Beige */
.pill-neighborhood {
  background: #D9C5B2 !important;
  color: #3B2314 !important;
  font-weight: 700;
  border: 1px solid #C4AE9B;
}

.pill-badge {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 10px;
  padding: 1px 6px;
  font-size: 0.72rem;
  margin-left: 5px;
  font-weight: 800;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
