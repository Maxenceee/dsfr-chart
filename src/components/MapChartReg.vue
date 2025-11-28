<template>
  <Teleport
    defer
    :disabled="!$el?.ownerDocument.getElementById(databoxId) || (!databoxId && !databoxType && databoxSource === 'default')"
    :to="'#' + databoxId + '-' + databoxType + '-' + databoxSource"
  >
    <div
      :ref="widgetId"
      class="widget_container fr-grid-row"
    >
      <MapInfo
        :data="InfoProps"
        :legend-alt="legendAlt"
        :selected-palette="selectedPalette"
        :current-palette="currentPalette"
        @toggle-accessibility="toggleAccessibility"
      />
      <div class="fr-col-12 fr-col-lg-9 align-stretch">
        <button
          v-if="zoomDep"
          class="fr-btn fr-btn--sm fr-icon-close-line fr-btn--icon-left fr-btn--tertiary-no-outline fr-ml-4w"
          @click="resetGeoFilters"
        >
          Déselectionner
        </button>
        <div class="map">
          <div
            class="map_tooltip"
            :style="{ top: tooltip.top, left: tooltip.left, visibility: tooltip.visibility }"
          >
            <div class="tooltip_header fr-text--sm fr-mb-0">
              {{ tooltip.place }}
            </div>
            <div class="tooltip_body">
              <div class="tooltip_value-content">
                <div class="tooltip_value">
                  {{ tooltip.value }}
                </div>
              </div>
            </div>
          </div>
          <div
            class="france_container no_select"
            :style="{ display: displayFrance }"
          >
            <france
              :config="FranceProps"
              :onclick="changeGeoLevel"
              :ondblclick="resetGeoFilters"
              :onenter="displayTooltip"
              :onleave="hideTooltip"
            />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
import * as d3 from 'd3-scale';
import { interpolateRgb } from 'd3-interpolate';
import MapInfo from '@/components/MapInfo.vue';
import maps from '@/components/maps';
import { mapMixins, isMobile } from '@/utils/global.js';
import { choosePalette } from '@/utils/colors.js';

