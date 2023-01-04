/**
 * Browser version tools
 *
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-02-21 16:29:12
 */

export const platform = () => {
  const ua = navigator.userAgent;
  const lowerUa = ua.toLocaleLowerCase();
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 || /macintosh|mac os x/i.test(ua);
  const isLinux = navigator.platform.toUpperCase().indexOf('LINUX') >= 0;
  const isWindowsPhone = /(?:Windows Phone)/.test(ua);
  const isWindows = /windows|win32|win64/i.test(ua);
  const isSymbian = /(?:SymbianOS)/.test(ua) || isWindowsPhone;
  const isAndroid = /(?:Android)/.test(ua) || lowerUa.indexOf('harmony') > -1;
  const isFireFox = /(?:Firefox)/.test(ua);
  const isChrome = /(?:Chrome|CriOS)/.test(ua) && !(ua.indexOf('Edg') > -1);
  const isEdge = ua.indexOf('Edg') > -1;
  const isSafari = ua.indexOf('Safari') > -1 && !(ua.indexOf('Chrome') > -1);
  const isMacOrPad = navigator.userAgent.toUpperCase().indexOf('MAC') >= 0 || /macintosh|mac os x/i.test(ua);
  const isIPad = /iPad/i.test(navigator.userAgent) || (isMacOrPad && navigator.maxTouchPoints > 1);
  const isTablet =
    /(?:iPad|PlayBook)/.test(ua) || (isAndroid && !/(?:Mobile)/.test(ua)) || (isFireFox && /(?:Tablet)/.test(ua));
  const isPhone = /(?:iPhone)/.test(ua) && !isTablet;
  const isIOS = isPhone || isIPad;
  const isPc = !isPhone && !isAndroid && !isSymbian && !isIPad;
  const isBaidu = ua.indexOf('Baidu') > -1 || ua.indexOf('BIDUBrowser') > -1 || ua.indexOf('baiduboxapp') > -1;
  const isFirefox = !!lowerUa.match(/firefox/) || ua.indexOf('Firefox') > -1;
  const isQQ =
    !!lowerUa.match(/tencenttraveler/) ||
    !!lowerUa.match(/qqbrowser/) ||
    ua.indexOf('QQ/') > -1 ||
    ua.indexOf('MicroMessenger') > -1;
  // PC微信浏览器
  const isWindowsWechat =
    ua.indexOf('MicroMessenger') > -1 &&
    lowerUa.indexOf('wxwork') <= -1 &&
    lowerUa.indexOf('windowswechat') > -1 &&
    // 排除mac客户端
    lowerUa.indexOf('macintosh') <= -1;
  // PC企业微信浏览器
  const isWindowsWxWechat =
    ua.indexOf('MicroMessenger') > -1 &&
    lowerUa.indexOf('wxwork') > -1 &&
    lowerUa.indexOf('windowswechat') > -1 &&
    // 排除mac客户端
    lowerUa.indexOf('macintosh') <= -1;
  // 移动端微信浏览器
  const isWeixin =
    ua.indexOf('MicroMessenger') > -1 && lowerUa.indexOf('wxwork') <= -1 && lowerUa.indexOf('windowswechat') <= -1;
  const isMiniProgram = ua.indexOf('miniProgram') > -1;
  const isOpera = ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1;
  const iswxwork = lowerUa.indexOf('wxwork') > -1 && lowerUa.indexOf('micromessenger') > -1;
  const isDingDing = lowerUa.indexOf('dingtalk') > -1;
  const isZhazha =
    ua.indexOf('QihooBrowser') > -1 ||
    ua.indexOf('QHBrowser') > -1 ||
    ua.indexOf('360SE') > -1 ||
    ua.indexOf('360EE') > -1 ||
    ua.indexOf('LBBROWSER') > -1 ||
    ua.indexOf('UC') > -1 ||
    ua.indexOf('UBrowser') > -1 ||
    ua.indexOf('UCWEB') > -1 ||
    ua.indexOf('Quark') > -1 ||
    ua.indexOf('MiuiBrowser') > -1 ||
    ua.indexOf('AliApp(TB') > -1 ||
    ua.indexOf('Weibo') > -1 ||
    ua.indexOf('IqiyiApp') > -1 ||
    ua.indexOf('HuaweiBrowser') > -1 ||
    ua.indexOf('HUAWEI') > -1 ||
    ua.indexOf('MetaSr') > -1 ||
    ua.indexOf('Sogou') > -1 ||
    ua.indexOf('SE') > -1 ||
    ua.indexOf('Maxthon') > -1 ||
    ua.indexOf('The world') > -1 ||
    ua.indexOf('MetaSr') > -1 ||
    ua.indexOf('2345Explorer') > -1 ||
    ua.indexOf('TencentTraveler') > -1 ||
    ua.indexOf('Mb2345Browser') > -1;

  return {
    isTablet,
    isPhone,
    isAndroid,
    isPc,
    isMac,
    isChrome,
    isLinux,
    isFirefox,
    isBaidu,
    isQQ,
    isOpera,
    isZhazha,
    isEdge,
    isSafari,
    isIPad,
    isWeixin,
    iswxwork,
    isDingDing,
    isWindowsWechat,
    isWindowsWxWechat,
    isWindows,
    isIOS,
    isMiniProgram,
  };
};

