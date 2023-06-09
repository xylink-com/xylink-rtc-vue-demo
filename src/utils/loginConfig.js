export const loginTypeMap = {
  XYLINK: {
    title: '小鱼账号登录',
    menu: { phone: true },
  },
  THIRD: {
    title: '三方账号登录',
    menu: { clientId: true, extUserId: true },
  },
  AUTHCODE: {
    title: '授权码登录',
    menu: { clientId: true, extUserId: true, authCode: true, channelId: true },
  },
};
