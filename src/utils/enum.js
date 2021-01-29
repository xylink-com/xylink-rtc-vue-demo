/**
 * enum tools
 */

export const DEFAULT_LOCAL_USER = {
  meeting: "",
  meetingPassword: "",
  meetingName: "",
  muteVideo: false,
  muteAudio: false,
  localHide: false,
};

export const NEXT_DEVICE = {
  deviceId: '',
  label: ''
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
