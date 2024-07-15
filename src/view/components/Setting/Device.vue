<template>
  <div class="setting__content-device">
    <el-alert v-if="isShowStreamFailTips" title="" type="error">
      <div class="stream-fail">
        <span class="stream-fail-tip">摄像头或麦克风打开失败</span>
        <span class="click-me" @click="guideVisible = true"> 点我 </span>
      </div>
    </el-alert>

    <div v-if="loading" class="fixed">
      <div class="request__loading" v-loading="true" element-loading-text="设备检测中..." />
    </div>

    <div :class="['setting__content-device-main', loading ? 'hidden' : 'visible']">
      <div>
        <div class="item">
          <div class="key">摄像头</div>
          <div class="value">
            <el-select popper-class="xy-select" v-model="videoSelectedDevice" value-key="key" @change="changeVideoIn">
              <el-option
                v-for="item in videoInList"
                :key="item.key"
                :label="item.isDefault ? '系统默认-' + item.label : item.label"
                :value="item"
              >
              </el-option>
            </el-select>
          </div>
        </div>

        <div class="item">
          <div class="key"></div>
          <div class="value video-value">
            <div :class="[isPreviewUnavailable ? 'visible' : 'hidden', 'preview-video-bg']">预览不可用</div>
            <video class="preview-video" autoPlay :muted="true" ref="videoRef" :controls="false" playsInline></video>
          </div>
        </div>

        <div class="item">
          <div class="key">麦克风</div>
          <div class="value">
            <el-select
              popper-class="xy-select"
              v-model="audioInputSelectedDevice"
              value-key="key"
              @change="changeAudioInput"
            >
              <el-option
                v-for="item in audioInputList"
                :key="item.key"
                :label="item.isDefault ? '系统默认-' + item.label : item.label"
                :value="item"
              >
              </el-option>
            </el-select>
          </div>
        </div>

        <div class="item">
          <div class="key">音量</div>
          <div class="value">
            <svg-icon icon="icon_device_volume" class="volume" />
            <div class="level-process">
              <div class="level-value" :style="{ transform: `translateX(${audioLevel}%)` }"></div>
            </div>
          </div>
        </div>

        <div class="item">
          <div class="key">扬声器</div>
          <div class="value">
            <el-select
              popper-class="xy-select"
              v-model="audioOutputSelectedDevice"
              value-key="key"
              @change="changeAudioOutput"
            >
              <el-option
                v-for="item in audioOutputList"
                :key="item.key"
                :label="item.isDefault ? '系统默认-' + item.label : item.label"
                :value="item"
              >
              </el-option>
            </el-select>
          </div>
        </div>

        <div class="item" v-if="permission.microphone === 'granted'">
          <div class="key"></div>
          <div class="value">
            <span class="play-audio" @click="playAudioTest">{{ testAudioStatus ? '停止扬声器' : '测试扬声器' }}</span>
            <span v-if="testAudioStatus" class="play-audio-status">正在播放声音...</span>
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
          <a href="https://cdn.xylink.com/webrtc/web/index.html#/detect" rel="noopener noreferrer" target="_blank">
            开始检测
          </a>
        </div>
      </div>
    </div>

    <Guide :visible="guideVisible" @close="guideVisible = false" />
  </div>
</template>
<script>
import XYRTC, { setOutputAudioDevice, PermissionType, DEVICE_KIND } from '@xylink/xy-rtc-sdk';
import Guide from '../Guide';
// import store from '@/utils/store';
// import { STORAGE_KEY } from '@/utils/enum';
import { message } from '@/utils/index';

