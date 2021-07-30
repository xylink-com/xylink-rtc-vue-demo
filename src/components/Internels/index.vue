<template>
  <div class="debug">
    <div class="debug__container">
      <div class="close" @click="switchDebug">X</div>

      <h3>总览：</h3>
      <table class="table">
        <thead>
          <tr class="table-title">
            <th>视频编码</th>
            <th>时间</th>
            <th>接收（kb/s）</th>
            <th>发送（kb/s）</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{{ mimeType }}</td>
            <td>{{ time }}</td>
            <td>{{ bytesReceivedSecond }}</td>
            <td>{{ bytesSentSecond }}</td>
          </tr>
        </tbody>
      </table>

      <br />
      <h3>发送：</h3>
      <table class="table">
        <thead>
          <tr class="table-title">
            <th>类型</th>
            <th>分辨率</th>
            <th>期望发送（kb/s）</th>
            <th>发送（kb/s）</th>
            <th>编码（帧/s）</th>
            <th>码率（帧/s）</th>
            <th>关键帧</th>
            <th>pliCount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, key) in sender" :key="key">
            <td>{{ item.type }}</td>
            <td>{{ item.frameWidth}}*{{item.frameHeight}}</td>
            <td>{{ item.expBandwidth }}</td>
            <td>{{ item.bytesSentSecond }}</td>
            <td>{{ item.framesEncodedSecond }}</td>
            <td>{{ item.framesSentSecond }}</td>
            <td>{{ item.keyFramesEncoded }}</td>
            <td>{{ item.pliCount }}</td>
          </tr>
        </tbody>
      </table>

      <br />
      <h3>与会者：</h3>
      <table class="table">
        <thead>
          <tr class="table-title">
            <th>昵称</th>
            <th>类型</th>
            <th>实际分辨率</th>
            <th>解码（帧/s）</th>
            <th>码率（帧/s）</th>
            <th>接收（kb/s）</th>
            <th>关键帧</th>
            <th>pliCount</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="({
              frameWidth,
              frameHeight,
              bytesReceivedSecond,
              framesReceivedSecond,
              framesDecodedSecond,
              type,
              name,
              isContent,
              keyFramesDecoded,
              pliCount,
            },
            key) in receiver"
            :key="key"
          >
            <td>{{ name }}</td>
            <td>{{ type}} * {{(isContent ? "Con" : "Peo") }}</td>
            <td>{{ frameWidth}}*{{frameHeight}}</td>
            <td>{{ framesDecodedSecond }}</td>
            <td>{{ framesReceivedSecond }}</td>
            <td>{{ bytesReceivedSecond }}</td>
            <td>{{ keyFramesDecoded }}</td>
            <td>{{ pliCount }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script>
import { transformTime } from "@/utils/index";
export default {
  props: ["senderStatus"],
  computed: {
    time() {
      return transformTime(this.timestamp);
    },
  },
  data() {
    const {
      mimeType,
      sender = {},
      timestamp,
      receiver = {},
      bytesReceivedSecond,
      bytesSentSecond,
    } = this.senderStatus;
    return {
      mimeType,
      sender,
      timestamp,
      receiver,
      bytesReceivedSecond,
      bytesSentSecond,
    };
  },
  methods: {
    switchDebug() {
      this.$emit("switchDebug");
    },
  },
  watch: {
    senderStatus: {
      handler(newValue) {
        const {
          mimeType,
          sender = {},
          timestamp,
          receiver = {},
          bytesReceivedSecond,
          bytesSentSecond,
        } = newValue;
        this.mimeType = mimeType;
        this.sender = sender;
        this.timestamp = timestamp;
        this.receiver = receiver;
        this.bytesReceivedSecond = bytesReceivedSecond;
        this.bytesSentSecond = bytesSentSecond;
      },
    },
  },
};
</script>
<style scoped>
.debug {
  position: fixed;
  top: 30px;
  left: 0px;
  width: 100%;
  height: calc(100% - 90px);
  background-color: rgba(51, 51, 51, 0.8);
  z-index: 1002;
  padding: 20px;
  text-align: left;
  user-select: auto;
  color: #fff;
}

.debug__container {
  width: 100%;
  height: 100%;
  overflow: auto;
  padding-right: 90px;
}

.debug__container .close {
  position: fixed;
  right: 50px;
  top: 50px;
  width: 30px;
  height: 30px;
  background-color: #1790ff;
  display: flex;
  font-size: 16px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
}

.debug__container .line {
  display: flex;
}
.debug__container .line span {
  margin-right: 10px;
  width: 180px;
  text-align: left;
}

.debug__container .table {
  width: 100%;
  border-collapse: collapse;
  background-color: #00000063;
  font-size: 14px;
}
.debug__container .table th {
  padding: 6px;
}

.debug__container .table tr,
.debug__container .table td {
  border-collapse: collapse;
  padding: 6px;
  text-align: left;
  min-width: 100px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.debug__container::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.debug__container::-webkit-scrollbar-thumb {
  border-radius: 1em;
  background: rgba(50, 50, 50, 0.3);
}
.debug__container::-webkit-scrollbar-track {
  border-radius: 1em;
  background: rgba(50, 50, 50, 0.1);
}
</style>
