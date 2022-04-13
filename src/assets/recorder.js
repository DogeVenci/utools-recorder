import { ref } from "vue";
import * as timer from "./timer.js";
const timeslice = 5000;
let mediaRecorder = null;
let chunks = [];
let interval = null;
let curStream = null;
let curPluginCode = "";

export let disableOperation = ref(false);
export let delayStart = ref(3);
export let errorText = ref("");
export let savedText = ref("");
export let savedFilePath = ref("");
export let audioSource = ref({ key: "system" });
export let recorderState = ref("inactive");

if (window.utools && utools.isWindows()) {
  audioSource.value = { key: "system" };
} else {
  audioSource.value = { key: "muted" };
}

export const getSources = async () => {
  let sources = await utools.desktopCaptureSources({
    types: ["screen", "window"],
    thumbnailSize: { width: 0, height: 0 }, //设置为0节省用于获取每个窗口和屏幕内容时的处理时间
    fetchWindowIcons: true, //尽可能获取图标
  });
  //TODO 异常处理
  sources = sources.filter(({ name }) => name != "uTools");
  sources.forEach((source) => {
    source.appIconURL = source.appIcon?.toDataURL();
  });
  console.log(sources);
  //
  return sources;
};

const getUserMediaBySystem = async (source, muted) => {
  let audio = {
    //TODO 无法获得音频设备得情况
    mandatory: {
      chromeMediaSource: "desktop",
    },
  };
  // if (utools.isMacOs() || utools.isLinux() || muted) {
  if (muted) {
    console.log("disable audio");
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
      const videoTracks = curStream.getVideoTracks();
      if (videoTracks?.length > 0) {
        videoTracks[0].onended = () => {
          errorText.value = Date.now() + " video source is ended";
        };
      }
      resolve(curStream);
    } catch (err) {
      errorText.value = "" + err;
      reject(err);
    }
  });
};

const getUserMediaByMicphone = async (source) => {
  console.log("getUserMediaByMicphone");
  return new Promise(async (resolve, reject) => {
    try {
      //navigator.mediaDevices.enumerateDevices()
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      //不能同时打开mic和录屏源
      const videoStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: source.id,
          },
        },
      });
      curStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);
      resolve(curStream);
    } catch (err) {
      errorText.value = "" + err;
      reject(err);
    }
  });
};

export const getStream = (source) => {
  if (audioSource.value.key == "mic") {
    return getUserMediaByMicphone(source);
  } else if (audioSource.value.key == "muted") {
    return getUserMediaBySystem(source, true);
  } else {
    return getUserMediaBySystem(source, false);
  }
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
  const videoTracks = stream.getVideoTracks();
  if (videoTracks?.length > 0 && videoTracks[0].readyState == "ended") {
    errorText.value = "startRecord failed: video source is ended";
    return;
  }
  mediaRecorder = new MediaRecorder(stream, {
    mimeType: "video/webm; codecs=h264", //TODO 视频格式转换
    // videoBitsPerSecond: 2.0e6, //比特率
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
    recorderState.value = "recording";
    timer.startCountTimer();
  };
  mediaRecorder.onstop = async () => {
    recorderState.value = "inactive";
    timer.stopCountTimer();
    if (chunks.length > 0) {
      //写入未完成的数据
      const blob = new Blob(chunks, { type: "video/webm; codecs=h264" });
      const buffer = mediaFile.Buffer.from(await blob.arrayBuffer());
      mediaFile.WriteMediaFile(buffer);
    }
    // curPluginCode == "tzlp" &&
    //   utools.shellShowItemInFolder(mediaFile.getMediaFilePath());
    savedText.value = `${mediaFile.getMediaFileName()} Saved`;
    savedFilePath.value = mediaFile.getMediaFilePath();
    mediaRecorder = null;
    chunks = [];
    utools.shellBeep();
    mediaFile.CloseMediaFile();
  };
  mediaRecorder.onerror = (err) => {
    recorderState.value = "inactive";
    console.log(err);
    errorText.value = err + "";
    clearCountDownTimer();
  };
  mediaRecorder.onpause = () => {
    recorderState.value = "paused";
    timer.pauseCountTimer();
  };
  mediaRecorder.onresume = () => {
    recorderState.value = "recording";
    timer.resumeCountTimer();
  };

  try {
    mediaRecorder.start(timeslice);
  } catch (err) {
    errorText.value = "" + err;
  }
};

export const stopRecord = () => {
  clearCountDownTimer();
  if (!mediaRecorder) return;
  if (mediaRecorder.state == "inactive") return;
  mediaRecorder.stop();
};

export const pauseRecord = () => {
  if (!mediaRecorder) return;
  if (mediaRecorder.state != "recording") return;
  mediaRecorder.pause();
};

export const resumeRecord = () => {
  if (!mediaRecorder) return;
  if (mediaRecorder.state != "paused") return;
  mediaRecorder.resume();
};

export const togglePause = () => {
  const recState = getRecorderState();
  if (recState == "paused") {
    resumeRecord();
  } else if (recState == "recording") {
    pauseRecord();
  }
};

export const getRecorderState = () => {
  if (mediaRecorder) return mediaRecorder.state;
  return "inactive";
};

export const openVideoDir = () => {
  utools.shellOpenPath(mediaFile.getOutputDir());
};

// utools 事件
if (typeof utools != "undefined") {
  utools.onPluginReady(() => {
    delayStart.value = utools.dbStorage.getItem("delayStart") || 3;

    const audioConfig = utools.dbStorage.getItem("audioSource");
    if (audioConfig) {
      audioSource.value = { key: audioConfig };
    }

    utools.setSubInput((text) => {},
    '可在utools 全局快捷键设置中绑定关键字 "开始录屏" "停止录屏" "暂停恢复录屏"');
  });

  utools.onPluginEnter(({ code, type, payload }) => {
    console.log("onPluginEnter:", code, type, payload);
    curPluginCode = code;
    if (code === "kslp") {
      // utools.setExpendHeight(1);
      if (curStream) {
        startRecord(curStream); //TODO 窗口关闭后需要刷新
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
      // utools.setExpendHeight(0);
      stopRecord();
      // utools.outPlugin();
    } else if (code === "ztlp") {
      togglePause();
    }
    // else {
    //   utools.setExpendHeight(600);
    // }
  });

  utools.onPluginOut(() => {
    console.log("onPluginOut");
  });
}
