<template>
  <q-dialog
    v-model="isOpen"
    :position="$q.screen.lt.sm ? 'bottom' : 'standard'"
    class="occurrence-dialog"
  >
    <q-card v-if="occurrence" class="occurrence-card shadow-14 q-pa-none">
      <q-tab-panels
        v-model="activeTab"
        animated
        swipeable
        class="bg-transparent"
      >
        <!-- ========================================================= -->
        <!-- ABA 1: RESUMO (Despoluído, espaçoso, posicionado embaixo)  -->
        <!-- ========================================================= -->
        <q-tab-panel name="summary" class="q-pa-md summary-panel">
          <!-- 1. Header: Ícone 42x42 + Categoria + Risco + Botão X no canto direito -->
          <div class="row items-center justify-between no-wrap q-mb-sm">
            <div class="row items-center no-wrap col-grow q-pr-sm">
              <!-- Símbolo da Categoria -->
              <div
                class="category-icon-box q-mr-sm flex flex-center"
                :style="{ backgroundColor: typeColor }"
              >
                <q-icon :name="typeIcon" size="22px" color="white" />
              </div>

              <!-- Categoria & Risco -->
              <div class="col-grow ellipsis">
                <div class="category-eyebrow" :style="{ color: typeColor }">
                  {{ categoryLabel.toUpperCase() }}
                </div>
                <div class="row items-center q-gutter-x-xs q-mt-xs">
                  <span class="risk-pill" :class="'risk-' + (props.severity || 'medium')">
                    Risco {{ severityLabel }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Botão X de fechar padrão no canto superior direito -->
            <q-btn
              flat
              round
              dense
              icon="close"
              size="sm"
              class="close-btn"
              v-close-popup
            />
          </div>

          <!-- 2. Rua e Data (com ícone e espaçamento generoso) -->
          <div class="location-date-row row items-center no-wrap text-caption q-mb-sm">
            <q-icon name="place" size="17px" class="q-mr-xs text-primary flex-shrink-0" />
            <span class="location-name text-weight-bold ellipsis col-grow">
              {{ locationDisplay }}
            </span>
            <span class="date-text text-muted flex-shrink-0 q-ml-xs">
              • {{ props.created_at_human || 'recentemente' }}
            </span>
          </div>

          <!-- 3. Texto da ocorrência & Miniatura visível de Foto -->
          <div class="content-block q-mb-sm">
            <div class="row items-start no-wrap q-col-gutter-sm">
              <!-- Texto descritivo legível (substitui o título grandalhão para não quebrar) -->
              <div class="col-grow">
                <p class="occurrence-main-text q-my-none">
                  {{ occurrenceDisplayText }}
                </p>
              </div>

              <!-- Miniatura de Foto com tamanho visível e nítido (84x64px) -->
              <div
                v-if="props.photo_url"
                class="photo-thumbnail-card cursor-pointer flex-shrink-0"
                @click="openPhotoLightbox(props.photo_url)"
              >
                <img :src="props.photo_url" alt="Foto da ocorrência" class="thumbnail-img" />
                <div class="thumbnail-zoom-overlay flex flex-center">
                  <q-icon name="zoom_in" size="15px" color="white" />
                </div>
                <q-tooltip>Ampliar foto</q-tooltip>
              </div>
            </div>
          </div>

          <!-- 4. Prova Social: Quantas pessoas confirmaram -->
          <div class="confirmations-row row items-center no-wrap q-py-xs q-mb-sm">
            <div class="avatar-stack q-mr-sm">
              <span class="avatar-dot dot-1">MA</span>
              <span class="avatar-dot dot-2">JP</span>
              <span class="avatar-dot dot-3">LS</span>
            </div>
            <div class="text-caption community-confirm-text">
              <strong>{{ props.confirmations_count || 1 }} {{ (props.confirmations_count === 1) ? 'pessoa confirmou' : 'pessoas confirmaram' }}</strong>
              <span class="text-muted"> esta ocorrência</span>
            </div>
          </div>

          <!-- 5. Botão de Confirmar (Grande, destacado e espaçoso) -->
          <div class="q-mb-sm">
            <q-btn
              unelevated
              class="primary-confirm-btn full-width"
              :class="{ 'btn-already-confirmed': props.has_confirmed }"
              :loading="confirmingLoading"
              @click="handleToggleConfirm"
            >
              <q-icon
                :name="props.has_confirmed ? 'check_circle' : 'check'"
                size="19px"
                class="q-mr-xs"
              />
              <span>
                {{ props.has_confirmed ? 'Você confirmou esta ocorrência' : 'Confirmar ocorrência' }}
              </span>
            </q-btn>
          </div>

          <!-- 6. Ações Secundárias: Ver detalhes e Botão de Discordar -->
          <div class="row items-center justify-between no-wrap q-pt-xs border-top-subtle">
            <!-- Link para página/aba completa de detalhes -->
            <button
              type="button"
              class="details-nav-link row items-center no-wrap"
              @click="activeTab = 'details'"
            >
              <span>Ver detalhes e histórico</span>
              <q-icon name="chevron_right" size="16px" class="q-ml-xs" />
            </button>

            <!-- Botão de Discordar / Não concordo com espaçamento e clareza -->
            <button
              type="button"
              class="contest-nav-btn row items-center no-wrap"
              :class="{ 'contest-nav-active': isContested }"
              @click="openContestDialog"
            >
              <q-icon name="flag" size="14px" class="q-mr-xs" />
              <span>{{ isContested ? 'Contestada por você' : 'Discordar / Denunciar' }}</span>
            </button>
          </div>
        </q-tab-panel>

        <!-- ========================================================= -->
        <!-- ABA 2: DETALHES COMPLETOS & AÇÕES AVANÇADAS               -->
        <!-- ========================================================= -->
        <q-tab-panel name="details" class="q-pa-md details-panel">
          <!-- Header com Voltar e Botão X -->
          <div class="row items-center justify-between no-wrap q-mb-md border-bottom pb-sm">
            <button
              type="button"
              class="back-to-summary-btn row items-center no-wrap"
              @click="activeTab = 'summary'"
            >
              <q-icon name="arrow_back" size="18px" class="q-mr-xs" />
              <span>Voltar ao resumo</span>
            </button>
            <q-btn
              flat
              round
              dense
              icon="close"
              size="sm"
              class="close-btn"
              v-close-popup
            />
          </div>

          <!-- Conteúdo Completo -->
          <div class="details-content-scroll q-gutter-y-md">
            <!-- Foto em alta resolução se houver -->
            <div
              v-if="props.photo_url"
              class="full-photo-box cursor-pointer"
              @click="openPhotoLightbox(props.photo_url)"
            >
              <img :src="props.photo_url" alt="Foto da ocorrência" class="full-photo-img" />
              <div class="full-photo-badge row items-center justify-between q-px-sm q-py-xs">
                <span class="text-caption text-white">Foto da ocorrência</span>
                <span class="text-caption text-white row items-center">
                  <q-icon name="fullscreen" size="16px" class="q-mr-xs" /> Ampliar
                </span>
              </div>
            </div>

            <!-- Título e Descrição Completos -->
            <div>
              <div class="detail-label q-mb-xs">Título registrado:</div>
              <div class="detail-value text-weight-bold q-mb-sm">{{ props.title }}</div>

              <div class="detail-label q-mb-xs">Descrição completa:</div>
              <p class="detail-description q-my-none">
                {{ props.description || 'Nenhum comentário adicional registrado.' }}
              </p>
            </div>

            <!-- Dados do Autor e Relato -->
            <div class="row items-center justify-between text-caption text-muted q-py-xs border-top-subtle">
              <div class="row items-center no-wrap">
                <q-avatar size="24px" class="q-mr-xs reporter-avatar text-weight-bold">
                  {{ (props.author_name || 'C').charAt(0).toUpperCase() }}
                </q-avatar>
                <span>Reportado por <strong>{{ props.author_name || 'Cidadão' }}</strong></span>
              </div>
              <span>{{ props.created_at_human || 'recentemente' }}</span>
            </div>

            <!-- Dados Técnicos Espaciais -->
            <div class="geo-box q-pa-sm rounded-borders">
              <div class="row items-center justify-between text-caption q-mb-xs">
                <span class="text-muted">Bairro:</span>
                <strong class="text-ink">{{ props.neighborhood }}</strong>
              </div>
              <div v-if="props.address" class="row items-center justify-between text-caption q-mb-xs">
                <span class="text-muted">Logradouro:</span>
                <strong class="text-ink">{{ props.address }}</strong>
              </div>
              <div class="row items-center justify-between text-caption q-mb-xs">
                <span class="text-muted">Coordenadas GPS:</span>
                <span class="text-ink text-weight-bold">
                  {{ Number(props.latitude).toFixed(5) }}, {{ Number(props.longitude).toFixed(5) }}
                </span>
              </div>
              <div class="row items-center justify-between text-caption">
                <span class="text-muted">Status:</span>
                <span class="status-tag">{{ props.status || 'Ativa' }}</span>
              </div>
            </div>

            <!-- Botões de Ação Avançada -->
            <div class="q-gutter-y-xs q-pt-xs">
              <q-btn
                unelevated
                class="full-width advanced-contest-btn"
                :class="{ 'advanced-contest-active': isContested }"
                @click="openContestDialog"
              >
                <q-icon name="flag" size="16px" class="q-mr-xs" />
                <span>{{ isContested ? 'Ocorrência contestada por você' : 'Discordar / Denunciar inconsistência' }}</span>
              </q-btn>

              <q-btn
                v-if="isOwner"
                outline
                color="negative"
                class="full-width delete-btn"
                icon="delete"
                label="Excluir minha ocorrência"
                @click="openDeleteDialog"
              />
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <!-- Modal de Contestação / Denúncia -->
    <q-dialog v-model="showContestDialog" persistent>
      <q-card class="modal-card shadow-12" style="min-width: 320px; max-width: 440px; width: 100%">
        <div class="row items-center justify-between q-pa-md border-bottom">
          <div class="row items-center no-wrap">
            <div class="contest-icon-box q-mr-sm flex flex-center">
              <q-icon name="flag" size="20px" color="white" />
            </div>
            <div>
              <div class="text-weight-bold text-subtitle2 text-ink">Discordar ou Denunciar</div>
              <div class="text-caption text-muted">Aponte inconsistências sobre esta ocorrência</div>
            </div>
          </div>
          <q-btn flat round dense icon="close" size="sm" class="close-btn" v-close-popup />
        </div>

        <q-card-section class="q-pa-md">
          <div class="text-caption text-weight-bold text-ink q-mb-xs">Motivo:</div>
          <q-option-group
            v-model="contestReason"
            :options="contestOptions"
            color="secondary"
            dense
            class="q-mb-sm text-caption"
          />

          <div class="text-caption text-weight-bold text-ink q-mb-xs">Detalhes adicionais (opcional):</div>
          <q-input
            v-model="contestDetails"
            type="textarea"
            rows="2"
            dense
            outlined
            placeholder="Ex: A prefeitura já concluiu as obras neste trecho..."
            bg-color="white"
            hide-bottom-space
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md border-top">
          <q-btn flat label="Cancelar" class="cancel-btn" v-close-popup />
          <q-btn
            unelevated
            label="Enviar Contestação"
            class="submit-contest-btn"
            :loading="contestLoading"
            @click="submitContest"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Modal de Confirmação de Exclusão -->
    <q-dialog v-model="showDeleteDialog" persistent>
      <q-card class="modal-card shadow-12" style="min-width: 300px; max-width: 400px; width: 100%">
        <q-card-section class="row items-start no-wrap q-pa-md">
          <div class="delete-warning-icon q-mr-md flex flex-center">
            <q-icon name="warning" size="24px" color="white" />
          </div>
          <div class="col-grow">
            <div class="text-weight-bolder text-subtitle1 text-ink q-mb-xs">Excluir ocorrência?</div>
            <div class="text-caption text-muted leading-snug">
              Tem certeza de que deseja remover esta ocorrência permanentemente do mapa?
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat label="Cancelar" class="cancel-btn" v-close-popup />
          <q-btn
            unelevated
            color="negative"
            label="Sim, excluir"
            icon="delete"
            :loading="deleteLoading"
            class="delete-confirm-btn text-weight-bold"
            @click="confirmDelete"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Lightbox da Foto Ampliada -->
    <q-dialog v-model="showPhotoLightbox">
      <q-card class="lightbox-card bg-black text-white">
        <div class="lightbox-top-bar row items-center justify-between q-pa-sm">
          <span class="text-caption text-weight-bold ellipsis">{{ props.title || 'Foto da ocorrência' }}</span>
          <q-btn flat round dense icon="close" size="sm" color="white" v-close-popup />
        </div>
        <div class="lightbox-img-wrapper flex flex-center">
          <img :src="lightboxPhotoUrl" alt="Foto ampliada" class="lightbox-img" />
        </div>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useOccurrencesStore } from '../stores/occurrences'
