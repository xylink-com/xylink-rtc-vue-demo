<template>
  <el-form
    :model="loginForm"
    status-icon
    :rules="rules"
    :label-position="labelPosition"
    ref="loginForm"
    label-width="130px"
    class="login-form"
  >
    <el-form-item label="会议号" prop="meeting">
      <el-input v-model="loginForm.meeting" autocomplete="off"></el-input>
    </el-form-item>
    <el-form-item label="入会昵称" prop="meetingName">
      <el-input v-model="loginForm.meetingName" autocomplete="off"></el-input>
    </el-form-item>
    <el-form-item label="入会密码" prop="meetingPassword">
      <el-input
        type="password"
        v-model="loginForm.meetingPassword"
        autocomplete="off"
      ></el-input>
    </el-form-item>
    <el-form-item label="入会时关闭摄像头" prop="muteVideo">
      <el-switch v-model="loginForm.muteVideo"></el-switch>
    </el-form-item>
    <el-form-item label="入会时静音" prop="muteAudio">
      <el-switch v-model="loginForm.muteAudio"></el-switch>
    </el-form-item>
    <el-form-item class="center">
      <el-button type="primary" @click="submitForm('loginForm')"
        >加入会议</el-button
      >
      <br />
    </el-form-item>
  </el-form>
</template>
<script>
import store from "@/utils/store";

export default {
  props: ["user"],
  computed: {},
  data() {
    return {
      labelPosition: "right",
      loginForm: this.user,
      rules: {
        meeting: [{ required: true, message: "请输入会议号", trigger: "blur" }],
        meetingPassword: [{ trigger: "blur" }],
        meetingName: [
          { required: true, message: "请输入入会昵称", trigger: "blur" },
        ],
      },
    };
  },
  methods: {
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          console.log("login form:", this.loginForm);

          this.$emit("submitForm", this.loginForm);
        } else {
          return false;
        }
      });
    },
  },
  watch: {
    loginForm: {
      handler(newValue) {
        store.set("xy-user", newValue);
      },
      deep: true,
    },
  },
};
</script>
<style scoped>
.login-form {
  text-align: left;
}
</style>
