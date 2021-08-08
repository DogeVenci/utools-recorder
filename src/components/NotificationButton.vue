<template>
  <a-button type="primary" @click="open"> 打开目录 </a-button>
  <a-button class="ml-4" type="primary" @click="redirect"> 转换格式 </a-button>
</template>

<script>
export default {
  props: {
    filePath: { type: String, required: true },
    onClick: { type: Function }
  },
  methods: {
    open() {
      window?.utools?.shellShowItemInFolder(this.filePath);
      this.onClick()
    },
    redirect() {
      window?.utools?.redirect("ffmpeg", {
        type: "files",
        data: this.filePath,
      });
      this.onClick()
    }
  }
}
</script>