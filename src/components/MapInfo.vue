<template>
  <div class="map_info fr-col-12 fr-col-lg-3">
    <div v-if="(data['valueNat'] || data['valueReg']) && !data['noMapInfo'] && !data['minimalMapInfo']">
      <p
        class="fr-text--xs fr-mb-1v"
        :style="{ color: data['textMention'] }"
      >
        Mise à jour : {{ data['date'] }}
      </p>
      <p
        class="fr-text--xs fr-text--bold fr-mb-1v"
        :style="{ color: data['textMention'] }"
      >
        {{ data['names'] }}, en France
      </p>
      <div class="sep fr-mb-2w" />
      <p
        class="fr-text--xs fr-text--bold fr-mb-2w"
        :style="{ color: data['textMention'] }"
      >
        {{ data['value'] }}
      </p>
    </div>
    <div v-if="!data['minimalMapInfo'] || (data['valueNat'] || data['valueReg'])">
      <p
        class="fr-text--xs fr-mb-1v"
        :style="{ color: data['textMention'] }"
      >
        Localisation
      </p>
      <p class="flex fr-text--sm fr-text--bold fr-mb-2w">
        <span>{{ data['localisation'] }}</span>
      </p>
      <p
        v-if="!data['minimalMapInfo']"
        class="fr-text--xs fr-mb-1v"
        :style="{ color: data['textMention'] }"
      >
        Mise à jour : {{ data['date'] }}
      </p>
      <p
        v-if="!data['minimalMapInfo']"
        class="fr-text--sm fr-text--bold fr-mb-1v"
      >
        {{ data['names'] }}
      </p>
      <p
        v-if="data['minimalMapInfo'] && (data['valueNat'] || data['valueReg'])"
        class="fr-text--xs fr-mb-1v"
        :style="{ color: data['textMention'] }"
      >
        Valeur
      </p>
      <p class="fr-text--md fr-text--bold fr-my-0">
        {{ selectedValueLabel }}
      </p>
    </div>
    <div class="scale fr-mt-auto">
      <div class="sep fr-my-2w" />
      <div class="legend_header">
        <p
          class="fr-text--xs fr-mb-1w"
          :style="{ color: data['textMention'] }"
        >
          {{ legendAlt || 'Légende' }}
        </p>
      </div>
      <div
        class="scale_container"
        :style="{ background: gradient }"
      >
        <div
          v-if="showMarker"
          class="scale_marker"
          :style="{ left: markerLeft }"
        >
          <span
            class="fr-icon-arrow-down-s-fill"
            aria-hidden="true"
          />
        </div>
      </div>
      <div class="scale_values">
        <span class="min fr-text--sm fr-text--bold fr-mb-0">{{ formatNumber(data['min']) }}</span>
        <span class="max fr-text--sm fr-text--bold fr-mb-0">{{ data['maxLabel'] ? data['maxLabel'] : formatNumber(data['max']) }}</span>
      </div>
      <div
        v-if="data['hasNoData']"
        class="legend_na_block na_below"
      >
        <span
          class="na_bar"
          :style="{ background: data['noDataColor'], width: '1.5rem', height: '1.5rem', display: 'inline-block', verticalAlign: 'middle', border: 'none' }"
        />
        <span
          class="na_label fr-text--xs"
          :style="{ display: 'inline-flex', alignItems: 'center', height: '1.5rem', lineHeight: '1.5rem', margin: '0 0 0 0.5rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }"
        >
          Pas de données
        </span>
      </div>
      <div
        v-if="isPaletteToggleEligible"
        class="legend_accessibility fr-mt-1w"
      >
        <button
          class="fr-btn fr-btn--sm fr-btn--tertiary-no-outline"
          type="button"
          :aria-pressed="isAccessibilityOn ? 'true' : 'false'"
          @click="onToggleAccessibility"
        >
          <span
            :class="isAccessibilityOn ? 'fr-icon-accessibility-fill' : 'fr-icon-accessibility-line'"
            aria-hidden="true"
          />
          <span class="fr-ml-1v fr-text--xs">
            {{ isAccessibilityOn ? 'Mode accessibilité activé' : 'Rendre le graphique accessible' }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatNumber } from '@/utils/global.js';

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  legendAlt: {
    type: String,
    default: 'Légende',
  },
  selectedPalette: {
    type: String,
    default: '',
  },
  currentPalette: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['toggle-accessibility']);

const gradient = computed(() => {
  return 'linear-gradient(90deg,' + props.data['colorMin'] + ' 0%,' + props.data['colorMax'] + ' 100%)';
});

// hasSelectedValue removed (visibility follows original truthy checks)

// headlineLabel removed (no longer used)

const selectedValueLabel = computed(() => {
  const prefix = props.data['prefix'] || '';
  const suffix = props.data['suffix'] || '';

  // Prefer explicit raw selected value first, then national, then regional.
  const candidates = [props.data['selectedValueRaw'], props.data['valueNat'], props.data['valueReg']]
    .filter(v => v !== undefined && v !== null && !Number.isNaN(Number(v)));

  if (!candidates.length) {
    // Fall back to the preformatted string if available.
    return typeof props.data['value'] === 'string' ? props.data['value'] : '';
  }

  // If first candidate is 0 but there exists a non‑zero candidate, pick the first non‑zero.
  let val = candidates[0];
  if (Number(val) === 0) {
    const nonZero = candidates.find(v => Number(v) !== 0);
    if (nonZero !== undefined) val = nonZero;
  }

  return `${prefix}${formatNumber(Number(val))}${suffix}`;
});

const showMarker = computed(() => {
  return props.data['selectedValueCapped'] !== undefined && props.data['min'] !== undefined && props.data['max'] !== undefined;
});

const markerLeft = computed(() => {
  const min = Number(props.data['min']);
  const max = Number(props.data['max']);
  let val = Number(props.data['selectedValueCapped']);
  if (Number.isNaN(min) || Number.isNaN(max) || max <= min || Number.isNaN(val)) return '0%';
  // Clamp between min and max
  if (val < min) val = min;
  if (val > max) val = max;
  const pct = ((val - min) / (max - min)) * 100;
  return pct.toFixed(2) + '%';
});

// Bouton visible uniquement si la palette ORIGINALE (selectedPalette) est divergente
const isPaletteToggleEligible = computed(() => {
  const p = props.selectedPalette || '';
  return ['divergentAscending', 'divergentDescending'].includes(p);
});

// État accessibilité basé sur la palette COURANTE (currentPalette)
const isAccessibilityOn = computed(() => {
  const p = props.currentPalette || '';
  return p.startsWith('sequential');
});

function onToggleAccessibility() {
  emit('toggle-accessibility');
}
</script>

<style scoped lang="scss">
@import '@/styles/MapInfo.scss';

.legend_header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.legend_na_block {
  display: flex;
  align-items: center; /* center label vertically with the box */
  justify-content: flex-start; /* align block to the left */
  gap: 8px;
  height: 1.5rem; /* same height as scale bar */
}
.na_bar {
  width: 1.5rem; /* same size as scale height for a square */
  height: 100%;
  flex: 0 0 1.5rem;
}
.na_label {
  white-space: nowrap;
  display: inline-flex;
  align-items: center; /* vertically center text within the 1.5rem height */
  height: 1.5rem;
  line-height: 1.5rem; /* override DSFR default line-height to visually center */
}
.scale_container {
  position: relative;
  flex: 1 1 auto;
}
.na_below {
  margin-top: 8px;
}
.scale_marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  color: #ffffff;
  font-weight: 700;
  text-shadow: 0 0 2px rgba(0,0,0,0.6);
  pointer-events: none;
}
</style>
