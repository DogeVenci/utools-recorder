import { ref } from "vue";
const timeslice = 5000;
let mediaRecorder = null;
let chunks = [];
let interval = null;
let config = { _id: "lpconfig" };
let curStream = null;

export let isRecording = ref(false);
export let disableOperation = ref(false);
export let delayStart = ref(3);
export let errorText = ref("");

export const getSources = async () => {
  const sources = await desktopCapturer.getSources({
    types: ["screen", "window"],
  });
  return sources;
};

export const getStream = (source) => {
  let audio = {
    mandatory: {
      chromeMediaSource: "desktop",
    },
  };
  if (utools.isMacOs() || utools.isLinux()) {
    audio = false;
  }
  return new Promise(async (resolve, reject) => {
    try {
      curStream = await navigator.mediaDevices.getUserMedia({
        audio,
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: source.id,
          },
        },
      });
      resolve(curStream);
    } catch (err) {
      errorText.value = "请刷新 " + err;
      reject(err);
    }
  });
};

export const countDownTimer = (seconds, finalFunc, countFunc) => {
  if (seconds <= 0) {
    typeof finalFunc == "function" && finalFunc();
    return;
  }
  disableOperation.value = true;
  let count = seconds;
  if (interval) clearInterval(interval);
  interval = setInterval(() => {
    count--;
    typeof countFunc == "function" && countFunc(count);
    if (count <= 0) {
      typeof finalFunc == "function" && finalFunc();
      disableOperation.value = false;
      clearInterval(interval);
    }
  }, 1000);
};

export const clearCountDownTimer = () => {
  if (interval) clearInterval(interval);
  disableOperation.value = false;
};

export const startRecord = (stream) => {
  if (mediaRecorder) return;
  if (!stream) return;
  console.log("startRecord");
  // utools.shellBeep();
  mediaRecorder = new MediaRecorder(stream, {
    mimeType: "video/webm; codecs=h264", //TODO 视频格式转换
  });
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
      const blob = new Blob(chunks, { type: "video/webm; codecs=h264" });
      blob
        .arrayBuffer()
        .then((buffer) => {
          mediaFile.WriteMediaFile(mediaFile.Buffer.from(buffer));
          chunks = [];
        })
        .catch((err) => {
          console.log(err);
          errorText.value = err + "";
        });
    }
  };
  mediaRecorder.onstart = async () => {
    mediaFile.NewMediaFile();
    isRecording.value = true;
  };
  mediaRecorder.onstop = async () => {
    if (chunks.length > 0) {
      //写入未完成的数据
      const blob = new Blob(chunks, { type: "video/webm; codecs=h264" });
      const buffer = mediaFile.Buffer.from(await blob.arrayBuffer());
      mediaFile.WriteMediaFile(buffer);
    }
    utools.shellShowItemInFolder(mediaFile.getMediaFilePath());
    mediaRecorder = null;
    chunks = [];
    utools.shellBeep();
    mediaFile.CloseMediaFile();
    isRecording.value = false;
  };
  mediaRecorder.onerror = (err) => {
    console.log(err);
    errorText.value = err + "";
    clearCountDownTimer();
    isRecording.value = false;
  };

  mediaRecorder.start(timeslice);
};

export const stopRecord = () => {
  clearCountDownTimer();
  if (!mediaRecorder) return;
  mediaRecorder.stop();
};

export const getRecorderState = () => {
  if (mediaRecorder) return mediaRecorder.state;
  return "inactive";
};

export const openVideoDir = () => {
  utools.shellOpenPath(utools.getPath("videos"));
};

export const putConfig = (val) => {
  config.delayStart = val; //TODO key赋值
  config = utools.db.put(config);
  config._id = "lpconfig";
  if (!config._rev) config._rev = config.rev; //TODO put返回不一样
};

// utools 事件
utools.onPluginReady(() => {
  config = utools.db.get("lpconfig");
  console.log(config);
  if (!config) {
    config = utools.db.put({ _id: "lpconfig", delayStart: delayStart.value });
    config._id = "lpconfig";
    if (!config._rev) config._rev = config.rev; //TODO put返回不一样
  } else {
    delayStart.value = config.delayStart;
  }
  console.log("onPluginReady:", delayStart.value);
  utools.setSubInput((text) => {},
  '可在utools 全局快捷键设置中绑定关键字 "开始录屏" "停止录屏"');
});

utools.onPluginEnter(({ code, type, payload }) => {
  console.log(code, type, payload);
  if (code === "kslp") {
    utools.setExpendHeight(1);
    if (curStream) {
      startRecord(curStream);
      utools.hideMainWindow();
    } else {
      getSources().then((sources) => {
        getStream(sources[0]).then((stream) => {
          startRecord(stream);
          utools.hideMainWindow();
        });
      });
    }
  } else if (code === "tzlp") {
    utools.setExpendHeight(0);
    stopRecord();
    utools.outPlugin();
  } else {
    utools.setExpendHeight(500);
  }
});

utools.onPluginOut(() => {
  console.log("onPluginOut");
});
