<template>
  <div class="timer-content">
    <i
      v-if="before"
      :class="{ 'timer-circle': true, 'circle-show': isEven, 'circle-hide': !isEven }"
    ></i>
    <div class="timer-children">
      <slot></slot>
    </div>
    <div v-if="time">
      {{ timer }}
    </div>
  </div>
</template>

<script>
export default {
  props: {
    before: {
      type: Boolean,
      default: false
    },
    time: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      timer: '00:00:00',
      timerCount: 0,
      meetingTimeout: null
    };
  },
  computed: {
    isEven() {
      return parseInt(this.timer.slice(-1)) % 2 === 0;
    }
  },
  methods: {
    secondToDate(result) {
      const h = String(Math.floor(result / 3600)).padStart(2, '0');
      const m = String(Math.floor((result / 60) % 60)).padStart(2, '0');
      const s = String(Math.floor(result % 60)).padStart(2, '0');
      return h + ':' + m + ':' + s;
    },
    onCreateMeetingTimeCount() {
      this.timerCount++;
      this.meetingTimeout = setTimeout(() => {
        clearTimeout(this.meetingTimeout);
        this.meetingTimeout = null;
        const meetingTime = this.secondToDate(this.timerCount);
        this.timer = meetingTime;
        this.onCreateMeetingTimeCount();
      }, 1000);
    }
  },
  created() {
    this.onCreateMeetingTimeCount();
  },
  beforeDestroy() {
    clearTimeout(this.meetingTimeout);
    this.meetingTimeout = null;
  }
};
</script>

<style scoped>
.timer-content {
  display: flex;
  align-items: center;
}
.timer-children {
  margin-right: 6px;
}

.timer-circle {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fa6a69;
  margin-right: 6px;
}

.circle-show {
  opacity: 1;
}

.circle-hide {
  opacity: 0;
}
</style>
