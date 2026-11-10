<template>
  <q-dialog v-model="isOpen" position="bottom" class="occurrence-dialog">
    <q-card v-if="occurrence" class="occurrence-card shadow-5 q-pa-none">
      <!-- Card Header Banner -->
      <div
        class="card-top-stripe row items-center justify-between q-px-md q-py-sm text-white"
        :style="{ backgroundColor: typeColor }"
      >
        <div class="row items-center no-wrap">
          <q-icon :name="typeIcon" size="22px" class="q-mr-sm" />
          <span class="text-weight-bold text-subtitle2">{{ $t(`types.${props.type}`) }}</span>
        </div>
        <div class="row items-center no-wrap q-gutter-x-xs">
          <!-- Severity Badge -->
          <q-badge
            rounded
            :color="severityBadgeColor"
            text-color="white"
            class="text-weight-bold text-caption q-px-sm"
          >
            {{ $t(`severity.${props.severity || 'medium'}`) }}
          </q-badge>
          <q-btn flat round dense icon="close" size="sm" color="white" v-close-popup />
        </div>
      </div>

      <!-- Card Body Content -->
      <q-card-section class="q-pa-md">
        <!-- Title -->
        <div class="text-h6 text-weight-bolder leading-snug q-mb-xs">
          {{ props.title }}
        </div>

        <!-- Neighborhood & Address -->
        <div class="row items-center text-grey-8 text-caption q-mb-sm">
          <q-icon name="apartment" size="16px" class="q-mr-xs text-primary" />
          <span class="text-weight-bold q-mr-sm">{{ props.neighborhood }}</span>
          <template v-if="props.address">
            <q-separator vertical inset class="q-mx-xs" />
            <q-icon name="place" size="16px" class="q-mr-xs text-grey-6" />
            <span class="ellipsis">{{ props.address }}</span>
          </template>
        </div>

        <!-- Description -->
        <p v-if="props.description" class="text-body2 text-grey-9 q-mb-md occurrence-desc">
          {{ props.description }}
        </p>

        <!-- Photo preview if available -->
        <div v-if="props.photo_url" class="photo-container q-mb-md rounded-borders overflow-hidden">
          <q-img
            :src="props.photo_url"
            spinner-color="primary"
            style="max-height: 200px"
            fit="cover"
            class="rounded-borders"
          />
        </div>

        <!-- Author & Time -->
        <div class="row items-center justify-between text-caption text-grey-6 q-mb-md">
          <div class="row items-center">
            <q-avatar size="24px" color="grey-3" text-color="grey-8" class="q-mr-xs text-weight-bold">
              {{ (props.author_name || 'A').charAt(0).toUpperCase() }}
            </q-avatar>
            <span>{{ $t('occurrence.reportedBy') }} <strong>{{ props.author_name || 'Cidadão' }}</strong></span>
          </div>
          <span v-if="props.created_at_human">{{ props.created_at_human }}</span>
        </div>

        <q-separator class="q-mb-md" />

        <!-- Confirmations & Social Upvote Section -->
        <div class="row items-center justify-between">
          <!-- Quantitative likes display (Public: viewable by anyone without login) -->
          <div class="row items-center">
            <q-avatar size="36px" color="blue-1" text-color="primary" class="q-mr-sm">
              <q-icon name="thumb_up" size="18px" />
            </q-avatar>
            <div>
              <div class="text-weight-bolder text-subtitle1 leading-tight text-primary">
                {{ props.confirmations_count || 0 }}
              </div>
              <div class="text-caption text-grey-7 leading-tight">
                {{ $t('occurrence.confirmations') }}
              </div>
            </div>
          </div>

          <!-- Actions: Confirm / Upvote Button -->
          <div class="row items-center q-gutter-x-sm">
            <q-btn
              unelevated
              rounded
              :color="props.has_confirmed ? 'primary' : 'grey-2'"
              :text-color="props.has_confirmed ? 'white' : 'grey-9'"
              :icon="props.has_confirmed ? 'check_circle' : 'thumb_up'"
              :label="props.has_confirmed ? $t('occurrence.confirmedAction') : $t('occurrence.confirmAction')"
              :loading="confirmingLoading"
              class="text-weight-bold q-px-md"
              @click="handleToggleConfirm"
            />

            <!-- Owner Delete Action -->
            <q-btn
              v-if="isOwner"
              flat
              round
              dense
              color="negative"
              icon="delete_outline"
              @click="handleDelete"
            >
              <q-tooltip>{{ $t('occurrence.delete') }}</q-tooltip>
            </q-btn>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useOccurrencesStore } from '../stores/occurrences'
