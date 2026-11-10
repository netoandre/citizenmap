<template>
  <q-dialog v-model="isOpen" class="auth-dialog">
    <q-card class="auth-card shadow-10" style="min-width: 330px; max-width: 420px; width: 100%">
      <q-card-section class="row items-center justify-between q-pb-none">
        <div class="row items-center no-wrap">
          <q-avatar size="38px" class="q-mr-sm" style="background-color: #2D5A27; color: white">
            <q-icon name="account_circle" size="24px" />
          </q-avatar>
          <div class="text-subtitle1 text-weight-bolder" style="color: #3B2314">
            {{ tab === 'login' ? $t('auth.titleLogin') : $t('auth.titleRegister') }}
          </div>
        </div>
        <q-btn flat round dense icon="close" size="sm" style="color: #3B2314" v-close-popup />
      </q-card-section>

      <!-- Tabs Switch -->
      <q-card-section class="q-pt-sm q-pb-none">
        <q-tabs
          v-model="tab"
          dense
          active-color="primary"
          indicator-color="primary"
          align="justify"
          narrow-indicator
          style="color: #8C7355"
        >
          <q-tab name="login" :label="$t('app.login')" class="text-weight-bold" />
          <q-tab name="register" :label="$t('app.register')" class="text-weight-bold" />
        </q-tabs>
        <q-separator style="background-color: #D9C5B2" />
      </q-card-section>

      <q-card-section>
        <q-tab-panels v-model="tab" animated class="q-pa-none" style="background: transparent">
          <!-- Login Panel -->
          <q-tab-panel name="login" class="q-pa-none">
            <q-form @submit.prevent="handleLogin" class="q-gutter-y-sm">
              <q-input
                v-model="loginForm.email"
                type="email"
                dense
                outlined
                bg-color="white"
                :label="$t('auth.email')"
                :rules="[val => !!val || 'E-mail obrigatório']"
                hide-bottom-space
              >
                <template #prepend>
                  <q-icon name="mail" size="18px" style="color: #8C7355" />
                </template>
              </q-input>

              <q-input
                v-model="loginForm.password"
                type="password"
                dense
                outlined
                bg-color="white"
                :label="$t('auth.password')"
                :rules="[val => !!val || 'Senha obrigatória']"
                hide-bottom-space
              >
                <template #prepend>
                  <q-icon name="lock" size="18px" style="color: #8C7355" />
                </template>
              </q-input>

              <!-- Quick Demo Fill Helper -->
              <div class="text-right">
                <q-btn
                  flat
                  dense
                  size="xs"
                  style="color: #C05C33; font-weight: 700"
                  :label="$t('auth.quickDemo')"
                  @click="fillDemoUser"
                />
              </div>

              <div class="q-pt-xs">
                <q-btn
                  unelevated
                  rounded
                  :label="$t('auth.submitLogin')"
                  type="submit"
                  :loading="authStore.loading"
                  class="full-width text-weight-bold text-white"
                  style="background-color: #2D5A27 !important"
                />
              </div>
            </q-form>
          </q-tab-panel>

          <!-- Register Panel -->
          <q-tab-panel name="register" class="q-pa-none">
            <q-form @submit.prevent="handleRegister" class="q-gutter-y-sm">
              <q-input
                v-model="registerForm.name"
                dense
                outlined
                bg-color="white"
                :label="$t('auth.name')"
                :rules="[val => !!val || 'Nome obrigatório']"
                hide-bottom-space
              >
                <template #prepend>
                  <q-icon name="person" size="18px" style="color: #8C7355" />
                </template>
              </q-input>

              <q-input
                v-model="registerForm.email"
                type="email"
                dense
                outlined
                bg-color="white"
                :label="$t('auth.email')"
                :rules="[val => !!val || 'E-mail obrigatório']"
                hide-bottom-space
              >
                <template #prepend>
                  <q-icon name="mail" size="18px" style="color: #8C7355" />
                </template>
              </q-input>

              <q-input
                v-model="registerForm.password"
                type="password"
                dense
                outlined
                bg-color="white"
                :label="$t('auth.password')"
                :rules="[val => val.length >= 6 || 'Mínimo de 6 caracteres']"
                hide-bottom-space
              >
                <template #prepend>
                  <q-icon name="lock" size="18px" style="color: #8C7355" />
                </template>
              </q-input>

              <div class="q-pt-sm">
                <q-btn
                  unelevated
                  rounded
                  :label="$t('auth.submitRegister')"
                  type="submit"
                  :loading="authStore.loading"
                  class="full-width text-weight-bold text-white"
                  style="background-color: #2D5A27 !important"
                />
              </div>
            </q-form>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'

const authStore = useAuthStore()
const { t } = useI18n()
const $q = useQuasar()

const isOpen = ref(false)
const tab = ref('login')

const loginForm = reactive({
  email: '',
  password: '',
})

const registerForm = reactive({
  name: '',
  email: '',
  password: '',
})

function open(initialTab = 'login') {
  tab.value = initialTab
  isOpen.value = true
}

function fillDemoUser() {
  loginForm.email = 'maria.silva@exemplo.com'
  loginForm.password = 'password123'
}

async function handleLogin() {
  try {
    await authStore.login(loginForm.email, loginForm.password)
    $q.notify({
      type: 'positive',
      message: t('auth.loginSuccess'),
    })
    isOpen.value = false
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Falha ao autenticar.',
    })
  }
}

async function handleRegister() {
  try {
    await authStore.register(registerForm.name, registerForm.email, registerForm.password)
    $q.notify({
      type: 'positive',
      message: t('auth.registerSuccess'),
    })
    isOpen.value = false
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Falha ao registrar conta.',
    })
  }
}

defineExpose({
  open,
})
</script>

<style scoped>
.auth-card {
  border-radius: 24px;
  background-color: #F7F2EE;
  border: 1px solid #D9C5B2;
  font-family: 'Public Sans', sans-serif;
  color: #3B2314;
}

@media (max-width: 600px) {
  .auth-dialog :deep(.q-dialog__inner) {
    padding: 12px;
    padding-bottom: 76px;
  }
}
</style>
