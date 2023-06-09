<template>
  <div class="login">
    <div class="login-header">
      <el-row type="flex" justify="center" align="center">
        <el-col :xs="24" :lg="22" :xl="16">
          <a href="https://www.xylink.com/" target="_blank" rel="noopener noreferrer">
            <img class="login-header-logo" src="@/assets/img/login-logo.png" alt="logo" />
          </a>
        </el-col>
      </el-row>
    </div>
    <div class="login-container">
      <div class="login-content">
        <div class="login-title">加入会议{{ loginType }}</div>
        <el-form
          :model="loginForm"
          status-icon
          :rules="rules"
          :label-position="labelPosition"
          ref="loginForm"
          class="login-form"
        >
          <el-form-item
            v-if="menu.extUserId"
            prop="extUserId"
            :rules="{
              required: true,
              message: '请输入第三方用户ID',
              trigger: 'blur',
            }"
          >
            <el-input v-model="loginForm.extUserId" autocomplete="off" placeholder="第三方用户ID"></el-input>
          </el-form-item>

          <el-form-item
            v-if="menu.phone"
            prop="phone"
            :rules="{
              required: true,
              message: '请输入小鱼账号',
              trigger: 'blur',
            }"
          >
            <el-input v-model="loginForm.phone" autocomplete="off" placeholder="输入小鱼账号"></el-input>
          </el-form-item>

          <el-form-item
            v-if="menu.phone"
            prop="password"
            :rules="{
              required: true,
              message: '请输入账号密码',
              trigger: 'blur',
            }"
          >
            <el-input
              type="password"
              v-model="loginForm.password"
              autocomplete="off"
              placeholder="输入账号密码"
            ></el-input>
          </el-form-item>

          <el-form-item
            v-if="menu.authCode"
            prop="authCode"
            :rules="{
              required: true,
              message: '请输入授权码',
              trigger: 'blur',
            }"
          >
            <el-input v-model="loginForm.authCode" autocomplete="off" placeholder="输入授权码"></el-input>
          </el-form-item>

          <el-form-item
            v-if="menu.channelId"
            prop="channelId"
            :rules="{
              required: true,
              message: '请输入渠道id',
              trigger: 'blur',
            }"
          >
            <el-input v-model="loginForm.channelId" autocomplete="off" placeholder="输入渠道id"></el-input>
          </el-form-item>

          <el-form-item prop="meeting">
            <el-input v-model="loginForm.meeting" autocomplete="off" placeholder="输入云会议室号或终端号"></el-input>
          </el-form-item>

          <el-form-item prop="meetingPassword">
            <el-input
              type="password"
              v-model="loginForm.meetingPassword"
              autocomplete="off"
              placeholder="入会密码"
            ></el-input>
          </el-form-item>

          <el-form-item prop="meetingName">
            <el-input v-model="loginForm.meetingName" autocomplete="off" placeholder="输入会议中显示的名称"></el-input>
          </el-form-item>

          <el-form-item class="login-form-checkbox" v-if="menu.authCode">
            <el-checkbox v-model="loginForm.isTempUser">临时账号</el-checkbox>
          </el-form-item>

          <el-button class="join-btn" type="primary" @click="submitForm('loginForm')">加入会议</el-button>
          <el-form-item class="login-form-checkbox">
            <el-checkbox v-model="loginForm.muteVideo">入会时关闭摄像头</el-checkbox>
          </el-form-item>
          <el-form-item class="login-form-checkbox">
            <el-checkbox v-model="loginForm.muteAudio">入会时静音</el-checkbox>
          </el-form-item>
        </el-form>
        <div class="setting-btn">
          <span @click="onOpenSetting"> 设置 <i class="el-icon-setting"></i> </span>
        </div>
      </div>
    </div>

    <div class="footer">
      <a
        class="link"
        rel="noopener noreferrer"
        target="_blank"
        href="https://openapi.xylink.com/common/meeting/doc/description?platform=web"
        >小鱼易连WebRTC SDK开发文档
      </a>
      <div class="version">版本：{{ xyRTC.version }}</div>
    </div>
  </div>
</template>
<script>
import store from '@/utils/store';
import xyRTC from '@xylink/xy-rtc-sdk';
import { loginTypeMap } from '@/utils/loginConfig';

export default {
  props: ['user', 'loginType'],

  computed: {
    menu() {
      return loginTypeMap[this.loginType].menu;
    },
  },
  data() {
    return {
      xyRTC,
      labelPosition: 'right',
      loginForm: this.user,
      rules: {
        meeting: [{ required: true, message: '请输入会议号', trigger: 'blur' }],
        meetingPassword: [{ trigger: 'blur' }],
        meetingName: [{ required: true, message: '请输入入会昵称', trigger: 'blur' }],
      },
    };
  },
  methods: {
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (!valid) {
          return false;
        }
        this.$emit('submitForm', this.loginForm);
      });
    },

    onOpenSetting() {
      this.$emit('onToggleSetting');
    },
  },
  watch: {
    loginForm: {
      handler(newValue) {
        store.set('xy-user', newValue);
      },
      deep: true,
    },
  },
};
</script>
<style lang="scss">
@import './index.scss';
</style>
