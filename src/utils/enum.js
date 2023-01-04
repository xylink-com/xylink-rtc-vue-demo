/**
 * enum tools
 */
import { isPc } from '@/utils/browser';

import confernece from '@/assets/img/type/confernece.png';
import h323 from '@/assets/img/type/h323.png';
import nemo from '@/assets/img/type/nemo.png';
import tvbox from '@/assets/img/type/tvbox.png';
import noicon from '@/assets/img/type/noicon.png';
import bruce from '@/assets/img/type/bruce.png';

export const DEFAULT_SETTING = {
  localHide: false,
  layoutMode: isPc ? 'AUTO' : 'CUSTOM',
  isThird: true,
};

export const DEFAULT_LOCAL_USER = {
  phone: '',
  password: '',
  meeting: '',
  meetingPassword: '',
  meetingName: '',
  muteVideo: false,
  muteAudio: false,
  extUserId: '',
};

export const DEFAULT_CALL_INFO = {
  avatar: '',
  displayName: '',
  numberType: 'CONFERENCE',
  number: '',
  callNumber: '',
};

export const NEXT_DEVICE = {
  deviceId: '',
  label: '',
};

/**
 * 默认设备列表信息
 */
export const DEFAULT_DEVICE = {
  detail: {
    audioInputList: [],
    audioOutputList: [],
    videoInList: [],
  },
  nextDevice: {
    audioInput: NEXT_DEVICE,
    videoInput: NEXT_DEVICE,
    audioOutput: NEXT_DEVICE,
  },
};

/**
 * 参会者默认头像
 */
export const DEVICE_TYPE_MAP = {
  webrtc: noicon,
  soft: noicon,
  hard: nemo,
  nemono: nemo,
  virtualnemo: nemo,
  nemo,
  tvbox,
  h323,
  bruce,
  desk: noicon,
  confernece,
  default: noicon,
};

/**
 * 参会者列表最多显示人数
 */
export const MAX_PARTICIPANT_COUNT = 500;

/**
 * 参会者列表每页显示最大数量
 */
export const PARTICIPANT_PAGE_SIZE = 20;

/**
 * 模板对应位置类型
 *
 * @enum
 * @property {LOCAL} LOCAL 本地
 * @property {CONTENT} CONTENT 共享画面
 */
export const TEMPLATE_TYPE = {
  LOCAL: 'LOCAL',
  CONTENT: 'CONTENT',
};

/**
 * 请流质量
 *
 * 0: low 低画面质量，帧率会自动降低到15帧接收；
 * 1: normal 普通画面质量，会基于带宽信息自动在30/15帧切换；
 * 2: high 高画面质量，会优先匹配高帧率高分辨率画面；
 */
export const VIDEO_QUALITY = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
};
