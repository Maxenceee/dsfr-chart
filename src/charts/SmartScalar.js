import { defineCustomElement } from 'vue';

import '@/styles/style.scss';

import SmartScalar from '@/components/SmartScalar.vue';

const SmartScalarElement = defineCustomElement(SmartScalar, { shadowRoot: false });

customElements.define('smart-scalar', SmartScalarElement);
