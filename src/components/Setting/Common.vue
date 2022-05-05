<template>
  <div class="setting__content-common">
    <div v-if="!isInMeeting">
      <div class="item">
        <div class="key">布局模式</div>
        <div class="value">
          <el-select
            popper-class="xy-select"
            v-model="mode"
            @change="onChangeLayoutMode"
          >
            <el-option
              v-for="key in Object.keys(layoutModeMap)"
              :key="key"
              :label="layoutModeMap[key]"
              :value="key"
            >
              {{ layoutModeMap[key] }}
            </el-option>
          </el-select>
        </div>
      </div>

      <div class="item">
        <div class="key">登录方式</div>
        <div class="value">
          <el-select
            popper-class="xy-select"
            v-model="loginType"
            @change="onChangeLoginType"
          >
            <el-option
              v-for="key in Object.keys(loginTypeMap)"
              :key="key"
              :label="loginTypeMap[key]"
              :value="key"
            >
              {{ loginTypeMap[key] }}
            </el-option>
          </el-select>
        </div>
      </div>
    </div>

    <div class="item">
      <div class="key">隐藏本地画面</div>
      <div class="value">
        <el-switch v-model="isLocalHide" @change="onChangeLocalHide" />
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: ["isThird", "layoutMode", "localHide", "isInMeeting"],
  data() {
    return {
      layoutModeMap: {
        AUTO: "自动布局",
        CUSTOM: "自定义布局",
      },
      loginTypeMap: {
        XYLINK: "小鱼账号登录",
        THIRD: "第三方账号登录",
      },
      loginType: this.isThird ? "THIRD" : "XYLINK",
      isLocalHide: this.localHide,
      mode: this.layoutMode
    };
  },
  methods: {
    onChangeLayoutMode(value) {
      this.$emit("setting", { layoutMode: value });
    },
    onChangeLoginType(value) {
      this.$emit("setting", { isThird: value === 'THIRD' });
    },
    onChangeLocalHide(value) {
      this.$emit("setting", { localHide: value });
    },
  },
  watch: {},
};
</script>
