<template>
  <header class="navbar-wrapper shadow-3">
    <!-- Desktop & Tablet Layout (>= 680px) -->
    <div class="desktop-nav-row row items-center no-wrap justify-between q-px-md q-py-xs full-width gt-xs">
      <!-- 1. Logo & Brand -->
      <div class="row items-center no-wrap">
        <AppLogo :icon-size="36" @click="$emit('reset-view')" class="q-mr-sm" />
      </div>

      <!-- 2. Search Bar (Expands in center) -->
      <div class="search-container col-grow q-mx-md">
        <q-input
          v-model="occurrencesStore.searchQuery"
          dense
          outlined
          rounded
          clearable
          placeholder="Buscar por ocorrência, endereço ou bairro..."
          class="search-pill-input"
        >
          <template #prepend>
            <q-icon name="search" size="18px" class="text-brown-7" />
          </template>
        </q-input>
      </div>

      <!-- 3. Actions Row -->
      <div class="row items-center no-wrap q-gutter-x-xs">
        <!-- Notification Bell / Analytics -->
        <q-btn
          flat
          round
          dense
          class="bell-btn q-mr-xs"
          @click="$emit('open-analytics')"
        >
          <q-icon name="notifications" size="22px" style="color: #3B2314" />
          <span class="bell-badge-dot"></span>
          <q-tooltip>{{ $t('app.analytics') }}</q-tooltip>
        </q-btn>

        <!-- Density / Buffer Radar Toggle -->
        <q-btn
          flat
          round
          dense
          :color="occurrencesStore.showBufferRadius ? 'primary' : 'grey-8'"
          icon="radar"
          size="sm"
          class="q-mr-xs"
          @click="occurrencesStore.showBufferRadius = !occurrencesStore.showBufferRadius"
        >
          <q-tooltip>{{ $t('app.density') }}</q-tooltip>
        </q-btn>

        <!-- Language Selector (PT / EN) -->
        <q-btn flat dense rounded class="lang-btn text-weight-bold text-caption">
          <span>{{ currentLocale.toUpperCase() }}</span>
          <q-menu auto-close>
            <q-list dense style="min-width: 110px" class="bg-light text-dark">
              <q-item clickable @click="setLocale('pt')">
                <q-item-section>🇧🇷 Português</q-item-section>
              </q-item>
              <q-item clickable @click="setLocale('en')">
                <q-item-section>🇺🇸 English</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </div>

    <!-- Mobile Layout (< 680px): 2 clean rows that never break or wrap -->
    <div class="mobile-nav-box lt-sm q-px-sm q-py-xs full-width">
      <!-- Top Row: Logo (left) + Actions (right) -->
      <div class="row items-center justify-between no-wrap full-width q-mb-xs">
        <AppLogo :icon-size="32" @click="$emit('reset-view')" />

        <div class="row items-center no-wrap q-gutter-x-xs">
          <!-- Notification Bell -->
          <q-btn
            flat
            round
            dense
            size="sm"
            class="bell-btn"
            @click="$emit('open-analytics')"
          >
            <q-icon name="notifications" size="20px" style="color: #3B2314" />
            <span class="bell-badge-dot mobile"></span>
          </q-btn>

          <!-- Radar Toggle -->
          <q-btn
            flat
            round
            dense
            size="sm"
            :color="occurrencesStore.showBufferRadius ? 'primary' : 'grey-8'"
            icon="radar"
            @click="occurrencesStore.showBufferRadius = !occurrencesStore.showBufferRadius"
          />

          <!-- Language Selector -->
          <q-btn flat dense rounded class="lang-btn text-weight-bold text-caption mobile">
            <span>{{ currentLocale.toUpperCase() }}</span>
            <q-menu auto-close>
              <q-list dense style="min-width: 100px" class="bg-light text-dark">
                <q-item clickable @click="setLocale('pt')">
                  <q-item-section>🇧🇷 PT</q-item-section>
                </q-item>
                <q-item clickable @click="setLocale('en')">
                  <q-item-section>🇺🇸 EN</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>

      <!-- Bottom Row: 100% Full-Width Search Input -->
      <div class="full-width q-px-xs">
        <q-input
          v-model="occurrencesStore.searchQuery"
          dense
          outlined
          rounded
          clearable
          placeholder="Buscar por ocorrência, endereço ou bairro..."
          class="search-pill-input full-width"
        >
          <template #prepend>
            <q-icon name="search" size="18px" class="text-brown-7" />
          </template>
        </q-input>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOccurrencesStore } from '../stores/occurrences'
import AppLogo from './AppLogo.vue'

defineEmits(['open-analytics', 'reset-view'])

const { locale } = useI18n()
const occurrencesStore = useOccurrencesStore()

const currentLocale = computed(() => locale.value)

function setLocale(lang) {
  locale.value = lang
  localStorage.setItem('citizenmap_locale', lang)
}
</script>

<style scoped>
.navbar-wrapper {
  width: 100%;
  background: rgba(247, 242, 238, 0.97); /* Bege Claro */
  backdrop-filter: blur(14px);
  border-bottom: 1px solid #D9C5B2;
  font-family: 'Public Sans', sans-serif;
  pointer-events: auto;
}

.desktop-nav-row {
  max-width: 1200px;
  margin: 0 auto;
  min-height: 52px;
}

.bell-btn {
  position: relative;
}

.bell-badge-dot {
  position: absolute;
  top: 5px;
  right: 6px;
  width: 7.5px;
  height: 7.5px;
  border-radius: 50%;
  background: #C05C33; /* Terracota */
  border: 1.5px solid #F7F2EE;
}

.bell-badge-dot.mobile {
  top: 3px;
  right: 4px;
  width: 6.5px;
  height: 6.5px;
}

.search-container {
  max-width: 480px;
}

.search-pill-input :deep(.q-field__control) {
  background: #FFFFFF;
  border-radius: 20px;
  border: 1px solid #D9C5B2;
  height: 38px;
  font-family: 'Public Sans', sans-serif;
  font-size: 0.88rem;
  padding: 0 12px;
  transition: all 0.2s ease;
}

.search-pill-input :deep(.q-field__control:hover),
.search-pill-input :deep(.q-field__control:focus-within) {
  border-color: #2D5A27;
  box-shadow: 0 0 0 2px rgba(45, 90, 39, 0.12);
}

.search-pill-input :deep(.q-field__native) {
  color: #3B2314;
}

.search-pill-input :deep(.q-field__native::placeholder) {
  color: #8C7D73;
}

.text-brown-7 {
  color: #665B53 !important;
}

.lang-btn {
  font-family: 'Public Sans', sans-serif;
  font-weight: 700;
  border: 1px solid #D9C5B2;
  background: #F5EBE6;
  color: #3B2314;
  border-radius: 14px;
  padding: 2px 8px;
  height: 30px;
}

.lang-btn.mobile {
  height: 26px;
  padding: 1px 6px;
  font-size: 0.72rem;
}
</style>
