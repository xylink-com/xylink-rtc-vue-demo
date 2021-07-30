import Vue from 'vue'
import App from './App.vue'
import "./plugins/element.js";
import "./assets/style/global.index.scss";

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
