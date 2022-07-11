<template>
  <div class="wrap-audio">
    <audio autoPlay ref="audioRef" :muted="muted"></audio>
  </div>
</template>
<script>

export default {
  props: ["muted", "streamId", "client"],
  mounted() {
    this.renderAudio();
  },
  beforeDestroy() {
    this.$refs["audioRef"] && this.$refs["audioRef"].pause();
  },
  methods: {
    renderAudio() {
      const audioEle = this.$refs["audioRef"];
      if (audioEle && this.client) {
        this.client.setAudioRenderer(this.streamId, audioEle);
      }
    },
  },
};
</script>
<style scoped></style>
