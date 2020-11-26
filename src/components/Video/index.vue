<template>
  <div class="wrap-video" :style="videoWrapStyle" ref="videoWrapRef">
    <div class="video">
      <div class="video-content" :style="border">
        <div class="video-model">
          <div class="status">
            <p :style="{ display: 'none' }">
              streamId:
              {{ item.stream && item.stream.video && item.stream.video.id }}
            </p>
          </div>

          <div :class="audioOnlyClass">
            <div class="center">
              <div class="displayname">{{ item.roster.displayName || "" }}</div>
              <div>语音通话中</div>
            </div>
          </div>

          <div :class="videoMuteClass">
            <div class="center">
              <div v-if="index === 0">视频暂停</div>
              <div v-else>对方忙，暂时关闭视频</div>
            </div>
          </div>

          <div :class="videoRequestClass">
            <div class="center">
              <div>视频请求中...</div>
            </div>
          </div>

          <div :class="videoMsgClass">
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

      <video
        v-if="item.stream.video"
        ref="videoRef"
        :style="videoStyle"
        autoPlay
        :controls="false"
        playsInline
        :id="videoId"
        :muted="index === 0"
        @canplay="onLoadCanPlay"
        @loadstart="onLoadStart"
        @error="onError"
        @emptied="onEmptied"
        @loadedmetadata="onLoadedMetadata"
      ></video>
    </div>
  </div>
</template>
<script>
export default {
  props: ["item", "isRefresh", "index", "model", "videoId"],
  computed: {
    videoWrapStyle() {
      let wrapStyle = {};
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

      if (this.index > 0) {
        style = this.item.rotate;

        if (this.item.roster.isContent || this.isFullScreen) {
          style = {
            ...style,
            ...fullStyle,
          };
        }
      } else {
        style = {
          ...this.item.rotate,
          transform: "rotateY(180deg)",
        };
      }

      return style;
    },
    videoStatus() {
      let status = {
        picture: false,
        audioOnly: false,
        mute: false,
        request: false,
        normal: false,
      };
      const { deviceType, videoTxMute, isContent } = this.item.roster;
      const isShowLoading =
        (!this.item.stream.video ||
          this.streamStatus === "comming" ||
          !this.playStatus) &&
        this.index >= 1;

      if (isContent) {
        const request = videoTxMute ? false : isShowLoading;
        // content共享
        // 仅音频共享: videoTxMute === true
        status = {
          ...status,
          audioOnly: videoTxMute,
          normal: !videoTxMute,
          request,
        };
      } else if (videoTxMute) {
        // 画面暂停
        status = {
          ...status,
          mute: true,
        };
      } else if (deviceType === "tel" || deviceType === "pstngw") {
        // pstn/tel 入会，显示语音通话中
        status = {
          ...status,
          audioOnly: true,
        };
      } else if (isShowLoading) {
        // 请求中
        status = {
          ...status,
          request: true,
        };
      } else {
        // 正常模式
        status = {
          ...status,
          normal: true,
        };
      }

      return status;
    },
    videoPictureClass() {
      return `video-bg ${
        this.videoStatus.picture ? "video-show" : "video-hidden"
      } `;
    },
    audioOnlyClass() {
      return `video-bg ${
        this.videoStatus.audioOnly ? "video-show" : "video-hidden"
      } `;
    },
    videoMuteClass() {
      return `video-bg ${
        this.videoStatus.mute ? "video-show" : "video-hidden"
      } `;
    },
    videoRequestClass() {
      return `video-bg ${
        this.videoStatus.request ? "video-show" : "video-hidden"
      } `;
    },
    videoMsgClass() {
      return `video-status video-animote ${
        this.videoStatus.normal ||
        this.videoStatus.mute ||
        this.videoStatus.request ||
        this.videoStatus.picture
          ? "video-show"
          : "video-hidden"
      }`;
    },

    renderVideoName() {
      return <div>hello word</div>;
    },
  },
  data() {
    return {
      streamStatus: "enabled",
      playStatus: false,
      isFullScreen: false, // 是否全屏
      video: this.item.stream && this.item.stream.video,
    };
  },
  mounted() {
    this.renderVideo(this.video);
  },
  beforeDestroy() {
    const videoEle = this.$refs["videoRef"];

    if (videoEle) {
      videoEle.pause();
      videoEle.srcObject = null;
    }
  },
  methods: {
    renderVideo(newValue) {
      const videoEle = this.$refs["videoRef"];
      if (videoEle && !videoEle.srcObject && newValue) {
        videoEle.srcObject = newValue;

        if (videoEle.paused) {
          videoEle.play();
        }
      }
    },
    onLoadCanPlay() {
      console.log(this.videoId + " enabled");
      this.playStatus = true;
    },
    onLoadStart() {
      console.log(this.videoId + " onLoadStart");
      this.playStatus = false;
    },
    onError() {
      console.log(this.videoId + " onError");
    },
    onEmptied() {
      console.log(this.videoId + " onEmptied");
    },
    onLoadedMetadata() {
      console.log(this.videoId + " onLoadedMetadata");
    },
  },
  watch: {
    isRefresh: {
      handler(newValue) {
        const current = this.$refs["videoWrapRef"];
        if (newValue && current) {
          const realWidth = parseInt(current.style.width);

          current.style.width = `${realWidth}px`;
        }
      },
    },
    video: {
      handler(newValue) {
        console.log("newValue::", newValue);
        newValue && this.renderVideo(newValue);
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
