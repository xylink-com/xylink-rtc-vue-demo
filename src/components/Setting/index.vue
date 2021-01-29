<template>
  <el-dialog
    custom-class="xy__setting-modal"
    :visible="settingVisible"
    :before-close="stop"
  >
    <el-row>
      <el-col :span="6">
        <el-menu
          :default-active="current"
          class="xy__setting-menu"
          @select="handleSelect"
        >
          <el-menu-item index="device">
            <i class="el-icon-video-camera"></i>
            <span slot="title">音视频</span>
          </el-menu-item>
          <el-menu-item index="common">
            <i class="el-icon-setting"></i>
            <span slot="title">常规</span>
          </el-menu-item>
        </el-menu>
      </el-col>
      <el-col :span="18" class="xy-setting-content">
        <div :class="[current === 'device' ? 'show' : 'hide']">
          <div v-if="iauth === 'prompt'" class="fixed">
            <div class="request__loading">
              <div class="init">
                请求获取摄像头&麦克风权限，请点击【允许】按钮进行授权操作
              </div>
            </div>
          </div>

          <div v-if="iauth === 'pending'" class="fixed">
            <div
              class="request__loading"
              v-loading="true"
              element-loading-text="设备检测中..."
            />
          </div>

          <div v-if="iauth === 'denied'" class="fixed">
            <div class="fixed">
              <div class="request__iauth">
                <h2 class="tips">摄像头和麦克风未授权</h2>
                <div>
                  <span
                    >需要使用摄像头和麦克风权限，请点击浏览器地址栏中被屏蔽的摄像头图标
                  </span>
                  <img :src="cameraNoIauthImg" alt="img no iauth" />
                  <span>，然后选择“始终允许”</span>
                </div>
                <img :src="getIauthImg" class="guide-img" alt="请求授权" />
              </div>
            </div>
          </div>

          <div v-if="iauth === 'reopen'" class="fixed">
            <div class="request__loading">
              <div class="init">授权被拒，请重新打开设置页面</div>
            </div>
          </div>

          <div v-if="iauth === 'error'" class="fixed">
            <div class="request__loading">
              <div class="init">
                浏览器版本太低，请升级最新的Chrome浏览器访问
              </div>
            </div>
          </div>

          <div
            :class="[
              'setting__content-device-main',
              iauth === 'granted' ? 'visible' : 'hidden',
            ]"
          >
            <div>
              <div class="item">
                <div class="key">
                  摄像头
                </div>
                <div class="value">
                  <el-select
                    v-model="select.videoInValue"
                    @change="changeVideoIn"
                  >
                    <el-option
                      v-for="item in videoInList"
                      :key="item.deviceId"
                      :label="item.label"
                      :value="item.deviceId"
                    >
                    </el-option>
                  </el-select>
                </div>
              </div>

              <div class="item">
                <div class="key"></div>
                <div class="value video-value">
                  <div
                    :class="[
                      videoStatusVisible ? 'visible' : 'hidden',
                      'preview-video-bg',
                    ]"
                  >
                    设备不可用
                  </div>
                  <video
                    class="preview-video"
                    autoPlay
                    :muted="true"
                    ref="videoRef"
                    :controls="false"
                    playsInline
                  ></video>
                </div>
              </div>

              <div class="item">
                <div class="key">麦克风</div>
                <div class="value">
                  <el-select
                    v-model="select.audioInputValue"
                    @change="changeAudioInput"
                  >
                    <el-option
                      v-for="item in audioInputList"
                      :key="item.deviceId"
                      :label="item.label"
                      :value="item.deviceId"
                    >
                    </el-option>
                  </el-select>
                </div>
              </div>

              <div class="item">
                <div class="key"></div>
                <div class="value">
                  <div class="level-process">
                    <div
                      class="level-value"
                      :style="{ transform: `translateX(${audioLevel}%)` }"
                    ></div>
                  </div>
                </div>
              </div>

              <div class="item">
                <div class="key">扬声器</div>
                <div class="value">
                  <el-select
                    v-model="select.audioOutputValue"
                    @change="changeAudioOutput"
                  >
                    <el-option
                      v-for="item in audioOutputList"
                      :key="item.deviceId"
                      :label="item.label"
                      :value="item.deviceId"
                    >
                    </el-option>
                  </el-select>
                </div>
              </div>

              <div class="item">
                <div class="key"></div>
                <div class="value">
                  <span class="play-audio" @click="play">{{
                    testAudioStatus ? "停止扬声器" : "测试扬声器"
                  }}</span>
                  <span v-if="testAudioStatus" class="play-audio-status"
                    >正在播放...</span
                  >
                  <audio
                    class="preview-audio"
                    ref="audioRef"
                    :loop="true"
                    src="https://cdn.xylink.com/wechatMP/ring.ogg"
                  ></audio>
                </div>
              </div>
            </div>

            <div class="setting__footer">
              <el-button type="primary" @click="handleOk">确定</el-button>
            </div>
          </div>
        </div>
        <div :class="[current === 'common' ? 'show' : 'hide']">
          <el-col :span="6">隐藏本地画面</el-col>
          <el-switch v-model="localHide"> </el-switch>
        </div>
      </el-col>
    </el-row>
  </el-dialog>
