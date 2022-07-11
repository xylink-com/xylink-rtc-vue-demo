<template>
  <div :class="audioValue.audioClass" @click="audioOperate">
    <div class="mic-icon">
      <MicLevel
        v-if="permission.microphone !== 'denied' && !disableAudio"
        :stream="stream"
        :audio="audio"
      />
      <svg-icon :icon="audioValue.svgIcon" :type="audioValue.svgType" />
    </div>
    <div class="title">{{ audioValue.audioStatus }}</div>
  </div>
</template>

<script>
import MicLevel from "../MicLevel/index.vue";

export default {
  props: ["stream", "permission", "audio", "disableAudio", "handStatus"],
  components: {
    MicLevel,
  },
  computed: {
    audioValue() {
      let audioClass = "button-warn mute_mic";
      let audioStatus = "取消静音";
      let svgIcon = "mic_null";
      let svgType = "default";

      if (this.permission.microphone === "denied") {
        audioClass = "button-warn mute_mic_error";
        svgIcon = "mute_mic_error";
      } else {
        if (this.audio === "muteAudio" && !this.disableAudio) {
          audioClass = "button-warn mute_mic";
          svgIcon = "cancel_mic_mute";
          svgType = "danger";
        }

        if (this.audio === "unmuteAudio" && !this.disableAudio) {
          audioStatus = "静音";
          audioClass = "mic_aec";
        }

        if (
          this.audio === "muteAudio" &&
          this.disableAudio &&
          !this.handStatus
        ) {
          audioStatus = "举手发言";
          audioClass = "hand_up";
          svgIcon = "hand_up";
        }

        if (
          this.audio === "muteAudio" &&
          this.disableAudio &&
          this.handStatus
        ) {
          audioStatus = "取消举手";
          audioClass = "hand_down";
          svgIcon = "hand_down";
        }

        if (this.audio === "unmuteAudio" && this.disableAudio) {
          audioStatus = "结束举手";
          audioClass = "hand_end";
          svgIcon = "hand_end";
        }
      }

      audioClass = "button " + audioClass;

      return {
        audioStatus,
        audioClass,
        svgIcon,
        svgType,
      };
    },
  },
  data() {
    return {};
  },
  methods: {
    audioOperate() {
      this.$emit("audioOperate");
    },
  },
};
</script>
