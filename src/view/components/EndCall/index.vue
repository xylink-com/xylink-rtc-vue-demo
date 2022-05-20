<template>
  <el-popover
    v-model="visible"
    popper-class="end-call-popover"
    placement="top"
    title=""
    trigger="click"
  >
    <div class="xy-btn-box">
      <div class="xy-btn xy-end-btn" @click="stop">
        离开会议
      </div>
      <div class="xy-btn xy-cancel-btn" @click="cancle">
        取消
      </div>
    </div>
    <div slot="reference" class="button button-warn end-call">
      <svg-icon icon="end_call" type="danger" />
      <div class="title">挂断</div>
    </div>
  </el-popover>
</template>

<script>
export default {
  data() {
    return {
      visible: false,
    };
  },
  methods: {
    cancle() {
      this.visible = false;
    },
    stop() {
      this.visible = false;
      this.$emit("stop");
    },
  },
};
</script>
<style lang="scss">
@import "./index.scss";
</style>
