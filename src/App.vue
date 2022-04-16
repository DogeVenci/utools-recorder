<template>
  <div class="px-4">
    <a-alert
      v-if="store.errorText?.length"
      type="error"
      :message="store.errorText"
      banner
      closable
    />
    <a-alert v-if="infoText?.length" :message="infoText" type="info" />
    <div class="py-4 flex justify-space-between">
      <div class="flex">
        <a-button-group>
          <a-tooltip placement="bottom" title="开始或停止">
            <a-button
              id="switchBtn"
              @click="onRecBtnClick"
              :disabled="store.disableOperation"
            >
              <template #icon>
                <RecordIcon v-if="store.recorderState == 'inactive'" />
                <StopIcon v-else />
              </template>
            </a-button>
          </a-tooltip>
          <a-tooltip placement="bottom" title="暂停或恢复">
            <a-button
              @click="togglePause"
              :disabled="store.recorderState == 'inactive'"
            >
              <template #icon>
                <PlayIcon v-if="store.recorderState == 'paused'" />
                <PauseIcon v-else />
              </template>
            </a-button>
          </a-tooltip>
        </a-button-group>
        <a-tooltip
          class="ml-3"
          placement="bottom"
          title="快捷键开始不受此影响 0s不延迟"
        >
          延迟
          <a-input-number
            class="width-4"
            id="inputDelay"
            v-model:value="store.delayStart"
            @change="onDelayChange"
            :min="0"
            :max="10"
            :disabled="store.recorderState != 'inactive' || store.disableOperation"
          />
        </a-tooltip>
        <a-button-group>
          <a-tooltip
            placement="bottom"
            title="选择录制窗口(新建或关闭窗口需刷新)"
          >
            <a-select
              class="ml-3 width-20"
              label-in-value
              v-model:value="store.selectedVideoSource"
              @select="handleSelectChange"
              :disabled="store.recorderState != 'inactive' || store.disableOperation"
              :options="store.videoOptions"
              option-label-prop="label"
            >
              <template #option="{ label, icon }">
                <a-image
                  v-if="icon"
                  :width="24"
                  :height="24"
                  :src="icon"
                ></a-image>
                <DesktopOutlined
                  v-else
                  style="width: 24px; height: 24px; font-size: 22px"
                />
                {{ label }}
              </template>
            </a-select>
          </a-tooltip>
          <a-tooltip placement="bottom" title="刷新可选择窗口列表">
            <a-button
              type="primary"
              @click="onRefreshClick"
              :disabled="store.recorderState != 'inactive' || store.disableOperation"
            >
              <template #icon>
                <SyncOutlined />
              </template>
            </a-button>
          </a-tooltip>
        </a-button-group>
        <div class="ml-3 self-end">
          <a-tooltip
            placement="bottom"
            title="选择音频输入 Mac和Linux不支持系统内录 麦克风输入部分支持"
          >
            <a-select
              class="width-8"
              label-in-value
              v-model:value="store.selectedAudioSource"
              @change="onAudioChange"
              :disabled="store.recorderState != 'inactive' || store.disableOperation"
              :options="audioSources"
              option-label-prop="label"
            >
              <template #option="{ value, label }">
                <SoundOutlined v-if="value == 'system'" />
                <AudioOutlined v-else-if="value == 'mic'" />
                <AudioMutedOutlined v-else-if="value == 'muted'" />
                {{ label }}
              </template>
            </a-select>
          </a-tooltip>
        </div>
      </div>
      <a-button-group>
        <a-tooltip placement="bottom" title="选择录像保存目录">
          <a-button
            @click="onSaveClick"
            :disabled="store.recorderState != 'inactive' || store.disableOperation"
          >
            <template #icon>
              <FolderOpenOutlined />
            </template>
          </a-button>
        </a-tooltip>
        <a-tooltip placement="bottom" title="打开录像目录">
          <a-button @click="openVideoDir">
            <template #icon>
              <OpenIcon />
            </template>
          </a-button>
        </a-tooltip>
      </a-button-group>
    </div>
    <div class="mb-4 border"></div>
    <video id="video" ref="videoPreview" class="width-100" muted></video>
  </div>
</template>

<script setup>
import { useStore } from './store.js'
const store = useStore()
import { storeToRefs } from 'pinia'
const { errorText, savedText } = storeToRefs(store)

import { ref, reactive, onMounted, computed, watch, h } from "vue"
import {
  getSources, getStream, getRecorderState, startRecord, stopRecord,
  pauseRecord, resumeRecord, togglePause
} from "./assets/recorder.js"

import { openVideoDir } from "./assets/plugin.js"
import { recordedTime, countDownTimer } from "./assets/timer.js"

