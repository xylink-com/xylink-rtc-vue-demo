<template>
  <div class="debug">
    <div class="debug__container">
      <div class="close-icon" @click="switchDebug" />

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
            <td>{{ time || 0 }}</td>
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
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, key) in sender" :key="key">
            <td>本地视频</td>
            <td>{{ item.frameWidth }}*{{ item.frameHeight }}</td>
            <td>{{ item.expBandwidth }}</td>
            <td>{{ item.bytesSentSecond }}</td>
            <td>{{ item.framesEncodedSecond }}</td>
            <td>{{ item.framesSentSecond }}</td>
            <td>{{ item.keyFramesEncoded }}</td>
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
            },
            key) in receiver"
            :key="key"
          >
            <td>{{ name }}</td>
            <td>{{ type }} * {{ isContent ? 'Con' : 'Peo' }}</td>
            <td>{{ frameWidth }}*{{ frameHeight }}</td>
            <td>{{ framesDecodedSecond }}</td>
            <td>{{ framesReceivedSecond }}</td>
            <td>{{ bytesReceivedSecond }}</td>
            <td>{{ keyFramesDecoded }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script>
import { transformTime } from '@/utils/index';
export default {
  props: ['senderStatus'],
  computed: {
    time() {
      return transformTime(this.timestamp);
    },
  },
  data() {
    const { mimeType, sender = {}, timestamp, receiver = {}, bytesReceivedSecond, bytesSentSecond } = this.senderStatus;
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
      this.$emit('switchDebug');
    },
  },
  watch: {
    senderStatus: {
      handler(newValue) {
        const { mimeType, sender = {}, timestamp, receiver = {}, bytesReceivedSecond, bytesSentSecond } = newValue;
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
<style lang="scss" scoped>
@import './index.scss';
</style>
