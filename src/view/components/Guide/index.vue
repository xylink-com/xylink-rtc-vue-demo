<template>
  <el-dialog
    custom-class="xy__guide-modal"
    :visible.sync="visible"
    width="542px"
    append-to-body
    title=""
    top = "10vh"
  >
    <div class="guide-content">
      <div class="model-title guide-title">
        <div class="close">
          <span class="close-icon" @click="onClose" />
        </div>
        <div class="title">摄像头或麦克风设置</div>
      </div>

      <div class="model-container guide-container">
        <div class="guide-tip">
          <div class="guide-tip-title">
            1、检查Web权限是否允许摄像头或麦克风
          </div>
          <div class="guide-tip-img">
            <img
              width="100%"
              src="@/assets/img/operate/ch_step_operate_video.png"
              alt=""
            />
          </div>
        </div>
        <div class="guide-tip">
          <div class="guide-tip-title">
            2、确保通话中选择了正确的设备，可通过以下操作切换设备
          </div>
          <div class="guide-tip-img">
            <img
              width="100%"
              src="@/assets/img/operate/ch_step_operate_permission.png"
              alt=""
            />
          </div>
        </div>
        <div class="guide-tip">
          <div class="guide-tip-title">
            3、检查摄像头或麦克风硬件设备本身是否正常
          </div>
        </div>
        <div class="guide-tip">
          <div class="guide-tip-title">
            4、检查系统权限是否允许摄像头或麦克风;
          </div>
          <div class="guide-tip-content">
            <div>
              -{`Windows 系统：设置 > 隐私 > 相机/麦克风 >
              允许桌面应用访问你的相机/麦克风`}
            </div>
            <div>
              -{` Mac OS 系统：系统偏好设置 > 安全与隐私 > 隐私 >
              摄像头/麦克风`}
            </div>
          </div>
        </div>
        <div class="guide-tip">
          <div class="guide-tip-title">
            5、如果以上步骤未设置成功，可<span class="link" @click="onReload">
              刷新 </span
            >页面尝试重新授权；
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>
<script>
export default {
  props: ["visible"],
  data() {
    return {};
  },
  methods: {
    onClose() {
      this.$emit("close");
    },
    onReload() {
      window.location.reload();
    },
  },
};
</script>
<style lang="scss">
@import "./index.scss";
</style>
