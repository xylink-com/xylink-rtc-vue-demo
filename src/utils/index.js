/**
 * Tools lib
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-04-28 17:26:40
 */

import { TEMPLATE } from "./template";
import { Message } from "element-ui";

export const transformTime = (timestamp = +new Date()) => {
  if (timestamp) {
    var time = new Date(timestamp);
    var y = time.getFullYear(); //getFullYear方法以四位数字返回年份
    var M = time.getMonth() + 1; // getMonth方法从 Date 对象返回月份 (0 ~ 11)，返回结果需要手动加一
    var d = time.getDate(); // getDate方法从 Date 对象返回一个月中的某一天 (1 ~ 31)
    var h = time.getHours(); // getHours方法返回 Date 对象的小时 (0 ~ 23)
    var m = time.getMinutes(); // getMinutes方法返回 Date 对象的分钟 (0 ~ 59)
    var s = time.getSeconds(); // getSeconds方法返回 Date 对象的秒数 (0 ~ 59)
    return y + "-" + M + "-" + d + " " + h + ":" + m + ":" + s;
  } else {
    return "";
  }
};

export const getErrorMsg = (err) => {
  return JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
};

export const calculateBaseLayoutList = (
  orderLayoutList,
  rateWidth,
  rateHeight
) => {
  let positionStyle = { left: "0px", top: "0px", width: "0px", height: "0px" };
  // @ts-ignore
  const positionInfo = TEMPLATE.temp[orderLayoutList.length];

  const layoutList = orderLayoutList.map((item, index) => {
    const position = positionInfo[index].position;
    const [x, y, w, h] = position;
    let layoutX = Math.round(rateWidth * x);
    let layoutY = Math.round(rateHeight * y);
    let layoutWidth = Math.round(rateWidth * w);
    let layoutHeight = Math.round(rateHeight * h);

    positionStyle = {
      left: `${layoutX}px`,
      top: `${layoutY}px`,
      width: `${layoutWidth}px`,
      height: `${layoutHeight}px`,
    };

    const cachePositionInfo = {
      width: layoutWidth,
      height: layoutHeight,
    };

    return { ...item, positionStyle, positionInfo: cachePositionInfo };
  });

  return layoutList;
};

/**
 * 通过旋转信息获取在layout中的位置
 *
 * @param pid peopleId
 * @param mediagroupid type类型，0: people画面，1: content画面
 */
export const getLayoutIndexByRotateInfo = (nextLayoutList, pid, mid) => {
  let index = -1;
  let listLen = nextLayoutList.length;

  for (let i = 0; i < listLen; i++) {
    const item = nextLayoutList[i];
    const { isContent, participantId } = item.roster;
    // 是不是同一个人
    const isSamePid = participantId === pid;
    // mediagroupid： content/people设备标示，为0代表是people数据，为1代表是content数据
    const isContentOfRotateDevice = mid === 1;
    const match = isSamePid && isContentOfRotateDevice === isContent;

    if (match) {
      index = i;
    }
  }

  return index;
};

// CUSTOM 自定义布局时，需要自行计算Layout容器信息
// 此处使用CUSTOM 自定义布局实现一套SPEAKER演讲者模式的布局模式
// 具体布局形式可参考AUTO布局的SPEAKER演讲者模式
export const getScreenInfo = (elementId = "", nextTemplateRate) => {
  const { clientHeight, clientWidth } =
    document.getElementById(elementId) || document.body;
  const rateHeight = Math.floor(clientWidth * nextTemplateRate);
  const rateWidth = Math.floor(clientHeight / nextTemplateRate);
  const screenInfoObj = { rateHeight: 0, rateWidth: 0 };

  // 高充足，以屏幕宽计算高
  if (clientHeight > rateHeight) {
    screenInfoObj.rateHeight = rateHeight;
    screenInfoObj.rateWidth = clientWidth;
  } else {
    // 否则，以比例宽计算高
    screenInfoObj.rateHeight = clientHeight;
    screenInfoObj.rateWidth = rateWidth;
  }

  return screenInfoObj;
};

// 将推送上来的custom layout数据进行排序处理
export const getOrderLayoutList = (layoutList) => {
  const layoutLen = layoutList.length;
  const baseLayout = {
    content: [],
    chairmain: [],
    activeSpeaker: [],
    audioVideoUnmute: [],
    audioUnmute: [],
    videoUnmute: [],
    audioVideoMute: [],
  };
  // 排序数据
  let orderedLayoutList = [];
  let selfRoster;

  for (let i = 0; i < layoutLen; i++) {
    const item = layoutList[i];
    const {
      isLocal,
      isContent,
      isForceFullScreen,
      isActiveSpeaker,
      audioTxMute,
      videoTxMute,
    } = item.roster;

    if (isLocal) {
      selfRoster = item;

      continue;
    }

    // 保存content
    if (isContent) {
      baseLayout["content"].push(item);
      continue;
    }

    // 保存主会场数据
    if (isForceFullScreen) {
      baseLayout["chairmain"].push(item);
      continue;
    }

    // 保存asp
    if (isActiveSpeaker) {
      baseLayout["activeSpeaker"].push(item);
      continue;
    }

    if (!audioTxMute && !videoTxMute) {
      baseLayout["audioVideoUnmute"].push(item);
      continue;
    }

    if (!audioTxMute && videoTxMute) {
      baseLayout["audioUnmute"].push(item);
      continue;
    }

    if (audioTxMute && !videoTxMute) {
      baseLayout["videoUnmute"].push(item);
      continue;
    }

    if (audioTxMute && videoTxMute) {
      baseLayout["audioVideoMute"].push(item);
      continue;
    }
  }

  for (let key in baseLayout) {
    orderedLayoutList = orderedLayoutList.concat(baseLayout[key]);
  }

  return setSelfRoster(orderedLayoutList, selfRoster);
};

export const setSelfRoster = (orderRosterList, selfRoster) => {
  // 如果会中只有自己，则将自己的画面显示出来
  if (orderRosterList.length === 0) {
    orderRosterList.push(selfRoster);

    return orderRosterList;
  }

  // 将自己的数据放置到第二位，一般来说，第一位都是content/AS/主会场等需要上大屏的数据
  orderRosterList.splice(1, 0, selfRoster);

  // 记录下来最终排好序的roster数据
  return orderRosterList || [];
};

export const message = {
  info: (message) => {
    Message.info({ message, duration: 2000, center: true });
  },
};
