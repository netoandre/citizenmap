<template>
  <q-dialog v-model="isOpen" persistent class="new-occurrence-dialog">
    <q-card class="new-occurrence-card shadow-10" style="min-width: 340px; max-width: 520px; width: 100%">
      <!-- Header -->
      <q-card-section class="row items-center justify-between q-pb-none">
        <div class="row items-center no-wrap">
          <q-avatar size="38px" class="q-mr-sm" style="background-color: #2D5A27; color: #ffffff">
            <q-icon name="add_location_alt" size="22px" />
          </q-avatar>
          <div>
            <div class="text-subtitle1 text-weight-bolder" style="color: #3B2314">{{ $t('newOccurrence.title') }}</div>
            <div class="text-caption" style="color: #8C7355">{{ $t('newOccurrence.subtitle') }}</div>
          </div>
        </div>
        <q-btn flat round dense icon="close" size="sm" style="color: #3B2314" v-close-popup />
      </q-card-section>

      <!-- Form Section -->
      <q-card-section class="q-pt-md scroll" style="max-height: 72vh">
        <q-form @submit.prevent="handleSubmit" class="q-gutter-y-sm">
          <!-- Occurrence Type Selector -->
          <div>
            <div class="text-caption text-weight-bold q-mb-xs" style="color: #3B2314">
              {{ $t('newOccurrence.typeLabel') }} *
            </div>
            <div class="row q-col-gutter-xs">
              <div v-for="t in occurrenceTypes" :key="t.value" class="col-6">
                <q-card
                  flat
                  clickable
                  v-ripple
                  class="cursor-pointer type-selector-card text-center q-pa-xs transition-all"
                  :class="{ 'selected-type-card': form.type === t.value }"
                  :style="form.type === t.value ? { borderColor: t.color, backgroundColor: '#FAF4EF' } : {}"
                  @click="form.type = t.value"
                >
                  <q-icon :name="t.icon" size="20px" :style="{ color: t.color }" class="q-mb-xs" />
                  <div class="text-caption text-weight-bold leading-tight" :style="{ color: form.type === t.value ? t.color : '#3B2314' }">
                    {{ $t(`types.${t.value}`) }}
                  </div>
                </q-card>
              </div>
            </div>
          </div>

          <!-- Title -->
          <q-input
            v-model="form.title"
            dense
            outlined
            bg-color="white"
            :label="$t('newOccurrence.titleLabel') + ' *'"
            :rules="[val => !!val || 'Campo obrigatório']"
            hide-bottom-space
          />

          <!-- Neighborhood & Severity -->
          <div class="row q-col-gutter-sm">
            <div class="col-7">
              <q-select
                v-model="form.neighborhood"
                :options="filteredNeighborhoodOptions"
                dense
                outlined
                bg-color="white"
                use-input
                fill-input
                hide-selected
                new-value-mode="add-unique"
                :loading="geocodingLoading"
                :label="$t('newOccurrence.neighborhoodLabel') + ' *'"
                :rules="[val => !!val || 'Informe o bairro']"
                hide-bottom-space
                @filter="filterNeighborhoodFn"
              >
                <template #prepend>
                  <q-icon name="apartment" size="18px" style="color: #2D5A27" />
                </template>
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      Pressione Enter para adicionar este novo bairro
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
            <div class="col-5">
              <q-select
                v-model="form.severity"
                :options="severityOptions"
                emit-value
                map-options
                dense
                outlined
                bg-color="white"
                :label="$t('newOccurrence.severityLabel')"
                hide-bottom-space
              />
            </div>
          </div>

          <!-- Auto-detected Geocoding Badge -->
          <div v-if="autoDetected" class="text-caption row items-center q-my-xs" style="color: #2D5A27">
            <q-icon name="auto_awesome" size="14px" class="q-mr-xs" />
            <span class="text-weight-bold">Bairro e endereço identificados pelo mapa</span>
          </div>

          <!-- Address -->
          <q-input
            v-model="form.address"
            dense
            outlined
            bg-color="white"
            :label="$t('newOccurrence.addressLabel')"
            hide-bottom-space
          >
            <template #prepend>
              <q-icon name="place" size="18px" style="color: #8C7355" />
            </template>
          </q-input>

          <!-- Description -->
          <q-input
            v-model="form.description"
            type="textarea"
            dense
            outlined
            bg-color="white"
            rows="2"
            :label="$t('newOccurrence.descLabel')"
            hide-bottom-space
          />

          <!-- Photo URL -->
          <q-input
            v-model="form.photo_url"
            dense
            outlined
            bg-color="white"
            :label="$t('newOccurrence.photoUrlLabel')"
            placeholder="https://..."
            hide-bottom-space
          >
            <template #prepend>
              <q-icon name="add_photo_alternate" size="18px" style="color: #8C7355" />
            </template>
          </q-input>

          <!-- Coordinates Pinpoint Banner -->
          <div class="coordinates-banner q-pa-xs rounded-borders row items-center justify-between text-caption">
            <div class="row items-center no-wrap">
              <q-icon name="gps_fixed" size="16px" class="q-mr-xs" style="color: #2D5A27" />
              <span class="text-weight-medium" style="color: #3B2314">{{ form.latitude.toFixed(5) }}, {{ form.longitude.toFixed(5) }}</span>
            </div>
            <q-btn
              flat
              dense
              size="xs"
              style="color: #2D5A27; font-weight: 700"
              :label="$t('newOccurrence.useCurrentLocation')"
              @click="fetchCurrentCoords"
            />
          </div>

          <!-- Actions -->
          <div class="row items-center justify-end q-gutter-x-sm q-pt-sm">
            <q-btn flat :label="$t('newOccurrence.cancel')" style="color: #8C7355" v-close-popup />
            <q-btn
              unelevated
              rounded
              :label="$t('newOccurrence.submit')"
              type="submit"
              :loading="loading"
              class="text-weight-bold q-px-lg text-white"
              style="background-color: #C05C33 !important"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useOccurrencesStore } from '../stores/occurrences'
