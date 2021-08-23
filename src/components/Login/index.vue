<template>
  <el-form
    :model="loginForm"
    status-icon
    :rules="rules"
    :label-position="labelPosition"
    ref="loginForm"
    label-width="100px"
    class="login-form"
  >
    <el-form-item label="会议号" prop="meeting">
      <el-input v-model="loginForm.meeting" autocomplete="off"></el-input>
    </el-form-item>
    <el-form-item label="会议密码" prop="meetingPwd">
      <el-input v-model="loginForm.meetingPwd" autocomplete="off"></el-input>
    </el-form-item>
    <el-form-item label="账号" prop="username">
      <el-input v-model="loginForm.username" autocomplete="off"></el-input>
    </el-form-item>
    <el-form-item label="账号密码" prop="password">
      <el-input
        type="password"
        v-model="loginForm.password"
        autocomplete="off"
      ></el-input>
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
