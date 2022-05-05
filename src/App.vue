<template>
  <div id="app">
    <div id="container" class="container">
      <Login
        v-if="!callMeeting && !callLoading"
        :user="user"
        :isThird="setting.isThird"
        @submitForm="submitForm"
        @onToggleSetting="onToggleSetting"
      />

      <Loading
        v-if="callMeeting && callLoading"
        :callInfo="conferenceInfo"
        :audioOutputValue="selectedDevice.audioOutput.deviceId"
        @stop="stop"
      />

      <div class="meeting" v-if="callMeeting && !callLoading">
        <MeetingHeader
          :callInfo="conferenceInfo"
          @onToggleSetting="onToggleSetting"
          @switchDebug="switchDebug"
          @stop="stop"
        />

        <PromptInfo
          :forceLayoutId="forceLayoutId"
          :chairmanUri="chairmanUri"
          :content="content"
          :localHide="setting.localHide"
          :isLocalShareContent="shareContentStatus"
          @forceFullScreen="forceFullScreen"
        />

        <div class="meeting-content">
          <div
            v-if="layout.length > 1 && pageStatus.status && pageStatus.previous"
            class="previous-box"
          >
            <div class="previous-button" @click="switchPage('previous')">
              <svg-icon icon="previous" />
            </div>
            <div
              v-if="pageInfo.currentPage > 1"
              class="home-button"
              @click="switchPage('home')"
            >
              回首页
            </div>
          </div>
          <div class="meeting-layout" :style="layoutStyle">
            <Video
              v-for="item in newLayout"
              :model="templateMode"
              :item="item"
              :key="item.roster.id"
              :id="item.roster.id"
              :forceLayoutId="forceLayoutId"
              :client="client"
            ></Video>
          </div>
          <div
            v-if="layout.length > 1 && pageStatus.status && pageStatus.next"
            class="next-box"
          >
            <div class="next-button" @click="switchPage('next')">
              <svg-icon icon="next" />
              <div
                v-if="pageInfo.totalPage > 1 && pageInfo.currentPage > 0"
                class="page-number"
              >
                {{ pageInfo.currentPage }} /
                {{ pageInfo.totalPage > 100 ? "..." : pageInfo.totalPage }}
              </div>
            </div>
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
            v-if="!onhold && subTitle.content && subTitle.action === 'push'"
            :subTitle="subTitle"
          />

          <InOutReminder v-if="!onhold" :reminders="reminders" />
        </div>
        <div class="meeting-footer">
          <div class="middle">
            <More @onToggleSetting="onToggleSetting" />

            <div
              @click="participantVisible = true"
              :class="[
                'button host',
                { 'disabled-button': conferenceInfo.numberType === 'APP' },
              ]"
            >
              <svg-icon icon="meeting_host" />
              <div class="title">参会者</div>
              <div class="tag">{{ participantsCount }}</div>
            </div>

            <div class="button layout" @click="switchLayout">
              <svg-icon icon="layout" />
              <div class="title">窗口布局</div>
            </div>

            <div
              v-if="shareContentStatus"
              @click="stopShareContent"
              class="button button-warn share-stop"
            >
              <svg-icon icon="share_stop" type="danger" />
              <div class="title">结束共享</div>
            </div>

            <div
              v-else
              @click="shareContent"
              :class="[
                'button share',
                { 'disabled-button': contentIsDisabled },
              ]"
            >
              <svg-icon icon="share" />
              <div class="title">共享</div>
            </div>

            <div class="line" />

            <AudioButton
              :permission="permission"
              :audio="audio"
              :disableAudio="disableAudio"
              :handStatus="handStatus"
              :stream="stream"
              @audioOperate="audioOperate"
            />

            <VideoButton
              :permission="permission"
              :video="video"
              @videoOperate="videoOperate"
            />

            <EndCall @stop="stop" />
          </div>
        </div>

        <Participant
          v-if="participantVisible"
          :client="client"
          :content="content"
          :rosters="rosters"
          :count="participantsCount"
          @showParticipant="participantVisible = false"
        />

        <Internels
          v-if="debug"
          :senderStatus="senderStatus"
          @switchDebug="switchDebug"
        ></Internels>
      </div>

      <Setting
        v-if="settingVisible"
        :setting="{
          ...setting,
          selectedDevice,
        }"
        :visible="settingVisible"
        @cancel="onToggleSetting"
        @setting="onSaveSetting"
      />
    </div>
  </div>
</template>

