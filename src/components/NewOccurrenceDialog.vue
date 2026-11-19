<template>
  <q-dialog v-model="isOpen" persistent class="new-occurrence-dialog">
    <q-card class="new-occurrence-card shadow-12">
      <!-- 1. Header with Stepper Progress (Image 3 from Figma) -->
      <div class="stepper-header q-pa-md border-bottom">
        <div class="row items-center justify-between no-wrap q-mb-xs">
          <div>
            <span class="stepper-eyebrow">NOVA OCORRÊNCIA</span>
            <h2 class="stepper-title q-ma-none">
              <span v-if="currentStep === 1">O que você encontrou?</span>
              <span v-else-if="currentStep === 2">Fotos e detalhes</span>
              <span v-else>Gravidade e publicação</span>
            </h2>
          </div>
          <q-btn flat round dense icon="close" size="sm" class="close-btn" v-close-popup />
        </div>

        <!-- 3-Segment Progress Bar -->
        <div class="stepper-bars-row row items-center q-gutter-x-xs q-mt-xs">
          <div
            class="stepper-bar-segment col cursor-pointer"
            :class="{ 'segment-active': currentStep >= 1 }"
            @click="currentStep = 1"
          />
          <div
            class="stepper-bar-segment col cursor-pointer"
            :class="{ 'segment-active': currentStep >= 2 }"
            @click="currentStep = 2"
          />
          <div
            class="stepper-bar-segment col cursor-pointer"
            :class="{ 'segment-active': currentStep >= 3 }"
            @click="currentStep = 3"
          />
        </div>

        <!-- Helper subtitle for current step -->
        <p class="stepper-subtitle q-mt-xs q-mb-none">
          <span v-if="currentStep === 1">Selecione a categoria que melhor representa o problema.</span>
          <span v-else-if="currentStep === 2">Confira o título inteligente e adicione foto ou observações.</span>
          <span v-else>Defina o impacto urbano para finalizar o relato no mapa.</span>
        </p>
      </div>

      <!-- 2. Stepper Body (Scrollable content) -->
      <q-card-section class="stepper-body scroll q-pa-md">
        <!-- ==================== ETAPA 1: CATEGORIA & LOCALIZAÇÃO ==================== -->
        <div v-show="currentStep === 1" class="step-content q-gutter-y-md">
          <!-- 2-Column Category Grid (Matching Image 3) -->
          <div class="row q-col-gutter-sm">
            <div v-for="cat in occurrenceCategories" :key="cat.value" class="col-6">
              <div
                class="category-select-card row items-center no-wrap cursor-pointer"
                :class="{ 'selected-category-card': form.type === cat.value }"
                @click="selectCategory(cat.value)"
              >
                <div
                  class="category-icon-box flex flex-center q-mr-sm"
                  :style="{ backgroundColor: cat.color }"
                >
                  <q-icon :name="cat.icon" size="22px" color="white" />
                </div>
                <div class="category-info col-grow ellipsis">
                  <div class="category-name ellipsis">{{ cat.label }}</div>
                  <div class="category-hint ellipsis">{{ cat.hint }}</div>
                </div>
                <q-icon
                  v-if="form.type === cat.value"
                  name="check_circle"
                  size="18px"
                  color="primary"
                  class="q-ml-xs check-indicator"
                />
              </div>
            </div>
          </div>

          <!-- Selected Location Box (Matching Image 3) -->
          <div class="location-preview-box row items-center justify-between no-wrap q-pa-sm">
            <div class="row items-center no-wrap col-grow q-pr-sm">
              <div class="location-icon-circle flex flex-center q-mr-sm">
                <q-icon name="place" size="18px" color="primary" />
              </div>
              <div class="col-grow ellipsis">
                <div class="location-eyebrow">Localização selecionada</div>
                <div class="location-address ellipsis" :title="locationDisplay">
                  {{ locationDisplay }}
                </div>
              </div>
            </div>

            <button
              type="button"
              class="location-change-link"
              @click="fetchCurrentCoords"
              :disabled="geocodingLoading"
            >
              <q-spinner-dots v-if="geocodingLoading" size="14px" />
              <span v-else>Alterar</span>
            </button>
          </div>
        </div>

        <!-- ==================== ETAPA 2: FOTOS & DETALHES ==================== -->
        <div v-show="currentStep === 2" class="step-content q-gutter-y-sm">
          <!-- Intelligent Title (Pre-filled, fully editable) -->
          <div>
            <div class="row items-center justify-between q-mb-xs">
              <span class="field-label">Título da Ocorrência *</span>
              <span class="field-badge">✨ Gerado automaticamente</span>
            </div>
            <q-input
              v-model="form.title"
              dense
              outlined
              bg-color="white"
              placeholder="Ex: Alagamento na Av. Nazaré"
              :rules="[val => !!val || 'Informe um título']"
              hide-bottom-space
              @update:model-value="hasUserEditedTitle = true"
            >
              <template #prepend>
                <q-icon :name="currentCategoryIcon" size="18px" :style="{ color: currentCategoryColor }" />
              </template>
            </q-input>
          </div>

          <!-- Photo Upload / Attachment Area (Emphasized as requested) -->
          <div class="photo-upload-zone q-pa-sm">
            <div class="row items-center no-wrap justify-between q-mb-xs">
              <div class="row items-center no-wrap">
                <q-icon name="photo_camera" size="20px" color="primary" class="q-mr-xs" />
                <span class="photo-title">Foto da Ocorrência <small class="text-muted">(opcional)</small></span>
              </div>
              <span v-if="form.photo_url" class="photo-attached-tag">✓ Foto anexada</span>
            </div>

            <p class="photo-help-text q-mb-xs">
              Uma foto ajuda os vizinhos e a prefeitura a confirmarem a gravidade do problema na via.
            </p>

            <!-- Photo Input -->
            <q-input
              v-model="form.photo_url"
              dense
              outlined
              bg-color="white"
              placeholder="Cole o link da foto (URL) ou escolha abaixo..."
              hide-bottom-space
              class="q-mb-xs"
            >
              <template #prepend>
                <q-icon name="link" size="18px" color="grey-6" />
              </template>
              <template #append v-if="form.photo_url">
                <q-btn flat round dense icon="close" size="xs" @click="form.photo_url = ''" />
              </template>
            </q-input>

            <!-- Sample photo presets for quick 1-tap attachment -->
            <div class="photo-presets-row row items-center q-gutter-x-xs q-mt-xs">
              <span class="preset-label">Exemplos rápidos:</span>
              <button
                v-for="(preset, idx) in currentCategoryPresets"
                :key="idx"
                type="button"
                class="preset-chip"
                :class="{ 'preset-chip-active': form.photo_url === preset.url }"
                @click="form.photo_url = preset.url"
              >
                {{ preset.label }}
              </button>
            </div>

            <!-- Thumbnail Preview if URL is set -->
            <div v-if="form.photo_url" class="photo-preview-box row items-center q-mt-xs q-pa-xs">
              <img :src="form.photo_url" alt="Prévia" class="preview-img" @error="handleImageError" />
              <div class="col-grow q-ml-sm ellipsis">
                <div class="text-caption text-weight-bold text-ink ellipsis">Foto anexada</div>
                <div class="text-caption text-muted ellipsis">{{ form.photo_url }}</div>
              </div>
              <q-btn flat dense round icon="delete" size="sm" color="negative" @click="form.photo_url = ''" />
            </div>
          </div>

          <!-- Neighborhood & Address (Pre-filled from reverse geocoding) -->
          <div class="row q-col-gutter-xs">
            <div class="col-6">
              <span class="field-label q-mb-xs block">Bairro *</span>
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
                :rules="[val => !!val || 'Bairro obrigatório']"
                hide-bottom-space
                @filter="filterNeighborhoodFn"
                @update:model-value="onLocationChanged"
              >
                <template #prepend>
                  <q-icon name="apartment" size="16px" color="primary" />
                </template>
              </q-select>
            </div>
            <div class="col-6">
              <span class="field-label q-mb-xs block">Endereço / Via</span>
              <q-input
                v-model="form.address"
                dense
                outlined
                bg-color="white"
                placeholder="Ex: Av. Nazaré, 120"
                hide-bottom-space
                @update:model-value="onLocationChanged"
              >
                <template #prepend>
                  <q-icon name="place" size="16px" color="secondary" />
                </template>
              </q-input>
            </div>
          </div>

          <!-- Additional Comments / Reference -->
          <div>
            <span class="field-label q-mb-xs block">Descrição / Ponto de referência <small class="text-muted">(opcional)</small></span>
            <q-input
              v-model="form.description"
              type="textarea"
              dense
              outlined
              bg-color="white"
              rows="2"
              placeholder="Descreva observações adicionais para ajudar a comunidade..."
              hide-bottom-space
            />
          </div>
        </div>

        <!-- ==================== ETAPA 3: GRAVIDADE & PUBLICAR ==================== -->
        <div v-show="currentStep === 3" class="step-content q-gutter-y-sm">
          <div>
            <span class="field-label q-mb-xs block">Nível de Gravidade / Risco Urbano</span>
            <div class="row q-col-gutter-xs">
              <div v-for="sev in severityOptions" :key="sev.value" class="col-6">
                <div
                  class="severity-card cursor-pointer q-pa-xs row items-center no-wrap"
                  :class="{ 'selected-severity-card': form.severity === sev.value }"
                  :style="form.severity === sev.value ? { borderColor: sev.color, backgroundColor: sev.bg } : {}"
                  @click="form.severity = sev.value"
                >
                  <div class="severity-dot q-mr-xs" :style="{ backgroundColor: sev.color }" />
                  <div class="col-grow ellipsis">
                    <div class="text-caption text-weight-bold" :style="{ color: sev.color }">
                      {{ sev.label }}
                    </div>
                    <div class="severity-subtext ellipsis">{{ sev.desc }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Card de Revisão Final -->
          <div class="review-card q-pa-sm q-mt-xs">
            <div class="text-caption text-weight-bold text-muted q-mb-xs">PRÉVIA DO SEU RELATO:</div>
            <div class="row items-center no-wrap">
              <div
                class="category-icon-box q-mr-sm flex flex-center"
                :style="{ backgroundColor: currentCategoryColor, width: '38px', height: '38px' }"
              >
                <q-icon :name="currentCategoryIcon" size="20px" color="white" />
              </div>
              <div class="col-grow ellipsis">
                <div class="review-eyebrow" :style="{ color: currentCategoryColor }">
                  {{ currentCategoryLabel.toUpperCase() }}
                </div>
                <div class="review-title ellipsis">{{ form.title }}</div>
                <div class="review-location ellipsis">
                  <q-icon name="place" size="13px" class="q-mr-xs text-primary" />
                  {{ locationDisplay }}
                </div>
              </div>
            </div>

            <div class="row items-center justify-between q-mt-xs pt-xs border-top-subtle text-caption">
              <span class="review-severity-badge" :style="{ backgroundColor: currentSeverityBg, color: currentSeverityColor }">
                Risco {{ currentSeverityLabel }}
              </span>
              <span v-if="form.photo_url" class="text-primary text-weight-bold">
                <q-icon name="image" size="14px" /> Com foto
              </span>
              <span v-else class="text-muted">Sem foto</span>
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- 3. Stepper Footer Actions -->
      <div class="stepper-footer q-pa-sm row items-center justify-between border-top">
        <!-- Back or Cancel Button -->
        <div>
          <q-btn
            v-if="currentStep === 1"
            flat
            label="Cancelar"
            class="footer-cancel-btn"
            v-close-popup
          />
          <q-btn
            v-else
            flat
            icon="arrow_back"
            label="Voltar"
            class="footer-back-btn"
            @click="currentStep--"
          />
        </div>

        <!-- Next or Submit Button -->
        <div>
          <q-btn
            v-if="currentStep < 3"
            unelevated
            class="footer-next-btn q-px-lg text-white"
            @click="handleNextStep"
          >
            <span>Continuar</span>
            <q-icon name="chevron_right" size="18px" class="q-ml-xs" />
          </q-btn>
          <q-btn
            v-else
            unelevated
            class="footer-submit-btn q-px-lg text-white"
            :loading="loading"
            @click="handleSubmit"
          >
            <q-icon name="check" size="18px" class="q-mr-xs" />
            <span>Publicar Ocorrência</span>
          </q-btn>
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useOccurrencesStore } from '../stores/occurrences'
import { useAuthStore } from '../stores/auth'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'

