import { useStore } from "../store.js";
import * as timer from "./timer.js";

const timeslice = 5000;
let mediaRecorder = null;
let chunks = [];
export let curStream = null;

const compareVersion = (v1, v2) => {
  v1 = v1.split(".").map(Number);
  v2 = v2.split(".").map(Number);
  const minLen = v1.length > v2.length ? v2.length : v1.length;
  for (let i = 0; i < minLen; i++) {
    if (v1[i] === v2[i]) continue;
    return v1[i] - v2[i];
  }
  return v1.length - v2.length;
}


export const getSources = async () => {
  if (!window.utools) return;
  let sources = [];
  if (compareVersion(utools.getAppVersion(), "2.6.1") >= 0) {
    sources = await utools.desktopCaptureSources({
      types: ["screen", "window"],
      thumbnailSize: { width: 0, height: 0 }, //设置为0节省用于获取每个窗口和屏幕内容时的处理时间
      fetchWindowIcons: true, //尽可能获取图标
    });
  } else {
    sources = await desktopCapturer.getSources({
      types: ["screen", "window"],
      thumbnailSize: { width: 0, height: 0 }, //设置为0节省用于获取每个窗口和屏幕内容时的处理时间
      fetchWindowIcons: true, //尽可能获取图标
    });
  }

  //TODO 异常处理
  sources = sources.filter(({ name }) => name != "uTools");
  sources.forEach((source) => {
    source.appIconURL = source.appIcon?.toDataURL();
  });
  console.log(sources);
  //
  return sources;
};

const getUserMediaMerge = async (source) => {
  const store = useStore();
  let tracks = []
  let audio = false
  return new Promise(async (resolve, reject) => {
    try {
      if (store.hasSysAudio) {
        console.log("store.hasSysAudio")
        audio = {
          //TODO 无法获得音频设备得情况
          mandatory: {
            chromeMediaSource: "desktop",
          },
        };
      }

      const screenVideoStream = await navigator.mediaDevices.getUserMedia({
        audio: audio,
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: source.id,
          },
        },
      });

      tracks = [...screenVideoStream.getVideoTracks(), ...screenVideoStream.getAudioTracks()]

      if (store.hasMicAudio) {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        tracks = [...tracks, ...micStream.getAudioTracks()]
      }


      curStream = new MediaStream(tracks);
      resolve(curStream);
    } catch (err) {
      store.errorText = "" + err;
      reject(err);
    }
  })
}

export const getStream = (source) => {
  return getUserMediaMerge(source);
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
    mediaFile.addToRecentFilelist({ filepath: store.savedFilePath })
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
    timer.clearCountDownTimer();
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
  timer.clearCountDownTimer();
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
