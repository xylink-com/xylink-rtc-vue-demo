<template>
  <div class="setting__content-common">
    <div v-if="!isInMeeting">
      <div v-if="isPc" class="item">
        <div class="key">布局模式</div>
        <div class="value">
          <el-select popper-class="xy-select" v-model="mode" @change="onChangeLayoutMode">
            <el-option v-for="key in Object.keys(layoutModeMap)" :key="key" :label="layoutModeMap[key]" :value="key">
              {{ layoutModeMap[key] }}
            </el-option>
          </el-select>
        </div>
      </div>

      <div v-if="isPc" class="item">
        <div class="key">登录方式</div>
        <div class="value">
          <el-select popper-class="xy-select" v-model="loginTypeModal" @change="onChangeLoginType">
            <el-option v-for="key in Object.keys(loginTypeMap)" :key="key" :label="loginTypeMap[key].title" :value="key">
              {{ loginTypeMap[key].title }}
            </el-option>
          </el-select>
        </div>
      </div>
    </div>

    <div class="item" v-if="isPc">
      <div class="key">隐藏本地画面</div>
      <div class="value">
        <el-switch v-model="isLocalHide" @change="onChangeLocalHide" />
      </div>
    </div>
  </div>
</template>
<script>
import { isPc } from '@/utils/browser';
import { loginTypeMap } from '@/utils/loginConfig';

export default {
  props: ['loginType', 'layoutMode', 'localHide', 'isInMeeting'],
  data() {
    return {
      layoutModeMap: {
        AUTO: '自动布局',
        CUSTOM: '自定义布局',
      },
      loginTypeMap,
      loginTypeModal: this.loginType,
      isLocalHide: this.localHide,
      mode: this.layoutMode,
      isPc,
    };
  },
  methods: {
    onChangeLayoutMode(value) {
      this.$emit('setting', { layoutMode: value });
    },
    onChangeLoginType(value) {
      this.$emit('setting', { loginType: value });
    },
    onChangeLocalHide(value) {
      this.$emit('setting', { localHide: value });
    },
  },
  watch: {},
};
</script>
