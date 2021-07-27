<template>
  <div class="px-4">
    <div class="py-4 flex justify-space-between">
      <div class="flex">
        <a-button
          type="primary"
          id="switchBtn"
          @click="onRecBtnClick"
          :disabled="disableOperation"
          >{{ btnText }}</a-button
        >
        <div class="ml-4">
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
          秒开始
        </div>
        <a-select
          class="ml-4 width-20"
          label-in-value
          v-model:value="selectValue"
          @change="handleSelectChange"
          :disabled="isRecording || disableOperation"
        >
          <a-select-option
            v-for="source in state.displaySources"
            :key="source.id"
            :value="source.id"
            >{{ source.name }}</a-select-option
          >
        </a-select>
      </div>

      <a id="linkBtn" href="#" @click="openVideoDir">打开视频目录</a>
    </div>
    <a-divider></a-divider>
    <video id="video" class="width-100" muted></video>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue"
import { getSources, getStream, openVideoDir, getRecorderState, startRecord, stopRecord, isRecording, disableOperation, delayStart, putConfig, countDownTimer } from "./assets/recorder.js"

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
  video = document.getElementById("video");
  video.onloadedmetadata = (e) => video.play();
})

getSources().then(sources => {
  state.displaySources = sources
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