import { useAuthStore } from '../stores/auth'
import { useQuasar } from 'quasar'

const emit = defineEmits(['request-login'])

const occurrencesStore = useOccurrencesStore()
const authStore = useAuthStore()
const $q = useQuasar()

const activeTab = ref('summary')
const confirmingLoading = ref(false)
const showContestDialog = ref(false)
const contestLoading = ref(false)
const contestReason = ref('resolved')
const contestDetails = ref('')

const showDeleteDialog = ref(false)
const deleteLoading = ref(false)

const showPhotoLightbox = ref(false)
const lightboxPhotoUrl = ref('')

const contestedIds = ref(new Set())

const contestOptions = [
  { label: 'Problema já foi resolvido', value: 'resolved' },
  { label: 'Informação incorreta ou inexistente', value: 'incorrect' },
  { label: 'Localização errada no mapa', value: 'wrong_location' },
  { label: 'Spam ou conteúdo impróprio', value: 'spam' },
]

const isOpen = computed({
  get: () => !!occurrencesStore.selectedOccurrence,
  set: (val) => {
    if (!val) occurrencesStore.clearSelection()
  },
})

watch(
  () => occurrencesStore.selectedOccurrence,
  (newVal) => {
    if (newVal) {
      activeTab.value = 'summary'
    }
  }
)

