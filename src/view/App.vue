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
        :conferenceInfo="conferenceInfo"
        :audioOutputValue="specifiedDevice?.audioOutput?.deviceId || ''"
        @stop="stop"
      />

      <div class="meeting" v-if="callMeeting && !callLoading">
        <MeetingHeader
          :className="toolVisible ? 'xy__show' : 'xy__hide'"
          :conferenceInfo="conferenceInfo"
          @switchDebug="switchDebug"
          @stop="stop"
        />

        <PromptInfo
          :toolVisible="toolVisible"
          :forceLayoutId="forceLayoutId"
          :chairman="chairman.hasChairman"
          :content="content"
          :localHide="setting.localHide"
          :isLocalShareContent="isLocalShareContent"
          :recordStatus="recordStatus"
          @forceFullScreen="forceFullScreen"
        />

        <div class="meeting-content" id="meeting" @click.stop="handleToolVisible">
          <div v-if="pageStatus.previous && toolVisible" class="previous-box">
            <div class="previous-button" @click.stop="switchPage('previous')">
              <svg-icon icon="previous" />
            </div>
            <div v-if="pageInfo.currentPage > 1" class="home-button" @click.stop="switchPage('home')">回首页</div>
          </div>
          <div v-if="pageStatus.next && toolVisible" class="next-box">
            <div class="next-button" @click.stop="switchPage('next')">
              <svg-icon icon="next" />
              <div v-if="pageInfo.totalPage > 1 && pageInfo.currentPage > 0" class="page-number">
                {{ pageInfo.currentPage }} /
                {{ pageInfo.totalPage > 100 ? '...' : pageInfo.totalPage }}
              </div>
            </div>
          </div>
          <div class="meeting-layout" :style="layoutStyle">
            <Video
              v-for="(item, index) in layout"
              :key="item.id"
              :id="item.id"
              :index="index"
              :model="templateMode"
              :layoutMode="setting.layoutMode"
              :item="item"
              :forceLayoutId="forceLayoutId"
              :client="client"
              @forceFullScreen="forceFullScreen"
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
          <Barrage v-if="!onhold && subTitle.content && subTitle.action === 'push'" :subTitle="subTitle" />
          <InOutReminder v-if="!onhold" :reminders="reminders" />
        </div>
        <div :class="toolVisible ? 'meeting-footer xy__show' : 'meeting-footer xy__hide'">
          <div class="middle">
            <div class="button setting" @click.stop="onToggleSetting">
              <svg-icon icon="setting" />
              <div class="title">设置</div>
            </div>

            <div
              @click="participantVisible = true"
              :class="['button host', { 'disabled-button': conferenceInfo.numberType === 'APP' }]"
            >
              <svg-icon icon="meeting_host" />
              <div class="title">参会者</div>
              <div class="tag">{{ participantsCount }}</div>
            </div>

            <div v-if="isPc" class="button layout" @click="switchLayout">
              <svg-icon icon="layout" />
              <div class="title">窗口布局</div>
            </div>

            <div v-if="isPc && isLocalShareContent" @click="stopShareContent" class="button button-warn share-stop">
              <svg-icon icon="share_stop" type="danger" />
              <div class="title">结束共享</div>
            </div>

            <div
              v-if="isPc && !isLocalShareContent"
              @click="shareContent"
              :class="['button share', { 'disabled-button': contentIsDisabled }]"
            >
              <svg-icon icon="share" />
              <div class="title">共享</div>
            </div>

            <div @click="toggleRecord" :class="['button share', { 'disabled-button': disableRecord }]">
              <svg-icon :icon="recordStatus === 0 ? 'record' : 'record_stop'" />
              <div class="title">
                {{ recordStatus === 1 ? '停止录制' : '开始录制' }}
              </div>
            </div>

            <div v-if="isPc" class="line" />

            <AudioButton
              :permission="permission"
              :audio="audio"
              :disableAudio="disableAudio"
              :handStatus="handStatus"
              :videoAudioTrack="videoAudioTrack"
              @audioOperate="audioOperate"
            />

            <VideoButton :permission="permission" :video="video" @videoOperate="videoOperate" />

            <EndCall v-if="isPc" @stop="stop" />
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

        <Internels v-if="debug" :senderStatus="senderStatus" @switchDebug="switchDebug"></Internels>
      </div>

      <Setting
        v-if="settingVisible"
        :setting="{
          ...setting,
          specifiedDevice,
        }"
        :visible="settingVisible"
        @cancel="onToggleSetting"
        @setting="onSaveSetting"
      />
    </div>
  </div>
</template>

