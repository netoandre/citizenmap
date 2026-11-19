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
          <q-icon name="map" size="21px" />
          <span class="nav-item-label">{{ $t('bottomNav.explore') || 'Explorar' }}</span>
        </button>

        <!-- 2. Rotas -->
        <button
          class="nav-item-btn column items-center justify-center"
          :class="{ active: routingStore.isOpen }"
          @click="handleTab('routes')"
        >
          <q-icon name="alt_route" size="21px" />
          <span class="nav-item-label">{{ $t('bottomNav.routes') || 'Rotas' }}</span>
          <span v-if="routingStore.hasConflicts" class="nav-badge-dot"></span>
        </button>

        <!-- 3. Elevated Figma Center '+' Report Button (.mobile-report) -->
        <div class="center-fab-wrapper">
          <button
            class="center-fab-btn column items-center justify-center shadow-4"
            @click="handleTab('quick-add')"
            aria-label="Reportar ocorrência"
          >
            <q-icon name="add" size="28px" color="white" />
          </button>
        </div>

        <!-- 4. Avisos / Painel Analítico -->
        <button
          class="nav-item-btn column items-center justify-center"
          :class="{ active: activeTab === 'analytics' }"
          @click="handleTab('analytics')"
        >
          <q-icon name="notifications" size="21px" />
          <span class="nav-item-label">{{ $t('bottomNav.analytics') || 'Avisos' }}</span>
        </button>

        <!-- 5. Perfil / Login -->
        <button
          class="nav-item-btn column items-center justify-center"
          :class="{ active: activeTab === 'profile' }"
          @click="handleTab('profile')"
        >
          <q-icon :name="authStore.isAuthenticated ? 'account_circle' : 'person'" size="21px" />
          <span class="nav-item-label">{{ authStore.isAuthenticated ? (authStore.userName.split(' ')[0] || 'Perfil') : 'Perfil' }}</span>
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
  } else if (tab === 'quick-add') {
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
/* Figma Mobile Bottom Navigation (.mobile-bottom-nav) */
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
  background: #fffdf8; /* --surface */
  border-top: 1px solid #ded9ce; /* --line */
  border-radius: 20px 20px 0 0;
  min-height: 64px;
  position: relative;
  box-shadow: 0 -4px 20px rgba(30, 45, 34, 0.08);
  padding: 4px 10px env(safe-area-inset-bottom, 4px) 10px;
}

.bottom-nav-inner {
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}

.nav-item-btn {
  background: transparent;
  border: none;
  color: #798079;
  cursor: pointer;
  padding: 4px 2px;
  border-radius: 12px;
  transition: all 0.17s ease;
  position: relative;
  flex: 1 1 0;
  max-width: 68px;
  min-width: 0;
}

.nav-item-btn:hover {
  color: #245c3a;
}

.nav-item-btn.active {
  color: #245c3a; /* --green-800 */
}

.nav-item-label {
  font-family: 'Public Sans', sans-serif;
  font-size: 0.68rem;
  font-weight: 600;
  margin-top: 2px;
  letter-spacing: -0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  text-align: center;
}

/* Figma Elevated Center '+' Button (.mobile-report > span) */
.center-fab-wrapper {
  position: relative;
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -24px;
  flex: 0 0 54px;
}

.center-fab-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #245c3a; /* --green-800 */
  border: 5px solid #fffdf8; /* 5px solid var(--surface) */
  color: white;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.2s ease;
  box-shadow: 0 6px 14px rgba(27, 75, 46, 0.35);
}

.center-fab-btn:hover {
  transform: scale(1.08) translateY(-2px);
  background: #173d29; /* --green-900 */
}

.center-fab-btn:active {
  transform: scale(0.95);
}

.nav-badge-dot {
  position: absolute;
  top: 4px;
  right: 14px;
  width: 7.5px;
  height: 7.5px;
  border-radius: 50%;
  background: #c65d35;
  border: 1.5px solid #fffdf8;
}
</style>