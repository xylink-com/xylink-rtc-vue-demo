<template>
  <div
    class="wrap-video"
    :style="videoWrapStyle"
    ref="videoWrapRef"
    :id="wrapVideoId"
    @dblclick="toggleFullScreen"
  >
    <div class="video">
      <div class="video-content" :style="{ border }">
        <div class="video-model">
          <div :class="audioOnlyClass">
            <div class="center">
              <div class="displayname">{{ item.roster.displayName || "" }}</div>
              <div>语音通话中</div>
            </div>
          </div>

          <div :class="videoMuteClass">
            <div class="center">
              <div v-if="item.roster.isLocal">视频暂停</div>
              <div v-else>对方忙，暂时关闭视频</div>
            </div>
          </div>

          <div :class="videoRequestClass">
            <div class="center">
              <div>视频请求中...</div>
            </div>
          </div>

          <div class="video-status">
            <div
              v-if="!item.roster.isContent"
              :class="
                item.roster.audioTxMute
                  ? 'audio-muted-status'
                  : 'audio-unmuted-status'
              "
            ></div>
            <div class="name">
              {{ `${item.roster.displayName || "Local"}` }}
            </div>
          </div>
        </div>
      </div>

      <video :style="videoStyle" autoPlay></video>
    </div>
  </div>
</template>
<script>
export default {
  props: ["item", "model", "id", "forceLayoutId", "client"],
  computed: {
    state() {
      return this.item.state;
    },
    videoWrapStyle() {
      let wrapStyle = {};
      // 全屏
      if (this.isFullScreen) {
        return (wrapStyle = {
          position: "fixed",
          width: "100%",
          height: "100%",
          left: "0",
          top: "0",
          zIndex: "101",
        });
      }
      const positionStyle = this.item.positionStyle;

      if (positionStyle && positionStyle.width) {
        wrapStyle = positionStyle;
      }

      return wrapStyle;
    },
    border() {
      let border = "";
      if (this.model === "gallery" && this.item.roster.isActiveSpeaker) {
        border = "2px solid #1483eb";
      } else {
        border = "none";
      }
      return border;
    },
    videoStyle() {
      let style = {};
      let fullStyle = {};

      if (this.isFullScreen) {
        fullStyle = {
          width: "100%",
          height: "100%",
          objectFit: "contain",
        };
      }

      style = this.item.rotate;

      if (this.item.roster.isContent || this.isFullScreen) {
        style = {
          ...style,
          ...fullStyle,
        };
      }

      return style;
    },
    audioOnlyClass() {
      return `video-bg ${
        this.state === "AUDIO_TEL" ||
        this.state === "AUDIO_CONTENT" ||
        this.state === "AUDIO_ONLY"
          ? "video-show"
          : "video-hidden"
      }`;
    },
    videoMuteClass() {
      return `video-bg ${
        this.state === "MUTE" || this.state === "INVALID"
          ? "video-show"
          : "video-hidden"
      }`;
    },
    videoRequestClass() {
      return `video-bg ${
        this.state === "REQUEST" ? "video-show" : "video-hidden"
      }`;
    },
  },
  data() {
    return {
      isFullScreen:  this.forceLayoutId === this.item.roster.id, // 是否全屏
      wrapVideoId: "wrap-" + this.id,
    };
  },
  mounted() {
    this.renderVideo(this.id);
  },
  methods: {
    async toggleFullScreen() {
      await this.client.forceFullScreen(!this.isFullScreen && this.id);
    },
    renderVideo(newValue) {
      if (newValue && this.client) {
        this.client.setVideoRenderer(newValue, "wrap-" + newValue);
      }
    },
  },
  watch: {
    id: {
      handler(newValue) {
        this.renderVideo(newValue);
      },
      deep: true,
    },
  },
};
</script>
<style scoped>
.wrap-video {
  position: absolute;

  background: #000;
  user-select: none;
  overflow: hidden;
}
.video {
  width: 100%;
  height: 100%;
  user-select: none;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.video .video-content {
  width: 100%;
  height: 100%;

  position: absolute;
  top: 0px;
  left: 0px;
  z-index: 10;
}
.video .video-content:hover .operate-icon {
  opacity: 1;
}
.video video {
  width: 100%;
  height: 100%;
  overflow: hidden;
  object-fit: cover;
}
.video audio {
  position: absolute;
}
.video .video-model {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  position: relative;
  color: #ddd;
  font-size: 12px;

  display: flex;
  align-items: center;
  justify-content: center;
}
.video .video-model .video-status {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background-color: rgba(42, 46, 51, 0.8);
  border-radius: 3px;
  display: flex;
  align-items: center;
  max-width: 90%;
}
.video .video-model .name {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  margin-right: 6px;
  margin-left: 6px;
}
.video .video-model .video-bg {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  transition: opacity ease 0.2s;
  background: url("./img/meeting_bg.png") center center no-repeat;
  background-size: cover;
}
.video .video-model .video-hidden {
  position: absolute;
  opacity: 0;
}
.video .video-model .video-show {
  display: flex;
  opacity: 1;
}
.video .video-model .center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  position: relative;
  z-index: 1;
}
.video .video-model .displayname {
  margin-bottom: 5px;
}
.video .video-model .audio-muted-status,
.video .video-model .audio-unmuted-status {
  width: 26px;
  height: 24px;
  margin: 0 -8px 0 -2px;
}
.video .video-model .audio-muted-status {
  background: url("./img/audio_mute.png") center center no-repeat;
  background-size: 60%;
}
.video .video-model .audio-unmuted-status {
  background: url("./img/audio_unmute.png") center center no-repeat;
  background-size: 60%;
}
.status {
  position: absolute;
  left: 1px;
  top: 0px;
  background-color: #0000002e;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: text;
  z-index: 100;
  padding-right: 5px;
}
.status p {
  margin: 0;
  line-height: 1;
  font-size: 12px;
}

.operate-icon {
  opacity: 0;

  color: rgb(255, 255, 255);
  font-size: 20px;
  background-color: rgba(42, 46, 51, 0.6);
  padding: 4px;
  border-radius: 50%;

  position: absolute;
  top: 6px;
  right: 6px;

  cursor: pointer;

  transition: all ease 0.2s;
}
.operate-icon:hover {
  background-color: rgba(42, 46, 51, 0.8);
}
</style>