<script>
import XYRTC, { getLayoutRotateInfo, LayoutOrientationType } from '@xylink/xy-rtc-sdk';
import cloneDeep from 'clone-deep';
import Login from './components/Login/index.vue';
import Loading from './components/Loading/index.vue';
import MeetingHeader from './components/Header/index.vue';
import Setting from './components/Setting/index.vue';
import Barrage from './components/Barrage/index.vue';
import InOutReminder from './components/InOutReminder/index.vue';
import Audio from './components/Audio/index.vue';
import Video from './components/Video/index.vue';
import Internels from './components/Internels/index.vue';
import Participant from './components/Participant/index.vue';
import EndCall from './components/EndCall/index.vue';
import VideoButton from './components/VideoButton/index.vue';
import AudioButton from './components/AudioButton/index.vue';
import PromptInfo from './components/PromptInfo/index.vue';
import store from '@/utils/store';
import { DEFAULT_LOCAL_USER, DEFAULT_SETTING, DEFAULT_CALL_INFO, TEMPLATE_TYPE } from '@/utils/enum';
import { SERVER, ACCOUNT } from '@/utils/config';
import { TEMPLATE } from '@/utils/template';
import { message } from '@/utils/index';
import { getLayoutIndexByRotateInfo, getScreenInfo, calculateBaseLayoutList, getOrderLayoutList } from '@/utils/layout';
import { isPc, isSupportMobileJoinMeeting } from '@/utils/browser';
import { WindowResize } from '@/utils/resize';
import { STORAGE_KEY } from '@/utils/enum';

const user = store.get('xy-user') || DEFAULT_LOCAL_USER;

const elementId = 'container';

let rotationInfoRef = [];
let nextLayoutListRef = [];

