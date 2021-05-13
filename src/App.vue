<template>
  <div id="app">
    <div id="container" class="container">
      <div class="login" v-if="!callMeeting && !callLoading">
        <h1>XY RTC Vue DEMO</h1>
        <div class="operate">
          <el-row type="flex" class="row-bg">
            <div class="header-container">
              <span>布局模式：</span>
              <el-select
                v-model="templateMode"
                size="mini"
                placeholder="请选择"
                class="template-mode"
              >
                <el-option
                  v-for="item in templateModeOption"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                >
                </el-option>
              </el-select>
            </div>

            <el-link class="operate-item" icon="el-icon-upload2" @click="upload"
              >上传日志</el-link
            >
            <el-link
              class="operate-item"
              icon="el-icon-download"
              @click="download"
              >下载日志</el-link
            >
            <el-link
              class="operate-item"
              icon="el-icon-setting"
              @click="onOpenSetting"
              >设置</el-link
            >
          </el-row>
        </div>

        <Login :user="user" @submitForm="submitForm" />

        <div class="copyright">版本：{{ this.version }}</div>
      </div>

      <Loading
        v-if="callMeeting && callLoading"
        :meeting="user.meeting"
        :audioOutputValue="selectedDevice.audioOutput.deviceId"
        :callStatus="callStatus"
        @stop="stop"
      />

      <div v-if="callMeeting && !callLoading">
        <div class="meeting-header">
          <span> {{ user.meeting }}-({{ participantsCount }}人) </span>
        </div>
        <div class="meeting-content">
          <div class="meeting-layout" :style="layoutStyle">
            <Video
              v-for="item in newLayout"
              :model="layoutModel"
              :item="item"
              :key="item.roster.id"
              :id="item.roster.id"
              :client="client"
            ></Video>
          </div>
          <div class="audio-list">
            <Audio
              v-for="item in audioList"
              :key="item.data.streams[0].id"
              :muted="item.status === 'local'"
              :streamId="item.data.streams[0].id"
              :client="client"
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
          <div>
            <el-button type="primary" size="small" @click="onOpenSetting"
              >设置
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

    <Setting
      v-if="settingVisible"
      :setting="{ localHide: user.localHide, selectedDevice }"
      :visible="settingVisible"
      @cancel="onCancelSetting"
      @setting="onSaveSetting"
    />
  </div>
</template>

<script>
import Login from "./components/Login/index.vue";
import Loading from "./components/Loading/index.vue";
import Setting from "./components/Setting/index.vue";
import Barrage from "./components/Barrage/index.vue";
import Audio from "./components/Audio/index.vue";
import Video from "./components/Video/index.vue";
import Internels from "./components/Internels/index.vue";
import xyRTC, { getLayoutRotateInfo } from "@xylink/xy-rtc-sdk";
import { Message } from "element-ui";
import store from "@/utils/store";
import { DEFAULT_LOCAL_USER, DEFAULT_DEVICE } from "@/utils/enum";
import { ENV, SERVER, ACCOUNT } from "@/utils/config";
import { TEMPLATE } from "@/utils/template";
import cloneDeep from "clone-deep";
import {
  getLayoutIndexByRotateInfo,
  getScreenInfo,
  calculateBaseLayoutList,
  getOrderLayoutList,
} from "@/utils/index";

let stream;
let audioLevelTimmer;
const user = store.get("xy-user") || DEFAULT_LOCAL_USER;

// AUTO/CUSTOM 两种模式
const LAYOUT = "AUTO";
const elementId = "container";

const message = {
  info: (message) => {
    Message.info({ message, duration: 2000, center: true });
  },
};

let rotationInfoRef = [];
let nextLayoutListRef = [];