export const getChromeVersion = () => {
  let pieces = navigator.userAgent.match(/Chrom(?:e|ium)\/([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)/);
  if (pieces == null || pieces.length !== 5) {
    return undefined;
  }

  pieces = pieces.map((piece) => parseInt(piece, 10));

  return {
    major: pieces[1],
    minor: pieces[2],
    build: pieces[3],
    patch: pieces[4],
  };
};

export const getEdgeVersion = () => {
  let pieces = navigator.userAgent.match(/Ed(?:g)\/([0-9]+)\.([0-9]+)\.([0-9]+)/);
  if (pieces == null || pieces.length < 4) {
    return undefined;
  }

  pieces = pieces.map((piece) => parseInt(piece, 10));
  return {
    major: pieces[1],
    minor: pieces[2],
    build: pieces[3],
  };
};

export const getSafariVersion = () => {
  let pieces = navigator.userAgent.match(/Version\/([0-9]+)\.([0-9]+)/);
  if (pieces === null || pieces.length < 3) {
    return undefined;
  }

  pieces = pieces.map((piece) => parseInt(piece, 10));
  return {
    major: pieces[1],
    minor: pieces[2],
  };
};

export const getWeixinVersion = () => {
  const { isWeixin } = platform();

  if (isWeixin) {
    const weixinInfo = navigator.userAgent.match(/MicroMessenger\/([\d.]+)/i) || ['', ''];
    const weixinVersion = weixinInfo[1].split('.');

    if (weixinVersion.length) {
      return {
        major: Number(weixinVersion[0]),
        minor: Number(weixinVersion[1]),
        build: Number(weixinVersion[2]),
      };
    }

    return {};
  } else {
    return {};
  }
};

export const getOperationSystem = () => {
  const {
    isIPad,
    isMac,
    isWindowsWechat,
    isWindowsWxWechat,
    isWindows,
    isPhone,
    isAndroid,
    isLinux,
    isMiniProgram,
  } = platform();

  if (isWindowsWxWechat) {
    return 'Windows WXWechat';
  } else if (isWindowsWechat) {
    return 'Windows Wechat';
  } else if (isWindows) {
    return 'Windows';
  } else if (isPhone) {
    return 'iPhone';
  } else if (isAndroid) {
    return 'Android';
  } else if (isIPad) {
    return 'iPad';
  } else if (isMac) {
    return 'Mac';
  } else if (isLinux) {
    return 'Linux';
  } else if (isMiniProgram) {
    return 'MiniProgram';
  }

  return '';
};

export const getBrowserName = () => {
  const {
    isFirefox,
    isChrome,
    isSafari,
    isWindowsWechat,
    isWindowsWxWechat,
    isZhazha,
    isEdge,
    isWeixin,
    iswxwork,
  } = platform();

  if (isFirefox) {
    return 'Firefox';
  } else if (isSafari) {
    return 'Safari';
  } else if (isWindowsWechat) {
    return 'WindowsWechat';
  } else if (isWindowsWxWechat) {
    return 'WindowsWxWechat';
  } else if (isWeixin) {
    return 'Weixin';
  } else if (iswxwork) {
    return 'WXWeixin';
  } else if (isWeixin) {
    return 'Weixin';
  } else if (isEdge) {
    return 'Edge';
  } else if (isChrome) {
    return 'Chrome';
  } else if (isZhazha) {
    return 'Other';
  }

  return '';
};

export const getAndroidVersion = () => {
  let pieces = navigator.userAgent.toLowerCase().match(/android (.*?);/);

  if (pieces) {
    let versions = pieces[1].split('.');

    versions = versions.map((v) => parseInt(v, 10));
    return {
      major: versions[0],
      minor: versions[1],
    };
  }
  return undefined;
};

export const getIOSVersion = () => {
  let pieces = navigator.userAgent.toLowerCase().match(/cpu( iphone)? os (.*?) like mac os/);

  if (pieces) {
    let versions = pieces[2].split('_');

    versions = versions.map((v) => parseInt(v, 10));

    return {
      major: versions[0],
      minor: versions[1],
    };
  }
  return undefined;
};

export const { isPc } = platform();

/**
 * ios 12.2+ safari
 * ios 14.3+ 微信浏览器
 *  android 8+ 微信浏览器 QQ浏览器
 */
export const isSupportMobileJoinMeeting = () => {
  const { isAndroid, isPhone, isIPad, isSafari, iswxwork } = platform();
  let isMinBrowser = false;
  const browserName = getBrowserName();
  const isWeixin = browserName === 'Weixin';

  if (isAndroid) {
    const { major } = getAndroidVersion() || { major: 0, minor: 0 };

    isMinBrowser = major >= 8;
  } else if (isPhone || isIPad) {
    const { major, minor } = getIOSVersion() || { major: 0, minor: 0 };

    if (major > 14 || (major === 14 && minor > 3)) {
      isMinBrowser = isWeixin || isSafari;
    } else if (major > 12 || (major === 12 && minor > 2)) {
      isMinBrowser = isSafari;
    }
  }

  isMinBrowser = isMinBrowser && !iswxwork;

  return isMinBrowser;
};

// 判断移动端横竖屏 true:竖屏； false:横屏
export const isVertical = () => {
  return window.innerHeight >= window.innerWidth;
};
