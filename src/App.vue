<template>
  <div class="px-4">
    <a-alert
      v-if="errorText.length"
      type="error"
      :message="errorText"
      banner
      closable
    />
    <div class="py-4 flex justify-space-between">
      <div class="flex">
        <a-button
          type="primary"
          id="switchBtn"
          @click="onRecBtnClick"
          :disabled="disableOperation"
          >{{ btnText }}</a-button
        >
        <a-tooltip
          class="ml-4"
          placement="bottom"
          title="快捷键开始关键字不受影响 0不延迟"
        >
          延迟
          <a-input-number
            class="width-4"
            id="inputDelay"
            v-model:value="delayStart"
            @change="onDelayChange"
            :min="0"
            :max="60"
            :disabled="isRecording || disableOperation"
          />
          秒
        </a-tooltip>
        <a-button-group>
          <a-tooltip
            placement="bottom"
            title="选择录制窗口(默认主屏幕)刷新后选择"
          >
            <a-select
              class="ml-4 width-20"
              label-in-value
              v-model:value="selectValue"
              @select="handleSelectChange"
              :disabled="isRecording || disableOperation"
            >
              <a-select-option
                v-for="source in state.displaySources"
                :key="source.id"
                :value="source.id"
                >{{ source.name }}</a-select-option
              >
            </a-select>
          </a-tooltip>
          <a-tooltip placement="bottom" title="刷新可选择窗口列表">
            <a-button
              type="primary"
              @click="onRefreshClick"
              :disabled="isRecording || disableOperation"
            >
              <template #icon>
                <SyncOutlined />
              </template>
            </a-button>
          </a-tooltip>
        </a-button-group>
      </div>
      <a-button-group>
        <a-tooltip placement="bottom" title="选择录像保存目录">
          <a-button @click="onSaveClick">保存位置</a-button>
        </a-tooltip>
        <a-tooltip placement="bottom" title="打开录像目录">
          <a-button type="primary" @click="openVideoDir">
            <template #icon>
              <FolderOpenOutlined />
            </template>
          </a-button>
        </a-tooltip>
      </a-button-group>
    </div>
    <div class="mb-4 border"></div>
    <video id="video" class="width-100" muted></video>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue"
import { getSources, getStream, openVideoDir, getRecorderState, startRecord, stopRecord, isRecording, disableOperation, delayStart, putConfig, countDownTimer, errorText } from "./assets/recorder.js"
import { SyncOutlined, FolderOpenOutlined } from '@ant-design/icons-vue';

let selectValue = ref({ key: "screen:0:0" })
let state = reactive({})
let video = null;
let countDown = ref(0);

const btnText = computed(() => {
  if (isRecording.value) {
    return "停止录制"
  } else {
    if (disableOperation.value && countDown.value) {
      return `Starting(${countDown.value})`
    } else {
      return "开始录制"
    }
  }
})

onMounted(() => {
  video = document.getElementById("video");//TODO
  video.onloadedmetadata = (e) => video.play();
})

getSources().then(sources => {
  state.displaySources = sources
  selectValue.value = { key: sources[0].id }
  getStream(sources[0]).then(stream => {
    video.srcObject = stream;
  })
})

const onRecBtnClick = () => {
  if (getRecorderState() == "inactive") {
    countDownTimer(delayStart.value, () => startRecord(video.srcObject), (count) => {
      countDown.value = count
    })
  } else {
    stopRecord()
  }
}

const onDelayChange = (e) => {
  let delay = parseInt(delayStart.value)
  if (delay < 0 || isNaN(delay)) {
    return
  }
  putConfig(delay)
}

const onSaveClick = () => {
  const dirs = utools?.showOpenDialog({
    title: '保存位置',
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
    state.displaySources = sources
    selectValue.value = { key: sources[0].id }
    handleSelectChange(selectValue.value)//TODO 改变后不调用change
  })
}

const handleSelectChange = (value) => {
  console.log(value)
  const source = state.displaySources.filter(source => source.id == value.key)[0]
  getStream(source).then(stream => {
    video.srcObject = stream;
    setTimeout(() => {
      utools.showMainWindow();
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

.button {
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  cursor: pointer;
}

.bg-green {
  background-color: #4caf50; /* Green */
}

.bg-red {
  background-color: #f44336;
}

.px-4 {
  padding: 0 1rem;
}

.py-4 {
  padding: 1rem 0;
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

.width-20 {
  width: 20rem;
}
</style>
