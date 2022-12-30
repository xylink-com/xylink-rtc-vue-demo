<template>
  <el-drawer
    title=""
    :withHeader="false"
    :visible.sync="visible"
    :before-close="closeParticipant"
    :size="size"
    :direction="direction"
    custom-class="xy__drawer-member"
  >
    <div class="member">
      <div class="member-header">
        <span class="member-hide-btn" @click="closeParticipant"></span>
        参会者
        <span v-if="!isPc">（{{ count }}）</span>
      </div>

      <div class="member-navbar">
        <span :class="navbarClass('all')" @click="onChangeTab('all')"> 已入会({{ count }}) </span>
        <span v-if="unmuteCount" :class="navbarClass('unmute')" @click="onChangeTab('unmute')">
          未静音({{ unmuteCount }})
        </span>
      </div>

      <div class="member-content">
        <div class="member-item" v-for="item in computedRosters" :key="item.participantId + item.mediagroupid">
          <div class="info">
            <div class="avatar">
              <img :src="item.avatar" alt="avatar" />
              <img v-if="item.memberStatusImg" class="avatar__status" :src="item.memberStatusImg" alt="" />
            </div>
            <div class="name" :title="item.displayName">
              <span class="name__info">
                {{ item.displayName }}
                <span v-if="item.isContentOnly">(仅桌面共享)</span>
              </span>
              <span
                v-if="(content && content.endpointId) === item.endpointId && !item.isContentOnly"
                class="name__status"
                >正在共享...</span
              >
            </div>
          </div>
          <div class="member__staus" v-if="!item.isContent">
            <div class="member__staus-audio">
              <img :src="item.audioImg" alt="unmute" />
            </div>
            <div class="member__staus-video">
              <img :src="item.videoImg" alt="mute" />
            </div>
          </div>
        </div>
      </div>

      <div class="member-pagination" v-if="pageInfo.totalPage > 1">
        <el-pagination
          background
          :small="true"
          layout="prev, pager, next"
          :total="pageInfo.totalCount"
          :current-page="pageInfo.currentPage"
          :page-size="defaultPageSize"
          :pager-count="5"
          @current-change="onChangePage"
        >
        </el-pagination>
      </div>
    </div>
  </el-drawer>
</template>
<script>
import { DEVICE_TYPE_MAP, PARTICIPANT_PAGE_SIZE } from '@/utils/enum';
import { isPc } from '@/utils/browser';
import unmuteActive from '@/assets/img/operate/icon_mic.svg';
import muteActive from '@/assets/img/operate/icon_mute_mic.svg';
import muteCamera from '@/assets/img/operate/icon_mute_camera.svg';
import unmuteCamera from '@/assets/img/operate/icon_camera.svg';
import speaker from '@/assets/img/operate/icon_speaker.gif';
import local from '@/assets/img/operate/icon_me.svg';
import './index.scss';

export default {
  props: ['rosters', 'content', 'count', 'client'],
  computed: {
    navbarClass() {
      return function(tab) {
        return `member-navbar-item ${this.tab === tab ? 'member-navbar-item-active' : ''}`;
      };
    },
    computedRosters() {
      return this.newRosters.map((item) => {
        const {
          participantId,
          endpointId,
          mediagroupid,
          videoTxMute,
          videoRxMute,
          audioTxMute,
          audioRxMute,
          deviceType,
          isContent,
          isActiveSpeaker,
        } = item;

        const key = participantId + mediagroupid;
        const avatar = DEVICE_TYPE_MAP[deviceType] || DEVICE_TYPE_MAP.default;
        const audioImg = audioTxMute ? muteActive : unmuteActive;
        const videoImg = videoTxMute ? muteCamera : unmuteCamera;
        const isContentOnly = videoTxMute && videoRxMute && audioRxMute && audioTxMute;

        let memberStatusImg = '';

        if (isContent) {
          return null;
        }

        if (endpointId === this.selfRoster?.endpointId) {
          memberStatusImg = local;
        } else {
          if (isActiveSpeaker && !audioTxMute) {
            memberStatusImg = speaker;
          }
        }

        return Object.assign(item, {
          key,
          avatar,
          audioImg,
          videoImg,
          isContentOnly,
          memberStatusImg,
        });
      });
    },
  },
  data() {
    return {
      visible: false,
      selfRoster: null,
      tab: 'all',
      size: 300,
      unmuteCount: 0,
      defaultPageSize: PARTICIPANT_PAGE_SIZE,
      pageInfo: {
        pageSize: PARTICIPANT_PAGE_SIZE,
        currentPage: 1,
        totalPage: 0,
        totalCount: 0,
      },
      originalRosters: this.rosters,
      newRosters: [],
      direction: isPc ? 'rtl' : 'btt',
      isPc,
    };
  },
  beforeMount() {
    this.selfRoster = this.client?.getSelfRoster();
  },
  mounted() {
    this.visible = true;
  },
  methods: {
    fetchRosters() {
      let newData = this.originalRosters.concat();

      if (this.tab === 'unmute') {
        newData = newData.filter((roster) => !roster.audioTxMute);
      }

      this.fetch(newData);
    },
    fetch(newData) {
      let totalCount = 0;

      let { currentPage, pageSize } = this.pageInfo;

      if (newData instanceof Array) {
        totalCount = newData.length;
        const startIndex = Math.max((currentPage - 1) * pageSize, 0);
        const endIndex = startIndex + pageSize > totalCount ? totalCount : startIndex + pageSize;
        newData = newData.slice(startIndex, endIndex);

        // 当前页没有数据时，返回第一页
        if (currentPage > 1 && newData.length === 0) {
          currentPage -= 1;
          this.pageInfo.currentPage = currentPage;

          this.fetch(newData);
        }
      }

      let totalPage = Math.ceil(totalCount / pageSize);

      this.pageInfo = {
        ...this.pageInfo,
        totalPage,
        currentPage,
        totalCount,
      };

      this.newRosters = newData;
    },
    setUnmuteCount() {
      const length = this.originalRosters.filter((item) => !item.audioTxMute).length;

      if (length === 0) {
        this.tab = 'all';
      }

      this.unmuteCount = length;
    },
    onChangePage(page) {
      this.pageInfo.currentPage = page;
      this.fetchRosters();
    },
    onChangeTab(tab) {
      this.tab = tab;
      this.pageInfo.currentPage = 1;
      this.fetchRosters();
    },
    closeParticipant() {
      this.$emit('showParticipant', false);
    },
  },
  watch: {
    rosters: {
      handler(newValue) {
        this.originalRosters = newValue;
        this.setUnmuteCount();
        this.fetchRosters();
      },
      deep: true,
      immediate: true,
    },
  },
};
</script>
<style scoped></style>
