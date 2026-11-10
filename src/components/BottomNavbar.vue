<template>
  <div class="bottom-nav-wrapper">
    <div class="bottom-nav-card shadow-12">
      <div class="bottom-nav-inner row items-center justify-around no-wrap">
        <!-- 1. Explorar -->
        <button
          class="nav-item-btn column items-center justify-center"
          :class="{ active: activeTab === 'explore' }"
          @click="handleTab('explore')"
        >
          <q-icon name="map" size="22px" />
          <span class="nav-item-label">{{ $t('bottomNav.explore') || 'Explorar' }}</span>
        </button>

        <!-- 2. Reportar / Cadastro -->
        <button
          class="nav-item-btn column items-center justify-center"
          :class="{ active: activeTab === 'report' }"
          @click="handleTab('report')"
        >
          <q-icon name="add_box" size="22px" />
          <span class="nav-item-label">{{ $t('bottomNav.report') || 'Reportar' }}</span>
        </button>

        <!-- 3. Elevated Terracotta Center '+' Button -->
        <div class="center-fab-wrapper">
          <button
            class="center-fab-btn shadow-6 column items-center justify-center"
            @click="handleTab('quick-add')"
          >
            <q-icon name="add" size="28px" color="white" />
          </button>
        </div>

        <!-- 4. Rotas -->
        <button
          class="nav-item-btn column items-center justify-center"
          :class="{ active: routingStore.isOpen }"
          @click="handleTab('routes')"
        >
          <q-icon name="alt_route" size="22px" />
          <span class="nav-item-label">{{ $t('bottomNav.routes') || 'Rotas' }}</span>
          <span v-if="routingStore.hasConflicts" class="nav-badge-dot"></span>
        </button>

        <!-- 5. Painel Analítico -->
        <button
          class="nav-item-btn column items-center justify-center"
          :class="{ active: activeTab === 'analytics' }"
          @click="handleTab('analytics')"
        >
          <q-icon name="insights" size="22px" />
          <span class="nav-item-label">{{ $t('bottomNav.analytics') || 'Painel' }}</span>
        </button>

        <!-- 6. Perfil / Login -->
        <button
          class="nav-item-btn column items-center justify-center"
          :class="{ active: activeTab === 'profile' }"
          @click="handleTab('profile')"
        >
          <q-icon :name="authStore.isAuthenticated ? 'account_circle' : 'login'" size="22px" />
          <span class="nav-item-label">{{ authStore.isAuthenticated ? (authStore.userName.split(' ')[0] || 'Perfil') : 'Entrar' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoutingStore } from '../stores/routing'
import { useAuthStore } from '../stores/auth'

const emit = defineEmits(['open-report', 'open-analytics', 'open-auth', 'reset-view', 'toggle-routes'])

const routingStore = useRoutingStore()
const authStore = useAuthStore()
const activeTab = ref('explore')

function handleTab(tab) {
  activeTab.value = tab
  if (tab === 'explore') {
    routingStore.isOpen = false
    emit('reset-view')
  } else if (tab === 'report' || tab === 'quick-add') {
    emit('open-report')
  } else if (tab === 'routes') {
    emit('toggle-routes')
  } else if (tab === 'analytics') {
    emit('open-analytics')
  } else if (tab === 'profile') {
    emit('open-auth')
  }
}
</script>

<style scoped>
.bottom-nav-wrapper {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 1000;
  pointer-events: none;
  display: flex;
  justify-content: center;
}

.bottom-nav-card {
  pointer-events: auto;
  width: 100%;
  max-width: 100%;
  background: #2D5A27; /* Verde Floresta */
  border-top: 1.5px solid rgba(255, 255, 255, 0.22);
  border-radius: 20px 20px 0 0;
  min-height: 60px;
  position: relative;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.28);
  padding: 2px 8px env(safe-area-inset-bottom, 2px) 8px;
}

.bottom-nav-inner {
  max-width: 680px;
  width: 100%;
  margin: 0 auto;
  height: 56px;
}

.nav-item-btn {
  background: transparent;
  border: none;
  color: #D5DFCC;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 12px;
  transition: all 0.2s ease;
  position: relative;
  min-width: 48px;
  flex: 1;
}

.nav-item-btn:hover {
  color: #FFFFFF;
}

.nav-item-btn.active {
  color: #FFFFFF;
}

.nav-item-label {
  font-family: 'Public Sans', sans-serif;
  font-size: 0.68rem;
  font-weight: 600;
  margin-top: 2px;
  letter-spacing: -0.2px;
  white-space: nowrap;
}

.center-fab-wrapper {
  position: relative;
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -22px;
  flex-shrink: 0;
}

.center-fab-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #C05C33; /* Terracota */
  border: 3.5px solid #2D5A27;
  color: white;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.2s ease;
  box-shadow: 0 4px 14px rgba(192, 92, 51, 0.55);
}

.center-fab-btn:hover {
  transform: scale(1.1) translateY(-2px);
  background: #D4693D;
}

.center-fab-btn:active {
  transform: scale(0.95);
}

.nav-badge-dot {
  position: absolute;
  top: 4px;
  right: 12px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #C05C33;
  border: 1.5px solid #2D5A27;
}
</style>
