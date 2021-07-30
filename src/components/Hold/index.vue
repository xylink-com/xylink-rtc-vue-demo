<template>
  <div class="hold">
    <div class="hold-content">
      <p class="hold-title">请稍等，主持人稍后邀请您入会</p>

      <p class="hold-conference-title">会议主题</p>
      <p class="hold-conference">{{ callInfo.displayName }}</p>

      <div class="hold-level-meeting">
        <span @click="stopMeeting">
          离开会议
        </span>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: ["callInfo"],
  computed: {
  },
  methods: {
    stopMeeting() {
      this.$emit("stopMeeting", false);
    },
  },
};
</script>
<style lang="scss" scoped>
.line {
  width: 64px;
  height: 2px;
  border-radius: 1px;
  content: '';
  display: inline-block;
}

.hold {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 0 56px;
  background: #000 url('https://cdn.xylink.com/wechatMP/images/meeting_bg.png') 0 0 no-repeat;
  background-size: cover;
  color: #fff;
  overflow: hidden;
  text-align: center;
  &-content {
    position: relative;
    top: 50%;
    margin-top: -180px;
  }
  &-title {
    font-size: 20px;
    margin-bottom: 80px;
  }

  &-conference {
    font-size: 16px;
    font-weight: 500;
    line-height: 24px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    &-title {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0 12px 20px 12px;
      &::before {
        @extend .line;
        background: linear-gradient(
          -297deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.3) 100%
        );
        margin-right: 12px;
      }
      &::after {
        @extend .line;
        background: linear-gradient(
          297deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.01) 1%,
          rgba(255, 255, 255, 0.2) 100%
        );
        margin-left: 12px;
      }
    }
  }

  &-level-meeting {
    width: 100%;
    font-size: 16px;
    font-weight: 400;
    color: #f94b4b;
    line-height: 24px;
    text-align: center;
    margin-top: 80px;
    span {
      cursor: pointer;
    }
  }
}

</style>
