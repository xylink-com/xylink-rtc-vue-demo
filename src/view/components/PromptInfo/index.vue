<template>
  <div :class="['meeting-prompt', toolVisible ? '' : 'meeting-prompt-top']">
    <div
      v-if="forceLayoutId"
      class="meeting-prompt-box"
    >
      主屏已被锁定
      <span
        class="lock-btn"
        @click="toggleForceFullScreen"
      >
        解锁
      </span>
    </div>
    <div
      v-if="localHide"
      class="meeting-prompt-box"
    >
      已开启隐藏本地画面模式
    </div>

    <div
      class="meeting-prompt-box"
      v-if="recordStatus === 1"
    >
      <Timer before>云端录制</Timer>
    </div>

    <div
      class="meeting-prompt-box"
      v-if="recordStatus === 2 || recordStatus === 3"
    >
      <Timer
        before
        :time="false"
      >
        <div class="remote-record-content">
          <span>云端录制</span>
          {{recordStatus === 3 ? '暂停中' : '录制中'}}
        </div>
      </Timer>
    </div>

    <div
      v-if="chairman"
      class="meeting-prompt-box"
    >主会场模式</div>

    <div
      v-if="isLocalShareContent"
      class="meeting-prompt-box"
    >本地共享中</div>

    <div
      v-if="content"
      class="meeting-prompt-box"
    >
      <span class="meeting-prompt-content-name">{{ content.displayName }}</span>
      正在共享
    </div>
  </div>
</template>

<script>
import Timer from './timer.vue';

export default {
  props: ['forceLayoutId', 'localHide', 'isLocalShareContent', 'content', 'chairman', 'toolVisible', 'recordStatus'],
  components: {
    Timer
  },
  data() {
    return {};
  },
  methods: {
    toggleForceFullScreen() {
      this.$emit('forceFullScreen');
    },
  },
};
</script>
<style lang="scss" scoped>
@import "./index.scss";
</style>