const occurrence = computed(() => occurrencesStore.selectedOccurrence)
const props = computed(() => occurrence.value?.properties || {})

const isOwner = computed(() => {
  if (!authStore.isAuthenticated || !authStore.user) return false
  return props.value.user_id === authStore.user.id
})

const isContested = computed(() => {
  return contestedIds.value.has(props.value.id)
})

const locationDisplay = computed(() => {
  const parts = []
  if (props.value.address) parts.push(props.value.address)
  if (props.value.neighborhood) parts.push(props.value.neighborhood)
  return parts.length > 0 ? parts.join(' · ') : 'Localização no mapa'
})

// Text content shown in place of cramped title
const occurrenceDisplayText = computed(() => {
  if (props.value.description && props.value.description.trim()) {
    return props.value.description
  }
  return props.value.title || 'Problema urbano apontado pela comunidade nesta localização.'
})

const categoryLabel = computed(() => {
  const map = {
    waste_dumping: 'Descarte irregular de lixo',
    unpaved_street: 'Rua sem pavimentação',
    pavement_repair: 'Reparo na pavimentação',
    flood_prone: 'Rua sujeita a alagamento',
    street_lighting: 'Iluminação pública',
  }
  return map[props.value.type] || 'Problema urbano'
})

const severityLabel = computed(() => {
  const map = {
    low: 'Baixo',
    medium: 'Médio',
    high: 'Alto',
    critical: 'Crítico',
  }
  return map[props.value.severity] || 'Médio'
})