import { useAuthStore } from '../stores/auth'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'

const emit = defineEmits(['request-login'])

const occurrencesStore = useOccurrencesStore()
const authStore = useAuthStore()
const { t } = useI18n()
const $q = useQuasar()

const confirmingLoading = ref(false)

const isOpen = computed({
  get: () => !!occurrencesStore.selectedOccurrence,
  set: (val) => {
    if (!val) occurrencesStore.clearSelection()
  },
})

const occurrence = computed(() => occurrencesStore.selectedOccurrence)
const props = computed(() => occurrence.value?.properties || {})

const isOwner = computed(() => {
  if (!authStore.isAuthenticated || !authStore.user) return false
  return props.value.user_id === authStore.user.id
})

const typeColor = computed(() => {
  switch (props.value.type) {
    case 'flood_prone': return '#428CA7' // Azul Alagamento
    case 'pavement_repair': return '#C05C33' // Terracota
    case 'unpaved_street': return '#8C7355' // Terra/Marrom
    case 'waste_dumping': return '#889E58' // Verde Oliva
    case 'street_lighting': return '#E5A93C' // Amarelo Iluminação
    default: return '#2D5A27'
  }
})

const typeIcon = computed(() => {
  switch (props.value.type) {
    case 'flood_prone': return 'waves'
    case 'pavement_repair': return 'report_problem'
    case 'unpaved_street': return 'terrain'
    case 'waste_dumping': return 'delete'
    case 'street_lighting': return 'lightbulb'
    default: return 'place'
  }
})

const severityBadgeColor = computed(() => {
  switch (props.value.severity) {
    case 'critical': return 'negative'
    case 'high': return 'secondary'
    case 'medium': return 'warning'
    case 'low': return 'positive'
    default: return 'sand'
  }
})

async function handleToggleConfirm() {
  if (!authStore.isAuthenticated) {
    $q.notify({
      type: 'warning',
      message: t('occurrence.mustLoginToConfirm'),
      actions: [
        {
          label: t('app.login'),
          color: 'white',
          handler: () => emit('request-login'),
        },
      ],
    })
    return
  }

  confirmingLoading.value = true
  try {
    const res = await occurrencesStore.toggleConfirmation(props.value.id)
    $q.notify({
      type: res.has_confirmed ? 'positive' : 'info',
      message: res.message,
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

async function handleDelete() {
  $q.dialog({
    title: t('occurrence.delete'),
    message: t('occurrence.deleteConfirm'),
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await occurrencesStore.deleteOccurrence(props.value.id)
      $q.notify({
        type: 'positive',
        message: 'Ocorrência excluída com sucesso.',
      })
    } catch (err) {
      $q.notify({
        type: 'negative',
        message: 'Falha ao excluir ocorrência.',
      })
    }
  })
}
</script>

<style scoped>
.occurrence-card {
  width: 100%;
  max-width: 580px;
  border-radius: 24px 24px 16px 16px;
  overflow: hidden;
  margin: 0 auto 76px auto;
  background: #F7F2EE;
  border: 1px solid #D9C5B2;
  font-family: 'Public Sans', sans-serif;
  color: #3B2314;
}

@media (min-width: 600px) {
  .occurrence-card {
    border-radius: 28px;
    margin-bottom: 96px;
  }
}

.card-top-stripe {
  height: 44px;
}

.occurrence-desc {
  white-space: pre-wrap;
  line-height: 1.5;
  color: #3B2314;
}

.photo-container {
  border: 1px solid #D9C5B2;
}
</style>
