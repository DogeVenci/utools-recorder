<template>
  <a-modal
    v-model:visible="store.settingVisable"
    title="设置"
    width="100%"
    wrap-class-name="full-modal"
    :maskStyle="{ 'background-color': 'white' }"
    @ok="onSettingOkClick"
    :footer="null"
  >
    <a-form>
      <a-form-item v-if="data.alertShow">
        <a-alert
          v-if="data.alertShow"
          message="注意"
          description="长视频由于体积大不适合转换成GIF"
          type="warning"
          closable
        />
      </a-form-item>
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

      <a-form-item label="默认保存格式">
        <a-select
          :options="data.fileTypeOption"
          v-model:value="store.outFileFormat"
          @change="onOutFileFormatChange"
        >
        </a-select>
      </a-form-item>

      <!-- <a-form-item label="最近录像">
        <a-table :columns="data.columns" :data-source="store.recentFilelist">
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'filepath'">
              <a @click.prevent.stop="onOpenFileClick(record.filepath)">
                {{ record.filepath }}
              </a>
            </template>
            <template v-else-if="column.key === 'action'">
              <span>
                <a @click.prevent.stop="onOpenDirClick(record.filepath)"
                  >打开位置</a
                >
                <a-divider type="vertical" />
                <a-dropdown v-model:visible="data.dropdownVisable[index]">
                  <a class="ant-dropdown-link" @click.prevent
                    >转换格式<down-outlined
                  /></a>
                  <template #overlay>
                    <a-menu>
                      <a-menu-item>
                        <a
                          @click.prevent.stop="
                            onConvertClick(record.filepath, '.mp4')
                          "
                          >.MP4</a
                        >
                      </a-menu-item>
                      <a-menu-item>
                        <a
                          @click.prevent.stop="
                            onConvertClick(record.filepath, '.gif')
                          "
                          >.GIF</a
                        >
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </span>
            </template>
          </template>
        </a-table>
      </a-form-item> -->
      <div class="flex justify-end">
        <a-button type="primary" @click="onSettingOkClick">应用</a-button>
      </div>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { FolderOpenOutlined, DownOutlined } from "@ant-design/icons-vue";
import { onMounted, reactive } from "vue";

import { useStore } from "../store.js";
const store = useStore();

const data = reactive({
  columns: [
    { name: "文件", dataIndex: "filepath", key: "filepath" },
    { name: "操作", dataIndex: "action", key: "action" },
  ],

  dropdownVisable: [...Array(10)].map(() => false),
  fileTypeOption: [
    {
      value: "webm",
      label: "WEBM",
    },
    {
      value: "mp4",
      label: "MP4",
    },
    {
      value: "gif",
      label: "GIF",
    },
  ],
  fileType: "webm",
  alertShow: false,
});

onMounted(() => {
  if (!window.utools) return;
  store.outputDir = mediaFile.getOutputDir();
});

const onOutFileFormatChange = () => {
  if (store.outFileFormat == "gif") {
    data.alertShow = true;
    setTimeout(() => {
      data.alertShow = false;
    }, 5000);
  }
  window.setOutFileFormat(store.outFileFormat);
};

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

const onOpenFileClick = (filePath: string) => {
  window?.utools?.shellOpenPath(filePath);
};

const onOpenDirClick = (filePath: string) => {
  window?.utools?.shellShowItemInFolder(filePath);
};

const onConvertClick = async (filePath: string, fileType: string) => {
  data.dropdownVisable = false;
  store.loading = true;
  if (fileType == ".mp4") {
    window
      ?.runFFmpeg(filePath)
      .then((filepath) => {
        // window?.utools?.shellShowItemInFolder(filepath);
      })
      .catch((err) => {
        store.errorText = "转换格式失败,请选择视频保存目录为非系统目录";
      })
      .finally(() => {
        console.log("finally");
        store.loading = false;
      });
  } else if (fileType == ".gif") {
    convert2Gif(filePath)
      .then((filepath) => {})
      .catch((err) => {
        store.errorText = "转换格式失败,请选择视频保存目录为非系统目录";
      })
      .finally(() => {
        console.log("finally");
        store.loading = false;
      });
  }
};
</script>

<style>
.justify-end {
  justify-content: flex-end;
}
</style>
