<template>
  <div class="setting__content-about">
    <img width="150" src="@/assets/img/login-logo.png" alt="logo" />
    <div class="about-version">版本号：{{ version }}</div>
    <!-- <div class="about-version about-time">变更时间：{{ update }}</div> -->
  </div>
</template>
<script>
import xyRTC from "@xylink/xy-rtc-sdk";

export default {
  data() {
    return {
      version: "",
      update: "",
    };
  },
  mounted() {
    const splitData = xyRTC.version.split("- build on");

    this.version = splitData[0];
    this.update = splitData[1];
  },
  methods: {},
};
</script>
