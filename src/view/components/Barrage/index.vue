<template>
  <div class="barrage-title-wrapper" :style="wrapperStyle">
    <div class="barrage-title-bg" :style="titleBgStyle"></div>
    <span :class="titleClass" ref="subTitleRef">
      {{ subTitle.content }}
    </span>
  </div>
</template>
<script>
const fontSizeMap = {
  small: "18px",
  middle: "22px",
  big: "24px",
};
const locationMap = {
  top: "0px",
  middle: "42%",
  bottom: "0px",
};

let intervalTimer;

export default {
  props: ["subTitle"],
  computed: {
    titleClass() {
      return this.subTitle.scroll === "1" ? "barrage-title-text" : "";
    },
    titleBgStyle() {
      return {
        background: this.subTitle.backgroundRGB || "transparent",
        opacity: (Number(this.subTitle.backgroundAlpha) / 100).toFixed(2),
      };
    },
    wrapperStyle() {
      const {
        backgroundRGB = "",
        fontRGB = "#fff",
        scroll = "0",
        location = "top",
        fontSize = "middle",
      } = this.subTitle;
      const locationKey = location === "middle" ? "top" : location;
      const style = {
        fontSize: fontSizeMap[fontSize],
        color: fontRGB,
        background: backgroundRGB || "transparent",
        [locationKey]: locationMap[location],
      };
      const textAlign =
        scroll === "1" ? { textAlign: "left" } : { textAlign: "center" };

      return { ...textAlign, ...style, background: "transparent", opacity: 1 };
    },
  },
  methods: {
    setScrollTitle(newValue) {
      const current = this.$refs["subTitleRef"];
      // 实现弹幕
      if (current) {
        const objWidth = current.clientWidth;
        const initTransformX = window.innerWidth;
        let transformX = initTransformX;

        const render = () => {
          current.style.transform = `translate3d(${transformX}px, 0, 0)`;

          transformX -= 0.5;
          if (transformX + objWidth < 0) {
            cancelAnimationFrame(intervalTimer.current);
            transformX = initTransformX;
          }
          intervalTimer = requestAnimationFrame(render);
        };

        if (newValue.scroll === "1") {
          current.style.visibility = "initial";

          render();
        }
      }

      if (!newValue || newValue.action !== "push" || newValue.scroll !== "1") {
        cancelAnimationFrame(intervalTimer);
      }
    },
  },
  mounted() {
    this.setScrollTitle(this.subTitle);
  },
  beforeDestroy() {
    cancelAnimationFrame(intervalTimer);
  },
  watch: {
    subTitle: {
      handler(newValue) {
        this.setScrollTitle(newValue);
      },
      deep: true,
      immediate: true,
    },
  },
};
</script>
<style scoped>
.barrage-title-wrapper {
  position: absolute;
  left: 0;
  width: 100%;
  padding: 15px 10px;
  color: #fff;
  font-size: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  z-index: 999;
  line-height: 1;
}
.barrage-title-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  z-index: -1;
}
.barrage-title-text {
  display: inline-block;
  position: relative;
  z-index: 1;
}
</style>
