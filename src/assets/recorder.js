import { ref } from "vue";
const timeslice = 5000;
let mediaRecorder = null;
let chunks = [];
let interval = null;

export let isRecording = ref(false);
export let disableOperation = ref(false);

export const getSources = async () => {
  const sources = await desktopCapturer.getSources({
    types: ["screen", "window"],
  });
  return sources;
};

export const getStream = async (source) => {
  let audio = {
    mandatory: {
      chromeMediaSource: "desktop",
    },
  };
  if (utools.isMacOs() || utools.isLinux()) {
    audio = false;
  }
  return navigator.mediaDevices.getUserMedia({
    audio,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id,
      },
    },
  });
};

export const countDownTimer = (seconds, finalFunc, countFunc) => {
  if (seconds <= 0) typeof finalFunc == "function" && finalFunc();
  let count = seconds;
  if (interval) clearInterval(interval);
  interval = setInterval(() => {
    typeof countFunc == "function" && countFunc();
    count--;
    if (count <= 0) {
      typeof finalFunc == "function" && finalFunc();
      clearInterval(interval);
    }
  }, 1000);
};

export const clearCountDownTimer = () => {
  if (interval) clearInterval(interval);
};

export const startRecord = (stream) => {
  if (mediaRecorder) return;
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
        });
    }
  };
  mediaRecorder.onstart = async () => {
    mediaFile.NewMediaFile();
    isRecording.value = true;
  };
  mediaRecorder.onstop = async () => {
    utools.shellShowItemInFolder(mediaFile.getMediaFilePath());
    mediaRecorder = null;
    chunks = [];
    utools.shellBeep();
    mediaFile.CloseMediaFile();
    isRecording.value = false;
  };
  mediaRecorder.onerror = (err) => {
    isRecording.value = false;
  };

  mediaRecorder.start(timeslice);
};

export const stopRecord = () => {
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
