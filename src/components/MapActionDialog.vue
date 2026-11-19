<template>
  <q-dialog v-model="isOpen" :position="$q.screen.lt.sm ? 'bottom' : 'standard'">
    <q-card class="map-action-card shadow-10">
      <!-- Drag handle for mobile bottom sheet -->
      <div class="row justify-center q-pt-sm q-pb-xs">
        <div class="drag-handle"></div>
      </div>

      <q-card-section class="q-pt-xs q-pb-md text-left">
        <!-- Title & Reverse Geocoded Subtitle -->
        <div class="action-dialog-title">
          {{ $t('dialog.whatToDo') || 'O que deseja fazer aqui?' }}
        </div>
        <div class="action-dialog-subtitle text-caption row items-center no-wrap">
          <q-icon name="place" size="14px" class="q-mr-xs text-grey-7" />
          <span class="ellipsis">{{ addressLabel || 'Localização selecionada no mapa' }}</span>
        </div>

        <!-- Action Buttons (matching Image 3) -->
        <div class="q-gutter-y-sm q-mt-md">
          <!-- Button 1: Usar como ponto de partida -->
          <q-btn
            outline
            rounded
            unelevated
            class="action-pill-btn btn-green-outline full-width"
            @click="handleSetOrigin"
          >
            <div class="row items-center no-wrap full-width">
              <div class="pill-icon-circle green-outline q-mr-md">
                <q-icon name="radio_button_checked" size="20px" color="primary" />
              </div>
              <span class="text-weight-bold text-body2 pill-label">
                {{ $t('dialog.useAsOrigin') || 'Usar como ponto de partida' }}
              </span>
            </div>
          </q-btn>

          <!-- Button 2: Usar como ponto de chegada -->
          <q-btn
            outline
            rounded
            unelevated
            class="action-pill-btn btn-green-outline full-width"
            @click="handleSetDestination"
          >
            <div class="row items-center no-wrap full-width">
              <div class="pill-icon-circle green-outline q-mr-md">
                <q-icon name="flag" size="20px" color="primary" />
              </div>
              <span class="text-weight-bold text-body2 pill-label">
                {{ $t('dialog.useAsDestination') || 'Usar como ponto de chegada' }}
              </span>
            </div>
          </q-btn>

          <!-- Button 3: Marcar nova ocorrência / Reportar problema urbano -->
          <q-btn
            unelevated
            rounded
            class="action-pill-btn btn-terracotta-fill full-width"
            @click="handleStartReport"
          >
            <div class="row items-center no-wrap full-width">
              <div class="pill-icon-circle white-fill q-mr-md">
                <q-icon name="add_location_alt" size="20px" class="text-terracotta" />
              </div>
              <div class="column items-start text-left">
                <span class="text-weight-bold text-body2 text-white leading-tight">
                  {{ $t('dialog.reportHere') || 'Marcar nova ocorrência' }}
                </span>
                <span class="text-caption text-white-8 leading-tight">
                  {{ $t('dialog.reportSubtitle') || 'Reportar problema urbano' }}
                </span>
              </div>
            </div>
          </q-btn>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useRoutingStore } from '../stores/routing'
import { useAuthStore } from '../stores/auth'
import { useQuasar } from 'quasar'

const emit = defineEmits(['start-report', 'open-auth'])

const routingStore = useRoutingStore()
const authStore = useAuthStore()
const $q = useQuasar()

const isOpen = ref(false)
const selectedCoords = ref(null) // { lat, lng }
const addressLabel = ref('')

async function open(coords) {
  selectedCoords.value = coords
  addressLabel.value = 'Buscando endereço...'
  isOpen.value = true

  // Reverse geocoding via Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
    if (res.ok) {
      const data = await res.json()
      if (data?.address) {
        const addr = data.address
        const road = addr.road || ''
        const suburb = addr.suburb || addr.neighbourhood || addr.city_district || ''
        const city = addr.city || 'Belém'

        const parts = [road ? `Próximo à ${road}` : '', suburb, city].filter(Boolean)
        addressLabel.value = parts.join(', ') || data.display_name?.split(',').slice(0, 3).join(',')
      }
    }
  } catch (err) {
    addressLabel.value = `Coordenadas: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
  }
}

function handleSetOrigin() {
  if (!selectedCoords.value) return
  routingStore.setOrigin(selectedCoords.value.lat, selectedCoords.value.lng, addressLabel.value)
  routingStore.isOpen = true
  isOpen.value = false
  $q.notify({
    type: 'positive',
    message: 'Ponto de partida (A) definido!',
  })
}

function handleSetDestination() {
  if (!selectedCoords.value) return
  routingStore.setDestination(selectedCoords.value.lat, selectedCoords.value.lng, addressLabel.value)
  routingStore.isOpen = true
  isOpen.value = false
  $q.notify({
    type: 'positive',
    message: 'Ponto de chegada (B) definido!',
  })
}

function handleStartReport() {
  isOpen.value = false
  if (!authStore.isAuthenticated) {
    $q.notify({
      type: 'warning',
      message: 'Faça login para registrar uma ocorrência.',
    })
    emit('open-auth')
    return
  }
  emit('start-report', selectedCoords.value)
}

defineExpose({
  open,
})
</script>

<style scoped>
.map-action-card {
  width: 100%;
  max-width: 440px;
  background: rgba(255, 253, 248, 0.98);
  border-radius: 24px;
  padding: 8px 14px 18px 14px;
  border: 1px solid #ded9ce;
  box-shadow: 0 18px 48px rgba(35, 49, 38, 0.16);
  font-family: 'Public Sans', sans-serif;
}

@media (max-width: 600px) {
  .map-action-card {
    border-radius: 24px 24px 0 0;
  }
}

.drag-handle {
  width: 44px;
  height: 4.5px;
  background: #ded9ce;
  border-radius: 4px;
}

.action-dialog-title {
  font-family: 'Public Sans', sans-serif;
  font-size: 1.25rem;
  font-weight: 800;
  color: #1f2923;
  letter-spacing: -0.3px;
  line-height: 1.2;
}

.action-dialog-subtitle {
  color: #677069;
  margin-top: 4px;
  font-weight: 500;
}

.action-pill-btn {
  height: 56px;
  border-radius: 16px;
  padding: 0 16px;
  text-transform: none;
  transition: all 0.2s ease;
}

.btn-green-outline {
  border: 2px solid #245c3a !important;
  background: #ffffff;
}

.btn-green-outline:hover {
  background: #edf3ea;
}

.btn-terracotta-fill {
  background: #c65d35 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(198, 93, 53, 0.35);
}

.btn-terracotta-fill:hover {
  background: #ab4e2a !important;
}

.pill-icon-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pill-icon-circle.green-outline {
  background: #edf3ea;
}

.pill-icon-circle.white-fill {
  background: #ffffff;
}

.text-terracotta {
  color: #c65d35 !important;
}

.pill-label {
  color: #245c3a;
  font-family: 'Public Sans', sans-serif;
}

.text-white-8 {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.76rem;
}
</style>
