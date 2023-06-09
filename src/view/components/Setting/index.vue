<template>
  <el-dialog v-if="isPc" custom-class="xy__setting-modal" :visible="visible">
    <div class="setting__header">
      设置
      <div class="close" @click="onCancel" />
    </div>
    <div class="setting__container">
      <div class="setting__menu">
        <el-menu :default-active="current" class="xy__setting-menu" @select="handleSelect">
          <el-menu-item index="common">
            <i class="el-icon-setting"></i>
            <span slot="title">常规设置</span>
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
          :loginType="loginType"
          :localHide="localHide"
          :layoutMode="layoutMode"
          @setting="onHandleSetting"
        />
        <Device v-if="current === 'device'" :setting="setting" :current="current" @setting="onHandleSetting" />
        <Feedback v-if="current === 'feedback'" />
        <Version v-if="current === 'about'" />
      </div>
    </div>
  </el-dialog>

  <div v-else>
    <el-drawer
      :visible.sync="visible"
      direction="btt"
      :append-to-body="true"
      :withHeader="false"
      custom-class="xy__drawer-setting"
      :before-close="onCancel"
    >
      <Version />
      <Common
        :isInMeeting="isInMeeting"
        :loginType="loginType"
        :localHide="localHide"
        :layoutMode="layoutMode"
        @setting="onHandleSetting"
      />
      <div class="list-item" @click="feedbackVisible = true">
        <div class="key">快速反馈</div>
        <div class="value">
          <i class="el-icon-arrow-right"></i>
        </div>
      </div>
    </el-drawer>
    <el-drawer
      :visible.sync="feedbackVisible"
      direction="btt"
      :append-to-body="true"
      :withHeader="false"
      custom-class="xy__drawer-setting"
    >
      <div class="mobile-drawer-back" @click="feedbackVisible = false">
        返回
      </div>
      <div class="mobile-drawer-content">
        <Feedback />
      </div>
    </el-drawer>
  </div>
</template>
<script>
import Common from './Common.vue';
import Device from './Device.vue';
import Feedback from './Feedback.vue';
import Version from './Version.vue';
import store from '@/utils/store';
import { isPc } from '@/utils/browser';

export default {
  props: ['visible', 'setting', 'isInMeeting'],
  components: {
    Common,
    Device,
    Feedback,
    Version,
  },
  data() {
    const { localHide = false, layoutMode, loginType } = this.setting || {};

    return {
      current: 'common',
      loginType,
      layoutMode,
      localHide,
      isPc,
      feedbackVisible: false,
    };
  },
  methods: {
    handleSelect(e) {
      this.current = e;
    },
    onHandleSetting(data) {
      const values = {};
      const SETTING_KEYS = ['selectedDevice', 'localHide'];

      SETTING_KEYS.forEach((key) => {
        if (data[key]) {
          if (key === 'selectedDevice') {
            store.set('selectedDevice', data.selectedDevice);

            this.$emit('cancel');
          } else {
            values[key] = data[key];
          }
        }
      });

      this.$emit('setting', data);
    },
    onCancel() {
      this.$emit('cancel');
    },
  },
};
</script>
<style lang="scss">
@import './style/index.scss';
</style>
