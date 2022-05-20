/**
 * enum tools
 */
import confernece from "@/assets/img/type/confernece.png";
import h323 from "@/assets/img/type/h323.png";
import nemo from "@/assets/img/type/nemo.png";
import tvbox from "@/assets/img/type/tvbox.png";
import noicon from "@/assets/img/type/noicon.png";
import bruce from "@/assets/img/type/bruce.png";
import { THIRD } from "./config";

export const DEFAULT_LOCAL_USER = {
  phone: "",
  password: "",
  meeting: "",
  meetingPassword: "",
  meetingName: "",
  muteVideo: false,
  muteAudio: false,
  extUserId: "",
};

export const DEFAULT_SETTING = {
  localHide: false,
  layoutMode: "AUTO",
  isThird: THIRD,
};

export const DEFAULT_CALL_INFO = {
  avatar: '',
  displayName: '',
  numberType: 'CONFERENCE',
  number: '',
  callNumber: ''
};

export const NEXT_DEVICE = {
  deviceId: "",
  label: "",
};

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

export const DEVICE_TYPE_MAP = {
  webrtc: confernece,
  soft: confernece,
  hard: nemo,
  nemono: nemo,
  virtualnemo: nemo,
  nemo,
  tvbox,
  h323,
  bruce,
  desk: noicon,
  confernece,
  default: confernece,
};

export const MAX_PARTICIPANT_COUNT = 500;

export const PARTICIPANT_PAGE_SIZE = 20;
