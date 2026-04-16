<template>
  <div id="meetingkit-root" ref="host" class="meeting-kit-root"></div>
</template>

<script>
import React from 'react';
import { createRoot } from 'react-dom/client';
import XYRTC from '@xylink/xy-rtc-sdk';
import { uiMeetingKit, XYMeetingKitComp, XYMeetingEventKey } from '@xylink/meetingkit';

export default {
  name: 'MeetingKitHost',
  props: {
    joinConfig: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      reactRoot: null,
      disconnectedHandler: null,
      tornDown: false,
    };
  },
  async mounted() {
    this.disconnectedHandler = () => {
      this.teardown().finally(() => {
        this.$emit('ended');
      });
    };

    try {
      // 按需加载 MeetingKit 样式：只有渲染 MeetingKitHost 时才会加载
      await import('@xylink/meetingkit/css/style.css');
      await this.bootstrap();
    } catch (err) {
      console.error('[MeetingKit]', err);
      await this.teardown();
      this.$emit('error', err);
    }
  },
  beforeDestroy() {
    this.teardown();
  },
  methods: {
    async bootstrap() {
      const { user, setting, server, account } = this.joinConfig;
      const { clientId, clientSecret, extId } = account;
      const { layoutMode = 'AUTO', localHide = false, isThird } = setting;
      const elementId = 'meetingkit-root';

      XYRTC.logger.setLogLevel('NONE');

      uiMeetingKit.on(XYMeetingEventKey.DISCONNECTED, this.disconnectedHandler);

      await uiMeetingKit.setFeatureVisible({
        enableVirtualBackground: true,
      });

      const client = await uiMeetingKit.createClient({
        clientId,
        clientSecret,
        extId,
        server,
        layout: layoutMode,
        container: {
          elementId,
          offset: [0, 0, 0, 0],
        },
        extUserId: isThird ? user.extUserId : undefined,
      });

      client.setFeatureConfig({
        enableAutoResizeLayout: true,
        enableLayoutAvatar: true,
        enableCheckRecordPermission: true,
        enableHideLocalView: localHide,
      });

      if (isThird) {
        await client.loginExternalAccount({
          displayName: user.meetingName || 'guest',
          extId,
          extUserId: user.extUserId,
        });
      } else {
        await client.loginXYlinkAccount(user.phone || '', user.password || '');
      }

      this.reactRoot = createRoot(this.$refs.host);
      this.reactRoot.render(React.createElement(XYMeetingKitComp, { visible: true, inPwa: false }));

      await uiMeetingKit.makeCall({
        confNumber: user.meeting,
        password: user.meetingPassword,
        displayName: user.meetingName,
        muteAudio: user.muteAudio,
        muteVideo: user.muteVideo,
      });
    },
    async teardown() {
      if (this.tornDown) {
        return;
      }
      this.tornDown = true;

      if (this.disconnectedHandler) {
        try {
          uiMeetingKit.removeEventListener(XYMeetingEventKey.DISCONNECTED, this.disconnectedHandler);
        } catch (e) {
          /* noop */
        }
        this.disconnectedHandler = null;
      }

      try {
        await uiMeetingKit.destroy();
      } catch (e) {
        /* noop */
      }

      if (this.reactRoot) {
        this.reactRoot.unmount();
        this.reactRoot = null;
      }
    },
  },
};
</script>

<style scoped>
.meeting-kit-root {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
