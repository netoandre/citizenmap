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
          <q-icon name="chevron_left" size="20px" style="color: #245c3a" />
        </button>
      </transition>

      <!-- Scrollable Pills Container (Figma .category-filters) -->
      <div
        ref="scrollContainerRef"
        class="filter-scroll-container row items-center no-wrap q-gutter-x-sm"
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
          class="figma-filter-pill"
          :class="{ active: occurrencesStore.selectedType === 'all' }"
          style="--category-color: #537a54"
          @click="handlePillClick(() => setTypeFilter('all'))"
        >
          <span class="pill-icon-circle">
            <q-icon name="layers" size="15px" />
          </span>
          <span class="pill-text-label">{{ $t('app.allTypes') || 'Todos' }}</span>
          <small class="pill-count-tag">{{ (occurrencesStore.occurrences?.length ?? occurrencesStore.features?.length ?? 0) }}</small>
        </button>

        <!-- 2. Iluminação -->
        <button
          class="figma-filter-pill"
          :class="{ active: occurrencesStore.selectedType === 'street_lighting' }"
          style="--category-color: #e7a72f"
          @click="handlePillClick(() => setTypeFilter('street_lighting'))"
        >
          <span class="pill-icon-circle">
            <q-icon name="lightbulb" size="15px" />
          </span>
          <span class="pill-text-label">{{ $t('types.street_lighting') || 'Iluminação' }}</span>
          <small v-if="occurrencesStore.typeCounts.street_lighting" class="pill-count-tag">
            {{ occurrencesStore.typeCounts.street_lighting }}
          </small>
        </button>

        <!-- 3. Pavimentação (Buracos) -->
        <button
          class="figma-filter-pill"
          :class="{ active: occurrencesStore.selectedType === 'pavement_repair' }"
          style="--category-color: #c65d35"
          @click="handlePillClick(() => setTypeFilter('pavement_repair'))"
        >
          <span class="pill-icon-circle">
            <q-icon name="construction" size="15px" />
          </span>
          <span class="pill-text-label">{{ $t('types.pavement_repair') || 'Pavimentação' }}</span>
          <small v-if="occurrencesStore.typeCounts.pavement_repair" class="pill-count-tag">
            {{ occurrencesStore.typeCounts.pavement_repair }}
          </small>
        </button>

        <!-- 4. Alagamento -->
        <button
          class="figma-filter-pill"
          :class="{ active: occurrencesStore.selectedType === 'flood_prone' }"
          style="--category-color: #287f9d"
          @click="handlePillClick(() => setTypeFilter('flood_prone'))"
        >
          <span class="pill-icon-circle">
            <q-icon name="waves" size="15px" />
          </span>
          <span class="pill-text-label">{{ $t('types.flood_prone') || 'Alagamento' }}</span>
          <small v-if="occurrencesStore.typeCounts.flood_prone" class="pill-count-tag">
            {{ occurrencesStore.typeCounts.flood_prone }}
          </small>
        </button>

        <!-- 5. Lixo irregular -->
        <button
          class="figma-filter-pill"
          :class="{ active: occurrencesStore.selectedType === 'waste_dumping' }"
          style="--category-color: #718a35"
          @click="handlePillClick(() => setTypeFilter('waste_dumping'))"
        >
          <span class="pill-icon-circle">
            <q-icon name="delete" size="15px" />
          </span>
          <span class="pill-text-label">{{ $t('types.waste_dumping') || 'Lixo irregular' }}</span>
          <small v-if="occurrencesStore.typeCounts.waste_dumping" class="pill-count-tag">
            {{ occurrencesStore.typeCounts.waste_dumping }}
          </small>
        </button>

        <!-- 6. Rua sem pavimentação -->
        <button
          class="figma-filter-pill"
          :class="{ active: occurrencesStore.selectedType === 'unpaved_street' }"
          style="--category-color: #8C7355"
          @click="handlePillClick(() => setTypeFilter('unpaved_street'))"
        >
          <span class="pill-icon-circle">
            <q-icon name="terrain" size="15px" />
          </span>
          <span class="pill-text-label">{{ $t('types.unpaved_street') || 'Sem pavimentação' }}</span>
          <small v-if="occurrencesStore.typeCounts.unpaved_street" class="pill-count-tag">
            {{ occurrencesStore.typeCounts.unpaved_street }}
          </small>
        </button>

        <!-- 7. District Filter (Figma .district-filter) -->
        <div class="figma-district-filter row items-center no-wrap">
          <q-icon name="place" size="18px" class="district-pin-icon" />
          <q-btn-dropdown
            flat
            dense
            no-caps
            class="district-dropdown-btn"
            :label="currentNeighborhoodLabel"
          >
            <q-list dense class="figma-dropdown-menu">
              <q-item
                clickable
                v-close-popup
                @click="setNeighborhoodFilter('all')"
                :class="{ 'text-weight-bold text-primary active-item': occurrencesStore.selectedNeighborhood === 'all' }"
              >
                <q-item-section>{{ $t('app.allNeighborhoods') || 'Todos os Bairros' }}</q-item-section>
              </q-item>
              <q-separator style="background: #ded9ce" />
              <q-item
                v-for="item in occurrencesStore.neighborhoods"
                :key="item.neighborhood"
                clickable
                v-close-popup
                @click="setNeighborhoodFilter(item.neighborhood)"
                :class="{ 'text-weight-bold text-primary active-item': occurrencesStore.selectedNeighborhood === item.neighborhood }"
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
          <q-icon name="chevron_right" size="20px" style="color: #245c3a" />
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
/* Figma Filterbar (.filterbar) */
.filter-bar-wrapper {
  width: 100%;
  pointer-events: none;
  display: flex;
  justify-content: center;
  background: #fffdf8eb;
  backdrop-filter: blur(14px);
  box-shadow: 0 6px 18px rgba(35, 49, 38, 0.07);
  border-bottom: 1px solid #ded9ced1;
  padding: 8px 16px;
  position: relative;
  z-index: 25;
}

