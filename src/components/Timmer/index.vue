<template>
  <span>
    {{ timmer }}
  </span>
</template>
<script>
export default {
  data() {
    return {
      timmer: 0,
      timerCount: 0,
      meetingTimeout: null,
    };
  },
  mounted() {
    this.onCreateMeetingTimeCount();
  },
  beforeDestroy() {
    clearTimeout(this.meetingTimeout);
    this.meetingTimeout = null;
  },
  methods: {
    secondToDate(result) {
      var h =
        Math.floor(result / 3600) < 10
          ? "0" + Math.floor(result / 3600)
          : Math.floor(result / 3600);
      var m =
        Math.floor((result / 60) % 60) < 10
          ? "0" + Math.floor((result / 60) % 60)
          : Math.floor((result / 60) % 60);
      var s =
        Math.floor(result % 60) < 10
          ? "0" + Math.floor(result % 60)
          : Math.floor(result % 60);
      return h + ":" + m + ":" + s;
    },
    onCreateMeetingTimeCount() {
      this.timerCount++;

      this.meetingTimeout = setTimeout(() => {
        clearTimeout(this.meetingTimeout);
        this.meetingTimeout = null;

        const meetingTime = this.secondToDate(this.timerCount);

        this.timmer = meetingTime;

        this.onCreateMeetingTimeCount();
      }, 1000);
    },
  },
};
</script>
