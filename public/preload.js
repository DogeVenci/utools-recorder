const { desktopCapturer } = require("electron");
const path = require("path");
const fs = require("fs");

window.desktopCapturer = desktopCapturer;

let filePath = null;
let fileName = "";

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
  fileName = `${new Date().format("yyyyMMddhhmmss")}.webm`;
  filePath = path.resolve(getOutputDir(), fileName);
  return filePath;
};

const WriteMediaFile = (data) => {
  if (!filePath) return;
  fs.appendFileSync(filePath, data);
};

const CloseMediaFile = () => {
  filePath = null;
};

const getOutputDir = () => {
  const output = utools.dbStorage.getItem("output") || utools.getPath("videos");
  return output;
};

const setOutputDir = (dirPath) => {
  utools.dbStorage.setItem("output", dirPath);
};

window.onbeforeunload = () => {
  console.log("onbeforeunload");
};

const getMediaFilePath = () => filePath;
const getMediaFileName = () => fileName;

window.mediaFile = {
  getMediaFilePath,
  getMediaFileName,
  NewMediaFile,
  WriteMediaFile,
  CloseMediaFile,
  getOutputDir,
  setOutputDir,
  Buffer,
};
