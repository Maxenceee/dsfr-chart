<template>
  <Teleport
    defer
    :disabled="teleportDisabled"
    :to="targetSelector"
  >
    <div
      :ref="widgetId"
      class="widget_container smart-scalar"
    >
      <div
        class="smart-scalar__value"
        :class="{ 'smart-scalar__value--compact': compactPrimaryNumber }"
      >
        <span
          v-if="prefix"
          class="smart-scalar__affix smart-scalar__affix--prefix"
        >{{ prefix }}</span>
        <span class="smart-scalar__number">{{ displayValue }}</span>
        <span
          v-if="suffix"
          class="smart-scalar__affix smart-scalar__affix--suffix"
        >{{ suffix }}</span>
      </div>

      <div
        v-if="valueSubtitle"
        class="smart-scalar__subtitle"
      >
        <span>{{ valueSubtitle }}</span>
      </div>

      <div
        v-if="timeframe"
        class="smart-scalar__timeframe"
      >
        <span>{{ timeframe }}</span>
      </div>

      <div class="smart-scalar__evolution">
        <template v-if="hasPreviousValue || change !== null">
          <span
            class="smart-scalar__change"
            :style="{ color: positiveSlope ? positiveColor : negativeColor }"
          >
            <span
              class="smart-scalar__arrow"
              aria-hidden="true"
            >
              <span
                :class="positiveSlope ? 'fr-icon-arrow-up-s-fill' : 'fr-icon-arrow-down-s-fill'"
                aria-hidden="true"
              />
            </span>
            {{ absoluteChangePercent }}%
          </span>
          <span class="smart-scalar__previous">
            <small>par rapport à la {{ trendingLabel }}</small>
            <small v-if="displayPreviousValue && previousValue !== null"> : {{ prefix }}{{ displayPreviousValue }}{{ suffix }}</small>
          </span>
        </template>
        <template v-else>
          <small
            v-if="!noCompare"
            class="smart-scalar__no-prev"
          ><i>Pas de données sur la période précédente</i></small>
        </template>
      </div>
    </div>
  </Teleport>
