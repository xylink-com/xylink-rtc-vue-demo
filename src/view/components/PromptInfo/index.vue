<template>
  <div :class="['meeting-prompt', toolVisible ? '' : 'meeting-prompt-top']">
    <div v-if="forceLayoutId" class="meeting-prompt-box">
      主屏已被锁定
      <span class="lock-btn" @click="toggleForceFullScreen">
        解锁
      </span>
    </div>
    <div v-if="localHide" class="meeting-prompt-box">
      已开启隐藏本地画面模式
    </div>

    <div v-if="chairman" class="meeting-prompt-box">主会场模式</div>

    <div v-if="isLocalShareContent" class="meeting-prompt-box">本地共享中</div>

    <div v-if="content" class="meeting-prompt-box">
      <span class="meeting-prompt-content-name">{{ content.displayName }}</span>
      正在共享
    </div>
  </div>
</template>

<script>
export default {
  props: ['forceLayoutId', 'localHide', 'isLocalShareContent', 'content', 'chairman', 'toolVisible'],
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
@import './index.scss';
</style>