const typeColor = computed(() => {
  switch (props.value.type) {
    case 'flood_prone': return '#287f9d'
    case 'pavement_repair': return '#c65d35'
    case 'unpaved_street': return '#8c7355'
    case 'waste_dumping': return '#718a35'
    case 'street_lighting': return '#e7a72f'
    default: return '#245c3a'
  }
})

const typeIcon = computed(() => {
  switch (props.value.type) {
    case 'flood_prone': return 'waves'
    case 'pavement_repair': return 'construction'
    case 'unpaved_street': return 'terrain'
    case 'waste_dumping': return 'delete'
    case 'street_lighting': return 'lightbulb'
    default: return 'place'
  }
})

function openPhotoLightbox(url) {
  if (!url) return
  lightboxPhotoUrl.value = url
  showPhotoLightbox.value = true
}

async function handleToggleConfirm() {
  if (!authStore.isAuthenticated) {
    $q.notify({
      type: 'warning',
      message: 'Faça login para confirmar a veracidade desta ocorrência.',
      actions: [
        {
          label: 'Entrar',
          color: 'white',
          handler: () => emit('request-login'),
        },
      ],
    })
    return
  }

  if (isContested.value) {
    contestedIds.value.delete(props.value.id)
  }

  confirmingLoading.value = true
  try {
    const res = await occurrencesStore.toggleConfirmation(props.value.id)
    $q.notify({
      type: res.has_confirmed ? 'positive' : 'info',
      icon: res.has_confirmed ? 'check_circle' : 'info',
      message: res.has_confirmed ? 'Confirmação registrada com sucesso!' : 'Confirmação retirada.',
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: 'Não foi possível confirmar a ocorrência.',
    })
  } finally {
    confirmingLoading.value = false
  }
}

