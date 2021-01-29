<template>
  <div class="loading">
    <div class="loading-content">
      <div class="avatar">
        <img
          src="https://cdn.xylink.com/wechatMP/images/device_cm_ios%402x.png"
          alt="nemo-avatar"
        />
      </div>
      <div class="name">正在呼叫 {{ meeting }}</div>
      <div class="stop" @click="stop('OK')">
        <img
          src="https://cdn.xylink.com/wechatMP/images/end.png"
          alt="end-call"
        />
      </div>
      <audio
        ref="bgmAudioRef"
        autoPlay
        loop
        src="https://cdn.xylink.com/wechatMP/ring.ogg"
      ></audio>
    </div>
  </div>
</template>
<script>
import xyRTC from "@xylink/xy-rtc-sdk";
export default {
  props: ["meeting", "audioOutputValue", "callStatus"],
  mounted() {
    const bgmAudioEle = this.$refs["bgmAudioRef"];

    xyRTC.setOutputAudioDevice(bgmAudioEle, this.audioOutputValue || "default");
  },
  methods: {
    stop() {
      this.$emit("stop");
    },
  },
  watch: {
    callStatus: {
      handler(newValue) {
        const { callMeeting, callLoading } = newValue;

        const bgmAudioEle = this.$refs["bgmAudioRef"];

        if (!callLoading && bgmAudioEle) {
          bgmAudioEle.pause();
        }

        if (callMeeting && callLoading) {
          xyRTC.setOutputAudioDevice(
            bgmAudioEle,
            this.audioOutputValue || "default"
          );
        }
      },
      deep: true,
    },
  },
};
</script>
<style scoped></style>
