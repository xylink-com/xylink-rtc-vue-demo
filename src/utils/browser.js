/**
 * Broswer version tools
 */

export const platform = () => {
  const ua = navigator.userAgent;
  const lowerUa = ua.toLocaleLowerCase();
  const isMac =
    navigator.platform.toUpperCase().indexOf("MAC") >= 0 ||
    /macintosh|mac os x/i.test(ua);
  const isLinux = navigator.platform.toUpperCase().indexOf("LINUX") >= 0;
  const isWindows = /(?:win)/.test(ua);
  const isWindowsPhone = /(?:Windows Phone)/.test(ua);
  const isSymbian = /(?:SymbianOS)/.test(ua) || isWindowsPhone;
  const isAndroid = /(?:Android)/.test(ua) || lowerUa.indexOf("harmony") > -1;
  const isFireFox = /(?:Firefox)/.test(ua);
  const isChrome = /(?:Chrome|CriOS)/.test(ua) && !(ua.indexOf("Edg") > -1);
  const isEdge = ua.indexOf("Edg") > -1;
  const isSafari = ua.indexOf("Safari") > -1 && !(ua.indexOf("Chrome") > -1);
  const isIPad =
    /iPad/i.test(ua) ||
    (ua.indexOf("MacIntel") > -1 && navigator.maxTouchPoints > 1) ||
    (ua.indexOf("Macintosh") > -1 && navigator.maxTouchPoints > 1);
  const isTablet =
    /(?:iPad|PlayBook)/.test(ua) ||
    (isAndroid && !/(?:Mobile)/.test(ua)) ||
    (isFireFox && /(?:Tablet)/.test(ua));
  const isPhone = /(?:iPhone)/.test(ua) && !isTablet;
  const isPc = !isPhone && !isAndroid && !isSymbian && !isIPad;
  const isBaidu =
    ua.indexOf("Baidu") > -1 ||
    ua.indexOf("BIDUBrowser") > -1 ||
    ua.indexOf("baiduboxapp") > -1;
  const isFirefox = !!lowerUa.match(/firefox/) || ua.indexOf("Firefox") > -1;
  const isQQ =
    !!lowerUa.match(/tencenttraveler/) ||
    !!lowerUa.match(/qqbrowse/) ||
    ua.indexOf("QQ/") > -1 ||
    ua.indexOf("MicroMessenger") > -1;
  // PC微信浏览器
  const isWindowsWechat =
    ua.indexOf("MicroMessenger") > -1 &&
    lowerUa.indexOf("wxwork") <= -1 &&
    lowerUa.indexOf("windowswechat") > -1 &&
    // 排除mac客户端
    lowerUa.indexOf("macintosh") <= -1;
  // PC企业微信浏览器
  const isWindowsWxWechat =
    ua.indexOf("MicroMessenger") > -1 &&
    lowerUa.indexOf("wxwork") > -1 &&
    lowerUa.indexOf("windowswechat") > -1 &&
    // 排除mac客户端
    lowerUa.indexOf("macintosh") <= -1;
  // 移动端微信浏览器
  const isWeixin =
    ua.indexOf("MicroMessenger") > -1 &&
    lowerUa.indexOf("wxwork") <= -1 &&
    lowerUa.indexOf("windowswechat") <= -1;
  const iswxwork =
    lowerUa.indexOf("wxwork") > -1 && lowerUa.indexOf("micromessenger") > -1;
  const isOpera = ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1;
  const isHuaweiBrowser = ua.indexOf("HuaweiBrowser") > -1;
  const isZhazha =
    ua.indexOf("QihooBrowser") > -1 ||
    ua.indexOf("QHBrowser") > -1 ||
    ua.indexOf("360SE") > -1 ||
    ua.indexOf("360EE") > -1 ||
    ua.indexOf("LBBROWSER") > -1 ||
    ua.indexOf("UC") > -1 ||
    ua.indexOf("UBrowser") > -1 ||
    ua.indexOf("UCWEB") > -1 ||
    ua.indexOf("Quark") > -1 ||
    ua.indexOf("MiuiBrowser") > -1 ||
    ua.indexOf("AliApp(TB") > -1 ||
    ua.indexOf("Weibo") > -1 ||
    ua.indexOf("IqiyiApp") > -1 ||
    ua.indexOf("HuaweiBrowser") > -1 ||
    ua.indexOf("HUAWEI") > -1 ||
    ua.indexOf("MetaSr") > -1 ||
    ua.indexOf("Sogou") > -1 ||
    ua.indexOf("SE") > -1 ||
    ua.indexOf("Maxthon") > -1 ||
    ua.indexOf("The world") > -1 ||
    ua.indexOf("MetaSr") > -1 ||
    ua.indexOf("2345Explorer") > -1 ||
    ua.indexOf("TencentTraveler") > -1 ||
    ua.indexOf("Mb2345Browser") > -1;

  return {
    isTablet,
    isPhone,
    isAndroid,
    isPc,
    isMac,
    isWindows,
    isIPad,
    isChrome,
    isLinux,
    isFirefox,
    isBaidu,
    isQQ,
    isOpera,
    isZhazha,
    isEdge,
    isSafari,
    isHuaweiBrowser,
    isWindowsWechat,
    isWindowsWxWechat,
    isWeixin,
    iswxwork,
  };
};

export const isPc = platform().isPc;

export const isMobile = !isPc;
