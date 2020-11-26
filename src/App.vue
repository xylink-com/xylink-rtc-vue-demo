<template>
  <div id="app">
    <div class="login" v-if="!callMeeting && !callLoading">
      <h1>XY RTC DEMO</h1>
      <div class="operate">
        <el-link class="operate-item" icon="el-icon-upload2" @click="upload"
          >上传日志</el-link
        >
        <el-link class="operate-item" icon="el-icon-download" @click="download"
          >下载日志</el-link
        >
        <el-link
          class="operate-item"
          icon="el-icon-setting"
          @click="onToggleSetting"
          >设置</el-link
        >
      </div>

      <Login :user="user" @submitForm="submitForm" />

      <div class="copyright">版本：{{ this.version }}</div>
    </div>

    <div v-if="callMeeting && callLoading" class="loading">
      <div class="loading-content">
        <div class="avatar">
          <img
            src="https://cdn.xylink.com/wechatMP/images/device_cm_ios%402x.png"
            alt="nemo-avatar"
          />
        </div>
        <div class="name">正在呼叫 {{ user.meeting }}</div>
        <div class="stop" @click="stop('OK')">
          <img
            src="https://cdn.xylink.com/wechatMP/images/end.png"
            alt="end-call"
          />
        </div>
        <audio
          ref="bgmAudioRef"
          autoPlay
          loop
          src="https://cdn.xylink.com/wechatMP/ring.ogg"
        ></audio>
      </div>
    </div>
    <div v-if="callMeeting && !callLoading">
      <div class="meeting-header">
        <span> {{ user.meeting }}-({{ participantsCount }}人) </span>
      </div>
      <div class="meeting-content">
        <div class="meeting-layout" :style="layoutStyle">
          <Video
            v-for="(item, index) in newLayout"
            :model="layoutModel"
            :item="item"
            :key="item.key"
            :index="index"
            :videoId="item.key"
            :isRefresh="item.isRefresh"
          ></Video>
        </div>
        <div class="audio-list">
          <Audio
            v-for="item in audioList"
            :key="item.data.streams[0].id"
            :item="item"
            :muted="item.status === 'local'"
            :audioOutput="audioOutput"
          />
        </div>
        <Barrage
          v-if="subTitle.content && subTitle.action === 'push'"
          :subTitle="subTitle"
        />
      </div>
      <div class="meeting-footer">
        <div>
          <el-button type="danger" size="small" @click="stop('OK')"
            >挂断</el-button
          >
        </div>
        <div>
          <el-button type="primary" size="small" @click="audioOperate"
            >{{ audioStatus }}
          </el-button>
        </div>
        <div>
          <el-button type="primary" size="small" @click="videoOperate"
            >{{ video === "unmuteVideo" ? "关闭摄像头" : "开启摄像头" }}
          </el-button>
        </div>
        <div>
          <el-button type="primary" size="small" @click="switchLayout"
            >切换布局</el-button
          >
        </div>
        <div>
          <el-button type="primary" size="small" @click="switchDebug"
            >调试：{{ debug ? "Yes" : "No" }}</el-button
          >
        </div>
        <div v-if="shareContentStatus">
          <el-button type="primary" size="small" @click="stopShareContent"
            >结束共享
          </el-button>
        </div>
        <div v-else>
          <el-button type="primary" size="small" @click="shareContent"
            >共享
          </el-button>
        </div>
        <div>
          <el-button
            style="{ width: '90px' }"
            type="primary"
            size="small"
            @click="shareContent"
          >
            声量：{{ micLevel }}
          </el-button>
        </div>
      </div>

      <Internels
        v-if="debug"
        :senderStatus="senderStatus"
        @switchDebug="switchDebug"
      ></Internels>
    </div>

    <Setting :visible="settingVisible" />
  </div>
</template>

<script>
import Login from "./components/Login/index.vue";
import Setting from "./components/Setting/index.vue";
import Barrage from "./components/Barrage/index.vue";
import Audio from "./components/Audio/index.vue";
import Video from "./components/Video/index.vue";
import Internels from "./components/Internels/index.vue";
import xyRTC from "@xylink/xy-rtc-sdk";
import { Message } from "element-ui";
import store from "@/utils/store";
import { USER_INFO, DEFAULT_DEVICES } from "@/utils/enum";
import { ENV, SERVER, ACCOUNT } from "@/utils/config";

