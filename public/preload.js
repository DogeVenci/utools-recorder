const { desktopCapturer, shell } = require("electron");
const path = require("path");
const fs = require("fs");

window.desktopCapturer = desktopCapturer;

const timeslice = 5000;
let mediaRecorder = null;
let chunks = [];
let interval = null;
let curCode = "lp";
let delayStart = 3;
let filePath = null;
let config = {};

Date.prototype.format = function (fmt) {
  var o = {
    "M+": this.getMonth() + 1, //月份
    "d+": this.getDate(), //日
    "h+": this.getHours(), //小时
    "m+": this.getMinutes(), //分
    "s+": this.getSeconds(), //秒
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度
    S: this.getMilliseconds(), //毫秒
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(
      RegExp.$1,
      (this.getFullYear() + "").substr(4 - RegExp.$1.length)
    );
  }
  for (var k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length)
      );
    }
  }
  return fmt;
};

const NewMediaFile = () => {
  filePath = path.resolve(
    utools.getPath("videos"),
    `${new Date().format("yyyyMMddhhmmss")}.webm`
  );
  return filePath;
};

const WriteMediaFile = (data) => {
  if (!filePath) return;
  // fs.writeFileSync(filePath, data);
  fs.appendFileSync(filePath, data);
};

const CloseMediaFile = () => {
  filePath = null;
};

const handleStream = (stream) => {
  const video = document.getElementById("video");

  video.onloadedmetadata = (e) => video.play();
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
          WriteMediaFile(Buffer.from(buffer));
          chunks = [];
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
  console.log("delayStart:", delayStart);
  if (delayStart <= 0) {
    mediaRecorder.start(timeslice);
    video.srcObject = stream;
    document.getElementById("switchBtn").value = "停止录制";
    document.getElementById("switchBtn").onclick = stop;
    document.getElementById("switchBtn").disabled = false;
    return;
  }

  let count = delayStart;
  if (interval) clearInterval(interval);
  document.getElementById("switchBtn").disabled = true;
  interval = setInterval(() => {
    document.getElementById("switchBtn").value = `正在开始 (${count - 1})`;
    count--;
    if (count <= 0) {
      count = delayStart;
      if (!mediaRecorder) clearInterval(interval);
      mediaRecorder.start(timeslice);
      video.srcObject = stream;
      document.getElementById("switchBtn").value = "停止录制";
      document.getElementById("switchBtn").onclick = stop;
      clearInterval(interval);
      document.getElementById("switchBtn").disabled = false;
    }
  }, 1000);
};

const start = async () => {
  if (mediaRecorder) return;
  const sources = await desktopCapturer.getSources({
    types: ["screen", "window"], //TODO 窗口录制
  });
  let audio = {
    mandatory: {
      chromeMediaSource: "desktop",
    },
  };
  if (utools.isMacOs() || utools.isLinux()) {
    audio = false;
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: sources[0].id,
      },
    },
  });
  NewMediaFile();
  handleStream(stream);
};

const stop = async () => {
  if (interval) clearInterval(interval);
  if (!mediaRecorder) return;
  try {
    mediaRecorder.stop();
  } catch (err) {
    mediaRecorder = null;
    chunks = [];
    document.getElementById("switchBtn").value = "开始录制";
    document.getElementById("switchBtn").onclick = start;
  }
};

window.onload = () => {};

window.onbeforeunload = () => {
  console.log("onbeforeunload");
};

const getMediaFilePath = () => filePath;

window.mediaFile = {
  getMediaFilePath,
  NewMediaFile,
  WriteMediaFile,
  CloseMediaFile,
  Buffer,
};
