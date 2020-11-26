<template>
  <div className="wrap-audio">
    <audio autoPlay ref="audioRef" :muted="muted"></audio>
  </div>
</template>
<script>
import xyRTC from "@xylink/xy-rtc-sdk";

export default {
  props: ["item", "muted", "audioOutput"],
  mounted() {
    this.renderAudio(this.item);
  },
  beforeDestroy() {
    this.$refs["audioRef"] && this.$refs["audioRef"].pause();
  },
  methods: {
    renderAudio(newValue) {
      const audioEle = this.$refs["audioRef"];
      if (audioEle && !audioEle.srcObject && newValue) {
        audioEle.srcObject =  newValue.data.streams[0];

        if (audioEle.paused) {
          audioEle.play();
        }
      }
    },
  },
  watch: {
    audioOutput: {
      handler(newValue) {
        // 扬声器
        if (newValue && this.item.status !== "local") {
          xyRTC.setOutputAudioDevice(this.$refs["audioRef"], newValue);
        }
      },
    },
    item: {
      handler(newValue) {
        this.renderAudio(newValue);
      },
      deep: true,
    },
  },
};
</script>
<style scoped></style>