</template>
<script>
import xyRTC, { DeviceManager } from "@xylink/xy-rtc-sdk";
import getIauthImg from "./guide.svg";
import cameraNoIauthImg from "./camera_no_iauth.svg";
export default {
  props: ["visible", "setting"],
  data() {
    const { selectedDevice, localHide = false } = this.setting || {
      localHide: false,
    };
    const defaultSelect = {
      audioInputValue: selectedDevice?.audioInput?.deviceId || "default",
      audioOutputValue: selectedDevice?.audioOutput?.deviceId || "default",
      videoInValue: selectedDevice?.videoInput?.deviceId || "",
    };
    return {
      settingVisible: this.visible,
      getIauthImg,
      cameraNoIauthImg,
      current: "device",
      iauth: "pending",
      stream: null,
      previewStream: null,
      deviceManager: null,
      audioInputList: [],
      audioOutputList: [],
      videoInList: [],
      audioLevel: 0,
      select: defaultSelect,
      testAudioStatus: false,
      videoStatusVisible: false,
      localHide,
      audioLevelTimmer: null,
    };
  },
  async mounted() {
    this.deviceManager = new DeviceManager();
    await this.deviceManager.init();
    await this.getStream();
    await this.initDeviceManagerEvent();
    this.getDevices();

    this.setOutputAudioDevice();
  },
  methods: {
    handleSelect(e) {
      this.current = e;
    },
    async getStream() {
      if (!this.stream) {
        this.stream = xyRTC.createStream();
      }
      try {
        let params = {};

        if (this.selectedDevice?.videoInput?.deviceId) {
          params["video"] = {
            deviceId: this.selectedDevice.videoInput.deviceId,
          };
        }

        if (this.selectedDevice?.audioInput?.deviceId) {
          params["audio"] = {
            deviceId: { exact: this.selectedDevice.audioInput.deviceId },
          };
        }

        this.previewStream?.getTracks().forEach((track) => {
          track.stop();
        });

        this.previewStream = await this.stream.getPreviewStream(
          true,
          true,
          params
        );

        if (this.previewStream) {
          const videoTrack = this.previewStream.getVideoTracks()[0];
          const audioTrack = this.previewStream.getAudioTracks()[0];

          const audioInput = audioTrack?.getSettings()["deviceId"] || "default";
          const videoInput = videoTrack?.getSettings()["deviceId"] || "";

          this.select = {
            ...this.select,
            videoInValue: videoInput,
            audioInputValue: audioInput,
          };

          const videoRefEle = this.$refs["videoRef"];

          if (videoRefEle && videoTrack) {
            videoRefEle.srcObject = this.previewStream;
          }

          this.hideCheckingPage();

          this.clearAudioLevelTimmer();

          this.stream.clearAudioLevel();

          await this.stream.getAudioLevel(this.previewStream);
          // 实时获取音量大小
          this.audioLevelTimmer = setInterval(async () => {
            try {
              const level = await this.stream.getAudioLevel();

              // 更新Audio的实时音量显示
              this.audioLevel = level;
            } catch (err) {
              this.clearAudioLevelTimmer();
            }
          }, 100);
        }
      } catch (err) {
        // 如果是403，则未授权
        if (err.code === 403) {
          this.iauth = "denied";
        }
      }
    },
    getRangeRandom(min = 50, max = 500) {
      const num = Math.floor(Math.random() * (max - min + 1) + min);
      return num;
    },
    hideCheckingPage() {
      const randomTimer = this.getRangeRandom();

      setTimeout(() => {
        this.iauth = "granted";
      }, randomTimer);
    },
    async initDeviceManagerEvent() {
      this.deviceManager.on("permission", async (e) => {
        const { camera } = e;
        if (camera === "granted") {
          await this.getStream();

          this.getDevices();
        }
        this.iauth = camera;
      });

      this.deviceManager.on("device", (e) => {
        const { detail, nextDevice } = e;
        const { videoInput, audioInput, audioOutput } = nextDevice;
        const nextDevices = detail;

        if (videoInput) {
          this.handleChange("videoInValue", videoInput.deviceId);
        }

        if (audioInput) {
          this.handleChange("audioInputValue", audioInput.deviceId);
        }

        if (audioOutput) {
          this.handleChange("audioOutputValue", audioOutput.deviceId);
        }

        this.setDevices(nextDevices);
      });
    },

    async handleChange(key, e) {
      if (key === "audioInputValue" || key === "videoInValue") {
        this.replaceTrack(key, e);
      }

      this.select = {
        ...this.select,
        [key]: e,
      };
    },

    changeVideoIn(e) {
      this.handleChange("videoInValue", e);
    },

    changeAudioInput(e) {
      this.handleChange("audioInputValue", e);
    },

    changeAudioOutput(e) {
      this.handleChange("audioOutputValue", e);
    },

    async replaceTrack(key, deviceId = undefined) {
      if (this.previewStream) {
        // 音量level clear
        if (key === "audioInputValue") {
          this.clearAudioLevelTimmer();
        }

        // 1. add new track
        try {
          let params = {};

          if (key === "videoInValue") {
            params.video = {
              deviceId: deviceId
                ? { exact: deviceId || this.select.videoInValue }
                : undefined,
            };
          }

          if (key === "audioInputValue") {
            params.audio = {
              deviceId: deviceId
                ? { exact: deviceId || this.select.audioInputValue }
                : undefined,
            };
          }

          const newConstraintsStream = await this.stream.getPreviewStream(
            !!params.video,
            !!params.audio,
            params
          );
          const newTrack =
            key === "audioInputValue"
              ? newConstraintsStream.getAudioTracks()[0]
              : newConstraintsStream.getVideoTracks()[0];

          this.previewStream.addTrack(newTrack);
          if (key === "videoInValue") {
            this.videoStatusVisible = false;
          }
        } catch (err) {
          if (key === "videoInValue") {
            this.videoStatusVisible = true;
          }

          return;
        }

        // 2. remove && stop
        const localStreamTrack =
          key === "audioInputValue"
            ? this.previewStream.getAudioTracks()[0]
            : this.previewStream.getVideoTracks()[0];

        if (localStreamTrack) {
          this.previewStream.removeTrack(localStreamTrack);
          localStreamTrack.stop();
        }

        // 音量level重置
        if (key === "audioInputValue") {
          this.stream.clearAudioLevel();

          this.audioLevelTimmer = setInterval(async () => {
            try {
              const level = await this.stream.getAudioLevel(this.previewStream);

              // 更新Audio的实时音量显示
              this.audioLevel = level;
            } catch (err) {
              this.clearAudioLevelTimmer();
            }
          }, 100);
        }
      }
    },

    async getDevices() {
      const devices = await this.deviceManager.getDevices();

      this.setDevices(devices);
    },

    setDevices(devices) {
      const { audioInputList, audioOutputList, videoInList } = devices;
      this.audioInputList = audioInputList;
      this.audioOutputList = audioOutputList;
      this.videoInList = videoInList;
    },

    clearAudioLevelTimmer() {
      this.audioLevelTimmer && clearInterval(this.audioLevelTimmer);
    },
    clearStream() {
      this.previewStream && xyRTC.closePreviewStream(this.previewStream);
    },
    stop() {
      this.$emit("cancel");
      this.clearAudioLevelTimmer();

      const deviceManager = this.$refs["deviceManager"];

      if (deviceManager) {
        deviceManager.destory();
      }

      this.clearStream();

      this.stream.close();
    },
    async play() {
      const audioRef = this.$refs["audioRef"];
      if (audioRef) {
        if (audioRef.paused && !this.testAudioStatus) {
          xyRTC.setOutputAudioDevice(audioRef, this.select.audioOutputValue);

          await audioRef.play();
          this.testAudioStatus = true;
        } else {
          await audioRef.pause();
          this.testAudioStatus = false;
        }
      }
    },
    findDeviceById(deviceId, list) {
      return (
        list.find((item) => {
          return item.deviceId === deviceId;
        }) || { deviceId: "", label: "" }
      );
    },

    handleOk() {
      if (this.videoStatusVisible) {
        this.$message("设备不可用,请重新选择");
      } else {
        this.stop();

        const { audioInputValue, audioOutputValue, videoInValue } = this.select;

        this.$emit("setting", {
          selectedDevice: {
            audioInput: this.findDeviceById(
              audioInputValue,
              this.audioInputList
            ),
            audioOutput: this.findDeviceById(
              audioOutputValue,
              this.audioOutputList
            ),
            videoInput: this.findDeviceById(videoInValue, this.videoInList),
          },
          deviceList: {
            audioInputList: this.audioInputList,
            audioOutputList: this.audioOutputList,
            videoInList: this.videoInList,
          },
        });
      }
    },

    setOutputAudioDevice(val = this.select.audioOutputValue) {
      const audioRef = this.$refs["audioRef"];

      audioRef && val && xyRTC.setOutputAudioDevice(audioRef, val);
    },
  },
  watch: {
    "select.audioOutputValue": {
      handler(newVal) {
        this.setOutputAudioDevice(newVal);
      }
    },
    localHide(newVal) {
      this.$emit("setting", {
        localHide: newVal,
      });
    },
  },
};
</script>
<style scoped>
.xy__setting-modal {
  width: 720px;
  height: 540px;
}

