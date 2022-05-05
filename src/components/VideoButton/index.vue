<template>
  <div :class="videoValue.videoClass" @click="videoOperate">
    <svg-icon :icon="videoValue.svgIcon" :type="videoValue.svgType" />
    <div class="title">
      {{ video === "unmuteVideo" ? "关闭摄像头" : "开启摄像头" }}
    </div>
  </div>
</template>

<script>
export default {
  props: ["permission", "video"],
  computed: {
    videoValue() {
      let videoClass = "button-warn mute_camera";
      let svgIcon = "camera";
      let svgType = "default";

      if (this.permission.camera === "denied") {
        videoClass = "button-warn mute_camera_error";
        svgIcon = "mute_camera_error";
        svgType = "danger";
      } else if (this.video === "unmuteVideo") {
        videoClass = "camera";
        svgIcon = "camera";
      } else {
        videoClass = "button-warn mute_camera";
        svgIcon = "mute_camera";
        svgType = "danger";
      }
      return {
        videoClass: "button " + videoClass,
        svgIcon,
        svgType,
      };
    },
  },
  data() {
    return {};
  },
  methods: {
    videoOperate() {
      this.$emit("videoOperate");
    },
  },
};
</script>
