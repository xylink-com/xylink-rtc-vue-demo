<template>
  <div class="video-avatar" :style="avatarStyle" v-if="textAvatar">
    {{ textAvatar }}
  </div>
  <Avatar v-else src="avatar" class="video-avatar" :style="avatarStyle" />
</template>

<script>
import Avatar from '@/components/Avatar';

export default {
  props: ['textAvatar', 'avatar', 'containerWidth'],
  components: { Avatar },
  computed: {
    avatarStyle() {
      let size = 44;
      let fontSize = 16;
      if (this.containerWidth > 300) {
        size = 72;
        fontSize = 18;
      }

      return {
        width: size + 'px',
        height: size + 'px',
        fontSize: fontSize + 'px',
      };
    },
  },
  data() {
    return {};
  },
  created() {},
  methods: {},
};
</script>
<style scoped>
.video-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom right, #3876ff, #447eff);
  color: #fff;
}
</style>