.xy__setting-menu {
  height: 480px;
}
.el-menu-item.is-active {
  outline: 0;
  background-color: #ecf5ff;
}
.xy-setting-content {
  padding: 15px 30px 15px 15px;
}

.request__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 60px;
  color: #666;
}
.request__loading .roll {
  font-size: 18px;
}
.request__loading .init {
  margin-top: 10px;
}
.request__loading .el-loading-spinner .el-loading-text {
  margin-top: 20px;
  color: #666;
}
.request__iauth .guide-img {
  width: 70%;
  margin: 30px auto;
  display: block;
}

.request__iauth .tips {
  color: #333;
}

.request__iauth .done {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding-top: 10px;
}

.setting__content {
  position: relative;
  flex-grow: 1;
  height: 100%;
  padding: 24px 15px;
  overflow-y: auto;
}

.item {
  display: flex;
  align-items: center;
  padding: 15px 0 5px;
}
.item .value {
  display: flex;
  align-items: center;
  flex: 1;
  overflow: hidden;
}

.item .value .el-select {
  width: 100%;
}

.item .key {
  margin-right: 15px;
  min-width: 80px;
  text-align: right;
}

.item .video-value {
  position: relative;
}

.item .preview-video-bg {
  position: absolute;
  background: #000;
  color: #fff;
  width: 248px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
}

.item .preview-video {
  width: 248px;
  height: 140px;
  overflow: hidden;
  border-radius: 2px;
  object-fit: cover;
}

.item .play-audio,
.item .upload {
  cursor: pointer;
  color: #3876ff;
  transition: color ease 0.3s;
}

.item .play-audio:hover,
.item .upload:hover {
  opacity: 0.9;
}

.item .play-audio-status {
  color: #999;
  margin-left: 10px;
}

.item .level-process {
  width: 230px;
  height: 16px;
  border: 1px solid #ddd;
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}

.item .level-value {
  position: absolute;
  left: -230px;
  top: 0;
  width: 100%;
  height: 14px;
  background-color: #3876ff;
  border-radius: 2px;
  overflow: hidden;
  transition: transform ease 0.3s;
  transform: translateX(0%);
}

.item .split {
  padding: 0 5px;
  color: #ddd;
}

.setting__footer {
  text-align: right;
  min-height: 50px;
}
</style>
