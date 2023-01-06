<template>
  <div :class="['meeting-header', className]">
    <span class="header-time" @click="switchDebug">
      <svg-icon icon="signal" class="meeting-stats-switch" />
      <Timmer />
    </span>
    <div class="header-count">
      <span class="header-name">
        {{ conferenceInfo.displayName }}
        <span v-if="conferenceInfo.numberType !== 'CONFERENCE'">({{ conferenceInfo.number }}) </span>
      </span>

      <div v-if="!isPc" class="meeting-info-btn" @click="infoVisible = true">
        <i class="el-icon-warning-outline"></i>
      </div>

      <el-popover v-if="isPc" popper-class="meeting-popover" placement="top" title="" trigger="hover">
        <div>
          <div class="meeting-info-name" :title="conferenceInfo.displayName">
            {{ conferenceInfo.displayName }}
          </div>
          <div class="meeting-info-number">
            会议号<span class="number">{{ conferenceInfo.number }}</span>
            <span class="copy-btn" @click="copyNumber" />
          </div>
        </div>
        <div class="meeting-info-btn" slot="reference">
          <i class="el-icon-warning-outline"></i>
        </div>
      </el-popover>
    </div>

    <el-drawer
      :visible.sync="infoVisible"
      direction="btt"
      :before-close="cancel"
      :append-to-body="true"
      :withHeader="false"
      custom-class="xy__drawer-conference"
    >
      <div class="meeting-info-name" :title="conferenceInfo.displayName">
        {{ conferenceInfo.displayName }}
      </div>
      <div class="meeting-info-number">
        会议号<span class="number">{{ conferenceInfo.number }}</span>
        <span class="copy-btn" @click="copyNumber" />
      </div>
    </el-drawer>

    <EndCall v-if="!isPc" @stop="stop" />
  </div>
</template>

<script>
import Timmer from '@/components/Timmer';
import EndCall from '@/view/components/EndCall';
import { isPc } from '@/utils/browser';
import { message } from '@/utils/index';

export default {
  props: ['className', 'conferenceInfo'],
  components: {
    Timmer,
    EndCall,
  },
  data() {
    return {
      infoVisible: false,
      isPc,
    };
  },
  methods: {
    cancel() {
      this.infoVisible = false;
    },
    switchDebug() {
      this.$emit('switchDebug');
    },
    stop() {
      this.$emit('stop');
    },

    // 复制
    copyNumber() {
      this.$copyText(this.conferenceInfo.number).then(() => {
        message.info('已复制到剪贴板');
      });
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
}

.meeting-info-name {
  font-size: 14px;
  color: #393946;
  margin-bottom: 12px;
  margin-right: 30px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.meeting-info-number {
  display: flex;
  align-items: center;
  line-height: 18px;
  color: rgba(57, 57, 70, 0.6);
  .number {
    color: #393946;
    margin-left: 12px;
  }
  .copy-btn {
    margin-left: 16px;
    width: 12px;
    height: 13px;
    background: url('~@/assets/img/icon/icon_copy.png') no-repeat center center;
    background-size: cover;

    &:hover {
      cursor: pointer;
    }
  }
}

.meeting-info-btn {
  cursor: pointer;
}
</style>
<style lang="scss" scoped>
@import './index.scss';
</style>
