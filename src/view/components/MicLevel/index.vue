<template>
  <div class="aec" v-if="audio === 'unmuteAudio'">
    <div
      class="aec_content"
      :style="{ transform: `translateY(-${micLevel}%)` }"
    />
  </div>
</template>

<script>
export default {
  props: ["audio", "videoAudioTrack"],
  data() {
    return {
      audioLevelTimmer: null,
      micLevel: 0, // 音量等级
    };
  },
  mounted() {
    this.setMicLevel();
  },
  beforeDestroy() {
    this.micLevel = 0;
    // 清理定时器
    this.clearTimmer();
  },
  methods: {
    clearTimmer() {
      this.audioLevelTimmer && clearInterval(this.audioLevelTimmer);
      this.audioLevelTimmer = null;
      this.micLevel = 0;
    },
    // 设置音量
    setMicLevel(audio = this.audio) {

      if (audio !== "unmuteAudio" || this.audioLevelTimmer) {
        this.clearTimmer();
        return;
      }

      this.audioLevelTimmer = setInterval(async () => {
        if (this.videoAudioTrack) {
          try {
            const level = await this.videoAudioTrack.getAudioLevel();

            // 更新Audio的实时音量显示
            this.micLevel = level;
          } catch (err) {
            this.clearTimmer();
          }
        }
      }, 500);
    },
  },
  watch: {
    audio: {
      handler(newValue) {
        this.setMicLevel(newValue);
      },
    },
  },
};
</script>
<style lang="scss" scoped>
@import "./index.scss";
</style>