const props = defineEmits(['occurrence-created', 'request-login'])

const occurrencesStore = useOccurrencesStore()
const authStore = useAuthStore()
const { t } = useI18n()
const $q = useQuasar()

const isOpen = ref(false)
const loading = ref(false)
const geocodingLoading = ref(false)
const autoDetected = ref(false)
const currentStep = ref(1)
const hasUserEditedTitle = ref(false)

const form = reactive({
  type: 'pavement_repair',
  title: '',
  description: '',
  neighborhood: '',
  address: '',
  latitude: -1.4558,
  longitude: -48.4902,
  severity: 'medium',
  photo_url: '',
})

// Categories matching Figma palette & backend types
const occurrenceCategories = [
  {
    value: 'pavement_repair',
    label: 'Pavimentação',
    hint: 'Buracos e desníveis',
    icon: 'construction',
    color: '#c65d35',
  },
  {
    value: 'flood_prone',
    label: 'Alagamento',
    hint: 'Pista submersa',
    icon: 'waves',
    color: '#287f9d',
  },
  {
    value: 'waste_dumping',
    label: 'Lixo irregular',
    hint: 'Entulho e descarte',
    icon: 'delete',
    color: '#718a35',
  },
  {
    value: 'street_lighting',
    label: 'Iluminação',
    hint: 'Poste apagado',
    icon: 'lightbulb',
    color: '#e7a72f',
  },
  {
    value: 'unpaved_street',
    label: 'Rua sem pavimento',
    hint: 'Via de terra ou lama',
    icon: 'terrain',
    color: '#8c7355',
  },
]

