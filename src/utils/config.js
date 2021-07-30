/**
 * webRTC config file
 *
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-01-17 12:04:01
 */

import store from "./store";

// 默认第三方是prd环境
export const ENV = store.get("sdk-env") || "TXDEV";
export const THIRD = true;

const SERVER_MAP = {
  TXDEV: {
    wssServer: "wss://testdevapi.xylink.com",
    httpServer: "https://testdevapi.xylink.com",
    baseServer: "https://testdev.xylink.com",
    logServer: "https://txdevlog.xylink.com",
  },
  PRE: {
    wssServer: "wss://cloudapi.xylink.com",
    httpServer: "https://cloudapi.xylink.com",
    baseServer: "https://cloud.xylink.com",
    logServer: "https://log.xylink.com",
  },
  PRD: {
    wssServer: "wss://cloudapi.xylink.com",
    httpServer: "https://cloudapi.xylink.com",
    baseServer: "https://cloud.xylink.com",
    logServer: "https://log.xylink.com",
  },
};

/**
 * 重要提示
 * 重要提示
 * 重要提示
 * 登录配置 THIRD_ACCOUNT_MAP -> PRD 中的extId和clientId字段，1.3.4 版本以上，clientSecret不再使用，可不用配置，忽略TXDEV和PRE属性
 * 此值需要从对接负责人处获取
 * 重要提示
 * 重要提示
 * 重要提示
 */

const THIRD_ACCOUNT_MAP = {
  TXDEV: {
    extId: "8bea008225dd82616e1f43dcc5c8e3bbbab0d9e5", // a8659e5d496283c5d5ed18b9b51f263bfeeebc79
    clientId: "Dx9AiLgQEOboyidOWxGoQRSi",
    clientSecret: "",
  },
  PRE: {
    extId: "",
    clientId: "",
    clientSecret: "",
  },
  PRD: {
    extId: "",
    clientId: "",
    // 1.3.4 版本以上，clientSecret不再使用，可不用配置，忽略TXDEV和PRE属性
    clientSecret: "",
  },
};

export const SERVER = (env = ENV) => SERVER_MAP[env];
export const ACCOUNT = (env = ENV) => THIRD_ACCOUNT_MAP[env];
