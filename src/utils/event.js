
export const Event = {
  lastTapTime: 0,
  lastTapTimer: null,
  click: function (params, doubleClick, singleClick = () => {}) {
    const currentTime = params.timeStamp;
    const lastTapTime = this.lastTapTime;
    this.lastTapTime = currentTime;

    if (currentTime - lastTapTime < 250) {
      this.lastTapTime = 0;
      if (doubleClick) doubleClick();
      // @ts-ignore
      clearTimeout(this.lastTapTimer);
    } else {
      // @ts-ignore
      this.lastTapTimer = setTimeout(() => {
        this.lastTapTime = 0;
        if (singleClick) singleClick();
      }, 250);
    }
  },
};