</template>
<script>
export default {
  name: 'SmartScalar',
  props: {
    databoxId: { type: String, default: null },
    databoxType: { type: String, default: null },
    databoxSource: { type: String, default: 'default' },
    value: { type: [Number, String], required: true },
    valueSubtitle: { type: String, default: '' },
    previousValue: { type: [Number, String], default: null },
    change: { type: Number, default: null }, // proportion (0.12 = +12%)
    prefix: { type: String, default: '' },
    suffix: { type: String, default: '' },
    unit: { type: String, default: null }, // 'week' | 'month' | 'year' | custom
    periodStart: { type: [String, Date], default: null },
    periodEnd: { type: [String, Date], default: null },
    scale: { type: Number, default: 1 },
    decimals: { type: Number, default: null },
    previousDecimals: { type: Number, default: null },
    compactPrimaryNumber: { type: Boolean, default: false },
    compactPreviousNumber: { type: Boolean, default: false },
    switchPositiveNegative: { type: Boolean, default: false },
    roundChange: { type: Boolean, default: false },
    trendingLabel: { type: String, default: '' },
    positiveColor: { type: String, default: 'lightgreen' },
    negativeColor: { type: String, default: 'red' },
    noCompare: { type: Boolean, default: false },
  },
  data() {
    return {
      widgetId: 'dsfr-widget-' + Math.floor(Math.random() * 1000),
      mountedReady: false
    };
  },
  computed: {
    targetId() {
      if (!this.databoxId || !this.databoxType) return null;
      return `${this.databoxId}-${this.databoxType}-${this.databoxSource}`;
    },
    targetSelector() {
      return this.targetId ? `#${this.targetId}` : undefined;
    },
    teleportDisabled() {
      // Désactive si aucune cible ou cible absente (au moment du rendu/monté)
      if (!this.targetId) return true;
      // Utilise document directement (this.$el n'est pas fiable avant mounted)
      return !document.getElementById(this.targetId);
    },
    rawValue() {
      const n = this.toNumber(this.value);
      return n === null ? null : n * this.scale;
    },
    rawPrevValue() {
      const n = this.toNumber(this.previousValue);
      return n === null ? null : n * this.scale;
    },
    changeComputed() {
      if (this.change !== null && this.change !== undefined) return this.change;
      if (this.rawValue !== null && this.rawPrevValue !== null && this.rawPrevValue !== 0) {
        return (this.rawValue - this.rawPrevValue) / this.rawPrevValue;
      }
      return 0;
    },
    hasPreviousValue() {
      return this.rawPrevValue !== null;
    },
    displayValue() {
      return this.formatNumber(this.rawValue, this.decimals, this.compactPrimaryNumber);
    },
    displayPreviousValue() {
      return this.formatNumber(this.rawPrevValue, this.previousDecimals ?? this.decimals, this.compactPreviousNumber);
    },
    absoluteChangePercent() {
      const digits = this.roundChange ? 0 : 2;
      return Math.abs((this.changeComputed || 0) * 100).toLocaleString('fr-FR', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      });
    },
    positiveSlope() {
      return this.switchPositiveNegative ? this.changeComputed <= 0 : this.changeComputed > 0;
    },
    timeframe() {
      if (!this.periodStart) return '';
      const start = new Date(this.periodStart);
      if (isNaN(start.getTime())) return '';
      if (this.periodEnd) {
        const endDate = new Date(this.periodEnd);
        if (isNaN(endDate.getTime())) return '';
        const opts = { day: 'numeric', month: 'short', year: 'numeric' };
        const fs = start.toLocaleDateString('fr-FR', opts);
        const fe = endDate.toLocaleDateString('fr-FR', opts);
        return fs === fe ? fs : `${fs} - ${fe}`;
      } else {
      let end = new Date(start);
      switch (this.unit) {
        case 'week':
          end.setDate(start.getDate() + 6);
          break;
        case 'month':
          end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
          break;
        case 'year':
          return String(start.getFullYear());
        default:
          break;
      }
      const opts = { day: 'numeric', month: 'short', year: 'numeric' };
      const fs = start.toLocaleDateString('fr-FR', opts);
      const fe = end.toLocaleDateString('fr-FR', opts);
      return fs === fe ? fs : `${fs} - ${fe}`;
      }
    }
  },
  mounted() {
    // Déclenche un recalcul après le montage pour que document.getElementById soit disponible
    this.mountedReady = true;
  },
  methods: {
    toNumber(v) {
      if (v === null || v === undefined || v === '') return null;
      if (typeof v === 'number') return v;
      const n = Number(String(v).replace(/\s/g, '').replace(',', '.'));
      return isNaN(n) ? null : n;
    },
    formatNumber(value, decimals, compact) {
      if (value === null) return 'N/A';
      const opts = {
        minimumFractionDigits: decimals ?? (Number.isInteger(value) ? 0 : 2),
        maximumFractionDigits: decimals ?? (Number.isInteger(value) ? 0 : 2)
      };
      if (compact) {
        opts.notation = 'compact';
        opts.compactDisplay = 'short';
      }
      return value.toLocaleString('fr-FR', opts);
    }
  }
};
</script>

<style scoped>
.smart-scalar { display: flex; flex-direction: column; align-items: center; font-family: system-ui, sans-serif; }
.smart-scalar__value { font-size: 3rem; font-weight: 600; line-height: 1.1; text-align: center; word-break: break-word; }
.smart-scalar__value--compact { font-size: 2.5rem; }
.smart-scalar__affix { opacity: 0.85; }
.smart-scalar__subtitle { margin-top: .5rem; font-size: .9rem; font-weight: 600; text-align: center; }
.smart-scalar__timeframe { margin-top: .25rem; font-size: .85rem; color: var(--text-mention-grey); }
.smart-scalar__evolution { margin-top: .5rem; font-size: .9rem; display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; justify-content: center; }
.smart-scalar__change { display: flex; align-items: center; gap: .25rem; font-weight: 500; }
.smart-scalar__arrow { width: 1rem; height: 1rem; }
.smart-scalar__separator { color: var(--text-mention-grey); }
.smart-scalar__previous { color: var(--text-mention-grey); }
.smart-scalar__no-prev { color: var(--text-mention-grey); }
@media (max-width: 600px) { .smart-scalar__value { font-size: 2.25rem; } }
</style>