<script>
import Login from "./components/Login/index.vue";
import Loading from "./components/Loading/index.vue";
import MeetingHeader from "./components/Header/index.vue";
import Setting from "./components/Setting/index.vue";
import Barrage from "./components/Barrage/index.vue";
import InOutReminder from "./components/InOutReminder/index.vue";
import Audio from "./components/Audio/index.vue";
import Video from "./components/Video/index.vue";
import Internels from "./components/Internels/index.vue";
import Participant from "./components/Participant/index.vue";
import More from "./components/More/index.vue";
import EndCall from "./components/EndCall/index.vue";
import VideoButton from "./components/VideoButton/index.vue";
import AudioButton from "./components/AudioButton/index.vue";
import PromptInfo from "./components/PromptInfo/index.vue";
import xyRTC, { getLayoutRotateInfo } from "@xylink/xy-rtc-sdk";
import { Message } from "element-ui";
import store from "@/utils/store";
import {
  DEFAULT_LOCAL_USER,
  DEFAULT_DEVICE,
  DEFAULT_SETTING,
} from "@/utils/enum";
import { SERVER, ACCOUNT } from "@/utils/config";
import { TEMPLATE } from "@/utils/template";
import cloneDeep from "clone-deep";
import {
  getLayoutIndexByRotateInfo,
  getScreenInfo,
  calculateBaseLayoutList,
} from "@/utils/index";
import { isPc } from "@/utils/browser";

