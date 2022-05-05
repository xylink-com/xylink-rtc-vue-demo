<template>
  <div :class="reminderClass">
    <div class="reminder-toolbar" @click="onToggleReminder">
      <img src="@/assets/img/icon/icon_hide.svg" alt="" />
      {{ !isHideContent && "隐藏" }}
    </div>
    <ul class="reminder-content">
      <li v-for="item in newReminders" :key="item.value">
        <div>
          <span class="name">{{ item.displayName }}</span>
          {{ actionMap[item.action] }}了会议
        </div>
      </li>
    </ul>
  </div>
</template>
<script>
/**
 * 出入会提醒
 * 1.显示最新的3条，3秒更新一次
 * 2.无数据变化，10s之后隐藏
 * 3.超过1000人，不会收到此消息
 */
export default {
  props: ["reminders"],
  computed: {
    reminderClass() {
      return `reminder ${
        this.isHideContent ? "reminder-close" : "reminder-expand"
      } ${this.isHide ? "reminder-hide" : "reminder-show"}`;
    },
  },
  data() {
    return {
      actionMap: {
        in: "加入",
        out: "离开",
      },
      newReminders: [], // 显示的消息
      isHide: true, // 隐藏toolbar + content
      isHideContent: false, // 隐藏content
      remindersTemp: [], // 存储展示的消息
      remindersQueue: [], // 存储3秒收到的消息
      timer: null, // 隐藏定时器
      queueTimer: null, // 存储定时器
    };
  },
  methods: {
    stopMeeting() {
      this.$emit("stopMeeting", false);
    },
    clearTimer() {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    },
    onToggleReminder() {
      this.isHideContent = !this.isHideContent;
    },
  },
  beforeDestroy() {
    this.remindersTemp = [];
    clearInterval(this.queueTimer);
    this.queueTimer = null;
  },
  watch: {
    reminders: {
      handler(newValue) {
        this.remindersQueue = this.remindersQueue.concat(newValue);

        // 起一个3s定时器，每3秒取最后一个最新的数据进行展示
        if (!this.queueTimer && this.remindersQueue.length > 0) {
          this.queueTimer = setInterval(() => {
            if (this.remindersQueue.length > 1) {
              this.remindersTemp = this.remindersTemp
                .concat(this.remindersQueue.pop() || [])
                .slice(-3);

              this.remindersQueue = [];
            }
          }, 2000);
        }

        // 第一条数据直接显示
        if (this.remindersQueue.length === 1) {
          this.remindersTemp = this.remindersTemp.concat(newValue);
        }
      },
      deep: true,
      immediate: true,
    },
    remindersTemp: {
      handler(newValue) {
        if (newValue.length !== 0) {
          this.isHide = false;

          this.newReminders = newValue;
          this.timer = setTimeout(() => {
            this.isHide = true;
            this.remindersTemp = [];
            clearInterval(this.queueTimer);
            this.queueTimer = null;
            this.remindersQueue = [];
          }, 10000);
        }
      },
      deep: true,
      immediate: true,
    },
  },
};
</script>
<style lang="scss" scoped>
.reminder {
  position: absolute;
  height: 122px;
  bottom: 70px;
  left: 6px;
  color: #fff;
  font-size: 12px;
  overflow: hidden;
  z-index: 99;
  &-toolbar {
    width: 66px;
    height: 32px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 3px 16px 16px 3px;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
    img {
      margin-right: 6px;
    }
  }

  &-content {
    padding: 0;
    margin: 0;
    li {
      margin-bottom: 6px;
      display: flex;
      justify-content: left;
      div {
        display: inline-flex;
        align-items: center;
        padding: 0 12px;
        height: 22px;
        background: rgba(0, 0, 0, 0.7);
        border-radius: 3px;
      }
      .name {
        display: inline-block;
        max-width: 180px;
        margin-right: 3px;
        color: #92bfff;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
  &-hide {
    display: none;
  }
  &-show {
    display: block;
  }
  &-close {
    left: 0;
    .reminder-toolbar {
      width: 26px;
      img {
        transform: rotate(180deg);
      }
    }
  }

  &-expand .reminder-content {
    visibility: visible;
  }
  &-close .reminder-content {
    visibility: hidden;
  }
}
</style>
