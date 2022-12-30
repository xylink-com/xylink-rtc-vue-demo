/**
 * Tools lib
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-04-28 17:26:40
 */

import { Message } from 'element-ui';

export const message = {
  info: (message) => {
    Message.info({ message, duration: 3000, center: true });
  },
};

export const transformTime = (timestamp = +new Date()) => {
  if (timestamp) {
    var time = new Date(timestamp);
    var y = time.getFullYear(); //getFullYear方法以四位数字返回年份
    var M = time.getMonth() + 1; // getMonth方法从 Date 对象返回月份 (0 ~ 11)，返回结果需要手动加一
    var d = time.getDate(); // getDate方法从 Date 对象返回一个月中的某一天 (1 ~ 31)
    var h = time.getHours(); // getHours方法返回 Date 对象的小时 (0 ~ 23)
    var m = time.getMinutes(); // getMinutes方法返回 Date 对象的分钟 (0 ~ 59)
    var s = time.getSeconds(); // getSeconds方法返回 Date 对象的秒数 (0 ~ 59)
    return y + '-' + M + '-' + d + ' ' + h + ':' + m + ':' + s;
  } else {
    return '';
  }
};

export const getErrorMsg = (err) => {
  return JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
};
