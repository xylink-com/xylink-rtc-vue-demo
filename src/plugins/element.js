/**
 * import element ui lib
 */

import Vue from 'vue';
import Element from 'element-ui';
import VueTouch from 'vue-touch';
import '../assets/style/element-variables.scss';

Vue.use(Element);

VueTouch.registerCustomEvent('doubletap', {
  type: 'tap',
  taps: 2,
});

Vue.use(VueTouch, { name: 'v-touch' });