function openContestDialog() {
  if (!authStore.isAuthenticated) {
    $q.notify({
      type: 'warning',
      message: 'Faça login para contestar ou denunciar esta ocorrência.',
      actions: [
        {
          label: 'Entrar',
          color: 'white',
          handler: () => emit('request-login'),
        },
      ],
    })
    return
  }
  contestReason.value = 'resolved'
  contestDetails.value = ''
  showContestDialog.value = true
}

async function submitContest() {
  contestLoading.value = true
  try {
    if (props.value.has_confirmed) {
      await occurrencesStore.toggleConfirmation(props.value.id)
    }

    contestedIds.value.add(props.value.id)
    showContestDialog.value = false

    $q.notify({
      type: 'positive',
      icon: 'flag',
      message: 'Contestação registrada com sucesso!',
      caption: 'Agradecemos sua colaboração em manter as informações da cidade precisas.',
      timeout: 4000,
    })
  } finally {
    contestLoading.value = false
  }
}

function openDeleteDialog() {
  showDeleteDialog.value = true
}

async function confirmDelete() {
  deleteLoading.value = true
  try {
    await occurrencesStore.deleteOccurrence(props.value.id)
    showDeleteDialog.value = false
    isOpen.value = false
    $q.notify({
      type: 'positive',
      icon: 'check',
      message: 'Ocorrência excluída com sucesso.',
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: 'Falha ao excluir ocorrência.',
    })
  } finally {
    deleteLoading.value = false
  }
}
</script>

<style scoped>
/* Card de Ocorrência: Mais largo, respirável, posicionado na parte inferior */
.occurrence-card {
  width: 100%;
  max-width: 440px;
  background: rgba(255, 253, 248, 0.99);
  border: 1px solid rgba(222, 217, 206, 0.95);
  border-radius: 22px;
  box-shadow: 0 16px 44px rgba(35, 49, 38, 0.18);
  backdrop-filter: blur(14px);
  color: #1f2923;
  font-family: 'Public Sans', sans-serif;
  overflow: hidden;
}

/* Telas maiores: posiciona na parte inferior direita para não cobrir o centro do mapa */
@media (min-width: 601px) {
  .occurrence-dialog :deep(.q-dialog__inner) {
    top: auto;
    bottom: 24px;
    right: 28px;
    left: auto;
    padding: 0;
  }
  .occurrence-card {
    width: 440px;
    max-width: 460px;
  }
}

/* Telas mobile: bottom-sheet docked */
@media (max-width: 600px) {
  .occurrence-dialog :deep(.q-dialog__inner) {
    padding: 0;
  }
  .occurrence-card {
    max-width: 100%;
    border-radius: 24px 24px 0 0;
    margin-bottom: 0;
  }
}

.summary-panel {
  overflow: visible;
}

/* Símbolo da Categoria */
.category-icon-box {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  flex-shrink: 0;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
}

.category-eyebrow {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.07em;
  line-height: 1.2;
}

.risk-pill {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
}

.risk-low {
  background: #e5efe3;
  color: #386b35;
}

.risk-medium {
  background: #fdf2d8;
  color: #866019;
}

.risk-high, .risk-critical {
  background: #fce7e2;
  color: #a4402e;
}

.close-btn {
  color: #677069;
}

/* Linha de Rua e Data */
.location-date-row {
  color: #2b362e;
  font-size: 12.5px;
}

.location-name {
  color: #1f2923;
}

.date-text {
  font-size: 11.5px;
}

/* Texto descritivo principal */
.occurrence-main-text {
  font-size: 13.5px;
  line-height: 1.45;
  color: #2d3830;
  white-space: pre-wrap;
}

/* Miniatura de Foto com tamanho visível (84x64px) */
.photo-thumbnail-card {
  position: relative;
  width: 84px;
  height: 64px;
  border-radius: 12px;
  overflow: hidden;
  border: 1.5px solid #ded9ce;
  background: #f0ece3;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumbnail-zoom-overlay {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: rgba(31, 41, 35, 0.75);
}

/* Prova social */
.avatar-stack {
  display: flex;
  align-items: center;
}

.avatar-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #fffdf8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 800;
  color: #fff;
  margin-left: -6px;
}

.avatar-dot:first-child {
  margin-left: 0;
}

