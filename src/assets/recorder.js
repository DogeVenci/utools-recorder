import { useStore } from "../store.js";
import * as timer from "./timer.js";

const timeslice = 5000;
let mediaRecorder = null;
let chunks = [];
let interval = null;
export let curStream = null;

export const getSources = async () => {
  if (!window.utools) return;
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
  const store = useStore();
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
          store.errorText = Date.now() + " video source is ended";
        };
      }
      resolve(curStream);
    } catch (err) {
      store.errorText = "" + err;
      reject(err);
    }
  });
};

const getUserMediaByMicphone = async (source) => {
  const store = useStore();
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
      store.errorText = "" + err;
      reject(err);
    }
  });
};

export const getStream = (source) => {
  const store = useStore();
  if (store.selectedAudioSource.key == "mic") {
    return getUserMediaByMicphone(source);
  } else if ((store.selectedAudioSource.key == "muted")) {
    return getUserMediaBySystem(source, true);
  } else {
    return getUserMediaBySystem(source, false);
  }
};

export const countDownTimer = (seconds, finalFunc, countFunc) => {
  const store = useStore();
  if (seconds <= 0) {
    typeof finalFunc == "function" && finalFunc();
    return;
  }
  store.disableOperation = true;
  let count = seconds;
  if (interval) clearInterval(interval);
  interval = setInterval(() => {
    count--;
    typeof countFunc == "function" && countFunc(count);
    if (count <= 0) {
      typeof finalFunc == "function" && finalFunc();
      store.disableOperation = false;
      clearInterval(interval);
    }
  }, 1000);
};

export const clearCountDownTimer = () => {
  const store = useStore();
  if (interval) clearInterval(interval);
  store.disableOperation = false;
};

export const startRecord = (stream) => {
  if (mediaRecorder) return;
  if (!stream) return;
  console.log("startRecord");
  const store = useStore();
  const videoTracks = stream.getVideoTracks();
  if (videoTracks?.length > 0 && videoTracks[0].readyState == "ended") {
    store.errorText = "startRecord failed: video source is ended";
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
          store.errorText = err + "";
        });
    }
  };
  mediaRecorder.onstart = async () => {
    const store = useStore();
    mediaFile.NewMediaFile();
    store.recorderState = "recording";
    timer.startCountTimer();
  };
  mediaRecorder.onstop = async () => {
    const store = useStore();
    store.recorderState = "inactive";
    timer.stopCountTimer();
    if (chunks.length > 0) {
      //写入未完成的数据
      const blob = new Blob(chunks, { type: "video/webm; codecs=h264" });
      const buffer = mediaFile.Buffer.from(await blob.arrayBuffer());
      mediaFile.WriteMediaFile(buffer);
    }
    store.savedText = `${mediaFile.getMediaFileName()} Saved`;
    store.savedFilePath = mediaFile.getMediaFilePath();
    mediaRecorder = null;
    chunks = [];
    utools.shellBeep();
    mediaFile.CloseMediaFile();
  };
  mediaRecorder.onerror = (err) => {
    const store = useStore();
    store.recorderState = "inactive";
    console.log(err);
    store.errorText = err + "";
    clearCountDownTimer();
  };
  mediaRecorder.onpause = () => {
    const store = useStore();
    store.recorderState = "paused";
    timer.pauseCountTimer();
  };
  mediaRecorder.onresume = () => {
    const store = useStore();
    store.recorderState = "recording";
    timer.resumeCountTimer();
  };

  try {
    mediaRecorder.start(timeslice);
  } catch (err) {
    store.errorText = "" + err;
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
