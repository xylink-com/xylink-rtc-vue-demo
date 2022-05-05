<template>
  <el-dialog custom-class="xy__setting-modal" :visible="visible" width="720px" top = "10vh">
    <div class="setting__container">
      <div class="close" @click="onCancel">
        <span class="close-icon" />
      </div>
      <div class="setting__header">
        <el-menu
          :default-active="current"
          class="xy__setting-menu"
          @select="handleSelect"
        >
          <el-menu-item index="common">
            <i class="el-icon-setting"></i>
            <span slot="title">常规</span>
          </el-menu-item>
          <el-menu-item index="device">
            <i class="el-icon-video-camera"></i>
            <span slot="title">音视频</span>
          </el-menu-item>

          <el-menu-item index="feedback">
            <i class="el-icon-edit-outline"></i>
            <span slot="title">反馈</span>
          </el-menu-item>

          <el-menu-item index="about">
            <i class="el-icon-s-opportunity"></i>
            <span slot="title">关于</span>
          </el-menu-item>
        </el-menu>
      </div>
      <div class="setting__content">
        <Common
          v-if="current === 'common'"
          :isInMeeting="isInMeeting"
          :isThird="isThird"
          :localHide="localHide"
          :layoutMode="layoutMode"
          @setting="onHandleSetting"
        />
        <Device
          v-if="current === 'device'"
          :setting="setting"
          :current="current"
          @setting="onHandleSetting"
        />
        <Feedback v-if="current === 'feedback'" />
        <Version v-if="current === 'about'" />
      </div>
    </div>
  </el-dialog>
</template>
<script>
import Common from "./Common.vue";
import Device from "./Device.vue";
import Feedback from "./Feedback.vue";
import Version from "./Version.vue";
import store from "@/utils/store";

export default {
  props: ["visible", "setting", "isInMeeting"],
  components: {
    Common,
    Device,
    Feedback,
    Version,
  },
  data() {
    const { localHide = false, layoutMode = "AUTO", isThird = false } =
      this.setting || {};

    return {
      current: "common",
      isThird,
      layoutMode,
      localHide,
    };
  },
  methods: {
    handleSelect(e) {
      this.current = e;
    },
    onHandleSetting(data) {
      const values = {};
      const SETTING_KEYS = ["selectedDevice", "localHide"];

      SETTING_KEYS.forEach((key) => {
        if (data[key]) {
          if (key === "selectedDevice") {
            store.set("selectedDevice", data.selectedDevice);

            this.$emit("cancel");
          } else {
            values[key] = data[key];
          }
        }
      });

      this.$emit("setting", data);
    },
    onCancel() {
      this.$emit("cancel");
    },
  },
};
</script>
<style lang="scss">
@import "./style/index.scss";
</style>
