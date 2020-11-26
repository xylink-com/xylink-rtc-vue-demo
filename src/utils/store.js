/**
 * Store LocalStorage
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2019-11-01 14:36:12
 */

const store = {
  storage: window.localStorage,
  set(key, value) {
    if (!value) return;

    let data = serialize(value) || "";

    this.storage.setItem(key, data);
  },
  get(key) {
    if (!key) return;

    const val = this.storage.getItem(key);
    let newVal = val || "";

    try {
      newVal = JSON.parse(newVal);
    } catch (err) {
      newVal = val || "";
    }

    return newVal;
  },
  remove(key) {
    if (!key) return;

    this.storage.removeItem(key);
  },
  clear() {
    this.storage.clear();
  },
  // 批量删除 array => key 数组
  removeList(array) {
    for (let key of array) {
      this.storage.removeItem(key);
    }
  },
};

const serialize = function(value) {
  if (!value) return;

  let val = "";
  const type = Object.prototype.toString.call(value);
  if (type === "[object Object]" || type === "[object Array]") {
    val = JSON.stringify(value);
  } else {
    val = value;
  }

  return val;
};

export default store;
