<template>
  <a-button @click="open"> 打开目录 </a-button>
  <a-button class="ml-4" type="primary" @click="redirect"> 转换格式 </a-button>
</template>

<script>
import { useStore } from "../store.js";
export default {
  props: {
    filePath: { type: String, required: true },
    onClick: { type: Function },
  },
  methods: {
    open() {
      window?.utools?.shellShowItemInFolder(this.filePath);
      this.onClick();
    },
    async toMP4() {
      const runFFmpeg = window.runFFmpeg;
      const store = useStore();
      store.loading = true;
      setTimeout(() => {
        convert2Gif(store.savedFilePath);
        runFFmpeg(store.savedFilePath)
          .then((filepath) => {
            window?.utools?.shellShowItemInFolder(filepath);
          })
          .catch((err) => {
            store.errorText = "转换格式失败,请选择视频保存目录为非系统目录";
          })
          .finally(() => {
            store.loading = false;
          });
      }, 500);
    },
    redirect() {
      this.onClick();
      this.toMP4();
    },
  },
};
</script>