export default {
  name: "App",
  components: {
    Login,
    Loading,
    Barrage,
    Audio,
    Video,
    Internels,
    Setting,
  },
  computed: {
    layoutStyle() {
      const { rateWidth, rateHeight } = this.screenInfo;

      let style = {
        width: rateWidth + "px",
        height: rateHeight + "px",
      };

      return style;
    },
    audioStatus() {
      let status = "取消静音";

      if (this.audio === "unmuteAudio") {
        status = this.disableAudio ? "结束发言" : "静音";
      } else if (this.audio === "muteAudio") {
        if (this.disableAudio) {
          status = this.handStatus ? "取消举手" : "举手发言";
        } else {
          status = "取消静音";
        }
      }
      return status;
    },
    newLayout() {
      return this.layout.filter((item) => item.roster.participantId);
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
      client: null,
      stream: null,
      user, // 登录者信息
      callMeeting: false, // 呼叫状态
      callLoading: false, // 是否呼叫中
      layout: [], // 参会成员数据，包含stream，roster，postion等信息，最终依赖layout的数据进行画面布局、渲染、播放、状态显示
      screenInfo: { rateWidth: 0, rateHeight: 0 }, // screen容器信息
      audioList: [], // 所有声源列表
      video: user.muteVideo ? "muteVideo" : "unmuteVideo", // 摄像头状态
      audio: user.muteAudio ? "muteAudio" : "unmuteAudio", // 麦克风状态
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
      selectedDevice: DEFAULT_DEVICE.nextDevice, // 选择的设备信息
      version: xyRTC.version,
      templateModeOption: [
        {
          value: "AUTO",
          label: "AUTO",
        },
        {
          value: "CUSTOM",
          label: "CUSTOM",
        },
      ],
      templateMode: store.get("xy-sdk-template-mode") || LAYOUT,
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
        const { clientId } = ACCOUNT(this.env);

        // 这里三方可以根据环境修改sdk log等级
        // xyRTC.logger.setLogLevel("NONE");

        this.client = xyRTC.createClient({
          // 注意，第三方集成时，默认是prd环境，不需要配置wss/http/log server地址；
          wssServer,
          httpServer,
          logServer,
          // 入会是否是自动静音
          muteAudio,
          // 入会是否是关闭摄像头
          muteVideo,
          // 使用哪一种布局方式：
          // AUTO：自动布局，第三方只需要监听layout回调消息即可渲染布局和视频画面
          // CUSTOM：自定义布局，灵活性更高，但是实现较为复杂，自定义控制参会成员的位置、大小和画面质量
          layout: this.templateMode,
          container: {
            // AUTO布局时，Layout容器相对于elementId元素空间的偏移量，四个值分别对应：[上、下、左、右]
            // 如果没有配置elementId元素，默认使用Body空间大小计算信息
            offset: [32, 60, 20, 20],
          },
          clientId,
        });

        this.initEventListener(this.client);

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
        const { extId } = ACCOUNT(this.env);

        // 第三方企业用户登录
        result = await this.client.loginExternalAccount({
          // 用户名自行填写
          displayName: "thirdName",
          extId,
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

        const token = result.detail.access_token;

        callStatus = await this.client.makeCall({
          token,
          confNumber: meeting,
          password: meetingPassword,
          displayName: meetingName,
        });

        if (callStatus) {
          stream = xyRTC.createStream();

          this.initStreamEventListener(stream);

          const { audioInput, audioOutput, videoInput } = this.selectedDevice;

          await stream.init({
            devices: {
              audioInputValue: audioInput.deviceId || "default",
              audioOutputValue: audioOutput.deviceId || "default",
              videoInValue: videoInput.deviceId || "",
            },
          });

          this.client.publish(stream, { isSharePeople: true });
        }
      } catch (err) {
        console.log("入会失败: ", err);

        this.disconnected(err.msg || "呼叫异常，请稍后重试");
      }
    },
    initStreamEventListener(stream) {
      stream.on("stream-status", (e) => {
        const { type } = e;

        if (type === "SEND_ONLY") {
          setTimeout(() => {
            message.info("当前仅接收远端画面模式", 5);
          }, 3000);
        }
      });
    },
    // 挂断会议
    disconnected(msg = "") {
      message.info(msg);

      this.stop();
    },

    // 结束会议操作
    stop() {
      // 重置audio、video状态
      this.audio = this.user.muteAudio ? "mute" : "unmute";
      this.video = this.user.muteVideo ? "muteVideo" : "unmuteVideo";

      // 重置字幕信息
      this.subTitle = { action: "cancel", content: "" };

      // sdk清理操作
      this.client && this.client.destroy();

      // 清理组件状
      this.callMeeting = false;
      this.callLoading = false;
      this.shareContentStatus = false;
      this.debug = false;
      this.layout = [];
      this.micLevel = 0;
      this.settingVisible = false;

      // 清理定时器
      this.clearTimmer();
      this.client = null;
      stream = null;
    },
    clearTimmer() {
      audioLevelTimmer && clearInterval(audioLevelTimmer);
      audioLevelTimmer = null;
      this.micLevel = 0;
    },
    // 监听client的内部事件
    initEventListener(client) {
      // 退会消息监听，注意此消息很重要，内部的会议挂断都是通过此消息通知
      client.on("disconnected", (e) => {
        const showMessage =
          (e.detail && e.detail.message) || "呼叫异常，请稍后重试";

        this.disconnected(showMessage);
      });

      // 会议成员数量数据
      client.on("participants-count", (e) => {
        this.participantsCount = e.participantsNum;
      });

      client.on("roster", (e) => {
        console.log("demo get roster message: ", e);

        // 自动布局不需要处理此数据
        if (this.templateMode === "AUTO") {
          return;
        }

        const tempLength = TEMPLATE.length;
        const rosters = e.rosters;
        const reqList = [];
        // 演讲者模式最多请8路流即可
        // requestLayout请求最多请9路画面流（包含本地Local流）
        // 如果请求超过9路，SDK内部会自动截断后面的数据
        const len = rosters.length > tempLength ? 8 : rosters.length;

        for (let i = 0; i < len; i++) {
          const item = rosters[i];
          const { endpointId, isContent } = item;

          const reqObj = {
            isContent,
            callUri: endpointId,
            resolution: 1,
            quality: 1,
          };

          // 3: 720P
          // 4: 1080P
          // 首位一般是权重最高的共享 Content 内容设备
          // 如果是 Content 应该请720P或1080P
          // 如果是 People 最多请720P画面
          if (i === 0) {
            reqObj["resolution"] = isContent ? 4 : 3;
          }

          reqList.push(reqObj);
        }

        console.log("reqList-====: ", reqList);

        client.requestLayout(reqList);
      });

      // AUTO 自动布局 会议layout数据
      client.on("layout", (e) => {
        this.layout = e;
      });

      // CUSTOM 自定义布局处理此数据
      // 通过 requestLayout 请求视频流之后，会通过此回调返回所有的参会者列表数据
      // 通过处理处理此数据，展示画面
      client.on("custom-layout", (e) => {
        console.log("demo get custom layout data:", e);

        // 此处渲染没有排序处理，需要自行将回调数据排序并展示
        // 此示例程序通过配置一个一组 TEMPLATE 模版数据，来计算layout container容器大小和layout item position/size/rotate 信息
        // 如果不想通过此方式实现，第三方获取到customLayoutList数据后，自行处理数据即可
        // @ts-ignore
        const nextTemplateRate = TEMPLATE.rate[e.length] || 0.5625;
        const { rateWidth, rateHeight } = getScreenInfo(
          elementId,
          nextTemplateRate
        );

        // 设置layout container容器的大小
        this.screenInfo = { rateWidth, rateHeight };

        // 按照优先级排序layout数据，便于统一通过tempalte模版来处理数据
        const orderLayoutList = getOrderLayoutList(e);
        // 计算初始layoutList数据
        // 包含计算每个参会成员的大小、位置
        // 如果不需要做上述的getOrderLayoutList的排序操作，那么直接在calculateBaseLayoutList中的第一个参数配置e即可
        // @ts-ignore
        nextLayoutListRef = calculateBaseLayoutList(
          orderLayoutList,
          rateWidth,
          rateHeight
        );

        // 计算屏幕旋转信息
        nextLayoutListRef = this.calculateRotate();

        this.layout = nextLayoutListRef;
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
      client.on("meeting-control", (e) => {
        const { disableMute, muteOperation } = e;

        this.disableAudio = disableMute;

        if (muteOperation === "muteAudio" && disableMute) {
          message.info("主持人已强制静音，如需发言，请点击“举手发言”");

          this.handStatus = false;
        } else if (muteOperation === "muteAudio" && !disableMute) {
          message.info("您已被主持人静音");
        } else if (muteOperation === "unmuteAudio" && disableMute) {
          message.info("主持人已允许您发言");

          this.handStatus = false;
        } else if (muteOperation === "unmuteAudio" && !disableMute) {
          message.info("您已被主持人取消静音");
        }
      });

      // 麦克风状态
      client.on("audio-status", (e) => {
        this.audio = e.status;
      });

      // 摄像头状态
      client.on("video-status", (e) => {
        this.video = e.status;
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
          this.onHand("handdown");
        }
      });

      // 设备旋转信息
      // 自定义布局需要处理
      client.on("rotation-change", (e) => {
        console.log("demo get rotation-change: ", e);

        // 当手机竖屏入会，或者分享的竖屏的内容时
        // 自定义布局需要手动计算视频画面的旋转信息
        if (this.templateMode === "CUSTOM") {
          rotationInfoRef = e;
          // 计算屏幕旋转信息
          nextLayoutListRef = this.calculateRotate();

          // 更新layout布局列表数据
          this.layout = nextLayoutListRef;
        }
      });

      // 设备切换
      client.on("devices", async (e) => {
        const { audioInput, videoInput, audioOutput } = e.nextDevice;

        videoInput?.label &&
          message.info(`视频设备已自动切换至 ${videoInput.label}`);
        audioInput?.label &&
          message.info(`音频输入设备已自动切换至 ${audioInput.label}`);
        setTimeout(() => {
          audioOutput?.label &&
            message.info(`音频输出设备已自动切换至 ${audioOutput.label}`);
        }, 500);
      });
    },

    // 计算 layout 成员渲染
    calculateRotate() {
      const rotationInfo = rotationInfoRef;
      const cacheNextLayoutList = cloneDeep(nextLayoutListRef);

      rotationInfo.forEach((item) => {
        let rotateInfo = {};
        const { participantId, mediagroupid } = item;
        const index = getLayoutIndexByRotateInfo(
          nextLayoutListRef,
          participantId,
          mediagroupid
        );

        if (index >= 0) {
          const layoutItem = cacheNextLayoutList[index];
          const { width, height } = layoutItem?.positionInfo;

          // 调用 xy-rtc-sdk 库提供的 helper 函数【getLayoutRotateInfo】方便第三方计算旋转信息
          // 提供 item 和 layoutItemContainerWidth 和 height 计算旋转信息
          // 返回旋转角度和宽高样式，此数据和AUTO布局的计算结果一致
          rotateInfo = getLayoutRotateInfo(item, width, height);
          // @ts-ignore
          cacheNextLayoutList[index]["rotate"] = rotateInfo;
        }
      });

      return cacheNextLayoutList;
    },

    // 摄像头操作
    async videoOperate() {
      try {
        let result = "muteVideo";

        if (this.video === "unmuteVideo") {
          result = await this.client.muteVideo();
        } else {
          result = await this.client.unmuteVideo();
        }
        this.video = result;
      } catch (err) {
        const msg = err?.detail?.msg || "禁止操作";
        const code = err?.detail?.code;

        if (code === 401) {
          message.error("当前摄像头或麦克风设备异常，请切换其他设备");
        } else {
          message.error("操作失败: " + msg);
        }
      }
    },

    // 麦克风操作
    async onAudioOperate() {
      try {
        let result = "muteAudio";

        if (this.audio === "unmuteAudio") {
          result = await this.client.muteAudio();

          message.info("麦克风已静音");
        } else {
          result = await this.client.unmuteAudio();
        }
        this.audio = result;
      } catch (err) {
        const msg = err?.detail?.msg || "禁止操作";
        const code = err?.detail?.code;

        if (code === 401) {
          message.error("当前摄像头或麦克风设备异常，请切换其他设备");
        } else {
          message.error("操作失败: " + msg);
        }
      }
    },

    // 取消举手
    async onHand(type) {
      const funcMap = {
        handup: {
          func: "onHandUp",
          msg: "发言请求已发送",
        },
        handdown: {
          func: "onHandDown",
          msg: "",
        },
        mute: {
          func: "onMute",
          msg: "",
        },
      };

      try {
        const { func, msg } = funcMap[type];
        const handStatus = await this.client[func]();

        this.handStatus = handStatus;
        if (msg) {
          message.info(msg);
        }
      } catch (err) {
        message.info("操作失败");
      }
    },

    // 麦克风操作
    async audioOperate() {
      if (this.audio === "muteAudio" && this.disableAudio && !this.handStatus) {
        await this.onHand("handup");
        return;
      }

      if (this.audio === "muteAudio" && this.disableAudio && this.handStatus) {
        await this.onHand("handdown");
        return;
      }

      if (this.audio === "unmuteAudio" && this.disableAudio) {
        await this.onHand("mute");
        return;
      }

      this.onAudioOperate();
    },

    // 切换布局
    async switchLayout() {
      try {
        const modal = await this.client.switchLayout();

        this.layoutModel = modal.toLowerCase();
      } catch (err) {
        console.log("switch layout error: ", err);
      }
    },

    // 设置
    onOpenSetting() {
      this.settingVisible = true;
    },

    async toggleLocal() {
      const { status } = await this.client.toggleLocal();
      const msg = status ? "已开启隐藏本地画面模式" : "已关闭隐藏本地画面模式";
      message.info(msg);
    },

    async switchDevice(key, device) {
      const deviceMap = {
        audioInput: {
          key: "audio",
          zh_text: "音频输入设备",
        },
        audioOutput: {
          key: "video",
          zh_text: "音频输出设备",
        },
        videoInput: {
          key: "video",
          zh_text: "视频设备",
        },
      };

      const { deviceId, label } = device;
      try {
        if (key === "audioOutput") {
          await stream.setAudioOutput(deviceId);
        } else if (key === "audioInput" || key === "videoInput") {
          await stream.switchDevice(deviceMap[key]["key"], deviceId);
        }
        message.info(`${deviceMap[key]["zh_text"]}已自动切换至 ${label}`);
      } catch (err) {
        message.error("设备切换失败");
        return Promise.reject(err);
      }
    },

    async onSwitchDevice(nextDevice) {
      const { audioInput, videoInput, audioOutput } =
        nextDevice || DEFAULT_DEVICE.nextDevice;

      try {
        if (
          audioInput?.deviceId !== this.selectedDevice?.audioInput?.deviceId
        ) {
          await this.switchDevice("audioInput", audioInput);
        }

        if (
          audioOutput?.deviceId !== this.selectedDevice?.audioOutput?.deviceId
        ) {
          await this.switchDevice("audioOutput", audioOutput);
        }

        if (
          videoInput?.deviceId !== this.selectedDevice?.videoInput?.deviceId
        ) {
          await this.switchDevice("videoInput", videoInput);
        }
      } catch (err) {
        return Promise.reject(err);
      }
    },

    onCancelSetting() {
      this.settingVisible = false;
    },

    async onSaveSetting(data) {
      if (data["selectedDevice"]) {
        this.settingVisible = false;

        try {
          if (stream) {
            await this.onSwitchDevice(data["selectedDevice"]);
          }
          this.selectedDevice = data.selectedDevice;
        } catch (err) {
          console.log("switch device err:", err);
        }
      }

      if (Object.prototype.hasOwnProperty.call(data, "localHide")) {
        const xyUser = { ...this.user, localHide: data["localHide"] };
        store.set("xy-user", xyUser);
        this.user = xyUser;

        if (this.client) {
          this.toggleLocal();
        }
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
      this.client.stopShareContent();
      this.shareContentStatus = false;
    },

    // 分享content内容
    async shareContent() {
      try {
        const result = await stream.createContentStream();

        // 创建分享屏幕stream成功
        if (result) {
          this.shareContentStatus = true;

          stream.on("start-share-content", () => {
            this.client.publish(stream, { isShareContent: true });
          });

          stream.on("stop-share-content", () => {
            this.stopShareContent();
          });
        } else {
          message.info("分享屏幕失败");
        }
      } catch (err) {
        if (err && err.code !== 20500) {
          message.info(err.msg || "分享屏幕失败");
        }
      }
    },
    // debug
    switchDebug() {
      const status = !this.debug;
      this.debug = status;

      this.client.switchDebug(status);
    },
    // 设置音量
    setMicLevel(audio) {
      if (audio === "unmuteAudio") {
        if (!audioLevelTimmer) {
          audioLevelTimmer = setInterval(async () => {
            if (stream) {
              try {
                const level = await stream.getAudioLevel();

                // 更新Audio的实时音量显示
                this.micLevel = level;
              } catch (err) {
                this.clearTimmer();
              }
            }
          }, 500);
        }
      } else {
        this.clearTimmer();
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

        // const bgmAudioEle = this.$refs["bgmAudioRef"];

        // if (!callLoading && bgmAudioEle) {
        //   bgmAudioEle.pause();
        // }

        // if (callMeeting && callLoading) {
        //   xyRTC.setOutputAudioDevice(
        //     bgmAudioEle,
        //     this.selectedDevice.audioOutput.deviceId || "default"
        //   );
        // }
      },
      deep: true,
    },
    templateMode: (nextValue) => {
      store.set("xy-sdk-template-mode", nextValue);
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
body {
  padding: 0px;
  width: 100vw;
  height: 100vh;

  overflow: hidden;
  user-select: none;
}

#app {
  width: 100vw;
  height: 100vh;

  overflow: auto;
  box-sizing: border-box;
}

#container {
  height: 100%;
  width: 100%;
  overflow: auto;

  position: relative;
}

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

.template-mode {
  width: 100px;
  margin-right: 15px;
}

.header-container {
  font-size: 14px;
  color: #333;
}
</style>
