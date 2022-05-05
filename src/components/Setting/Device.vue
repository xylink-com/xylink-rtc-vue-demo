<template>
  <div class="setting__content-device">
    <el-alert v-if="isShowStreamFailTips" title="" type="error">
      <div class="stream-fail">
        <span class="stream-fail-tip">摄像头或麦克风打开失败</span>
        <span class="click-me" @click="guideVisible = true">
          点我
        </span>
      </div>
    </el-alert>

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
              popper-class="xy-select"
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
              popper-class="xy-select"
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
              popper-class="xy-select"
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

      <div class="item">
        <div class="key">详细检测</div>
        <div class="value">
          <a
            href="https://cdn.xylink.com/webrtc/web/index.html#/detect"
            rel="noopener noreferrer"
            target="_blank"
          >
            开始检测
          </a>
        </div>
      </div>

      <div class="setting__footer">
        <el-button type="primary" @click="handleOk">保存</el-button>
      </div>
    </div>

    <Guide :visible="guideVisible" @close="guideVisible = false" />
  </div>
</template>
<script>
import xyRTC, { DeviceManager } from "@xylink/xy-rtc-sdk";
import Guide from "../Guide";

export default {
  props: ["setting", "current"],
  components: {
    Guide,
  },
  computed: {
    isShowStreamFailTips() {
      const { camera, microphone } = this.permission || {};

      return (
        camera === "denied" ||
        camera === "failed" ||
        microphone === "denied" ||
        microphone === "failed"
      );
    },
  },
  data() {
    const { selectedDevice } = this.setting || {};
    const defaultSelect = {
      audioInputValue: selectedDevice?.audioInput?.deviceId || "default",
      audioOutputValue: selectedDevice?.audioOutput?.deviceId || "default",
      videoInValue: selectedDevice?.videoInput?.deviceId || "",
    };
    return {
      settingVisible: this.visible,
      iauth: "pending",
      stream: null,
      previewVideoStream: null,
      previewAudioStream: null,
      deviceManager: null,
      audioInputList: [],
      audioOutputList: [],
      videoInList: [],
      audioLevel: 0,
      select: defaultSelect,
      testAudioStatus: false,
      videoStatusVisible: false,
      audioLevelTimmer: null,
      permission: { camera: "", microphone: "" },
      guideVisible: false,
    };
  },

  async mounted() {
    this.deviceManager = new DeviceManager();
    await this.deviceManager.init();

    // 在某些浏览器需要先采流授权，才能得到对应的设备信息
    await this.getStream();

    await this.getDevices();

    await this.initDeviceManagerEvent();
  },

  beforeDestroy() {
    this.stop();
  },

  methods: {
    async getStream() {
      if (!this.stream) {
        this.stream = xyRTC.createStream();
      }

      await this.getVideoStream();

      await this.getAudioStream();

      this.hideCheckingPage();
    },

    async getVideoStream(deviceId = this.selectedDevice?.videoInput?.deviceId) {
      let cameraPermission = "failed";

      try {
        let params = {};

        if (deviceId) {
          params["video"] = {
            deviceId: { exact: deviceId },
          };
        }

        this.previewVideoStream?.getTracks().forEach((track) => {
          track.stop();
        });

        this.previewVideoStream = await this.stream.getPreviewStream(
          true,
          false,
          params
        );

        if (this.previewVideoStream) {
          const videoTrack = this.previewVideoStream.getVideoTracks()[0];

          const videoInput = videoTrack?.getSettings()["deviceId"] || "";

          this.select = {
            ...this.select,
            videoInValue: videoInput,
          };

          const videoRefEle = this.$refs["videoRef"];

          if (videoRefEle && videoTrack) {
            videoRefEle.srcObject = this.previewVideoStream;
          }
        }

        cameraPermission = "granted";
      } catch (err) {
        this.videoStatusVisible = true;

        console.log("video err:", err);

        if (err?.code === "XYSDK:950404") {
          cameraPermission = "denied";
        }

        console.log("get video stream error:", err);
      }

      this.permission = {
        ...this.permission,
        camera: cameraPermission,
      };
    },

    async getAudioStream(deviceId = this.selectedDevice?.audioInput?.deviceId) {
      let microphonePermission = "failed";
      let params = {};

      if (deviceId) {
        params["audio"] = {
          deviceId: { exact: deviceId },
        };
      }

      this.previewAudioStream?.getTracks().forEach((track) => {
        track.stop();
      });

      try {
        this.previewAudioStream = await this.stream.getPreviewStream(
          false,
          true,
          params
        );

        if (this.previewAudioStream) {
          const audioTrack = this.previewAudioStream.getAudioTracks()[0];
          const audioInput = audioTrack?.getSettings()["deviceId"] || "default";

          this.select = {
            ...this.select,
            audioInputValue: audioInput,
          };

          this.stream.clearAudioLevel();

          await this.stream.getAudioLevel(this.previewAudioStream);
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
        microphonePermission = "granted";
      } catch (err) {
        console.log("get audio stream failed:", err);

        if (err?.code === "XYSDK:950404") {
          microphonePermission = "denied";
        }
      }

      this.permission = {
        ...this.permission,
        microphone: microphonePermission,
      };
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
        const { camera, microphone } = e;

        if (camera === "granted") {
          await this.getVideoStream();
        }

        if (microphone === "granted") {
          await this.getAudioStream();
        }

        this.getDevices();

        this.permission = e;
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
        await this.getVideoStream(e);
      }

      if (key === "videoInValue") {
        await this.getAudioStream(e);
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
      this.previewVideoStream &&
        xyRTC.closePreviewStream(this.previewVideoStream);

      this.previewAudioStream &&
        xyRTC.closePreviewStream(this.previewAudioStream);
    },

    stop() {
      this.clearAudioLevelTimmer();

      const deviceManager = this.$refs["deviceManager"];

      if (deviceManager) {
        deviceManager.destroy();
      }

      this.clearStream();

      this.stream.close();

      this.$emit("cancel");
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
      this.stop();

      const { audioInputValue, audioOutputValue, videoInValue } = this.select;

      this.$emit("setting", {
        selectedDevice: {
          audioInput: this.findDeviceById(audioInputValue, this.audioInputList),
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
      },
    },
  },
};
</script>