const user = store.get("xy-user") || DEFAULT_LOCAL_USER;

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
    InOutReminder,
    Audio,
    Video,
    Internels,
    Setting,
    Participant,
    More,
    EndCall,
    VideoButton,
    AudioButton,
    PromptInfo,
    MeetingHeader,
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
    newLayout() {
      return this.layout.filter((item) => item.roster.participantId);
    },
  },
  data() {
    return {
      client: null,
      stream: null,
      user: store.get("xy-user") || DEFAULT_LOCAL_USER, // 登录者信息
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
      templateMode: "speaker", // 桌面布局模式(语音激励模式、画廊模式)
      participantsCount: 0, // 会议成员数量
      shareContentStatus: false, // 开启content的状态
      senderStatus: { sender: {}, receiver: {} }, // 呼叫数据统计
      debug: false, // 是否是调试模式（开启则显示所有画面的呼叫数据）
      settingVisible: false, // 设置
      setting: store.get("xy-setting") || DEFAULT_SETTING, // 设置信息
      selectedDevice: DEFAULT_DEVICE.nextDevice, // 选择的设备信息
      version: xyRTC.version,
      permission: {
        camera: "",
        microphone: "",
      },
      onhold: false,
      reminders: [],
      pageInfo: {
        pageSize: 3,
        currentPage: 1,
        totalPage: 0,
      },
      pageStatus: {
        status: true, // 是否分页
        previous: false, // 上一页
        next: true, // 下一页
      },
      confChangeInfo: {},
      forceLayoutId: "", // 全屏 roster id
      rosters: [], // 所有参会者列表
      participantVisible: false, // 是否展示参会者列表
      content: null,
      conferenceInfo: null, // 会议室信息
    };
  },
  beforeDestroy() {
    this.stop();
  },
  methods: {
    setUserInfo(values) {
      this.user = values;

      this.audio = this.user.muteAudio ? "muteAudio" : "unmuteAudio";
      this.video = this.user.muteVideo ? "muteVideo" : "unmuteVideo";
    },
    // 登录
    async submitForm(values) {
      this.setUserInfo(values);

      const result = await (isPc
        ? xyRTC.checkSupportWebRTC()
        : xyRTC.checkSupportMobileWebRTC());
      const { result: isSupport } = result;

      if (!isSupport) {
        message.info("Not support webrtc");

        return;
      }

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
          extUserId,
          layoutMode = "AUTO",
        } = this.user;
        const { wssServer, httpServer, logServer } = SERVER;
        const { clientId } = ACCOUNT;

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
          layout: layoutMode,
          container: {
            elementId,
            // AUTO布局时，Layout容器相对于elementId元素空间的偏移量，四个值分别对应：[上、下、左、右]
            // 如果没有配置elementId元素，默认使用Body空间大小计算信息
            offset: [0, 0, 0, 0],
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
        const { extId } = ACCOUNT;

        // 第三方企业用户登录
        if (this.setting.isThird) {
          result = await this.client.loginExternalAccount({
            // 用户名自行填写
            displayName: "thirdName",
            extId,
            extUserId,
          });
        } else {
          // 小鱼登录
          result = await this.client.loginXYlinkAccount(
            user.phone || "",
            user.password || ""
          );
        }

        // XYSDK:950120 成功
        // XYSDK:950104 账号密码错误
        if (result.code === "XYSDK:950104") {
          message.info("登录密码错误");

          this.callMeeting = false;
          this.callLoading = false;
          return;
        }

        if (result.code !== "XYSDK:950120") {
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
          // 订阅全部参会者信息
          this.client.subscribeBulkRoster();

          this.stream = xyRTC.createStream();

          const { audioInput, audioOutput, videoInput } = this.selectedDevice;

          await this.stream.init({
            devices: {
              audioInputValue: audioInput.deviceId || "default",
              audioOutputValue: audioOutput.deviceId || "default",
              videoInValue: videoInput.deviceId || "",
            },
          });

          this.client.publish(this.stream, { isSharePeople: true });
        }
      } catch (err) {
        console.log("入会失败: ", err);

        this.disconnected(err.msg || "呼叫异常，请稍后重试");
      }
    },
    // 挂断会议
    disconnected(msg = "") {
      message.info(msg);

      this.stop();
    },

    // 结束会议操作
    stop() {
      // 重置audio、video状态
      this.audio = this.user.muteAudio ? "muteAudio" : "unmuteAudio";
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
      this.settingVisible = false;

      this.client = null;
      this.stream = null;
    },
    // 监听client的内部事件
    initEventListener(client) {
      // 会议室信息
      client.on("conference-info", (e) => {
        this.conferenceInfo = e;
      });

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

      // 从v2.0.2版本开始，需要监听conf-change-info来请求Layout数据。以前版本不兼容
      // 接收到conf-change-info后，需要基于此列表数据计算想要请求的参会成员和共享Content画面流
      // client.requestNewLayout请求后，会回调custom-layout数据，包含有请求的视频画面数据
      client.on("conf-change-info", (e) => {
        this.confChangeInfo = e;

        // CUSTOM 模式
        if (this.setting.layoutMode === "CUSTOM") {
          const cacheCustomPageInfo = this.calcPageInfo();

          this.customRequestLayout(cacheCustomPageInfo);
        }
      });

      // AUTO 布局回调layout数据，使用此数据直接渲染画面即可
      // CUSTOM 布局不需要监听此数据
      client.on("layout", (e) => {
        this.layout = e;
      });

      // CUSTOM 自定义布局处理此数据
      // 通过 requestLayout 请求视频流之后，会通过此回调返回所有的参会者列表数据
      // 通过处理处理此数据，展示画面
      client.on("custom-layout", (e) => {
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

        // 计算初始layoutList数据
        // 包含计算每个参会成员的大小、位置
        // 如果不需要做上述的getOrderLayoutList的排序操作，那么直接在calculateBaseLayoutList中的第一个参数配置e即可
        // @ts-ignore
        nextLayoutListRef = calculateBaseLayoutList(e, rateWidth, rateHeight);

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
        // XYSDK:950518 入会成功
        // XYSDK:950519 正在呼叫中
        // 呼叫失败，请将detail信息作为disconnected的第二个参数
        const code = e.code;
        const msg = e.msg;
        const detail = e.detail;

        if (code === "XYSDK:950518") {
          message.info(msg);

          // 提示
          if (this.localHide) {
            message.info("已开启隐藏本地画面模式", 5);
          }

          this.callLoading = false;
        } else if (code === "XYSDK:950519") {
          message.info(msg);
        } else {
          this.disconnected(msg, detail);
        }
      });

      // 麦克风状态
      client.on("meeting-control", (e) => {
        const {
          disableMute,
          muteOperation,
          contentIsDisabled,
          chairmanUri,
        } = e;
        let info = "";
        this.disableAudio = disableMute;
        this.contentIsDisabled = contentIsDisabled;
        this.chairmanUri = chairmanUri;

        if (muteOperation === "muteAudio" && disableMute) {
          info = "主持人已强制静音，如需发言，请点击“举手发言”";

          this.handStatus = false;
        } else if (muteOperation === "muteAudio" && !disableMute) {
          info = "您已被主持人静音";
        } else if (muteOperation === "unmuteAudio" && disableMute) {
          info = "主持人已允许您发言";
          this.handStatus = false;
        } else if (muteOperation === "unmuteAudio" && !disableMute) {
          info = "您已被主持人取消静音";
        }

        // 在等候室时，不做提示
        if (!this.onhold && info) {
          message.info(info);
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

      // 会议实时数据
      client.on("meeting-stats", (e) => {
        this.senderStatus = e;
      });

      // 共享content
      client.on("content", (e) => {
        this.content = e.data;
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
        // 当手机竖屏入会，或者分享的竖屏的内容时
        // 自定义布局需要手动计算视频画面的旋转信息
        if (this.setting.layoutMode === "CUSTOM") {
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

      // 设备权限
      client.on("permission", async (e) => {
        this.permission = e;
      });

      // 被移入等候室
      client.on("onhold", (e) => {
        this.onhold = e;

        if (e) {
          setTimeout(() => {
            message.info("该会议室已开启等候室，请等待主持人审核");
          }, 1000);
        }
      });

      // AUTO布局 当前模板类型
      client.on("template-mode", (mode) => {
        this.templateMode = mode;
      });

      // 出入会消息
      client.on("in-out-reminder", (e) => {
        this.reminders = e;
      });

      // 分页信息
      client.on("page-info", (pageInfo) => {
        let next = true;
        let previous = false;
        const { currentPage = 0, totalPage = 0 } = pageInfo;

        if (currentPage !== 0) {
          previous = true;
        }

        if (currentPage >= totalPage) {
          next = false;
        }

        this.pageStatus = {
          ...this.pageStatus,
          next,
          previous,
        };
        this.pageInfo = pageInfo;
      });

      client.on("bulkRoster", this.handleBulkRoster);

      // video、audio play faild, 在移动端某些浏览器，audio需要手动播放
      client.on("play-failed", ({ type, key, error }) => {
        if (type === "video") {
          console.log("[xyRTC on]video play failed:" + key, error);
        }

        if (type === "audio") {
          console.log("[xyRTC on]audio play failed:" + key, error);
        }
      });

      // current forceLayout roster id
      client.on("force-full-screen", (id) => {
        this.forceLayoutId = id;
      });
    },
    handleBulkRoster(e) {
      // 参会者信息 是增量消息
      // bulkRosterType: 0 - 全量roster, 1 - 增量roster
      // addRosterInfo  新增的参会者信息  当bulkRosterType是0的时候，此参数表示全量数据
      // changeRosterInfo  变化的参会者信息
      // deleteRosterInfo  被删除的参会者信息
      const {
        bulkRosterType = 0,
        addRosterInfo = [],
        changeRosterInfo = [],
        deleteRosterInfo = [],
      } = e;

      if (bulkRosterType === 0) {
        this.rosters = addRosterInfo;
      } else {
        // 新增参会者
        let newRosters = this.rosters.concat(addRosterInfo);

        // 删除离会的参会者
        if (deleteRosterInfo.length > 0) {
          deleteRosterInfo.forEach((info) => {
            const index = newRosters.findIndex((roster) => {
              return roster.participantId === info.participantId;
            });

            if (index > -1) {
              newRosters.splice(index, 1);
            }
          });
        }
        // 修改参会者信息，如果不存在，则添加到参会者列表中
        if (changeRosterInfo.length > 0) {
          changeRosterInfo.forEach((info) => {
            const index = newRosters.findIndex((roster) => {
              return roster.participantId === info.participantId;
            });

            if (index > -1) {
              newRosters[index] = info;
            } else {
              newRosters.push(info);
            }
          });
        }

        this.rosters = newRosters;
      }
    },
    // CUSTOM布局 计算页码信息
    calcPageInfo() {
      const { participantCount } = this.confChangeInfo;
      let { pageSize, currentPage } = this.pageInfo;
      let cacheCustomPageInfo = JSON.parse(JSON.stringify(this.pageInfo));

      // 会议产生变动，那么就重新计算总页数
      // participantCount + contentPartCount 代表people + content的总个数
      let totalPage = Math.ceil((participantCount - 1) / pageSize);
      totalPage = totalPage > 0 ? totalPage : 0;

      // 如果当前的页码大于最新最大的页码，就更新到最后一页
      if (currentPage > totalPage) {
        currentPage = totalPage;
      }

      cacheCustomPageInfo = {
        ...cacheCustomPageInfo,
        totalPage,
        currentPage,
      };

      this.pageInfo = cacheCustomPageInfo;

      return cacheCustomPageInfo;
    },
    // CUSTOM布局 请流
    customRequestLayout(cacheCustomPageInfo) {
      const { chairManUrl, contentUri, participantCount } = this.confChangeInfo;
      let reqList = [];
      let extReqList = [];
      let realLen = participantCount - 1;
      const { pageSize, currentPage } = cacheCustomPageInfo;

      if (chairManUrl) {
        extReqList.push({
          calluri: chairManUrl,
          mediagroupid: 0,
          resolution: 3,
          quality: 2,
        });

        realLen -= 1;
      }

      if (contentUri) {
        extReqList.push({
          calluri: contentUri,
          mediagroupid: 1,
          resolution: 4,
          quality: 2,
        });

        realLen -= 1;
      }

      // 如果真实请流大于每页最大数量
      if (realLen > pageSize) {
        if (realLen < currentPage * pageSize) {
          realLen = realLen - (currentPage - 1) * pageSize;
        } else {
          realLen = pageSize;
        }
      }

      for (let i = 0; i < realLen; i++) {
        reqList.push({
          calluri: "",
          mediagroupid: 0,
          resolution: 1,
          quality: 1,
        });
      }

      this.client?.requestNewLayout(
        reqList,
        pageSize,
        currentPage,
        extReqList,
        {
          uiShowLocalWhenPageMode: false,
        }
      );
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
        const { msg = "禁止操作" } = err || {};

        message.error(msg);
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
        const { msg = "禁止操作" } = err || {};

        message.error(msg);
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
        await this.client.switchLayout();
      } catch (err) {
        console.log("switch layout error: ", err);
      }
    },
    // 自定义布局分页
    customSwitchPage(type) {
      const { currentPage, totalPage } = this.pageInfo;
      let nextPage = currentPage;
      let next = true;
      let previous = false;

      if (type === "next") {
        nextPage += 1;
      } else if (type === "previous") {
        nextPage -= 1;
      } else if (type === "home") {
        nextPage = 1;
      }

      nextPage = Math.max(nextPage, 1);
      nextPage = Math.min(nextPage, totalPage);

      if (nextPage !== 1) {
        previous = true;
      }

      if (nextPage >= totalPage) {
        next = false;
      }

      this.pageStatus = {
        ...this.pageStatus,
        next,
        previous,
      };

      this.pageInfo = {
        ...this.pageInfo,
        currentPage: nextPage,
      };

      this.customRequestLayout(this.pageInfo);
    },

    async forceFullScreen(id = "") {
      await this.client.forceFullScreen(id);
    },

    // 分页
    async switchPage(type) {
      if (this.setting.layoutMode === "CUSTOM") {
        this.customSwitchPage(type);
        return;
      }

      if (this.forceLayoutId) {
        await this.forceFullScreen();
      }

      const { currentPage, totalPage } = this.pageInfo;
      let nextPage = currentPage;

      if (type === "next") {
        nextPage += 1;
      } else if (type === "previous") {
        nextPage -= 1;
      } else if (type === "home") {
        nextPage = 0;
      }

      nextPage = Math.max(nextPage, 0);
      nextPage = Math.min(nextPage, totalPage);

      this.client?.setPageInfo(nextPage);
    },

    onToggleSetting() {
      this.settingVisible = !this.settingVisible;
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
          await this.stream.setAudioOutput(deviceId);
        } else if (key === "audioInput" || key === "videoInput") {
          await this.stream.switchDevice(deviceMap[key]["key"], deviceId);
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

    async onSaveSetting(data) {
      if (data["selectedDevice"]) {
        this.settingVisible = false;

        try {
          if (this.stream) {
            await this.onSwitchDevice(data["selectedDevice"]);
          }
          this.selectedDevice = data.selectedDevice;
        } catch (err) {
          console.log("switch device err:", err);
        }

        return;
      }

      if (Object.prototype.hasOwnProperty.call(data, "localHide")) {
        if (this.client) {
          this.toggleLocal();
        }
      }

      const key = Object.keys(data)[0];
      const value = data[key];

      const xySetting = { ...this.setting, [key]: value };

      store.set("xy-setting", xySetting);

      this.setting = xySetting;
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
        // screenAudio 共享时，是否采集系统音频。 true: 采集； false: 不采集
        const result = await this.stream.createContentStream({
          screenAudio: true,
        });

        // 创建分享屏幕stream成功
        if (result) {
          this.shareContentStatus = true;

          this.stream.on("start-share-content", () => {
            this.client.publish(this.stream, { isShareContent: true });
          });

          this.stream.on("stop-share-content", () => {
            this.stopShareContent();
          });
        } else {
          message.info("分享屏幕失败");
        }
      } catch (err) {
        console.log("share content failed:", err);
        if (err && err.code !== "XYSDK:950501") {
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
  },
};
</script>
<style lang="scss">
@import "./assets/style/index.scss";
</style>
