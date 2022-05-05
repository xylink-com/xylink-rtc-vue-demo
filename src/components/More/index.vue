<template>
  <el-popover
    popper-class="more-select-popover"
    placement="top"
    title=""
    trigger="hover"
  >
    <ul class="more-select">
      <li @click="onToggleSetting">设置</li>
    </ul>
    <div class="button" slot="reference">
      <svg-icon icon="more" />
      <div class="title">更多</div>
    </div>
  </el-popover>
</template>
<script>
export default {
  data() {
    return {};
  },
  methods: {
    onToggleSetting() {
      this.$emit("onToggleSetting");
    },
  },
};
</script>
<style lang="scss">
@import "./index.scss";
</style>