.filter-outer-box {
  pointer-events: auto;
  position: relative;
  width: 100%;
  max-width: 1400px;
  display: flex;
  align-items: center;
}

.filter-scroll-container {
  flex: 1;
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
  background: #fffdf8;
  border: 1px solid #ded9ce;
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
  background: #f0ede7;
  transform: scale(1.1);
}

.scroll-arrow-btn:active {
  transform: scale(0.95);
}

/* Figma Category Filter Pills (.category-filters button) */
.figma-filter-pill {
  color: #4e564f;
  background: #fffefa;
  border: 1px solid #e2ddd2;
  border-radius: 999px;
  flex: none;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 13px 0 7px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Public Sans', sans-serif;
  transition: all 0.17s ease;
  display: inline-flex;
  cursor: pointer;
}

.pill-icon-circle {
  background: rgba(83, 122, 84, 0.12);
  border-radius: 50%;
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--category-color);
  transition: all 0.16s ease;
}

.pill-text-label {
  white-space: nowrap;
}

.pill-count-tag {
  color: #727872;
  background: #f0ede7;
  border-radius: 999px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.figma-filter-pill:hover {
  border-color: var(--category-color);
  transform: translateY(-1px);
}

/* Active State from Figma */
.figma-filter-pill.active {
  border-color: var(--category-color);
  background: var(--category-color);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(36, 92, 58, 0.25);
}

.figma-filter-pill.active .pill-icon-circle {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.24);
}

.figma-filter-pill.active .pill-count-tag {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.24);
}

/* Figma District Filter (.district-filter) */
.figma-district-filter {
  border-left: 1px solid #ded9ce;
  height: 36px;
  color: #245c3a;
  flex: 0 0 auto;
  align-items: center;
  padding-left: 14px;
  margin-left: 8px;
}

.district-pin-icon {
  color: #245c3a;
  margin-right: 2px;
}

.district-dropdown-btn {
  font-family: 'Public Sans', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #1f2923;
  padding: 0 8px;
}

.figma-dropdown-menu {
  background: #fffdf8;
  color: #1f2923;
  border: 1px solid #ded9ce;
  border-radius: 12px;
  box-shadow: 0 10px 24px rgba(35, 49, 38, 0.12);
  min-width: 180px;
}

.active-item {
  background: #e7efe7;
  color: #245c3a !important;
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