// Preset high quality photos for 1-click test & UX demonstration
const categoryPhotoPresets = {
  pavement_repair: [
    { label: 'Buraco no asfalto', url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80' },
    { label: 'Pavimento cedido', url: 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=800&auto=format&fit=crop&q=80' },
  ],
  flood_prone: [
    { label: 'Rua alagada', url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop&q=80' },
    { label: 'Bueiro transbordando', url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80' },
  ],
  waste_dumping: [
    { label: 'Descarte em calçada', url: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=800&auto=format&fit=crop&q=80' },
    { label: 'Entulho na via', url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop&q=80' },
  ],
  street_lighting: [
    { label: 'Poste apagado', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80' },
  ],
  unpaved_street: [
    { label: 'Lamaçal / Erosão', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80' },
  ],
}

const severityOptions = [
  { value: 'low', label: 'Baixa', desc: 'Inconveniente leve, trânsito normal', color: '#386b35', bg: '#edf7ec' },
  { value: 'medium', label: 'Média', desc: 'Atenção, trânsito lento ou desvio', color: '#866019', bg: '#fdf6e7' },
  { value: 'high', label: 'Alta', desc: 'Risco de acidentes ou veículos presos', color: '#a4402e', bg: '#fdeee9' },
  { value: 'critical', label: 'Crítica', desc: 'Interdição completa da via', color: '#9c1c1c', bg: '#fbe8e8' },
]

const currentCategory = computed(() => {
  return occurrenceCategories.find((c) => c.value === form.type) || occurrenceCategories[0]
})

const currentCategoryLabel = computed(() => currentCategory.value.label)
const currentCategoryIcon = computed(() => currentCategory.value.icon)
const currentCategoryColor = computed(() => currentCategory.value.color)

const currentCategoryPresets = computed(() => {
  return categoryPhotoPresets[form.type] || []
})

const currentSeverityObj = computed(() => {
  return severityOptions.find((s) => s.value === form.severity) || severityOptions[1]
})
const currentSeverityLabel = computed(() => currentSeverityObj.value.label)
const currentSeverityColor = computed(() => currentSeverityObj.value.color)
const currentSeverityBg = computed(() => currentSeverityObj.value.bg)

const locationDisplay = computed(() => {
  if (form.address && form.neighborhood) {
    return `${form.address}, ${form.neighborhood}`
  }
  if (form.address) return form.address
  if (form.neighborhood) return form.neighborhood
  return `${form.latitude.toFixed(4)}, ${form.longitude.toFixed(4)}`
})

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

// Generates smart title like "Alagamento na Av. Nazaré"
function generateAutoTitle(type, address, neighborhood) {
  const typeMap = {
    pavement_repair: 'Pavimentação danificada',
    flood_prone: 'Ponto de alagamento',
    waste_dumping: 'Descarte irregular de lixo',
    street_lighting: 'Iluminação deficiente',
    unpaved_street: 'Rua sem pavimentação',
  }
  const prefix = typeMap[type] || 'Problema na via'
  const place = address || (neighborhood ? `no bairro ${neighborhood}` : '')
  if (place) {
    return `${prefix} na ${place}`.replace('na no bairro', 'no bairro')
  }
  return prefix
}

function updateAutoTitle() {
  if (!hasUserEditedTitle.value) {
    form.title = generateAutoTitle(form.type, form.address, form.neighborhood)
  }
}

function selectCategory(catVal) {
  form.type = catVal
  updateAutoTitle()
}

function onLocationChanged() {
  updateAutoTitle()
}

function handleImageError() {
  $q.notify({
    type: 'warning',
    message: 'Não foi possível carregar a imagem deste link. Verifique a URL.',
  })
}

async function reverseGeocode(lat, lng) {
  geocodingLoading.value = true
  autoDetected.value = false
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.address) {
        const addr = data.address
        const detectedNeighborhood =
          addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter || ''
        const streetParts = [addr.road, addr.house_number].filter(Boolean)
        const detectedStreet = streetParts.join(', ')

        if (detectedNeighborhood) {
          form.neighborhood = detectedNeighborhood
        }
        if (detectedStreet) {
          form.address = detectedStreet
        }
        autoDetected.value = !!(detectedNeighborhood || detectedStreet)
        updateAutoTitle()
      }
    }
  } catch (err) {
    console.info('Reverse geocoding unavailable, fallback to manual entry.')
  } finally {
    geocodingLoading.value = false
  }
}

function open(coords = null) {
  currentStep.value = 1
  hasUserEditedTitle.value = false
  autoDetected.value = false
  form.photo_url = ''
  form.description = ''
  form.severity = 'medium'
  filteredNeighborhoodOptions.value = allNeighborhoods.value

  if (coords) {
    form.latitude = coords.lat
    form.longitude = coords.lng
    reverseGeocode(coords.lat, coords.lng)
  } else {
    if (!form.neighborhood && allNeighborhoods.value.length > 0) {
      form.neighborhood = allNeighborhoods.value[0]
    }
  }

  updateAutoTitle()
  isOpen.value = true
}

function fetchCurrentCoords() {
  if (navigator.geolocation) {
    geocodingLoading.value = true
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.latitude = pos.coords.latitude
        form.longitude = pos.coords.longitude
        reverseGeocode(pos.coords.latitude, pos.coords.longitude)
        $q.notify({ type: 'info', message: 'Localização atualizada com sucesso!' })
      },
      () => {
        geocodingLoading.value = false
        $q.notify({ type: 'warning', message: 'Não foi possível obter localização via GPS.' })
      }
    )
  }
}

function handleNextStep() {
  if (currentStep.value === 1) {
    if (!form.neighborhood && allNeighborhoods.value.length > 0) {
      form.neighborhood = allNeighborhoods.value[0]
    }
    updateAutoTitle()
    currentStep.value = 2
  } else if (currentStep.value === 2) {
    if (!form.title) {
      updateAutoTitle()
    }
    currentStep.value = 3
  }
}

async function handleSubmit() {
  if (!authStore.isAuthenticated) {
    $q.notify({
      type: 'warning',
      message: t('occurrence.mustLoginToReport') || 'Faça login para registrar ocorrências.',
      actions: [
        {
          label: t('app.login') || 'Entrar',
          color: 'white',
          handler: () => props('request-login'),
        },
      ],
    })
    return
  }

  if (!form.neighborhood) {
    form.neighborhood = allNeighborhoods.value[0] || 'Centro'
  }
  if (!form.title) {
    form.title = generateAutoTitle(form.type, form.address, form.neighborhood)
  }

  loading.value = true
  try {
    const payload = { ...form }
    if (!payload.photo_url) {
      delete payload.photo_url
    }
    const newOcc = await occurrencesStore.createOccurrence(payload)
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: t('newOccurrence.success') || 'Ocorrência publicada no mapa!',
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
  border-radius: 20px;
  background-color: rgba(255, 253, 248, 0.99);
  border: 1px solid rgba(222, 217, 206, 0.95);
  font-family: 'Public Sans', sans-serif;
  color: #1f2923;
  width: 100%;
  max-width: 480px;
  overflow: hidden;
}

@media (max-width: 600px) {
  .new-occurrence-dialog :deep(.q-dialog__inner) {
    padding: 12px;
    padding-bottom: 74px;
  }
  .new-occurrence-card {
    max-height: 82vh;
  }
}

.stepper-header {
  background: #fffdf8;
}

.stepper-eyebrow {
  font-size: 10.5px;
  font-weight: 800;
  color: #245c3a;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.stepper-title {
  font-size: 19px;
  font-weight: 800;
  color: #1f2923;
  line-height: 1.2;
}

.stepper-bars-row {
  margin-top: 8px;
}

.stepper-bar-segment {
  height: 4px;
  border-radius: 4px;
  background-color: #e0ded6;
  transition: all 0.3s ease;
}

.segment-active {
  background-color: #245c3a;
}

.stepper-subtitle {
  font-size: 11.5px;
  color: #677069;
  line-height: 1.35;
}

.stepper-body {
  max-height: 58vh;
}

/* Category Grid */
.category-select-card {
  border-radius: 14px;
  background: #ffffff;
  border: 1.5px solid #ded9ce;
  padding: 10px 10px;
  transition: all 0.2s ease;
  min-height: 58px;
}

.category-select-card:hover {
  border-color: #245c3a;
  background: #fbfaf6;
}

.selected-category-card {
  border-color: #245c3a !important;
  background: #f2f7f3 !important;
  box-shadow: 0 3px 10px rgba(36, 92, 58, 0.14);
}

.category-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  flex-shrink: 0;
}

.category-name {
  font-size: 12.5px;
  font-weight: 800;
  color: #1f2923;
}

.category-hint {
  font-size: 10px;
  color: #677069;
}

.check-indicator {
  flex-shrink: 0;
}

/* Location Preview Box (Matching Image 3) */
.location-preview-box {
  border-radius: 14px;
  background: #f3efe6;
  border: 1px solid #dcd7cb;
}

.location-icon-circle {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: #e4eee3;
  flex-shrink: 0;
}

.location-eyebrow {
  font-size: 10px;
  font-weight: 700;
  color: #677069;
  text-transform: uppercase;
}

.location-address {
  font-size: 12.5px;
  font-weight: 700;
  color: #1f2923;
}

.location-change-link {
  background: none;
  border: none;
  color: #245c3a;
  font-weight: 800;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.location-change-link:hover {
  text-decoration: underline;
}

/* Photo Upload Zone */
.photo-upload-zone {
  border: 1.5px dashed #c4d4c2;
  background: #f8faf7;
  border-radius: 14px;
}

.photo-title {
  font-size: 12px;
  font-weight: 800;
  color: #1f2923;
}

.photo-attached-tag {
  font-size: 10px;
  font-weight: 800;
  color: #245c3a;
  background: #e5efe3;
  padding: 2px 7px;
  border-radius: 6px;
}

.photo-help-text {
  font-size: 11px;
  color: #677069;
  line-height: 1.3;
}

.preset-label {
  font-size: 10px;
  color: #677069;
  font-weight: 700;
}

.preset-chip {
  background: #ffffff;
  border: 1px solid #ded9ce;
  border-radius: 8px;
  font-size: 10.5px;
  font-weight: 700;
  color: #245c3a;
  padding: 2px 7px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-chip:hover {
  background: #edf3ea;
  border-color: #245c3a;
}

.preset-chip-active {
  background: #245c3a;
  color: #ffffff;
  border-color: #245c3a;
}

.photo-preview-box {
  background: #ffffff;
  border: 1px solid #ded9ce;
  border-radius: 10px;
}

.preview-img {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

/* Fields */
.field-label {
  font-size: 11.5px;
  font-weight: 700;
  color: #1f2923;
}

.field-badge {
  font-size: 10px;
  font-weight: 700;
  color: #245c3a;
  background: #edf3ea;
  padding: 2px 6px;
  border-radius: 6px;
}

/* Severity Options */
.severity-card {
  border-radius: 11px;
  background: #ffffff;
  border: 1.5px solid #ded9ce;
  min-height: 48px;
  transition: all 0.2s ease;
}

.selected-severity-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.severity-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.severity-subtext {
  font-size: 9.5px;
  color: #677069;
}

/* Review Card */
.review-card {
  border-radius: 14px;
  background: #f7f4ed;
  border: 1px solid #ded9ce;
}

.review-eyebrow {
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.review-title {
  font-size: 13.5px;
  font-weight: 800;
  color: #1f2923;
}

.review-location {
  font-size: 11px;
  color: #677069;
}

.review-severity-badge {
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 10.5px;
}

/* Footer Actions */
.stepper-footer {
  background: #fffdf8;
}

.border-bottom {
  border-bottom: 1px solid #ded9ce;
}

.border-top {
  border-top: 1px solid #ded9ce;
}

.border-top-subtle {
  border-top: 1px dashed #ded9ce;
}

.footer-cancel-btn {
  color: #677069;
  font-weight: 700;
  font-size: 13px;
}

.footer-back-btn {
  color: #1f2923;
  font-weight: 700;
  font-size: 13px;
}

.footer-next-btn {
  background-color: #245c3a !important;
  border-radius: 12px;
  height: 42px;
  font-weight: 800;
  font-size: 13.5px;
  box-shadow: 0 3px 12px rgba(36, 92, 58, 0.28);
}

.footer-next-btn:hover {
  background-color: #173d29 !important;
}

.footer-submit-btn {
  background-color: #245c3a !important;
  border-radius: 12px;
  height: 42px;
  font-weight: 800;
  font-size: 13.5px;
  box-shadow: 0 4px 14px rgba(36, 92, 58, 0.32);
}

.close-btn {
  color: #677069;
}
</style>
