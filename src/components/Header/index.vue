<template>
  <div class="meeting-header">
    <span class="header-time" @click="switchDebug">
      <svg-icon icon="signal" class="meeting-stats-switch" />
      <Timmer />
    </span>
    <span class="header-count">
      <span class="header-displayname">
        {{ callInfo.displayName }}
        <span v-if="callInfo.numberType !== 'CONFERENCE'"
          >({{ callInfo.number }})
        </span>
      </span>

      <el-popover
        popper-class="meeting-popover"
        placement="top"
        title=""
        trigger="click"
      >
        <div>
          <div class="upload-icon" @click="onToggleSetting">
            <svg-icon icon="setting" />
          </div>
          <div class="meeting-popover-name" :title="callInfo.displayName">
            {{ callInfo.displayName }}
          </div>
          <div class="meeting-popover-number">
            会议号：<span class="number">{{ callInfo.number }}</span>
          </div>
        </div>
        <div class="meeting-popover-btn" slot="reference">
          <i class="el-icon-warning-outline"></i>
        </div>
      </el-popover>
    </span>
  </div>
</template>

<script>
import Timmer from "../Timmer";

export default {
  props: ["callInfo"],
  components: {
    Timmer,
  },
  data() {
    return {
      infoVisible: false,
    };
  },
  methods: {
    setInfoVisible(infoVisible) {
      this.infoVisible = infoVisible;
    },
    switchDebug() {
      this.$emit("switchDebug");
    },
    onToggleSetting() {
      this.$emit("onToggleSetting");
    },
  },
};
</script>
<style lang="scss">
.el-popover.meeting-popover {
  width: 360px;
  height: 80px;
  background: #ffffff;
  box-shadow: 0px 2px 8px 0px rgba(0, 0, 0, 0.26);
  font-size: 12px;
  z-index: 1009;
  padding: 14px 16px;
  .popper__arrow {
    display: none;
  }
  .upload-icon {
    position: absolute;
    right: 12px;
    top: 16px;
    cursor: pointer;
    .svg-icon {
      width: 16px;
      height: 16px;
      fill-opacity: 0.8;
      fill: #393946;
    }
    &:hover {
      .svg-icon {
        fill-opacity: 0.6;
      }
    }
  }
  .meeting-popover-name {
    font-size: 14px;
    color: #393946;
    margin-bottom: 12px;
    margin-right: 30px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .meeting-popover-number {
    display: flex;
    align-items: center;
    line-height: 18px;
    color: rgba(57, 57, 70, 0.6);
    .number {
      color: #393946;
    }
    .copy {
      display: inline-flex;
      align-items: center;
      color: rgba(56, 118, 255, 1);
      margin-left: 12px;
      cursor: pointer;
      .svg-icon {
        width: 16px;
        height: 16px;
        margin-left: 4px;
      }
    }
  }
}

.meeting-popover-btn {
  cursor: pointer;
}
</style>
<style lang="scss" scoped>
@import "./index.scss";
</style>