export default {
  name: 'MapChartReg',
  components: {
    MapInfo,
    ...maps,
  },
  mixins: [mapMixins],
  props: {
    databoxId: {
      type: String,
      default: null,
    },
    databoxType: {
      type: String,
      default: null,
    },
    databoxSource: {
      type: String,
      default: 'default',
    },
    data: {
      type: String,
      required: true,
    },
    value: {
      type: [Number, String],
      default: '',
    },
    date: {
      type: String,
      required: true,
    },
    region: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: 'Data',
    },
    selectedPalette: {
      type: String,
      default: 'sequentialAscending',
    },
    colors: {
      type: Array,
      default: undefined,
    },
    noMapInfo: {
      type: Boolean,
      default: false,
    },
    legendMaxValue: {
      type: [Number, String],
      default: undefined,
    },
    prefix: {
      type: String,
      default: '',
    },
    suffix: {
      type: String,
      default: '',
    },
    legendAlt: {
      type: String,
      default: 'Légende',
    },
  },
  data() {
    return {
      dataParse: {},
      widgetId: '',
      scaleMin: 0,
      scaleMax: 0,
      colorLeft: '',
      colorRight: '',
      currentPalette: this.selectedPalette,
      zoomDep: '',
      InfoProps: {
        localisation: '',
        names: [],
        min: 0,
        max: 0,
        maxLabel: '',
        legendCap: undefined,
        anyAboveCap: false,
        colorMin: '',
        colorMax: '',
        value: 0,
        valueReg: 0,
        selectedValueRaw: undefined,
        selectedValueCapped: undefined,
        date: '',
        noMapInfo: false,
        hasNoData: false,
        noDataColor: '#9e9e9e',
        prefix: '',
        suffix: '',
      },
      FranceProps: {
        viewBox: '0 0 1010 1010',
        displayDep: {},
        colorStroke: '#FFFFFF',
      },
      tooltip: {
        top: '0px',
        left: '0px',
        visibility: 'hidden',
        value: '',
        place: '',
      },
      displayFrance: '',
      displayGuadeloupe: '',
      displayMartinique: '',
      displayMayotte: '',
      displayReunion: '',
      displayGuyanne: '',
    };
  },
  watch: {
    $props: {
      handler() {
        // Check if the widget is already created to prevent useless re-renders
        if (this.widgetId) {
          // sync internal palette if prop changed from outside
          if (this.currentPalette !== this.selectedPalette) {
            this.currentPalette = this.selectedPalette;
          }
          this.createChart();
        }
      },
      deep: true,
      immediate: true,
    },
  },
  created() {
    this.widgetId = 'dsfr-widget-' + Math.floor(Math.random() * 1000);
  },
  mounted() {
    this.createChart();
    // The template is not retriggered in maps, force update to process after other elements
    this.$forceUpdate();

    const element = document.documentElement;
    element.addEventListener('dsfr.theme', (e) => {
      this.changeTheme(e.detail.theme);
    });
  },
  methods: {
    toNumber(val) {
      if (val === null || val === undefined) return NaN;
      if (typeof val === 'number') return val;
      if (typeof val !== 'string') return Number(val);
      const s = val.replace(/\s+/g, '').replace(',', '.');
      const n = parseFloat(s);
      return isNaN(n) ? NaN : n;
    },
    getValueForKey(code) {
      if (Object.prototype.hasOwnProperty.call(this.dataParse, code)) return this.dataParse[code];
      if (typeof code === 'string' && code.length === 2 && code.startsWith('0')) {
        const k = code.slice(1);
        if (Object.prototype.hasOwnProperty.call(this.dataParse, k)) return this.dataParse[k];
      }
      if (typeof code === 'string' && code.length === 1) {
        const k = '0' + code;
        if (Object.prototype.hasOwnProperty.call(this.dataParse, k)) return this.dataParse[k];
      }
      return undefined;
    },
    createChart() {
      const parentWidget = this.$refs[this.widgetId];

      // Parsing des données
      try {
        this.dataParse = JSON.parse(this.data);
      } catch (error) {
        console.error('Erreur lors du parsing des données data:', error);
        return;
      }

      // Choisir les couleurs extrêmes basées sur la palette
      const palette = this.choosePalette();

      this.colorLeft = palette[0];
      this.colorRight = palette[palette.length - 1];
      this.InfoProps.colorMin = this.colorLeft;
      this.InfoProps.colorMax = this.colorRight;
      this.InfoProps.date = this.date;
      // Assurer un format cohérent pour MapInfo
      this.InfoProps.names = Array.isArray(this.name) ? this.name : [this.name];

      const values = [];
      let listDep = [];

      this.FranceProps.displayDep = {};

      // Afficher uniquement les départements de la région sélectionnée
      listDep = this.getDepsFromReg(this.region);
      listDep.forEach((key) => {
        const v = this.toNumber(this.dataParse[key]);
        if (!isNaN(v)) values.push(v);
      });

      // Calcul des min et max pour l'échelle
      const legendCap = this.legendMaxValue !== undefined && this.legendMaxValue !== null && !isNaN(Number(this.legendMaxValue)) ? Number(this.legendMaxValue) : undefined;
      const anyAboveCap = legendCap !== undefined && values.some(v => v > legendCap);
      const cappedValues = legendCap !== undefined ? values.map(v => Math.min(v, legendCap)) : values.slice();
      if (cappedValues.length === 0) {
        this.scaleMin = 0;
        this.scaleMax = 1;
      } else {
        this.scaleMin = Math.min(...cappedValues);
        this.scaleMax = Math.max(...cappedValues);
      }
      this.InfoProps.maxLabel = anyAboveCap && legendCap !== undefined ? `> ${legendCap}` : String(this.scaleMax);
      this.InfoProps.legendCap = legendCap;
      this.InfoProps.anyAboveCap = anyAboveCap;

      // Define color scale based on regional values (interpolation RGB pour éviter les couleurs invalides)
      const colorScale = d3
        .scaleLinear()
        .domain([this.scaleMin, this.scaleMax])
        .interpolate(interpolateRgb)
        .range([this.colorLeft, this.colorRight]);

      let xmin = [],
        xmax = [],
        ymin = [],
        ymax = [];

      // Iterate over each department in France and hide
      for (const key in this.dataParse) {
        const className = 'FR-' + key;
        const elCol = parentWidget.getElementsByClassName(className);

        if (elCol.length !== 0) {
          elCol[0].setAttribute('fill', 'rgba(255, 255, 255, 0)');
        }
        this.FranceProps.displayDep[className] = 'none';
      }
      // Iterate over each department in the region and set colors
      listDep.forEach((key) => {
        const className = 'FR-' + key;
        const elCol = parentWidget.getElementsByClassName(className);

        if (!this.zoomDep) {
          if (listDep.includes(key)) {
            const polygon = elCol[0].getBBox();
            if (elCol.length !== 0) {
              const raw = this.getValueForKey(key);
              const num = this.toNumber(raw);
              if (raw == null || isNaN(num)) {
                elCol[0].setAttribute('fill', '#9e9e9e');
              } else {
                const val = legendCap !== undefined ? Math.min(num, legendCap) : num;
                elCol[0].setAttribute('fill', colorScale(val));
              }
            }
            this.FranceProps.displayDep[className] = '';
            xmin.push(polygon.x);
            ymin.push(polygon.y);
            xmax.push(polygon.x + polygon.width);
            ymax.push(polygon.y + polygon.height);
          }
        } else {
          if (this.zoomDep === key) {
            const polygon = elCol[0].getBBox();
            if (elCol.length !== 0) {
              const raw = this.getValueForKey(key);
              const num = this.toNumber(raw);
              if (raw == null || isNaN(num)) {
                elCol[0].setAttribute('fill', '#9e9e9e');
              } else {
                const val = legendCap !== undefined ? Math.min(num, legendCap) : num;
                elCol[0].setAttribute('fill', colorScale(val));
              }
            }
            this.FranceProps.displayDep[className] = '';
            xmin.push(polygon.x);
            ymin.push(polygon.y);
            xmax.push(polygon.x + polygon.width);
            ymax.push(polygon.y + polygon.height);
          } else if (listDep.includes(key)) {
            const polygon = elCol[0].getBBox();
            if (elCol.length !== 0) {
              // Non-selected deps: if no data, gray; else muted min color
              const raw = this.getValueForKey(key);
              const num = this.toNumber(raw);
              if (raw == null || isNaN(num)) {
                elCol[0].setAttribute('fill', '#9e9e9e');
                elCol[0].style.opacity = '1';
              } else {
                elCol[0].setAttribute('fill', this.colorLeft);
                elCol[0].style.opacity = '0.7';
              }
            }
            this.FranceProps.displayDep[className] = '';
            xmin.push(polygon.x);
            ymin.push(polygon.y);
            xmax.push(polygon.x + polygon.width);
            ymax.push(polygon.y + polygon.height);
          }
        }
      });

      // Calculate viewBox to focus on the selected region
      if (xmin.length && ymin.length && xmax.length && ymax.length) {
        const xminValue = Math.min(...xmin);
        const yminValue = Math.min(...ymin);
        const xmaxValue = Math.max(...xmax);
        const ymaxValue = Math.max(...ymax);
        const width = xmaxValue - xminValue;
        const height = ymaxValue - yminValue;
        const size = Math.max(width, height);
        this.FranceProps.viewBox = `${xminValue} ${yminValue} ${size} ${size}`;
      }

      this.InfoProps.localisation = this.getReg(this.region).department;
      // Region headline shows RAW selected region value when available
      // Valeur du département sélectionné (si disponible), sinon valeur régionale
      const rawSelected = this.toNumber(this.getValueForKey(this.zoomDep) ?? this.dataParse[this.region]);
      this.InfoProps.value = isNaN(rawSelected) ? `${this.prefix}${this.value}${this.suffix}` : `${this.prefix}${rawSelected}${this.suffix}`;
      this.InfoProps.valueReg = isNaN(rawSelected) ? 0 : rawSelected;
      this.InfoProps.min = this.scaleMin;
      this.InfoProps.max = this.scaleMax;
      this.InfoProps.noMapInfo = this.noMapInfo;
      this.InfoProps.selectedValueRaw = isNaN(rawSelected) ? undefined : rawSelected;
      this.InfoProps.selectedValueCapped = isNaN(rawSelected)
        ? undefined
        : (legendCap !== undefined ? Math.min(rawSelected, legendCap) : rawSelected);
      // Détermination précise: toutes les dépendances (départements) de la région doivent être présentes et valides
      const expectedCodes = listDep;
      const hasNoData = expectedCodes.some(code => {
        const raw = this.getValueForKey(code);
        return raw === undefined || raw === null || isNaN(this.toNumber(raw));
      });
      this.InfoProps.hasNoData = hasNoData;
      this.InfoProps.noDataColor = '#9e9e9e';
      this.InfoProps.prefix = this.prefix;
      this.InfoProps.suffix = this.suffix;
    },
    choosePalette() {
      // Using the refactored choosePalette function from utils
      return choosePalette(this.currentPalette || this.selectedPalette, this.colors);
    },
    toggleAccessibility() {
      const p = this.currentPalette || this.selectedPalette || '';
      let next = p;
      if (p === 'divergentAscending') next = 'sequentialAscending';
      else if (p === 'divergentDescending') next = 'sequentialDescending';
      else if (p === 'sequentialAscending') next = 'divergentAscending';
      else if (p === 'sequentialDescending') next = 'divergentDescending';
      this.currentPalette = next;
      this.createChart();
    },
    displayTooltip(e) {
      if (isMobile()) return;
      const parentWidget = this.$refs[this.widgetId];
      const hoverElement = e.target.className.baseVal;
      const hoverValue = hoverElement.replace('FR-', '');

      const elCol = parentWidget.getElementsByClassName(hoverElement);
      const raw = this.getValueForKey(hoverValue);
      const num = this.toNumber(raw);
      if (raw == null || isNaN(num)) {
        this.tooltip.visibility = 'hidden';
        return;
      }
      elCol[0].style.opacity = 0.8;
      // Hover displays RAW value (not capped)
      this.tooltip.value = `${this.prefix}${num}${this.suffix}`;
      this.tooltip.place = this.getDep(hoverValue).department;

      const franceRect = parentWidget.querySelector('.france_container').getBoundingClientRect();
      const tooltipRect = parentWidget.querySelector('.map_tooltip').getBoundingClientRect();
      const containerRect = e.target.getBoundingClientRect();

      const adjust = window.innerWidth > 1000 ? window.innerWidth / 30 : window.innerWidth / 15;

      let tooltipX = containerRect.x - franceRect.x + tooltipRect.width - adjust;
      let tooltipY = containerRect.y - franceRect.y;

      if (tooltipX + tooltipRect.width + adjust > franceRect.x) {
        tooltipX = containerRect.x / 2 - franceRect.x + tooltipRect.width + adjust / 2;
      }

      this.tooltip.top = tooltipY + 'px';
      this.tooltip.left = tooltipX + 'px';
      this.tooltip.visibility = 'visible';
    },
    hideTooltip(e) {
      if (isMobile()) return;
      this.tooltip.visibility = 'hidden';
      const parentWidget = this.$refs[this.widgetId];
      const hoverElement = e.target.className.baseVal;

      const elCol = parentWidget.getElementsByClassName(hoverElement);
      elCol[0].style.opacity = 1;
    },
    changeGeoLevel(e) {
      // Get clicked department value
      const hoverValue = e.target.className.baseVal.replace('FR-', '');
      const raw = this.getValueForKey(hoverValue);
      const num = this.toNumber(raw);
      if (raw == null || isNaN(num)) {
        // Prevent selecting areas without data
        return;
      }
      this.zoomDep = hoverValue;
      this.createChart();
    },
    resetGeoFilters() {
      this.zoomDep = '';
      this.createChart();
    },
    changeTheme(theme) {
      if (theme === 'light') {
        this.FranceProps.colorStroke = '#FFFFFF';
      } else {
        this.FranceProps.colorStroke = '#161616';
      }
      this.createChart();
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/styles/MapChart.scss';
</style>
