<template>
  <a-modal
    v-model:visible="store.settingVisable"
    title="设置"
    width="100%"
    wrap-class-name="full-modal"
    @ok="onSettingOkClick"
  >
    <a-form>
      <a-form-item label="录像保存路径">
        <a-input-group compact>
          <a-input
            disabled
            v-model:value="store.outputDir"
            style="width: calc(100% - 36px)"
          />
          <a-button type="primary" @click="onOutputDirClick">
            <template #icon>
              <FolderOpenOutlined />
            </template>
          </a-button>
        </a-input-group>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { FolderOpenOutlined } from "@ant-design/icons-vue";
import { onMounted } from "vue";

import { useStore } from "../store.js";
const store = useStore();

onMounted(() => {
  if (!window.utools) return;
  store.outputDir = mediaFile.getOutputDir();
  store.recentFilelist = mediaFile.getRecentFilelist();
});

const onSettingOkClick = () => {
  store.settingVisable = false;
};

const onOutputDirClick = () => {
  if (!window.utools) return;
  const dirs = utools?.showOpenDialog({
    title: "选择保存目录",
    defaultPath: mediaFile.getOutputDir(),
    buttonLabel: "选择此目录",
    properties: [
      "openDirectory",
      "createDirectory",
      "dontAddToRecent",
      "treatPackageAsDirectory",
    ],
  });
  if (dirs?.length && dirs[0]?.length) {
    mediaFile.setOutputDir(dirs[0]);
    store.outputDir = dirs[0];
  }
};
</script>
