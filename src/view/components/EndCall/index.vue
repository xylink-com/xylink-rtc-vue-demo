<template>
  <el-popover v-if="isPc" v-model="visible" popper-class="end-call-popover" placement="top" title="" trigger="click">
    <div class="xy-btn-box">
      <div v-for="(item, index) in endCallData" :key="index" :class="item.className" @click="item.onHandle">
        {{ item.text }}
      </div>
    </div>
    <div slot="reference" class="button button-warn end-call">
      <svg-icon icon="end_call" type="danger" />
      <div class="title">挂断</div>
    </div>
  </el-popover>

  <div v-else>
    <div slot="reference" class="button button-warn end-call" @click="show">
      <svg-icon icon="end_call" type="danger" />
      <div class="title">挂断</div>
    </div>

    <el-drawer
      :visible.sync="visible"
      direction="btt"
      :before-close="cancel"
      :append-to-body="true"
      :withHeader="false"
      custom-class="xy__drawer-end"
    >
      <div class="xy-btn-box">
        <div v-for="(item, index) in endCallData" :key="index" :class="item.className" @click="item.onHandle">
          {{ item.text }}
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { isPc } from '@/utils/browser';

export default {
  data() {
    return {
      isPc,
      visible: false,
      endCallData: [
        {
          text: '离开会议',
          className: 'xy-btn xy-end-btn',
          onHandle: this.stop,
        },
        {
          text: '取消',
          className: 'xy-btn xy-cancel-btn',
          onHandle: this.cancel,
        },
      ],
    };
  },
  methods: {
    show() {
      this.visible = true;
    },
    cancel() {
      this.visible = false;
    },
    stop() {
      this.visible = false;
      this.$emit('stop');
    },
  },
};
</script>
<style lang="scss">
@import './index.scss';
</style>
