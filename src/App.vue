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
          />
        </div>
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
  </div>
</template>

<script>
import Login from "./components/Login/index.vue";
import Audio from "./components/Audio/index.vue";
import Video from "./components/Video/index.vue";
import Internels from "./components/Internels/index.vue";
import xyRTC from "xy-rtc-sdk-beta";
import { Message } from "element-ui";
import store from "@/utils/store";
import { USER_INFO } from "@/utils/enum";
import { SERVER } from "@/utils/config";
import { Base64 } from "js-base64";

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
      video: "unmuteVideo", // 摄像头状态
      audio: "unmute", // 麦克风状态
      disableAudio: false, // 是否强制静音
      layoutModel: "speaker", // 桌面布局模式(语音激励模式、画廊模式)
      participantsCount: 0, // 会议成员数量
      micLevel: 0, // 音量等级
      shareContentStatus: false, // 开启content的状态
      senderStatus: { sender: {}, receiver: {} }, // 呼叫数据统计
      debug: false, // 是否是调试模式（开启则显示所有画面的呼叫数据）
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
        const { meeting, meetingPwd, username, password } = this.user;
        const { wssServer, httpServer, logServer } = SERVER;

        // 这里三方可以根据环境修改sdk log等级
        // xyRTC.logger.setLogLevel("NONE");

        client = xyRTC.createClient({
          // 注意，第三方集成时，默认是prd环境，不需要配置wss/http/log server地址；
          wssServer,
          httpServer,
          logServer,
          container: {
            offsetHeight: 92,
          },
        });

        this.initEventListener(client);

        let result;

        result = await client.loginXYlinkAccount(
          username,
          Base64.encode(password)
        );

        if (result.code !== 200) {
           message.info("登录失败");

          this.callMeeting = false;
          this.callLoading = false;
          return;
        }

        const token = result.data.token || result.data.access_token;

        callStatus = await client.makeCall({
          token, // 唯一标识符
          confNumber: meeting, // 云会议号
          password: meetingPwd, // 入会密码，没有则为空
          displayName: username, // 入会显示昵称
        });

        if (callStatus) {
          stream = xyRTC.createStream();

          await stream.init();

          client.publish(stream, { isSharePeople: true });
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
      // 重置audio、video状态
      this.audio = "unmute";
      this.video = "unmuteVideo";

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
        } else if (muteOperation === "mute" && !disableMute) {
          message.info("您已被主持人静音");
        } else if (muteOperation === "unmute" && disableMute) {
          message.info("主持人已允许您发言");
        } else if (muteOperation === "unmute" && !disableMute) {
          message.info("您已被主持人取消静音");
        }
      });

      // 参会者信息
      client.on("roster", (e) => {
        console.log("roster:", e);
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
      if (this.audio === "mute" && this.disableAudio) {
        return;
      }

      if (this.audio === "unmute") {
        client.muteAudio();

        this.audio = "mute";
      } else {
        client.unmuteAudio();

        this.audio = "unmute";
      }
    },
    // 切换布局
    switchLayout() {
      client.switchLayout();

      if (this.layoutModel === "speaker") {
        this.layoutModel = "gallery";
      } else {
        this.layoutModel = "speaker";
      }
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
