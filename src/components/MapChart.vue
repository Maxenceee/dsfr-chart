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
            v-if="isDep"
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
          <div
            v-if="isReg"
            class="france_container no_select"
            :style="{ display: displayFrance }"
          >
            <france-reg
              :config="FranceProps"
              :onclick="changeGeoLevel"
              :ondblclick="resetGeoFilters"
              :onenter="displayTooltip"
              :onleave="hideTooltip"
            />
          </div>
          <!-- <div
            v-if="isAcad"
            class="france_container no_select"
            :style="{ display: displayFrance }"
          >
            <france-acad
              :config="FranceProps"
              :onclick="changeGeoLevel"
              :ondblclick="resetGeoFilters"
              :onenter="displayTooltip"
              :onleave="hideTooltip"
            />
          </div> -->
          <div class="om_container fr-grid-row no_select">
            <div
              class="om fr-col-sm"
              :style="{ display: displayGuadeloupe }"
            >
              <span
                class="om_title fr-text--xs fr-my-1w"
                :style="{ color: dromColor }"
              >
                Guadeloupe
              </span>
              <guadeloupe
                height="50"
                :config="DromProps"
                :onclick="changeGeoLevel"
                :ondblclick="resetGeoFilters"
                :onenter="displayTooltip"
                :onleave="hideTooltip"
              />
            </div>
            <div
              class="om fr-col-sm"
              :style="{ display: displayMartinique }"
            >
              <span
                class="fr-text--xs fr-my-1w"
                :style="{ color: dromColor }"
              >
                Martinique
              </span>
              <martinique
                height="50"
                :config="DromProps"
                :onclick="changeGeoLevel"
                :ondblclick="resetGeoFilters"
                :onenter="displayTooltip"
                :onleave="hideTooltip"
              />
            </div>
            <div
              class="om fr-col-sm"
              :style="{ display: displayGuyane }"
            >
              <span
                class="fr-text--xs fr-my-1w"
                :style="{ color: dromColor }"
              >
                Guyane
              </span>
              <guyane
                height="50"
                :config="DromProps"
                :onclick="changeGeoLevel"
                :ondblclick="resetGeoFilters"
                :onenter="displayTooltip"
                :onleave="hideTooltip"
              />
            </div>
            <div
              class="om fr-col-sm"
              :style="{ display: displayReunion }"
            >
              <span
                class="fr-text--xs fr-my-1w"
                :style="{ color: dromColor }"
              >
                La Réunion
              </span>
              <reunion
                height="50"
                :config="DromProps"
                :onclick="changeGeoLevel"
                :ondblclick="resetGeoFilters"
                :onenter="displayTooltip"
                :onleave="hideTooltip"
              />
            </div>
            <div
              class="om fr-col-sm"
              :style="{ display: displayMayotte }"
            >
              <span
                class="fr-text--xs fr-my-1w"
                :style="{ color: dromColor }"
              >
                Mayotte
              </span>
              <mayotte
                height="50"
                :config="DromProps"
                :onclick="changeGeoLevel"
                :ondblclick="resetGeoFilters"
                :onenter="displayTooltip"
                :onleave="hideTooltip"
              />
            </div>
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
  name: 'MapChart',
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
    level: {
      type: String,
      default: 'dep',
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
    minimalMapInfo: {
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
      isDep: true,
      isReg: false,
      isAcad: false,
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
        valueNat: 0,
        valueReg: 0,
        selectedValueRaw: undefined,
        selectedValueCapped: undefined,
        date: '',
        noMapInfo: false,
        minimalMapInfo: false,
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
      DromProps: {
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
      displayGuyane: '',
      dromColor: '#6b6b6b',
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
    this.isDep = this.level === 'dep';
    this.isReg = this.level === 'reg';
    this.isAcad = this.level === 'acad';
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
      // Try exact code
      if (Object.prototype.hasOwnProperty.call(this.dataParse, code)) return this.dataParse[code];
      // Try without leading zero
      if (typeof code === 'string' && code.length === 2 && code.startsWith('0')) {
        const k = code.slice(1);
        if (Object.prototype.hasOwnProperty.call(this.dataParse, k)) return this.dataParse[k];
      }
      // Try with leading zero for 1-digit departments
      if (typeof code === 'string' && code.length === 1) {
        const k = ('0' + code);
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

      const palette = this.choosePalette();

      // Choisir les couleurs extrêmes basées sur la palette
      this.colorLeft = palette[0];
      this.colorRight = palette[palette.length - 1];
      this.InfoProps.colorMin = this.colorLeft;
      this.InfoProps.colorMax = this.colorRight;
      this.InfoProps.date = this.date;
      // Assurer un format cohérent pour MapInfo
      this.InfoProps.names = Array.isArray(this.name) ? this.name : [this.name];

      // Toujours utiliser TOUTES les valeurs pour l'échelle
      const values = [];
      for (const key in this.dataParse) {
        values.push(this.dataParse[key]);
      }

      let listDep = [];
      this.FranceProps.displayDep = {};

      // Déterminer quelles régions/départements afficher
      if (this.zoomDep) {
        if (this.isDep) {
          const region = this.getDep(this.zoomDep).region_value;
          listDep = this.getDepsFromReg(region);
        } else if (this.isReg) {
          listDep = this.getAllReg();
        } else if (this.isAcad) {
          listDep = [this.getAcad(this.zoomDep).value];
        }
      }

      // Calcul des min et max pour l'échelle
      const validValuesRaw = values.filter(v => v != null && !isNaN(this.toNumber(v)));
      const legendCap = this.legendMaxValue !== undefined && this.legendMaxValue !== null && !isNaN(Number(this.legendMaxValue)) ? Number(this.legendMaxValue) : undefined;
      const validValues = legendCap !== undefined
        ? validValuesRaw.map(v => Math.min(this.toNumber(v), legendCap))
        : validValuesRaw.map(v => this.toNumber(v));
      const anyAboveCap = legendCap !== undefined && validValuesRaw.some(v => this.toNumber(v) > legendCap);
      if (validValues.length === 0) {
        this.scaleMin = 0;
        this.scaleMax = 1;
      } else {
        this.scaleMin = Math.min(...validValues);
        this.scaleMax = Math.max(...validValues);
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

      // Coloration: distinguer dataset départemental vs régional
      const expectedFull = this.getAllDep ? this.getAllDep() : [];
      const expectedRegions = this.getAllReg ? [...new Set(this.getAllReg())] : [];
      const isDepDataset = this.level === 'dep';
      // Pour les régions, on boucle sur la liste complète des codes région (uniques) afin de griser celles réellement sans données
      const iterationCodes = isDepDataset ? expectedFull : expectedRegions;
      iterationCodes.forEach(code => {
        const className = 'FR-' + code;
        const elCol = parentWidget.getElementsByClassName(className);
        if (elCol.length === 0) return; // SVG path missing
        if (!this.zoomDep) {
          const raw = this.getValueForKey(code);
          const num = this.toNumber(raw);
          if (raw == null || isNaN(num)) {
            elCol[0].setAttribute('fill', '#9e9e9e');
          } else {
            const val = legendCap !== undefined ? Math.min(num, legendCap) : num;
            elCol[0].setAttribute('fill', colorScale(val));
          }
          this.FranceProps.displayDep[className] = '';
        } else {
          const raw = this.getValueForKey(code);
          const num = this.toNumber(raw);
          const polygon = elCol[0].getBBox();
          if (this.zoomDep === code) {
            if (raw == null || isNaN(num)) {
              elCol[0].setAttribute('fill', '#9e9e9e');
            } else {
              const val = legendCap !== undefined ? Math.min(num, legendCap) : num;
              elCol[0].setAttribute('fill', colorScale(val));
            }
            this.FranceProps.displayDep[className] = '';
            xmin.push(polygon.x);
            ymin.push(polygon.y);
            xmax.push(polygon.x + polygon.width);
            ymax.push(polygon.y + polygon.height);
          } else if (listDep.includes(code)) {
            if (raw == null || isNaN(num)) {
              elCol[0].setAttribute('fill', '#9e9e9e');
            } else {
              elCol[0].setAttribute('fill', this.colorLeft + 'B3');
            }
            this.FranceProps.displayDep[className] = '';
            xmin.push(polygon.x);
            ymin.push(polygon.y);
            xmax.push(polygon.x + polygon.width);
            ymax.push(polygon.y + polygon.height);
          } else {
            // Outside region: hide
            elCol[0].setAttribute('fill', 'rgba(255, 255, 255, 0)');
            this.FranceProps.displayDep[className] = 'none';
          }
        }
      });

      if (this.zoomDep) {
        // Logic for zoom level and dimensions adjustment
        if (this.isDep) {
          this.InfoProps.localisation = this.getDep(this.zoomDep).department;
          const xminValue = Math.min(...xmin);
          const yminValue = Math.min(...ymin);
          const xmaxValue = Math.max(...xmax);
          const ymaxValue = Math.max(...ymax);
          const width = xmaxValue - xminValue;
          const height = ymaxValue - yminValue;
          const size = Math.max(width, height);
          this.FranceProps.viewBox = `${xminValue} ${yminValue} ${size} ${size}`;
        } else if (this.isReg) {
          this.InfoProps.localisation = this.getReg(this.zoomDep).region;
        } else if (this.isAcad) {
          this.InfoProps.localisation = this.getAcad(this.zoomDep).academy;
        }
        // Selected area values (use RAW for display, capped only for color)
        const rawSelected = this.toNumber(this.getValueForKey(this.zoomDep));
        this.InfoProps.value = isNaN(rawSelected) ? `${this.prefix}${this.value}${this.suffix}` : `${this.prefix}${rawSelected}${this.suffix}`;
        // Utiliser valueReg pour les régions, valueNat pour les départements
        if (this.isReg) {
          this.InfoProps.valueReg = isNaN(rawSelected) ? 0 : rawSelected;
          this.InfoProps.valueNat = 0;
        } else {
          this.InfoProps.valueNat = isNaN(rawSelected) ? 0 : rawSelected;
          this.InfoProps.valueReg = 0;
        }
        this.InfoProps.selectedValueRaw = isNaN(rawSelected) ? undefined : rawSelected;
        this.InfoProps.selectedValueCapped = isNaN(rawSelected)
          ? undefined
          : (legendCap !== undefined ? Math.min(rawSelected, legendCap) : rawSelected);

        if (this.isDep) {
          this.displayFrance = 'none';
          this.displayGuadeloupe = 'none';
          this.displayMartinique = 'none';
          this.displayMayotte = 'none';
          this.displayReunion = 'none';
          this.displayGuyane = 'none';
          // Setting visibility for DOM regions
          if ((this.zoomDep === '971' && this.level === 'dep') || (this.zoomDep === '01' && this.level === 'reg')) {
            this.displayGuadeloupe = '';
          } else if ((this.zoomDep === '972' && this.level === 'dep') || (this.zoomDep === '02' && this.level === 'reg')) {
            this.displayMartinique = '';
          } else if ((this.zoomDep === '973' && this.level === 'dep') || (this.zoomDep === '03' && this.level === 'reg')) {
            this.displayGuyane = '';
          } else if ((this.zoomDep === '974' && this.level === 'dep') || (this.zoomDep === '04' && this.level === 'reg')) {
            this.displayReunion = '';
          } else if ((this.zoomDep === '976' && this.level === 'dep') || (this.zoomDep === '06' && this.level === 'reg')) {
            this.displayMayotte = '';
          } else {
            this.displayFrance = '';
          }
        }
      } else {
        this.InfoProps.localisation = 'France';
        this.InfoProps.value = `${this.prefix}${this.value}${this.suffix}`;
        this.InfoProps.valueNat = 0;
        this.InfoProps.valueReg = 0;
        this.InfoProps.selectedValueRaw = undefined;
        this.InfoProps.selectedValueCapped = undefined;
        this.FranceProps.viewBox = '0 0 1010 1010';
        this.displayFrance = '';
        this.displayGuadeloupe = '';
        this.displayMartinique = '';
        this.displayMayotte = '';
        this.displayReunion = '';
        this.displayGuyane = '';
      }

      this.InfoProps.names = this.name;
      this.InfoProps.min = this.scaleMin;
      this.InfoProps.max = this.scaleMax;
      this.InfoProps.colorMin = this.colorLeft;
      this.InfoProps.colorMax = this.colorRight;
      this.InfoProps.noMapInfo = this.noMapInfo;
      this.InfoProps.minimalMapInfo = this.minimalMapInfo;
      // Détermination précise des zones sans données: comparer aux codes attendus selon le niveau
      let expectedCodes = [];
      if (this.level === 'dep') {
        expectedCodes = this.getAllDep ? this.getAllDep() : [];
      } else if (this.level === 'reg') {
        expectedCodes = this.getAllReg ? [...new Set(this.getAllReg())] : [];
      }
      const hasNoData = expectedCodes.some(code => {
        const raw = this.getValueForKey(code);
        return raw === undefined || raw === null || isNaN(this.toNumber(raw));
      });
      this.InfoProps.hasNoData = hasNoData;
      this.InfoProps.noDataColor = '#9e9e9e';
      this.InfoProps.prefix = this.prefix;
      this.InfoProps.suffix = this.suffix;
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
        // No data: do not hover
        this.tooltip.visibility = 'hidden';
        return;
      }
      elCol[0].style.opacity = 0.8;
      // Hover displays RAW value (not capped)
      this.tooltip.value = `${this.prefix}${num}${this.suffix}`;
      if (this.isDep) {
        this.tooltip.place = this.getDep(hoverValue).department;
      } else if (this.isReg) {
        this.tooltip.place = this.getReg(hoverValue).region;
      } else if (this.isAcad) {
        this.tooltip.place = this.getAcad(hoverValue).academy;
      }

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
    changeTheme(theme) {
      if (theme === 'light') {
        this.dromColor = '#6b6b6b';
        this.FranceProps.colorStroke = '#FFFFFF';
        this.DromProps.colorStroke = '#FFFFFF';
      } else {
        this.dromColor = '#cecece';
        this.FranceProps.colorStroke = '#161616';
        this.DromProps.colorStroke = '#161616';
      }
      this.createChart();
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/styles/MapChart.scss';
</style>
