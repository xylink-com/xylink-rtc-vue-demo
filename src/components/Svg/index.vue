<template>
  <svg :class="svgClass" aria-hidden="true">
    <use :xlink:href="iconName" />
  </svg>
</template>
<script>
export default {
  name: "SvgIcon",
  props: {
    icon: {
      type: String,
      default: "",
    },
    className: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "default",
    },
  },
  computed: {
    iconName() {
      return `#icon-${this.icon}`;
    },
    svgClass() {
      return `svg-icon ${this.type === "danger" ? "svg-icon-danger" : ""} ${
        this.className
      }`;
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>
