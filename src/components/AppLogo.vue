<template>
  <div class="citizenmap-logo row items-center no-wrap cursor-pointer" @click="$emit('click')">
    <!-- SVG Icon -->
    <svg
      :width="iconSize"
      :height="iconSize"
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="logo-svg q-mr-sm"
    >
      <!-- Isometric Ground Grid -->
      <path
        d="M20 105 L70 85 L120 105 L70 125 Z"
        fill="#F5EBE6"
        stroke="#D9C5B2"
        stroke-width="3"
        stroke-linejoin="round"
      />
      <path d="M45 95 L95 115" stroke="#D9C5B2" stroke-width="2.5" />
      <path d="M45 115 L95 95" stroke="#D9C5B2" stroke-width="2.5" />
      <path d="M70 85 L70 125" stroke="#D9C5B2" stroke-width="2.5" />

      <!-- Pin Base Shadow -->
      <ellipse cx="70" cy="110" rx="14" ry="4" fill="#3B2314" opacity="0.25" />

      <!-- Main Map Pin Shape -->
      <path
        d="M70 108 C64 96 38 72 38 48 C38 30 52 16 70 16 C88 16 102 30 102 48 C102 72 76 96 70 108 Z"
        fill="#3B2314"
      />
      <!-- Inner cutout -->
      <circle cx="70" cy="48" r="26" fill="#F5EBE6" />

      <!-- Community People Figures -->
      <!-- Left Person -->
      <circle cx="58" cy="40" r="4.5" fill="#3B2314" />
      <path d="M52 54 C52 47 64 47 64 54 Z" fill="#3B2314" />

      <!-- Right Person (Terracotta) -->
      <circle cx="82" cy="40" r="4.5" fill="#C05C33" />
      <path d="M76 54 C76 47 88 47 88 54 Z" fill="#C05C33" />

      <!-- Center Lower Person -->
      <circle cx="70" cy="49" r="4" fill="#3B2314" />
      <path d="M64 61 C64 55 76 55 76 61 Z" fill="#3B2314" />

      <!-- Sprouting Green Leaves at the Top -->
      <!-- Left Leaf -->
      <path
        d="M70 28 C60 22 48 20 44 8 C58 8 68 18 70 28 Z"
        fill="#2D5A27"
      />
      <path
        d="M44 8 C54 18 64 24 70 28"
        stroke="#F5EBE6"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <!-- Right Leaf -->
      <path
        d="M70 28 C80 20 92 18 96 6 C82 6 72 16 70 28 Z"
        fill="#2D5A27"
      />
      <path
        d="M96 6 C86 16 76 22 70 28"
        stroke="#F5EBE6"
        stroke-width="1.5"
        stroke-linecap="round"
      />
    </svg>

    <!-- Brand Text -->
    <div v-if="showText" class="logo-typography">
      <span class="text-citizen">Citizen</span><span class="text-map">Map</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  iconSize: {
    type: [Number, String],
    default: 38,
  },
  showText: {
    type: Boolean,
    default: true,
  },
})

defineEmits(['click'])
</script>

<style scoped>
.citizenmap-logo {
  user-select: none;
}

.logo-typography {
  font-family: 'Public Sans', sans-serif;
  font-weight: 800;
  font-size: 1.35rem;
  letter-spacing: -0.5px;
  line-height: 1;
}

.text-citizen {
  color: #3B2314;
}

.text-map {
  color: #2D5A27;
}
</style>