export default {
  name: 'App',
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
        width: rateWidth + 'px',
        height: rateHeight + 'px',
      };

      return style;
    },
    pageStatus() {
      const { currentPage = 0, totalPage = 0 } = this.pageInfo;

      const { participantCount = 1 } = this.confChangeInfo || {};

      // 总页数大于当前页，则显示 "下一页"按钮
      let next = currentPage < totalPage;
      // 非首页，则显示”上一页“按钮
      let previous = currentPage !== 0;

      // 不显示分页按钮
      // 1. 人数为1
      // 2. 人数为2,且隐藏本地画面
      // 3. 共享(本地)
      // 4. 主会场(非本地、且在线)
      if (
        participantCount === 1 ||
        (participantCount === 2 && this.setting.localHide) ||
        this.isLocalShareContent ||
        this.chairman.chairmanUri
      ) {
        next = false;
        previous = false;
      }

      return {
        previous, // 上一页
        next, // 下一页
      };
    },

    disableRecord() {
      const { meeting, control } = this.recordPermission;

      return !meeting || !control || this.recordStatus === 2 || this.recordStatus === 3;
    },
  },
  data() {
    return {
      client: null,
      videoAudioTrack: null,
      user: store.get('xy-user') || DEFAULT_LOCAL_USER, // 登录者信息
      callMeeting: false, // 呼叫状态
      callLoading: false, // 是否呼叫中
      layout: [], // 参会成员数据，包含stream，roster，position等信息，最终依赖layout的数据进行画面布局、渲染、播放、状态显示
      screenInfo: { rateWidth: 0, rateHeight: 0 }, // screen容器信息
      audioList: [], // 所有声源列表
      video: user.muteVideo ? 'muteVideo' : 'unmuteVideo', // 摄像头状态
      audio: user.muteAudio ? 'muteAudio' : 'unmuteAudio', // 麦克风状态
      disableAudio: false, // 是否强制静音
      handStatus: false, // 举手状态
      subTitle: { action: 'cancel', content: '' }, // 是否有字幕或点名
      templateMode: 'speaker', // 桌面布局模式(语音激励模式、画廊模式)
      participantsCount: 0, // 会议成员数量
      isLocalShareContent: false, // 开启content的状态
      senderStatus: { sender: {}, receiver: {} }, // 呼叫数据统计
      debug: false, // 是否是调试模式（开启则显示所有画面的呼叫数据）
      settingVisible: false, // 设置
      setting: store.get('xy-setting') || DEFAULT_SETTING, // 设置信息
      specifiedDevice: store.get(STORAGE_KEY.specifiedDevice) || {
        audioInput: null,
        audioOutput: null,
        videoInput: null,
      }, // 选择的设备信息
      version: XYRTC.version,
      permission: {
        camera: '',
        microphone: '',
      },
      onhold: false,
      reminders: [],
      pageInfo: {
        pageSize: 7,
        currentPage: 0,
        totalPage: 0,
      },
      confChangeInfo: {},
      forceLayoutId: '', // 全屏 roster id
      rosters: [], // 所有参会者列表
      participantVisible: false, // 是否展示参会者列表
      content: null,
      conferenceInfo: DEFAULT_CALL_INFO, // 会议室信息
      chairman: {
        chairmanUri: '', // 主会场是否入会
        hasChairman: false, // 是否有设置主会场(预设主会场)
      },
      isPc, // 是否是PC端
      toolVisible: true, // 操作条是否显示
      recordStatus: 0, // 录制状态  0-未开启录制 1-本地开启录制 2-远端开启录制 3-远端录制暂停中
      recordPermission: {
        meeting: false, // 会议室 录制权限
        control: false, // 会控上报录制权限
      },
    };
  },
  beforeMount() {
    if (!isPc) {
      document.body.setAttribute('data-role', 'mobile');
    }
  },
  beforeDestroy() {
    this.stop();
  },
  methods: {
    handleToolVisible() {
      this.toolVisible = !this.toolVisible;
    },
    setUserInfo(values) {
      this.user = values;

      this.audio = this.user.muteAudio ? 'muteAudio' : 'unmuteAudio';
      this.video = this.user.muteVideo ? 'muteVideo' : 'unmuteVideo';
    },
    // 登录
    async submitForm(values) {
      this.setUserInfo(values);

      const result = await XYRTC.checkSupportWebRTC();
      const { result: isSupport } = result;

      if (!isSupport) {
        let msg = '浏览器版本太低，请升级最新的Chrome浏览器访问';

        /**
         * 手机端支持以下系统版本及浏览器
         *
         * ios 12.2+ safari
         * ios 14.3+ 微信浏览器
         *  android 8+ 微信浏览器 QQ浏览器等
         */
        if (!isPc && !isSupportMobileJoinMeeting()) {
          msg = '请升级手机系统版本或尝试其他浏览器';
        }

        message.info(msg);

        return;
      }

      this.join();
    },
    // 加入会议
    async join() {
      this.callMeeting = true;
      this.callLoading = true;

      try {
        const { meeting, meetingPassword, meetingName, muteAudio, muteVideo, extUserId } = this.user;
        const { layoutMode = 'AUTO', localHide = false } = this.setting;
        const { clientId, clientSecret, extId } = ACCOUNT;

        // 这里三方可以根据环境修改sdk log等级
        XYRTC.logger.setLogLevel('NONE');

        this.client = XYRTC.createClient({
          server: SERVER,
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
          clientSecret,
          extId,
        });

        this.client.setFeatureConfig({
          enableAutoResizeLayout: false,
          enableLayoutAvatar: true,
          enableCheckRecordPermission: true, // 开启检测录制权限
          // 隐藏 Local 画面配置项
          enableHideLocalView: localHide,
        });

        this.enableHideLocalView = localHide;

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

        // 第三方企业用户登录
        if (this.setting.isThird) {
          await this.client.loginExternalAccount({
            // 用户名自行填写
            displayName: 'thirdName',
            extId,
            extUserId,
          });
        } else {
          // 小鱼登录
          await this.client.loginXYlinkAccount(user.phone || '', user.password || '');
        }

        await this.client.makeCall({
          confNumber: meeting,
          password: meetingPassword,
          displayName: meetingName,
          muteAudio,
          muteVideo,
        });

        this.videoAudioTrack = await this.client.createVideoAudioTrack();

        this.initPeopleTrackEvent();

        const { audioInput, audioOutput, videoInput } = this.specifiedDevice;

        await this.videoAudioTrack.capture({
          audioInputId: audioInput?.isDefault ? '' : audioInput?.deviceId,
          audioOutputId: audioOutput?.isDefault ? '' : audioOutput?.deviceId,
          videoInputId: videoInput?.isDefault ? '' : videoInput?.deviceId,
        });

        this.client.publish(this.videoAudioTrack);

        WindowResize.init(elementId, this.onResize);

        // 移动端 锁屏、退出后台等 需关掉本地视频、声音
        if (!isPc && !this.onhold) {
          document.addEventListener('visibilitychange', this.visibilitychange);
        }
      } catch (err) {
        this.callMeeting = false;
        this.callLoading = false;

        console.log('入会失败: ', err);

        this.disconnected(err.msg || '呼叫异常，请稍后重试');
      }
    },

    initPeopleTrackEvent() {
      if (!this.videoAudioTrack) return;

      // 设备切换
      this.videoAudioTrack.on('device', async (e) => {
        const { detail, nextDevice } = e;

        this.updateDeviceList(detail);
        this.deviceChangeTips(nextDevice);
      });

      // 设备权限
      this.videoAudioTrack.on('permission', async (e) => {
        this.permission = e;
      });

      this.videoAudioTrack.on('track-error', (e) => {
        const { msg = '' } = e;

        msg && message.info(msg);
      });
    },

    // 获取最新的设备列表，直接更新
    updateDeviceList(device) {
      const { audioInputList, audioOutputList, videoInputList } = device;

      this.audioInputList = audioInputList;
      this.audioOutputList = audioOutputList;
      this.videoInputList = videoInputList;
    },
    // 设备切换提示
    deviceChangeTips(nextDevice) {
      const { audioInput, videoInput, audioOutput } = nextDevice;
      const { label: aiLabel } = audioInput || {};
      const { label: aoLabel } = audioOutput || {};
      const { label: viLabel } = videoInput || {};

      videoInput && message.info(`摄像头设备已切换至 ${viLabel}`);

      audioInput && message.info(`麦克风设备已切换至 ${aiLabel}`);

      setTimeout(() => {
        audioOutput && message.info(`扬声器设备已切换至 ${aoLabel}`);
      }, 500);
    },

    // 切换移动端布局方向
    async handleOrientationChange(isHorizontal) {
      if (isPc) return;

      const { MOBILE_HORIZONTAL, MOBILE_VERTICAL } = LayoutOrientationType;
      const orientation = isHorizontal ? MOBILE_HORIZONTAL : MOBILE_VERTICAL;

      this.client.setLayoutOrientation(orientation);

      this.orientation = orientation;
    },

    onResize({ isHorizontal }) {
      if (!this.client) return;

      // CUSTOM 模式
      if (this.setting.layoutMode === 'CUSTOM') {
        // content模式，横竖屏显示数量不一致，需重新请流
        // content模式，只需转换layout布局即可
        if (this.confChangeInfo.contentUri) {
          this.customRequestLayout();
        } else {
          this.createCustomLayout();
        }
        return;
      }

      // AUTO 模式
      // 通过resize监听横竖屏变化，兼容性会更好
      // 监听手机端方向 设置layout方向
      this.handleOrientationChange(isHorizontal);

      this.client.updateLayoutSize();
    },

    async visibilitychange() {
      if (document.visibilityState === 'hidden') {
        if (this.video === 'unmuteVideo') {
          await this.client.muteVideo();
        }
      } else {
        if (this.video === 'unmuteVideo') {
          await this.client.unmuteVideo();
        }
      }
    },
    // 挂断会议
    disconnected(msg = '') {
      message.info(msg);

      this.stop();
    },

    // 结束会议操作
    stop() {
      WindowResize.destroy();

      document.removeEventListener('visibilitychange', this.visibilitychange);

      // 重置audio、video状态
      this.audio = this.user.muteAudio ? 'muteAudio' : 'unmuteAudio';
      this.video = this.user.muteVideo ? 'muteVideo' : 'unmuteVideo';

      // sdk清理操作
      this.client && this.client.destroy();

      // 清理组件状
      rotationInfoRef = [];
      nextLayoutListRef = [];

      this.callMeeting = false;
      this.callLoading = false;
      this.isLocalShareContent = false;
      this.debug = false;
      this.layout = [];
      this.settingVisible = false;

      this.client = null;
      this.content = null;
      this.participantsCount = 0;
      this.conferenceInfo = DEFAULT_CALL_INFO;
      this.subTitle = { action: 'cancel', content: '' };
      this.reminders = [];
    },
    // 监听client的内部事件
    initEventListener(client) {
      // 会议室信息
      client.on('conference-info', (e) => {
        this.conferenceInfo = e;
      });

      // 退会消息监听，注意此消息很重要，内部的会议挂断都是通过此消息通知
      client.on('disconnected', (e) => {
        const showMessage = (e.detail && e.detail.message) || '呼叫异常，请稍后重试';

        this.disconnected(showMessage);
      });

      // 会议成员数量数据
      client.on('participants-count', (e) => {
        this.participantsCount = e.participantsNum;
      });

      // 从v2.0.2版本开始，需要监听conf-change-info来请求Layout数据。以前版本不兼容
      // 接收到conf-change-info后，需要基于此列表数据计算想要请求的参会成员和共享Content画面流
      // client.requestNewLayout请求后，会回调custom-layout数据，包含有请求的视频画面数据
      client.on('conf-change-info', (e) => {
        const { chairManUrl } = e;

        this.confChangeInfo = e;

        this.chairman = {
          ...this.chairman,
          chairmanUri: chairManUrl,
        };

        // CUSTOM 模式
        if (this.setting.layoutMode === 'CUSTOM') {
          this.content = this.rosters.find((item) => item.endpointId === this.confChangeInfo.contentUri);

          const cacheCustomPageInfo = this.calcPageInfo();

          this.customRequestLayout(cacheCustomPageInfo);
        }
      });

      // AUTO 布局回调layout数据，使用此数据直接渲染画面即可
      // [v4.0.0] CUSTOM 布局需要监听此数据
      client.on('layout', (e) => {
        if (this.setting.layoutMode === 'AUTO') {
          this.layout = e;

          if (this.forceLayoutId) {
            const forceLayout = this.layout.find((item) => item.id === this.forceLayoutId);

            if (!forceLayout) {
              this.forceLayoutId = '';
            }
          }
        } else {
          // CUSTOM 自定义布局处理此数据
          // 通过 requestLayout 请求视频流之后，会通过此回调返回所有的参会者列表数据
          // 通过处理处理此数据，展示画面
          this.createCustomLayout(e);
        }
      });

      // 动态计算的显示容器信息
      client.on('screen-info', (e) => {
        this.screenInfo = e;
      });

      // audio list数据
      client.on('audio-track', (e) => {
        this.audioList = e;
      });

      // 呼叫状态
      client.on('call-status', (e) => {
        // XYSDK:950518 入会成功
        // XYSDK:950519 正在呼叫中
        // 呼叫失败，请将detail信息作为disconnected的第二个参数
        const { code, msg, detail } = e;

        if (code === 'XYSDK:950518') {
          message.info(msg);

          // 提示
          if (this.localHide) {
            message.info('已开启隐藏本地画面模式', 5);
          }

          this.callLoading = false;
        } else if (code === 'XYSDK:950519') {
          message.info(msg);
        } else {
          this.disconnected(msg, detail);
        }
      });

      // 会控相关状态
      client.on('meeting-control', (e) => {
        const { disableMute, muteOperation, contentIsDisabled, chairmanUri, recordIsDisabled } = e;
        let info = '';
        this.disableAudio = disableMute;
        this.contentIsDisabled = contentIsDisabled;

        // 会控录制权限
        this.recordPermission = {
          ...this.recordPermission,
          control: !recordIsDisabled,
        };

        this.chairman = {
          ...this.chairman,
          hasChairman: !!chairmanUri,
        };

        if (muteOperation === 'muteAudio' && disableMute) {
          info = '主持人已强制静音，如需发言，请点击“举手发言”';

          this.handStatus = false;
        } else if (muteOperation === 'muteAudio' && !disableMute) {
          info = '您已被主持人静音';
        } else if (muteOperation === 'unmuteAudio' && disableMute) {
          info = '主持人已允许您发言';
          this.handStatus = false;
        } else if (muteOperation === 'unmuteAudio' && !disableMute) {
          info = '您已被主持人取消静音';
        }

        // 在等候室时，不做提示
        if (!this.onhold && info) {
          message.info(info);
        }
      });

      // 麦克风状态
      client.on('audio-status', (e) => {
        this.audio = e.status;
      });

      // 摄像头状态
      client.on('video-status', (e) => {
        this.video = e.status;
      });

      // 会议实时数据
      client.on('meeting-stats', (e) => {
        this.senderStatus = e;
      });

      // 共享content
      client.on('content', (e) => {
        this.content = e.data;
      });

      // 字幕、点名消息
      client.on('sub-title', (e) => {
        this.subTitle = e;
      });

      // 清除举手
      client.on('cancel-handup', (e) => {
        if (e) {
          this.onHand('handdown');
        }
      });

      // 设备旋转信息
      // 自定义布局需要处理
      client.on('rotation-change', (e) => {
        // 当手机竖屏入会，或者分享的竖屏的内容时
        // 自定义布局需要手动计算视频画面的旋转信息
        if (this.setting.layoutMode === 'CUSTOM') {
          rotationInfoRef = e;
          // 计算屏幕旋转信息
          nextLayoutListRef = this.calculateRotate();

          // 更新layout布局列表数据
          this.layout = nextLayoutListRef;
        }
      });

      // 被移入等候室
      client.on('onhold', (e) => {
        this.onhold = e;

        if (e) {
          setTimeout(() => {
            message.info('该会议室已开启等候室，请等待主持人审核');
          }, 1000);
        }
      });

      // AUTO布局 当前模板类型
      client.on('template-mode', (mode) => {
        this.templateMode = mode;
      });

      // 出入会消息
      client.on('in-out-reminder', (e) => {
        this.reminders = e;
      });

      // 分页信息
      client.on('page-info', (pageInfo) => {
        this.pageInfo = pageInfo;
      });

      client.on('bulkRoster', this.handleBulkRoster);

      // video、audio play failed, 在移动端某些浏览器，audio需要手动播放
      client.on('play-failed', ({ type, key, error }) => {
        if (type === 'video') {
          console.log('[xyRTC on]video play failed:' + key, error);
        }

        if (type === 'audio') {
          console.log('[xyRTC on]audio play failed:' + key, error);
        }
      });

      // 录制权限
      client.on('record-permission', (data) => {
        const { authorize } = data;

        // 会议室录制权限
        this.recordPermission = {
          ...this.recordPermission,
          meeting: authorize,
        };
      });

      // 处理 本地录制结果上报
      client.on('recording-state-changed', (data) => {
        const { reason, state, reasonText, recordInfo } = data;
        const { recordSessionId } = recordInfo;

        // 开启录制成功
        if (state === 'RECORD_STATE_STARTED') {
          this.recordStatus = 1;

          console.log('recordSessionId:::', recordSessionId);
        }

        // 停止录制成功
        if (state === 'RECORD_STATE_IDLE') {
          this.recordStatus = 0;

          if (reason !== 'STATE:200') {
            message.info(reasonText);
          } else {
            message.info('录制完成，录制视频已保存到云会议室管理员的文件夹中');
          }
        }
      });

      // 处理 远端录制状态/会控录制状态 上报
      client.on('record-status-notification', (data) => {
        const { isStart, isLocal, status, recordInfo } = data;
        const { recordSessionId } = recordInfo;

        console.log('recordSessionId:::', recordSessionId);

        if (isStart && !isLocal) {
          // 录制暂停
          this.recordStatus = status === 'RECORDING_STATE_PAUSED' ? 3 : 2;
        }

        if (!isStart) {
          this.recordStatus = 0;
        }
      });
    },
    // 参会者信息
    handleBulkRoster(e) {
      // 参会者信息 是增量消息
      // bulkRosterType: 0 - 全量roster, 1 - 增量roster
      // addRosterInfo  新增的参会者信息  当bulkRosterType是0的时候，此参数表示全量数据
      // changeRosterInfo  变化的参会者信息
      // deleteRosterInfo  被删除的参会者信息
      const { bulkRosterType = 0, addRosterInfo = [], changeRosterInfo = [], deleteRosterInfo = [] } = e;

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
    // CUSTOM布局 全屏请流
    calcForceFullScreenRequestLayout(cacheCustomPageInfo = this.pageInfo) {
      if (!this.forceLayoutId) {
        return;
      }

      const { pageSize } = cacheCustomPageInfo;

      const reqList = [];
      const item = this.layout.find((item) => item.roster.id === this.forceLayoutId);

      if (item) {
        const { endpointId = '', mediagroupid = 0 } = item?.roster || {};

        // 全屏的对象 content请1080，people请720的流，保证清晰度，其他不请流
        let resolution = mediagroupid ? 4 : 3;

        reqList.push({
          calluri: endpointId,
          mediagroupid,
          resolution,
          quality: resolution === 4 ? 2 : 0,
        });

        let extReqList = [];

        this.client?.requestNewLayout(reqList, pageSize, 0, extReqList, {
          uiShowLocalWhenPageMode: false,
        });
      } else {
        this.forceLayoutId = '';
      }

      return this.forceLayoutId;
    },

    // CUSTOM布局 请流
    customRequestLayout(cacheCustomPageInfo = this.pageInfo) {
      // forceFullScreen 请流
      this.calcForceFullScreenRequestLayout();
      if (this.forceLayoutId) {
        return;
      }
      const { chairManUrl, contentUri, participantCount } = this.confChangeInfo;
      const { pageSize, currentPage } = cacheCustomPageInfo;
      let reqList = [];
      let extReqList = [];
      const realContentLen = currentPage === 0 && contentUri ? 1 : 0;
      let realLen = participantCount + realContentLen;
      if (realLen > pageSize) {
        if (realLen < currentPage * pageSize) {
          realLen = realLen - (currentPage - 1) * pageSize;
        } else {
          realLen = pageSize;
        }
      }
      let isRequest = currentPage > 1;
      // 移动端横屏模式下，接收content，只显示content+远端
      if (currentPage === 0 && contentUri) {
        realLen = 2;
        isRequest = true;
      }
      const { temp, length } = TEMPLATE();
      let templateLayout = temp[realLen] || temp[Math.max(1, length)];
      templateLayout.forEach((item, index) => {
        let { resolution = 2, quality = 1, type } = item;
        let calluri = '';
        let mediagroupid = 0;
        if (type === TEMPLATE_TYPE.LOCAL && !isRequest) {
          return;
        }
        // 只在第一页显示content和主会场
        if (currentPage === 0 && index === 0) {
          calluri = contentUri || chairManUrl;
          mediagroupid = contentUri ? 1 : 0;
          if (contentUri) {
            resolution = 4;
            quality = 2;
          }
        }
        reqList.push({
          mediagroupid,
          calluri,
          resolution,
          quality,
        });
      });
      this.client?.requestNewLayout(reqList, pageSize, currentPage, extReqList, {
        uiShowLocalWhenPageMode: false,
      });
    },
    // CUSTOM布局
    createCustomLayout(e = this.layout) {
      // 如果forceFullScreen 的情况下，layout返回空，则说明当前终端已不在会，则需重新请流
      if (this.forceLayoutId) {
        const forceLayoutList = e.filter((item) => item.roster.id === this.forceLayoutId);
        const item = forceLayoutList[0];
        // 当前layout为空，则说明当前终端已不在会，则需重新请流
        // 全屏对象是content, 但是远端已取消content或者取消指定广播该content
        if (!item || (item.roster.mediagroupid === 1 && !this.confChangeInfo.contentUri)) {
          this.forceLayoutId = '';
          this.customRequestLayout();
          return;
        }
        e = forceLayoutList;
      }
      // 此处渲染没有排序处理，需要自行将回调数据排序并展示
      // 此示例程序通过配置一个一组 TEMPLATE 模版数据，来计算layout container容器大小和layout item position/size/rotate 信息
      // 如果不想通过此方式实现，第三方获取到customLayoutList数据后，自行处理数据即可
      e = getOrderLayoutList(e);
      // 移动端横屏模式下，首页，接收content, 只显示content+远端
      const { contentUri, participantCount } = this.confChangeInfo;
      if (this.pageInfo.currentPage === 0 && contentUri && participantCount > 1) {
        e = e.filter((item) => !item.roster.isLocal);
      }
      const { rate, temp } = TEMPLATE();
      const nextTemplateRate = rate[e.length] || 0.5625;
      const positionInfo = temp[e.length];
      const { rateWidth, rateHeight } = getScreenInfo(elementId, nextTemplateRate);
      // 设置layout container容器的大小
      this.screenInfo = { rateWidth, rateHeight };
      // 计算初始layoutList数据
      // 包含计算每个参会成员的大小、位置
      // 如果不需要做上述的getOrderLayoutList的排序操作，那么直接在calculateBaseLayoutList中的第一个参数配置e即可
      nextLayoutListRef = calculateBaseLayoutList(e, rateWidth, rateHeight, positionInfo);
      // 计算屏幕旋转信息
      nextLayoutListRef = this.calculateRotate();
      this.layout = nextLayoutListRef;
    },
    // CUSTOM布局 计算 layout 成员渲染
    calculateRotate() {
      const rotationInfo = rotationInfoRef;
      const cacheNextLayoutList = cloneDeep(nextLayoutListRef);

      rotationInfo.forEach((item) => {
        let rotateInfo = {};
        const { participantId, mediagroupid, rotation } = item;
        const index = getLayoutIndexByRotateInfo(nextLayoutListRef, participantId, mediagroupid);

        if (index >= 0) {
          const layoutItem = cacheNextLayoutList[index];

          let { width, height } = layoutItem?.positionInfo;

          // 调用 xy-rtc-sdk 库提供的 helper 函数【getLayoutRotateInfo】方便第三方计算旋转信息
          // 提供 item 和 layoutItemContainerWidth 和 height 计算旋转信息
          // 返回旋转角度和宽高样式，此数据和AUTO布局的计算结果一致
          rotateInfo = getLayoutRotateInfo(item, width, height);

          // 1和3对应需要将分辨率画面进行旋转90deg和270deg
          const isRotate = rotation === 1 || rotation === 3;

          if (isRotate) {
            rotateInfo = { ...rotateInfo, maxWidth: height + 'px' };
          } else {
            rotateInfo = { ...rotateInfo, maxHeight: '100%' };
          }

          cacheNextLayoutList[index]['rotate'] = rotateInfo;
        }
      });

      return cacheNextLayoutList;
    },
    // 摄像头操作
    async videoOperate() {
      try {
        let result = 'muteVideo';

        if (this.video === 'unmuteVideo') {
          result = await this.client.muteVideo();
        } else {
          result = await this.client.unmuteVideo();
        }

        this.video = result;
      } catch (err) {
        const { msg = '无法访问您的摄像头设备' } = err || {};

        message.error(msg);
      }
    },

    // 麦克风操作
    async onAudioOperate() {
      try {
        let result = 'muteAudio';

        if (this.audio === 'unmuteAudio') {
          result = await this.client.muteAudio();

          message.info('麦克风已静音');
        } else {
          result = await this.client.unmuteAudio();
        }
        this.audio = result;
      } catch (err) {
        const { msg = '无法访问您的麦克风设备' } = err || {};

        message.error(msg);
      }
    },

    // 取消举手
    async onHand(type) {
      const funcMap = {
        handup: {
          func: 'onHandUp',
          msg: '发言请求已发送',
        },
        handdown: {
          func: 'onHandDown',
          msg: '',
        },
        mute: {
          func: 'onMute',
          msg: '',
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
        message.info('操作失败');
      }
    },

    // 麦克风操作
    async audioOperate() {
      if (this.audio === 'muteAudio' && this.disableAudio && !this.handStatus) {
        await this.onHand('handup');
        return;
      }

      if (this.audio === 'muteAudio' && this.disableAudio && this.handStatus) {
        await this.onHand('handdown');
        return;
      }

      if (this.audio === 'unmuteAudio' && this.disableAudio) {
        await this.onHand('mute');
        return;
      }

      this.onAudioOperate();
    },

    // 切换布局
    async switchLayout() {
      try {
        await this.client.switchLayout();
      } catch (err) {
        console.log('switch layout error: ', err);
      }
    },

    // 自定义布局分页
    customSwitchPage(type) {
      const { currentPage, totalPage } = this.pageInfo;
      let nextPage = currentPage;

      if (type === 'next') {
        nextPage += 1;
      } else if (type === 'previous') {
        nextPage -= 1;
      } else if (type === 'home') {
        nextPage = 1;
      }

      nextPage = Math.max(nextPage, 1);
      nextPage = Math.min(nextPage, totalPage);

      this.pageInfo = {
        ...this.pageInfo,
        currentPage: nextPage,
      };

      this.customRequestLayout(this.pageInfo);
    },

    // 全屏
    async forceFullScreen(id = '') {
      if (this.setting.layoutMode === 'CUSTOM') {
        if (id) {
          const item = this.layout.find((item) => item.roster.id === id);

          if (!item || id === this.forceLayoutId) {
            return;
          }
        }

        this.forceLayoutId = id;

        this.customRequestLayout();

        return;
      }

      await this.client.forceFullScreen(id);

      this.forceLayoutId = id;
    },

    // 分页
    async switchPage(type) {
      this.forceLayoutId = '';

      if (this.setting.layoutMode === 'CUSTOM') {
        this.customSwitchPage(type);
        return;
      }

      const { currentPage, totalPage } = this.pageInfo;
      let nextPage = currentPage;

      if (type === 'next') {
        nextPage += 1;
      } else if (type === 'previous') {
        nextPage -= 1;
      } else if (type === 'home') {
        nextPage = 0;
      }

      nextPage = Math.max(nextPage, 0);
      nextPage = Math.min(nextPage, totalPage);

      this.client?.setPageInfo(nextPage);
    },

    // 打开/关闭 设置弹框
    onToggleSetting() {
      this.settingVisible = !this.settingVisible;
    },

    // 隐藏本地画面
    async toggleLocal() {
      this.enableHideLocalView = !this.enableHideLocalView;

      const { status } = await this.client.setHideLocalView(this.enableHideLocalView);
      const msg = status ? '已开启隐藏本地画面模式' : '已关闭隐藏本地画面模式';
      message.info(msg);
    },

    async onSaveSetting(data) {
      if (data['specifiedDevice']) {
        this.specifiedDevice = data['specifiedDevice'];
        store.set(STORAGE_KEY.specifiedDevice, { ...this.specifiedDevice });
        return;
      }

      if (Object.prototype.hasOwnProperty.call(data, 'localHide')) {
        if (this.client) {
          this.toggleLocal();
        }
      }

      const key = Object.keys(data)[0];
      const value = data[key];

      const xySetting = { ...this.setting, [key]: value };

      store.set('xy-setting', xySetting);

      this.setting = xySetting;
    },

    // 停止分享content
    stopShareContent() {
      if (this.contentTrack) {
        this.contentTrack.close();
        this.contentTrack = null;
      }

      this.isLocalShareContent = false;
    },

    // 分享content内容
    async shareContent() {
      try {
        this.contentTrack = await this.client.createContentTrack();

        this.contentTrack.on('start-share-content', () => {
          this.client.publish(this.contentTrack);
        });

        this.contentTrack.on('stop-share-content', () => {
          this.stopShareContent();
        });

        // screenAudio 共享时，是否采集系统音频。 true: 采集； false: 不采集
        await this.contentTrack.capture({
          screenAudio: true,
        });

        // 创建分享屏幕stream成功
        this.isLocalShareContent = true;
      } catch (err) {
        this.stopShareContent();
      }
    },

    // debug
    switchDebug() {
      this.debug = !this.debug;

      this.client.switchDebug(this.debug);
    },

    // 录制
    async toggleRecord() {
      if (this.recordStatus === 0) {
        // 开启录制
        await this.client.startCloudRecord();
      } else if (this.recordStatus === 1) {
        // 结束录制
        await this.client.stopCloudRecord();
      }
    },
  },
};
</script>
<style lang="scss">
@import '@/assets/style/index.scss';
</style>
