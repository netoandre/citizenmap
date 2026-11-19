<template>
  <header class="navbar-wrapper">
    <!-- Desktop & Tablet Layout (>= 680px) -->
    <div class="desktop-nav-row row items-center no-wrap justify-between q-px-lg full-width gt-xs">
      <!-- 1. Logo & Brand (Mantendo a logo atual conforme solicitado) -->
      <div class="row items-center no-wrap brand-area">
        <AppLogo :icon-size="38" @click="$emit('reset-view')" class="cursor-pointer" />
      </div>

      <!-- 2. Search Bar (Figma .search-box style) -->
      <div class="search-container col-grow q-mx-lg">
        <div class="figma-search-box row items-center no-wrap">
          <q-icon name="search" size="19px" class="search-icon" />
          <input
            v-model="occurrencesStore.searchQuery"
            type="text"
            placeholder="Buscar por ocorrência, endereço ou bairro..."
            class="search-native-input"
          />
          <button
            v-if="occurrencesStore.searchQuery"
            class="clear-btn"
            @click="occurrencesStore.searchQuery = ''"
            aria-label="Limpar busca"
          >
            <q-icon name="close" size="16px" />
          </button>
        </div>
      </div>

      <!-- 3. Desktop Navigation (Figma .desktop-nav style) -->
      <nav class="desktop-nav row items-center no-wrap q-gutter-x-sm">
        <!-- Rotas Button -->
        <button
          class="nav-action-btn"
          :class="{ active: routingStore.isOpen }"
          @click="routingStore.isOpen = !routingStore.isOpen"
        >
          <q-icon name="alt_route" size="18px" />
          <span>Rotas</span>
          <span v-if="routingStore.hasConflicts" class="nav-alert-dot"></span>
        </button>

        <!-- Notification Bell / Analytics -->
        <button
          class="nav-action-btn icon-only"
          @click="$emit('open-analytics')"
          aria-label="Avisos e Painel Analítico"
        >
          <q-icon name="notifications" size="20px" />
          <span class="notification-dot"></span>
          <q-tooltip>{{ $t('app.analytics') || 'Painel Analítico' }}</q-tooltip>
        </button>

        <!-- Density / Buffer Radar Toggle -->
        <button
          class="nav-action-btn icon-only"
          :class="{ active: occurrencesStore.showBufferRadius }"
          @click="occurrencesStore.showBufferRadius = !occurrencesStore.showBufferRadius"
          aria-label="Buffers de Risco"
        >
          <q-icon name="radar" size="19px" />
          <q-tooltip>{{ $t('app.density') || 'Buffers de Risco' }}</q-tooltip>
        </button>

        <!-- Language Selector (PT / EN) -->
        <div class="lang-dropdown-wrapper">
          <button class="nav-action-btn lang-toggle-btn">
            <span>{{ currentLocale.toUpperCase() }}</span>
            <q-icon name="expand_more" size="16px" class="q-ml-xs" />
            <q-menu auto-close>
              <q-list dense style="min-width: 120px" class="figma-menu-list">
                <q-item clickable @click="setLocale('pt')">
                  <q-item-section>🇧🇷 Português</q-item-section>
                </q-item>
                <q-item clickable @click="setLocale('en')">
                  <q-item-section>🇺🇸 English</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </button>
        </div>

        <!-- Profile Button (Figma .profile-button) -->
        <button class="profile-button row items-center no-wrap" @click="$emit('open-auth')">
          <span class="profile-avatar">{{ authStore.isAuthenticated ? (authStore.userName.charAt(0).toUpperCase() || 'U') : 'C' }}</span>
          <div class="column items-start text-left q-ml-xs">
            <strong>{{ authStore.isAuthenticated ? (authStore.userName.split(' ')[0]) : 'Cidadão' }}</strong>
            <small>{{ authStore.isAuthenticated ? 'Belém / Conectado' : 'Entrar' }}</small>
          </div>
          <q-icon name="expand_more" size="16px" class="q-ml-xs text-muted" />
        </button>
      </nav>
    </div>

    <!-- Mobile Layout (< 680px): 2 clean rows that never break or wrap -->
    <div class="mobile-nav-box lt-sm q-px-sm q-py-xs full-width">
      <!-- Top Row: Logo (left) + Actions (right) -->
      <div class="row items-center justify-between no-wrap full-width q-mb-xs">
        <AppLogo :icon-size="32" @click="$emit('reset-view')" />

        <div class="row items-center no-wrap q-gutter-x-xs">
          <!-- Notification Bell -->
          <button
            class="nav-action-btn icon-only mobile"
            @click="$emit('open-analytics')"
          >
            <q-icon name="notifications" size="19px" />
            <span class="notification-dot mobile"></span>
          </button>

          <!-- Radar Toggle -->
          <button
            class="nav-action-btn icon-only mobile"
            :class="{ active: occurrencesStore.showBufferRadius }"
            @click="occurrencesStore.showBufferRadius = !occurrencesStore.showBufferRadius"
          >
            <q-icon name="radar" size="18px" />
          </button>

          <!-- Language Selector -->
          <button class="nav-action-btn mobile lang-toggle-btn">
            <span>{{ currentLocale.toUpperCase() }}</span>
            <q-menu auto-close>
              <q-list dense style="min-width: 100px" class="figma-menu-list">
                <q-item clickable @click="setLocale('pt')">
                  <q-item-section>🇧🇷 PT</q-item-section>
                </q-item>
                <q-item clickable @click="setLocale('en')">
                  <q-item-section>🇺🇸 EN</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </button>

          <!-- Mobile Profile Avatar -->
          <button class="mobile-profile-btn" @click="$emit('open-auth')">
            {{ authStore.isAuthenticated ? (authStore.userName.charAt(0).toUpperCase() || 'U') : 'C' }}
          </button>
        </div>
      </div>

      <!-- Bottom Row: 100% Full-Width Search Input -->
      <div class="full-width q-px-xs">
        <div class="figma-search-box mobile row items-center no-wrap full-width">
          <q-icon name="search" size="17px" class="search-icon" />
          <input
            v-model="occurrencesStore.searchQuery"
            type="text"
            placeholder="Buscar por ocorrência, endereço ou bairro..."
            class="search-native-input"
          />
          <button
            v-if="occurrencesStore.searchQuery"
            class="clear-btn"
            @click="occurrencesStore.searchQuery = ''"
            aria-label="Limpar busca"
          >
            <q-icon name="close" size="15px" />
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOccurrencesStore } from '../stores/occurrences'
import { useRoutingStore } from '../stores/routing'
import { useAuthStore } from '../stores/auth'
import AppLogo from './AppLogo.vue'