export default {
  props: ['setting', 'current'],
  components: {
    Guide,
  },
  computed: {
    isShowStreamFailTips() {
      const { camera, microphone } = this.permission || {};

      return camera === 'denied' || camera === 'failed' || microphone === 'denied' || microphone === 'failed';
    },
  },
  data() {
    return {
      settingVisible: this.visible,
      client: null,
      videoAudioTrack: null,
      audioInputList: [],
      audioOutputList: [],
      videoInList: [],
      audioLevel: 0,
      videoSelectedDevice: null,
      audioInputSelectedDevice: null,
      audioOutputSelectedDevice: null,
      testAudioStatus: false,
      isPreviewUnavailable: false,
      audioLevelTimer: null,
      permission: { camera: '', microphone: '' },
      guideVisible: false,
      loading: false,
    };
  },

  async mounted() {
    const logger = XYRTC.createLogger({
      dbName: 'XYRTC_SETTING_DEVICE_LOG',
      tableName: 'LOG',
      scope: 'SETTING',
      maxSize: 10000,
    });

    this.client = XYRTC.createClient(
      {
        clientId: '',
        clientSecret: '',
        extId: '',
      },
      logger
    );

    this.client.setFeatureConfig({ enableV2States: false });

    const { audioInput, audioOutput, videoInput } = this.setting.specifiedDevice || {};

    try {
      this.videoAudioTrack = await this.client.createVideoAudioTrack();

      this.videoAudioTrack.on('permission', this.handlePermission);
      this.videoAudioTrack.on('device', this.handleDevice);
      this.videoAudioTrack.on('track-error', this.handleError);

      await this.videoAudioTrack.capture({
        audioInputId: audioInput?.isDefault ? '' : audioInput?.deviceId,
        audioOutputId: audioOutput?.isDefault ? '' : audioOutput?.deviceId,
        videoInputId: videoInput?.isDefault ? '' : videoInput?.deviceId,
      });
    } catch (error) {
      console.log('create video audio track error: ', error);
    }

    this.loading = false;

    this.videoOperate();
    this.audioOperate();
  },

  beforeDestroy() {
    this.stop();
  },

  methods: {
    setVideoRender() {
      if (!this.client) return;

      const mediaStream = this.client.getVideoStream();

      const videoRef = this.$refs['videoRef'];

      if (videoRef && mediaStream) {
        videoRef.srcObject = mediaStream;
      }

      this.isPreviewUnavailable = false;
    },

    // 监听SDK上报的device消息，更新最新的设备列表数据，包含isDefault和isSelected状态
    handleDevice(e) {
      // 获取最新的设备列表，直接更新
      const { audioInputList, audioOutputList, videoInputList } = e.detail;

      this.audioInputList = audioInputList;
      this.audioOutputList = audioOutputList;
      this.videoInList = videoInputList;

      // 切换设备
      // 扬声器因为在外部，所以需要业务自行切换设备ID
      const { audioOutput } = e.nextDevice;

      if (audioOutput) {
        this.setOutputAudioDevice(audioOutput.deviceId);
      }
    },

    handlePermission(e) {
      const { camera, microphone } = e;
      if (camera !== this.permission.camera) {
        this.videoOperate();
      }

      if (microphone !== this.permission.microphone) {
        this.audioOperate();
      }

      this.permission = e;
    },

    handleError(e) {
      const { msg = '' } = e;

      msg && message.info(msg);
    },

    async videoOperate() {
      if (this.loading || !this.client) {
        return;
      }

      const { GRANTED } = PermissionType;

      try {
        if (this.permission.camera === GRANTED) {
          await this.client.unmuteVideo();
          this.setVideoRender();
        } else {
          await this.client.muteVideo();
          this.isPreviewUnavailable = true;
        }
      } catch (error) {
        console.log('video operate error: ', error);
      }
    },

    async audioOperate() {
      if (this.loading || !this.client) {
        return;
      }

      const { GRANTED } = PermissionType;

      try {
        if (this.permission.microphone === GRANTED) {
          await this.client.unmuteAudio();
          this.getAudioLevel();
        } else {
          await this.client.muteAudio();
        }
      } catch (error) {
        console.log('audio operate error: ', error);
      }
    },

    async handleChange(kind, device) {
      const { AUDIOINPUT, AUDIOOUTPUT, VIDEOINPUT } = DEVICE_KIND;

      if (kind === AUDIOINPUT) {
        await this.switchAudioInputDevice(device);
      }

      if (kind === AUDIOOUTPUT) {
        await this.switchAudioOutputDevice(device);
      }

      if (kind === VIDEOINPUT) {
        await this.switchVideoInputDevice(device);
      }
    },

    /**
     * 切换麦克风
     */
    async switchAudioInputDevice(device) {
      const { deviceId, isDefault } = device;

      try {
        await this.videoAudioTrack.switchDevice(DEVICE_KIND.AUDIOINPUT, deviceId, { isDefault });

        this.setSpecifiedDevice({ audioInput: device });
      } catch (err) {
        console.error('switch audio input error: ', err);
      }
    },

    /**
     * 切换摄像头
     */
    async switchVideoInputDevice(device) {
      const { deviceId, isDefault } = device;

      try {
        await this.videoAudioTrack?.switchDevice(DEVICE_KIND.VIDEOINPUT, deviceId, { isDefault });

        this.setVideoRender();

        this.setSpecifiedDevice({ videoInput: device });
      } catch (err) {
        console.warn('switch video input error: ', err);
      }
    },

    /**
     * 切换扬声器
     */
    async switchAudioOutputDevice(device) {
      const { deviceId, isDefault } = device;

      // 调用SDK切换设备方法，通知设备切换行为
      await this.videoAudioTrack?.switchDevice(DEVICE_KIND.AUDIOOUTPUT, deviceId, { isDefault });

      await this.setOutputAudioDevice(deviceId);

      this.setSpecifiedDevice({ audioOutput: device });
    },

    async setOutputAudioDevice(deviceId) {
      const audioRef = this.$refs['audioRef'];

      // 更新设置组件的audio播放器对应的输出设备
      try {
        await setOutputAudioDevice(audioRef, deviceId);
      } catch (err) {
        console.log('setOutputAudioDevice error: ', err);
      }
    },

    setSpecifiedDevice(obj) {
      this.$emit('setting', {
        specifiedDevice: {
          ...this.setting.specifiedDevice,
          ...obj,
        },
      });

      // store.set(STORAGE_KEY.specifiedDevice, { ...this.specifiedDevice });
    },

    changeVideoIn(e) {
      this.handleChange(DEVICE_KIND.VIDEOINPUT, e);
    },

    changeAudioInput(e) {
      this.handleChange(DEVICE_KIND.AUDIOINPUT, e);
    },

    changeAudioOutput(e) {
      this.handleChange(DEVICE_KIND.AUDIOOUTPUT, e);
    },

    async getAudioLevel() {
      this.clearAudioLevelTimer();

      await this.getAudioLevelByTrack();

      // 实时获取音量大小
      this.audioLevelTimer = setInterval(async () => {
        await this.getAudioLevelByTrack();
      }, 100);
    },

    async getAudioLevelByTrack() {
      try {
        const level = await this.videoAudioTrack.getAudioLevel();
        this.audioLevel = level;
      } catch (err) {
        this.clearAudioLevelTimer();
      }
    },

    clearAudioLevelTimer() {
      if (this.audioLevelTimer) {
        clearInterval(this.audioLevelTimer);
        this.audioLevelTimer = null;
      }
    },

    async stop() {
      this.clearAudioLevelTimer();

      this.testAudioStatus = false;

      await this.client?.destroy();

      this.client = null;
      this.logger = null;

      this.$emit('cancel');
    },
    async playAudioTest() {
      const audioRef = this.$refs['audioRef'];
      if (audioRef) {
        const selectDevice = this.audioOutputList.find((device) => device.isSelected);

        if (audioRef.paused && !this.testAudioStatus && selectDevice) {
          setOutputAudioDevice(audioRef, selectDevice.deviceId);

          await audioRef.play();
          this.testAudioStatus = true;
        } else {
          await audioRef.pause();
          this.testAudioStatus = false;
        }
      }
    },
    findDevice(list) {
      return (
        list.find((item) => {
          return item.isSelected;
        }) || { deviceId: '', label: '' }
      );
    },
  },

  watch: {
    videoInList: {
      handler(newDevices) {
        this.videoSelectedDevice = this.findDevice(newDevices);
      },
      deep: true,
    },
    audioInputList: {
      handler(newDevices) {
        this.audioInputSelectedDevice = this.findDevice(newDevices);
      },
      deep: true,
    },
    audioOutputList: {
      handler(newDevices) {
        this.audioOutputSelectedDevice = this.findDevice(newDevices);
      },
      deep: true,
    },
  },
};
</script>
