// import { RATE } from '@/utils/template';

export const calculateBaseLayoutList = (orderLayoutList, rateWidth, rateHeight, positionInfo) => {
  let positionStyle = { left: '0px', top: '0px', width: '0px', height: '0px' };

  const layoutList = orderLayoutList.map((item, index) => {
    const position = positionInfo[index].position;
    const [x, y, w, h] = position;

    let layoutX = Math.round(rateWidth * x);
    let layoutY = Math.round(rateHeight * y);
    let layoutWidth = Math.round(rateWidth * w);
    let layoutHeight = Math.round(layoutWidth * 0.5625);
    if (w === 1 && h === 1) {
      layoutHeight = Math.round(rateHeight * h);
    }

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
export const getScreenInfo = (elementId = '', nextTemplateRate) => {
  const { clientHeight, clientWidth } = document.getElementById(elementId) || document.body;
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
    const { isLocal, isContent, isForceFullScreen, isActiveSpeaker, audioTxMute, videoTxMute } = item.roster;

    if (isLocal) {
      selfRoster = item;

      continue;
    }

    // 保存content
    if (isContent) {
      baseLayout['content'].push(item);
      continue;
    }

    // 保存主会场数据
    if (isForceFullScreen) {
      baseLayout['chairmain'].push(item);
      continue;
    }

    // 保存asp
    if (isActiveSpeaker) {
      baseLayout['activeSpeaker'].push(item);
      continue;
    }

    if (!audioTxMute && !videoTxMute) {
      baseLayout['audioVideoUnmute'].push(item);
      continue;
    }

    if (!audioTxMute && videoTxMute) {
      baseLayout['audioUnmute'].push(item);
      continue;
    }

    if (audioTxMute && !videoTxMute) {
      baseLayout['videoUnmute'].push(item);
      continue;
    }

    if (audioTxMute && videoTxMute) {
      baseLayout['audioVideoMute'].push(item);
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
    selfRoster && orderRosterList.push(selfRoster);

    return orderRosterList;
  }

  // 将自己的数据放置到第二位，一般来说，第一位都是content/AS/主会场等需要上大屏的数据
  selfRoster && orderRosterList.splice(1, 0, selfRoster);

  // 记录下来最终排好序的roster数据
  return orderRosterList || [];
};
