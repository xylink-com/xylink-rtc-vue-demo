<template>
  <div class="loading">
    <div class="loading-content">
      <div class="avatar">
        <img src="@/assets/img/confernece.png" alt="nemo-avatar" />
      </div>
      <div class="name">
        <div class="calling">正在呼叫</div>
        <div class="text">{{ conferenceInfo && conferenceInfo.displayName }}</div>
      </div>
      <div class="stop-btn" @click="stop('OK')">
        <svg-icon icon="hang_up" />
      </div>

      <audio ref="bgmAudioRef" autoPlay loop src="@/assets/ring.wav"></audio>
    </div>
  </div>
</template>
<script>
import xyRTC from "@xylink/xy-rtc-sdk";
export default {
  props: ["conferenceInfo", "audioOutputValue"],
  async mounted() {
    const bgmAudioEle = this.$refs["bgmAudioRef"];

    xyRTC.setOutputAudioDevice(bgmAudioEle, this.audioOutputValue || "default");

    if (bgmAudioEle.paused) {
      try {
        await bgmAudioEle.play();
      } catch (error) {
        console.log("bgmAudio play error:", error);
      }
    }
  },
  beforeDestroy() {
    const bgmAudioEle = this.$refs["bgmAudioRef"];

    bgmAudioEle.pause();
  },
  methods: {
    stop() {
      this.$emit("stop");
    },
  },
};
</script>
<style lang="scss" scoped>
@import "./index.scss";
</style>