import { SyncOutlined, FolderOpenOutlined, DesktopOutlined, PauseOutlined, SoundOutlined, AudioOutlined, AudioMutedOutlined } from '@ant-design/icons-vue';
import PauseIcon from "./components/PauseIcon.vue";
import PlayIcon from "./components/PlayIcon.vue";
import RecordIcon from "./components/RecordIcon.vue";
import StopIcon from "./components/StopIcon.vue";
import OpenIcon from "./components/OpenIcon.vue";
import { notification } from 'ant-design-vue';
import NotificationButton from "./components/NotificationButton.vue"

const audioSources = [{ value: "system", label: "系统" }, { value: "mic", label: "麦克风" }, { value: "muted", label: "静音" }];
const videoPreview = ref(null);
let countDown = ref(0);

watch(errorText, (text, prevText) => {
  stopRecord()
  document.hidden && utools?.showNotification(text, "lp")//隐藏窗口时弹出错误提示
})

watch(savedText, (text, prevText) => {
  openNotification(text, "点击'转换格式'安装并使用FFmpeg助手重封装mp4。")
})

const openNotification = (title, description) => {
  const key = `open${Date.now()}`;
  notification.open({
    message: title,
    description,
    placement: "topRight",
    duration: 10,
    onClick: () => {
      console.log('Notification Clicked!');
    },
    btn: h(NotificationButton, { filePath: store.savedFilePath, onClick: () => { } }, null),
    key
  });
}

const infoText = computed(() => {
  if (store.recorderState == "recording") {
    return "Recording " + recordedTime.value
  } else if (store.recorderState == "paused") {
    return "Paused " + recordedTime.value
  }
  else {
    if (store.disableOperation && countDown.value) {
      return `Start record after ${countDown.value}s`
    } else {
      return ""
    }
  }
})

onMounted(() => {
  videoPreview.value.onloadedmetadata = (e) => videoPreview.value.play();
})

getSources().then(sources => {
  if(!window.utools) return;
  store.videoSources = sources
  store.selectedVideoSource = { key: sources[0].id }
  getStream(sources[0]).then(stream => {
    videoPreview.value.srcObject = stream;
  })
})

const onRecBtnClick = () => {
  if (getRecorderState() == "inactive") {
    countDownTimer(store.delayStart, () => startRecord(videoPreview.value.srcObject), (count) => {
      countDown.value = count
    })
  } else {
    stopRecord()
  }
}

const onDelayChange = (e) => {
  let delay = parseInt(store.delayStart)
  if (delay < 0 || isNaN(delay)) {
    return
  }
  utools?.dbStorage.setItem("delayStart", delay)
}

const onSaveClick = () => {
  const dirs = utools?.showOpenDialog({
    title: '选择保存目录',
    defaultPath: mediaFile.getOutputDir(),
    buttonLabel: '选择此目录',
    properties: [
      "openDirectory",
      "createDirectory",
      "dontAddToRecent",
      "treatPackageAsDirectory"
    ]
  })
  if (dirs?.length && dirs[0]?.length) {
    mediaFile.setOutputDir(dirs[0])
  }
}

const onRefreshClick = () => {
  getSources().then(sources => {
    store.videoSources = sources
    store.selectedVideoSource = { key: sources[0].id }
    handleSelectChange(store.selectedVideoSource)//TODO 改变后不调用change
  })
}

const onAudioChange = () => {
  console.log(store.selectedAudioSource.key)
  utools?.dbStorage.setItem("audioSource", store.selectedAudioSource.key)
  handleSelectChange(store.selectedVideoSource)
}

// const resizeWindow = () => {
//   const height = document.getElementById("app")?.offsetHeight || 300
//   height > 300 && utools?.setExpendHeight(height)
// }

const handleSelectChange = (value) => {
  console.log(value)
  const source = store.videoSources.filter(source => source.id == value.key)[0]
  getStream(source).then(stream => {
    videoPreview.value.srcObject = stream;
    setTimeout(() => {
      // resizeWindow()
      utools?.showMainWindow();
    }, 500)
  }).catch(err => {
    console.log("get stream:", err)
  })
}

// This starter template is using Vue 3 experimental <script setup> SFCs
// Check out https://github.com/vuejs/rfcs/blob/master/active-rfcs/0040-script-setup.md
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.px-4 {
  padding: 0 1rem;
}

.py-4 {
  padding: 1rem 0;
}

.ml-3 {
  margin-left: 0.75rem;
}

.ml-4 {
  margin-left: 1rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.border {
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.my-4 {
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.flex {
  display: flex;
}

.self-end {
  align-self: flex-end;
}

.justify-space-between {
  justify-content: space-between;
}

.width-100 {
  width: 100%;
}

.input-number {
  width: 3rem;
  height: 2rem;
}

.height-2 {
  height: 2rem;
}

.width-3 {
  width: 3rem;
}

.width-4 {
  width: 4rem;
}

.width-8 {
  width: 8rem;
}

.width-20 {
  width: 20rem;
}
</style>
