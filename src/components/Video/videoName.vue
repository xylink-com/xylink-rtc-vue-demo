<template>
  <div class="video-status">
    <div v-if="!item.roster.isContent" :class="videoNameClass"></div>
    <div class="name">{`${this.item.roster.displayName || "Local"}`}</div>
  </div>
</template>
<script>
export default {
  props: ["item"],
  computed: {
    videoNameClass() {
      return this.item.roster.audioTxMute
        ? "audio-muted-status"
        : "audio-unmuted-status";
    },
  },
};
</script>