import { useAuthStore } from '../stores/auth'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'

const props = defineEmits(['occurrence-created'])

const occurrencesStore = useOccurrencesStore()
const authStore = useAuthStore()
const { t } = useI18n()
const $q = useQuasar()

const isOpen = ref(false)
const loading = ref(false)
const geocodingLoading = ref(false)
const autoDetected = ref(false)

const form = reactive({
  type: 'flood_prone',
  title: '',
  description: '',
  neighborhood: '',
  address: '',
  latitude: -1.4558,
  longitude: -48.4902,
  severity: 'high',
  photo_url: '',
})

const occurrenceTypes = [
  { value: 'pavement_repair', icon: 'construction', color: '#C05C33' },
  { value: 'flood_prone', icon: 'water_drop', color: '#428CA7' },
  { value: 'waste_dumping', icon: 'delete', color: '#889E58' },
  { value: 'street_lighting', icon: 'lightbulb', color: '#E5A93C' },
  { value: 'unpaved_street', icon: 'terrain', color: '#8C7355' },
]

const severityOptions = computed(() => [
  { label: t('severity.low'), value: 'low' },
  { label: t('severity.medium'), value: 'medium' },
  { label: t('severity.high'), value: 'high' },
  { label: t('severity.critical'), value: 'critical' },
])

const allNeighborhoods = computed(() => {
  return occurrencesStore.neighborhoods.map((n) => n.neighborhood)
})

const filteredNeighborhoodOptions = ref([])

function filterNeighborhoodFn(val, update) {
  update(() => {
    if (!val) {
      filteredNeighborhoodOptions.value = allNeighborhoods.value
    } else {
      const needle = val.toLowerCase()
      filteredNeighborhoodOptions.value = allNeighborhoods.value.filter(
        (v) => v.toLowerCase().indexOf(needle) > -1
      )
    }
  })
}

async function reverseGeocode(lat, lng) {
  geocodingLoading.value = true
  autoDetected.value = false
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.address) {
        const addr = data.address
        const detectedNeighborhood = addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter || ''
        const streetParts = [addr.road, addr.house_number].filter(Boolean)
        const detectedStreet = streetParts.join(', ')

        if (detectedNeighborhood) {
          form.neighborhood = detectedNeighborhood
        }
        if (detectedStreet) {
          form.address = detectedStreet
        }
        autoDetected.value = !!(detectedNeighborhood || detectedStreet)
      }
    }
  } catch (err) {
    console.info('Reverse geocoding unavailable, fallback to manual entry.')
  } finally {
    geocodingLoading.value = false
  }
}

function open(coords = null) {
  autoDetected.value = false
  filteredNeighborhoodOptions.value = allNeighborhoods.value

  if (coords) {
    form.latitude = coords.lat
    form.longitude = coords.lng
    reverseGeocode(coords.lat, coords.lng)
  } else {
    // If no neighborhood selected yet, pick first available
    if (!form.neighborhood && allNeighborhoods.value.length > 0) {
      form.neighborhood = allNeighborhoods.value[0]
    }
  }
  isOpen.value = true
}

function fetchCurrentCoords() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      form.latitude = pos.coords.latitude
      form.longitude = pos.coords.longitude
      reverseGeocode(pos.coords.latitude, pos.coords.longitude)
      $q.notify({ type: 'info', message: 'Coordenadas atualizadas pelo GPS!' })
    })
  }
}

async function handleSubmit() {
  if (!authStore.isAuthenticated) {
    $q.notify({
      type: 'warning',
      message: t('occurrence.mustLoginToReport'),
    })
    return
  }

  loading.value = true
  try {
    const newOcc = await occurrencesStore.createOccurrence({ ...form })
    $q.notify({
      type: 'positive',
      message: t('newOccurrence.success'),
    })
    isOpen.value = false
    props('occurrence-created', newOcc)
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Falha ao registrar ocorrência.',
    })
  } finally {
    loading.value = false
  }
}

defineExpose({
  open,
})
</script>

<style scoped>
.new-occurrence-card {
  border-radius: 24px;
  background-color: #F7F2EE;
  border: 1px solid #D9C5B2;
  font-family: 'Public Sans', sans-serif;
  color: #3B2314;
}

@media (max-width: 600px) {
  .new-occurrence-dialog :deep(.q-dialog__inner) {
    padding: 12px;
    padding-bottom: 76px;
  }
}

.type-selector-card {
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #D9C5B2;
  transition: all 0.2s ease;
}

.type-selector-card:hover {
  background: #FAF4EF;
  border-color: #8C7355;
}

.selected-type-card {
  box-shadow: 0 2px 8px rgba(45, 90, 39, 0.18);
  font-weight: 700;
}

.coordinates-banner {
  border: 1px dashed #D9C5B2;
  background-color: #EFE7DE;
}
</style>
