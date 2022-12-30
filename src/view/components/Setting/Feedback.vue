<template>
  <div class="feedback">
    <div class="feedback__content">
      <div class="item">
        <div class="key">内容描述</div>
        <div class="value">
          <el-input
            type="textarea"
            :rows="2"
            placeholder="请输入您的宝贵意见和建议"
            v-model="content"
          >
          </el-input>
        </div>
      </div>

      <div class="item feedback__content-contact">
        <div class="key">联系方式</div>
        <div class="value">
          <el-input
            v-model="contact"
            class="feedback__content-input"
            autocomplete="off"
            placeholder="请输入您的联系方式"
          ></el-input>
        </div>
      </div>
    </div>
    <div class="feedback__footer">
      <el-button class="download" type="text" @click="download" :loading="downloadLoading"
        >下载日志</el-button
      >
      <el-button
        class="upload-btn"
        :loading="uploadLoading"
        @click="upload"
        type="primary"
        :disabled="!content.trim()"
      >
        {{ uploadLoading ? "提交中" : "提交" }}
      </el-button>
    </div>
  </div>
</template>
<script>
import xyRTC from "@xylink/xy-rtc-sdk";
import store from "@/utils/store";
import { message } from "@/utils/index";

export default {
  data() {
    return {
      content: "",
      contact: "",
      uploadLoading: false,
      downloadLoading: false
    };
  },
  methods: {
    async download() {
      this.downloadLoading = true;
      await xyRTC.logger.downloadLog();
      this.downloadLoading = false;
    },
    async upload() {
      this.uploadLoading = false;
      try {
        const { meetingName = "" } = store.get("xy-user") || {};

        const result = await xyRTC.logger.uploadLog(
          meetingName,
          this.contact,
          this.content
        );

        if (result) {
          message.info("提交成功");

          this.content = "";
        } else {
          message.info("提交失败");
        }

        this.contact = "";
      } catch (err) {
        message.info("提交失败");
      }

      this.uploadLoading = false;
    },
  },
};
</script>
