import Vue from "vue";
import "./plugins/element.js";
import App from "./view/App.vue";
import "./assets/style/global.scss";
import SvgIcon from "./components/Svg/index.vue";

// 导入svg
Vue.component("svg-icon", SvgIcon);

const requireAll = (requireContext) =>
  requireContext.keys().map(requireContext);

const req = require.context("@/assets/img/svg", true, /\.svg$/);
requireAll(req);

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount("#app");