.dot-1 { background: #245c3a; }
.dot-2 { background: #c65d35; }
.dot-3 { background: #718a35; }

.community-confirm-text {
  font-size: 12px;
  color: #1f2923;
}

/* Botão de Confirmar */
.primary-confirm-btn {
  height: 46px;
  border-radius: 13px;
  background: #245c3a !important;
  color: #ffffff !important;
  font-weight: 800;
  font-size: 14px;
  box-shadow: 0 4px 14px rgba(36, 92, 58, 0.28);
  text-transform: none;
}

.primary-confirm-btn:hover {
  background: #173d29 !important;
}

.primary-confirm-btn.btn-already-confirmed {
  background: #edf3ea !important;
  border: 1.5px solid #245c3a;
  color: #245c3a !important;
  box-shadow: none;
}

/* Ações Secundárias */
.details-nav-link {
  background: none;
  border: none;
  color: #245c3a;
  font-weight: 800;
  font-size: 12.5px;
  cursor: pointer;
  padding: 4px 0;
  transition: all 0.2s ease;
}

.details-nav-link:hover {
  text-decoration: underline;
}

.contest-nav-btn {
  background: none;
  border: none;
  color: #8c7355;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.contest-nav-btn:hover {
  color: #c65d35;
  background: #fdf2ee;
}

.contest-nav-active {
  color: #c65d35 !important;
  font-weight: 800;
}

.border-top-subtle {
  border-top: 1px dashed #ded9ce;
}

/* ABA 2: DETALHES */
.details-panel {
  max-height: 70vh;
  overflow-y: auto;
}

.back-to-summary-btn {
  background: none;
  border: none;
  color: #245c3a;
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}

.back-to-summary-btn:hover {
  text-decoration: underline;
}

.full-photo-box {
  position: relative;
  border-radius: 14px;
  border: 1px solid #ded9ce;
  overflow: hidden;
  max-height: 180px;
  background: #000;
}

.full-photo-img {
  width: 100%;
  max-height: 180px;
  object-fit: cover;
  display: block;
}

.full-photo-badge {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.75));
}

.detail-label {
  font-size: 10.5px;
  font-weight: 800;
  color: #677069;
  text-transform: uppercase;
}

.detail-value {
  font-size: 14px;
  color: #1f2923;
}

.detail-description {
  font-size: 13px;
  line-height: 1.45;
  color: #2d3830;
  white-space: pre-wrap;
}

.reporter-avatar {
  background: #e7efe7;
  color: #245c3a;
  font-size: 11px;
}

.geo-box {
  background: #f7f4ed;
  border: 1px solid #ded9ce;
}

.status-tag {
  font-size: 10px;
  font-weight: 800;
  color: #245c3a;
  background: #edf3ea;
  padding: 2px 7px;
  border-radius: 6px;
}

.advanced-contest-btn {
  background: #fdf2ee;
  border: 1px solid #f8cdbf;
  color: #c65d35;
  font-weight: 700;
  font-size: 12px;
  border-radius: 11px;
  height: 38px;
  text-transform: none;
}

.advanced-contest-active {
  background: #c65d35 !important;
  color: #ffffff !important;
}

.delete-btn {
  border-radius: 11px;
  height: 36px;
  font-weight: 700;
  font-size: 12px;
  text-transform: none;
}

/* Modals */
.modal-card {
  border-radius: 20px;
  background: rgba(255, 253, 248, 0.99);
  border: 1px solid rgba(222, 217, 206, 0.95);
  color: #1f2923;
  font-family: 'Public Sans', sans-serif;
  overflow: hidden;
}

.contest-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background-color: #c65d35;
}

.delete-warning-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background-color: #c65d35;
  flex-shrink: 0;
}

.submit-contest-btn {
  background: #c65d35 !important;
  color: #ffffff !important;
  border-radius: 11px;
  font-weight: 700;
  height: 38px;
}

.delete-confirm-btn {
  border-radius: 11px;
  height: 38px;
}

.cancel-btn {
  color: #677069;
  font-weight: 600;
}

.border-bottom {
  border-bottom: 1px solid #ded9ce;
}

.border-top {
  border-top: 1px solid #ded9ce;
}

.text-ink {
  color: #1f2923;
}

.text-muted {
  color: #677069;
}

/* Lightbox Modal */
.lightbox-card {
  max-width: 90vw;
  max-height: 90vh;
  border-radius: 16px;
  overflow: hidden;
}

.lightbox-img-wrapper {
  max-height: 80vh;
  overflow: auto;
}

.lightbox-img {
  max-width: 100%;
  max-height: 75vh;
  object-fit: contain;
}
</style>