let client;
let stream;
let audioLevelTimmer;
const user = store.get("xy-user") || USER_INFO;

const message = {
  info: (message) => {
    Message.info({ message, duration: 2000, center: true });
  },
};

export default {
  name: "App",
  components: {
    Login,
    Setting,
    Barrage,
    Audio,
    Video,
    Internels,
  },
  computed: {
    layoutStyle() {
      const { rateWidth, rateHeight } = this.screenInfo;

      let style = {
        width: rateWidth + "px",
        height: rateHeight + "px",
      };

      if (
        this.layout[0] &&
        this.layout[0].position[2] === 1 &&
        this.layout[0].position[3] === 1
      ) {
        style = {
          width: "100%",
          height: "100%",
        };
      }

      return style;
    },
    audioStatus() {
      let status = "取消静音";

      if (this.audio === "unmute") {
        status = this.disableAudio ? "结束发言" : "静音";
      } else if (this.audio === "mute") {
        if (this.disableAudio) {
          status = this.handStatus ? "取消举手" : "举手发言";
        } else {
          status = "取消静音";
        }
      }
      return status;
    },
    newLayout() {
      const layoutLen = this.layout.length;
      return this.layout
        .filter((item) => item.roster.participantId)
        .map((item, index) => {
          const id = item.roster.endpointId;
          const mediagroupid = item.roster.mediagroupid;
          const streamId =
            (item.stream && item.stream.video && item.stream.video.id) || "";
          const key = id + streamId + mediagroupid;
          const isRefresh = layoutLen > 1 && layoutLen === index + 1;
          return {
            ...item,
            key,
            isRefresh,
            id,
          };
        });
    },
    audioOutput() {
      const devices = store.get("xy-devices") || {
        audioOutputValue: "default",
      };
      return devices.audioOutputValue || "";
    },
    callStatus() {
      return {
        callMeeting: this.callMeeting,
        callLoading: this.callLoading,
      };
    },
  },
  data() {
    return {
      user, // 登录者信息
      callMeeting: false, // 呼叫状态
      callLoading: false, // 是否呼叫中
      layout: [], // 参会成员数据，包含stream，roster，postion等信息，最终依赖layout的数据进行画面布局、渲染、播放、状态显示
      screenInfo: { rateWidth: 0, rateHeight: 0 }, // screen容器信息
      audioList: [], // 所有声源列表
      video: user.muteVideo ? "muteVideo" : "unmuteVideo", // 摄像头状态
      audio: user.muteAudio ? "mute" : "unmute", // 麦克风状态
      disableAudio: false, // 是否强制静音
      handStatus: false, // 举手状态
      subTitle: { action: "cancel", content: "" }, // 是否有字幕或点名
      layoutModel: "speaker", // 桌面布局模式(语音激励模式、画廊模式)
      participantsCount: 0, // 会议成员数量
      micLevel: 0, // 音量等级
      shareContentStatus: false, // 开启content的状态
      senderStatus: { sender: {}, receiver: {} }, // 呼叫数据统计
      debug: false, // 是否是调试模式（开启则显示所有画面的呼叫数据）
      env: ENV, // 配置环境，第三方集成不需要配置，默认是线上环境
      settingVisible: false, // 设置
      preDevicesRef: null, // pre device
      version: xyRTC.version,
    };
  },
  beforeDestroy() {
    this.stop();
  },
  methods: {
    // 登录
    submitForm(values) {
      const isSupport = xyRTC.checkSupportWebRTC();

      if (!isSupport) {
        message.info("Not support webrtc");

        return;
      }
      this.user = values;

      this.join();
    },
    async join() {
      this.callMeeting = true;
      this.callLoading = true;

      let callStatus = true;

      try {
        const {
          meeting,
          meetingPassword,
          meetingName,
          muteAudio,
          muteVideo,
        } = this.user;
        const { wssServer, httpServer, logServer } = SERVER(this.env);

        // 这里三方可以根据环境修改sdk log等级
        // xyRTC.logger.setLogLevel("NONE");

        client = xyRTC.createClient({
          // 注意，第三方集成时，默认是prd环境，不需要配置wss/http/log server地址；
          wssServer,
          httpServer,
          logServer,
          muteAudio,
          muteVideo,
          container: {
            offsetHeight: 92,
          },
        });

        this.initEventListener(client);

        /**
         * 重要提示
         * 重要提示
         * 重要提示
         * 第三方登录，请在config配置文件里面配置企业账户信息
         * 重要提示
         * 重要提示
         * 重要提示
         */
        let result;
        const { extId, clientId, clientSecret } = ACCOUNT(this.env);

        result = await client.loginExternalAccount({
          // 用户名自行填写
          displayName: "thirdName",
          extId,
          clientId,
          clientSecret,
        });

        if (result.code === 10104) {
          message.info("登录密码错误");

          this.callMeeting = false;
          this.callLoading = false;
          return;
        } else if (result.code !== 200) {
          message.info("登录失败");

          this.callMeeting = false;
          this.callLoading = false;
          return;
        }

        const token = result.data.token || result.data.access_token;

        callStatus = await client.makeCall({
          token,
          confNumber: meeting,
          password: meetingPassword,
          displayName: meetingName,
        });

        if (callStatus) {
          stream = xyRTC.createStream();

          const devices = store.get("xy-devices") || {
            audioInputValue: "default",
            videoInValue: "",
          };

          await stream.init({ devices });

          client.publish(stream, { isSharePeople: true });

          // 记录入会时的设备信息
          this.updateDevicesByStream(stream);
        }
      } catch (err) {
        console.log("入会失败: ", err);

        this.disconnected(
          err.msg || "呼叫异常，请稍后重试",
          "PEER_NET_DISCONNECT"
        );
      }
    },
    // 挂断会议
    disconnected(msg = "", reason) {
      message.info(msg);

      this.stop(reason);
    },

    // 结束会议操作
    stop(reason = "OK") {
      this.clearStorage();

      // 重置audio、video状态
      this.audio = this.user.muteAudio ? "mute" : "unmute";
      this.video = this.user.muteVideo ? "muteVideo" : "unmuteVideo";

      // 重置字幕信息
      this.subTitle = { action: "cancel", content: "" };

      // sdk清理操作
      stream && stream.close();
      client && client.close(reason);

      // 清理组件状
      this.callMeeting = false;
      this.callLoading = false;
      this.shareContentStatus = false;
      this.debug = false;
      this.layout = [];
      this.micLevel = 0;

      // 清理定时器
      this.clearTimmer();
      client = null;
      stream = null;
    },
    clearStorage() {
      store.remove("xy-devices");
      store.remove("xy-deviceList");
    },
    clearTimmer() {
      audioLevelTimmer && clearInterval(audioLevelTimmer);
      audioLevelTimmer = null;
    },
    // 监听client的内部事件
    initEventListener(client) {
      // 退会消息监听，注意此消息很重要，内部的会议挂断都是通过此消息通知
      client.on("disconnected", (e) => {
        const showMessage =
          (e.detail && e.detail.message) || "呼叫异常，请稍后重试";

        this.disconnected(showMessage, "EXPIRED");
      });

      // 会议成员数量数据
      client.on("participants-count", (e) => {
        this.participantsCount = e.participantsNum;
      });

      // 会议layout数据
      client.on("layout", (e) => {
        this.layout = e;
      });

      // 动态计算的显示容器信息
      client.on("screen-info", (e) => {
        this.screenInfo = e;
      });

      // audio list数据
      client.on("audio-track", (e) => {
        this.audioList = e;
      });

      // 呼叫状态
      client.on("call-status", (e) => {
        // 10518入会成功
        // 10519正在呼叫中
        // 呼叫失败，请将detail信息作为disconnected的第二个参数
        const code = e.code;
        const msg = e.msg;
        const detail = e.detail;

        if (code === 10518) {
          message.info(msg);
          this.callLoading = false;
        } else if (code === 10519) {
          message.info(msg);
        } else {
          this.disconnected(msg, detail);
        }
      });

      // 麦克风状态
      client.on("audio-status", (e) => {
        const { disableMute, muteOperation } = e;
        // if (disableMute) {
        //   setDisableAudio(disableMute);
        // }
        this.disableAudio = disableMute;

        if (muteOperation) {
          this.audio = muteOperation;
        }

        if (muteOperation === "mute" && disableMute) {
          message.info("主持人已强制静音，如需发言，请点击“举手发言”");
          this.handStatus = false;
        } else if (muteOperation === "mute" && !disableMute) {
          message.info("您已被主持人静音");
        } else if (muteOperation === "unmute" && disableMute) {
          message.info("主持人已允许您发言");
          this.handStatus = false;
        } else if (muteOperation === "unmute" && !disableMute) {
          message.info("您已被主持人取消静音");
        }
      });

      // 分享content消息
      client.on("content", (e) => {
        if (e.data) {
          message.info("您正在接收共享内容", 3);
        }
      });

      client.on("meeting-stats", (e) => {
        this.senderStatus = e;
      });

      // 字幕、点名消息
      client.on("sub-title", (e) => {
        this.subTitle = e;
      });

      // 清除举手
      client.on("cancel-handup", (e) => {
        if (e) {
          this.onHandDown();
        }
      });

      // 设备切换
      client.on("devices", async (e) => {
        if (e && e.detail) {
          const nextDevices = e.detail || DEFAULT_DEVICES;
          const preDevices = store.get("xy-deviceList") || DEFAULT_DEVICES;
          // pre 设备
          // @ts-ignore
          const {
            videoIn: preVideoIn,
            audioInput: preAudioInput,
          } = this.preDevicesRef;
          // 当前连接设备
          const {
            videoIn: nextVideoIn,
            audioInput: nextAudioInput,
            audioOutput,
          } = xyRTC.diffDevices(preDevices, nextDevices);

          nextVideoIn &&
            message.info(`视频设备已自动切换至 ${nextVideoIn.label}`);
          nextAudioInput &&
            message.info(`音频输入设备已自动切换至 ${nextAudioInput.label}`);
          audioOutput &&
            message.info(`音频输出设备已自动切换至 ${audioOutput.label}`);

          if (
            nextAudioInput &&
            nextAudioInput.deviceId !== preAudioInput.deviceId
          ) {
            console.log("switch audio device:::", nextAudioInput.deviceId);
            try {
              stream.switchDevice("audio", nextAudioInput.deviceId);
              // @ts-ignore
              this.preDevicesRef.audioInput = nextAudioInput;
            } catch (err) {
              stream.switchDevice("audio", undefined);
            }
          }

          if (nextVideoIn && nextVideoIn.deviceId !== preVideoIn.deviceId) {
            console.log("switch video device:::", nextVideoIn.deviceId);
            try {
              stream.switchDevice("video", nextVideoIn.deviceId);
              // @ts-ignore
              this.preDevicesRef.videoIn = nextVideoIn;
            } catch (err) {
              stream.switchDevice("video", undefined);
            }
          }

          if (audioOutput) {
            const devices = store.get("xy-devices");

            store.set("xy-devices", {
              ...devices,
              audioOutputValue: audioOutput.deviceId,
            });
          }

          store.set("xy-deviceList", nextDevices);
        }
      });
    },
    // 通过stream获取设备信息
    async updateDevicesByStream(stream) {
      if (stream && stream.localStream && stream.localStream.stream) {
        const tempLocalStream = stream.localStream.stream.clone();

        const audioTrack = tempLocalStream.getAudioTracks()[0];
        const videoTrack = tempLocalStream.getVideoTracks()[0];

        const audioInput = audioTrack.getSettings();
        const videoIn = videoTrack.getSettings();

        // @ts-ignore
        this.preDevicesRef = {
          audioInput: {
            ...audioInput,
            label: audioTrack.label,
          },
          videoIn: {
            ...videoIn,
            label: videoTrack.label,
          },
        };
        const deviceList = await xyRTC.getDevices();
        store.set("xy-deviceList", deviceList);
      }
    },
    // 摄像头操作
    videoOperate() {
      if (this.video === "unmuteVideo") {
        client.muteVideo();

        this.video = "muteVideo";
      } else {
        client.unmuteVideo();

        this.video = "unmuteVideo";
      }
    },

    // 麦克风操作
    async audioOperate() {
      if (this.audio === "mute" && this.disableAudio && !this.handStatus) {
        const isHandStatus = await client.onHandUp();
        this.handStatus = isHandStatus;
        message.info("发言请求已发送");
        return;
      }

      if (this.audio === "mute" && this.disableAudio && this.handStatus) {
        await this.onHandDown();
        return;
      }

      if (this.audio === "unmute" && this.disableAudio) {
        const isHandStatus = await client.onMute();
        this.handStatus = isHandStatus;
        return;
      }

      if (this.audio === "unmute") {
        client.muteAudio();

        this.audio = "mute";

        message.info("麦克风已静音");
      } else {
        client.unmuteAudio();

        this.audio = "unmute";
      }
    },
    // 切换布局
    switchLayout() {
      const modal = client.switchLayout().toLowerCase();

      this.layoutModel = modal;
    },
    // 取消举手
    async onHandDown() {
      const isHandStatus = await client.onHandDown();
      this.handStatus = isHandStatus;
    },
    // 设置
    onToggleSetting() {
      message.info("设置");
    },
    // 上传日志
    async upload() {
      const result = await xyRTC.logger.uploadLog(this.user.meetingName);

      if (result) {
        message.info("上传成功");
      } else {
        message.info("上传失败");
      }
    },
    // 下载日志
    async download() {
      message.info("正在下载，请稍后");
      await xyRTC.logger.downloadLog();
    },

    // 停止分享content
    stopShareContent() {
      client.stopShareContent();
      this.shareContentStatus = false;
    },

    // 分享content内容
    async shareContent() {
      try {
        const result = await stream.createContentStream();

        // 创建分享屏幕stream成功
        if (result.code === 518) {
          this.shareContentStatus = true;

          stream.on("start-share-content", () => {
            client.publish(stream, { isShareContent: true });
          });

          stream.on("stop-share-content", () => {
            this.stopShareContent();
          });
        } else {
          if (result && result.code !== 500) {
            message.info(result.msg || "分享屏幕失败");
            return;
          }
        }
      } catch (err) {
        console.log("share screen error: ", err);
      }
    },
    // debug
    switchDebug() {
      const status = !this.debug;
      this.debug = status;

      client.switchDebug(status);
    },
    // 设置音量
    setMicLevel(audio) {
      if (audio === "unmute") {
        if (!audioLevelTimmer) {
          audioLevelTimmer = setInterval(() => {
            if (stream) {
              const level = stream.getAudioLevel();

              // 更新Audio的实时音量显示
              this.micLevel = level;
            }
          }, 500);
        }
      } else {
        this.clearTimmer();
        this.micLevel = 0;
      }
    },
  },
  watch: {
    callStatus: {
      handler(newValue) {
        const { callMeeting, callLoading } = newValue;
        if (callMeeting && !callLoading) {
          this.setMicLevel(this.audio);
        }

        if (!callLoading && this.$refs["bgmAudioRef"]) {
          this.$refs["bgmAudioRef"].pause();
        }

        if (callMeeting && callLoading) {
          const devices = store.get("xy-devices") || {
            audioOutputValue: "default",
          };
          xyRTC.setOutputAudioDevice(
            this.$refs["bgmAudioRef"],
            devices.audioOutputValue
          );
        }
      },
    },
    audio: {
      handler(newValue) {
        if (this.callMeeting && !this.callLoading) {
          this.setMicLevel(newValue);
        }
      },
    },
  },
};
</script>
<style scoped>
.login {
  width: 100%;
  height: 100%;
  max-width: 500px;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
}
.login h1 {
  margin: 20px 0;
}
.login .operate {
  margin: 20px 0 50px;
}
.login .operate-item {
  margin: 0 10px;
}
</style>