defineEmits(['open-analytics', 'reset-view', 'open-auth'])

const { locale } = useI18n()
const occurrencesStore = useOccurrencesStore()
const routingStore = useRoutingStore()
const authStore = useAuthStore()

const currentLocale = computed(() => locale.value)

function setLocale(lang) {
  locale.value = lang
  localStorage.setItem('citizenmap_locale', lang)
}
</script>

<style scoped>
/* Figma Topbar Styles (.topbar) */
.navbar-wrapper {
  width: 100%;
  background: #fffdf8f5;
  border-bottom: 1px solid #ded9ced1;
  box-shadow: 0 4px 18px rgba(35, 49, 38, 0.04);
  font-family: 'Public Sans', sans-serif;
  pointer-events: auto;
  position: relative;
  z-index: 30;
}

.desktop-nav-row {
  max-width: 1400px;
  margin: 0 auto;
  height: 68px;
}

/* Figma Search Box (.search-box) */
.figma-search-box {
  background: #f5f2eb;
  border: 1px solid #ded9ce;
  border-radius: 14px;
  height: 44px;
  padding: 0 14px;
  width: 100%;
  max-width: 520px;
  transition: all 0.18s ease;
}

.figma-search-box:focus-within {
  background: #ffffff;
  border-color: #7ba28a;
  box-shadow: 0 0 0 4px rgba(36, 92, 58, 0.08);
}

.figma-search-box.mobile {
  height: 38px;
  border-radius: 12px;
  max-width: 100%;
}

.search-icon {
  color: #747a75;
  margin-right: 8px;
  flex-shrink: 0;
}

.search-native-input {
  border: none;
  background: transparent;
  outline: none;
  flex: 1;
  min-width: 0;
  font-family: 'Public Sans', sans-serif;
  font-size: 13.5px;
  color: #1f2923;
}

.search-native-input::placeholder {
  color: #747a75;
}

.clear-btn {
  background: transparent;
  border: none;
  color: #677069;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn:hover {
  color: #1f2923;
}

/* Figma Desktop Nav Buttons (.desktop-nav > button) */
.nav-action-btn {
  background: transparent;
  border: none;
  color: #4c574f;
  border-radius: 12px;
  min-height: 40px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Public Sans', sans-serif;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  position: relative;
  transition: all 0.16s ease;
}

.nav-action-btn:hover,
.nav-action-btn.active {
  background: #e7efe7; /* --green-100 */
  color: #245c3a; /* --green-800 */
}

.nav-action-btn.icon-only {
  width: 40px;
  height: 40px;
  padding: 0;
  justify-content: center;
}

.nav-action-btn.mobile {
  min-height: 32px;
  height: 32px;
  padding: 0 8px;
  font-size: 11px;
  border-radius: 8px;
}

.nav-action-btn.icon-only.mobile {
  width: 32px;
  height: 32px;
}

.notification-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #c65d35; /* Terracotta */
  border: 2px solid #fffdf8;
  position: absolute;
  top: 7px;
  right: 8px;
}

.notification-dot.mobile {
  top: 4px;
  right: 5px;
}

.nav-alert-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #c65d35;
  border: 1.5px solid #fff;
}

/* Figma Profile Button (.profile-button) */
.profile-button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 3px 6px 3px 4px;
  border-radius: 12px;
  transition: background 0.16s ease;
  font-family: 'Public Sans', sans-serif;
}

.profile-button:hover {
  background: #f0ede7;
}

.profile-avatar {
  background: #245c3a; /* --green-800 */
  color: #ffffff;
  border-radius: 50%;
  width: 34px;
  height: 34px;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-profile-btn {
  background: #245c3a;
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.profile-button strong {
  color: #1f2923;
  font-size: 12.5px;
  line-height: 1.1;
}

.profile-button small {
  color: #677069;
  font-size: 10px;
  font-weight: 400;
}

.text-muted {
  color: #677069;
}

.figma-menu-list {
  background: #fffdf8;
  color: #1f2923;
  border: 1px solid #ded9ce;
  border-radius: 12px;
  box-shadow: 0 10px 24px rgba(35, 49, 38, 0.12);
}
</style>
