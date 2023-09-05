<template>
  <img :src="imageSrc" @error="onImageError" alt="Avatar" />
</template>

<script>
import { DEVICE_TYPE_MAP } from '@/utils/enum';
export default {
  props: {
    src: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: 'default', 
    },
  },
  data() {
    return {
      imageSrc: this.src,
      defaultSrc: DEVICE_TYPE_MAP[this.type] || DEVICE_TYPE_MAP.default,
    };
  },
  created() {
    this.imageSrc = this.src;
  },
  methods: {
    onImageError() {
      this.imageSrc = this.defaultSrc;
    },
  },
};
</script>
