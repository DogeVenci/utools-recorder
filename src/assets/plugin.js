import { useStore } from "../store.js";

import {
  startRecord,
  stopRecord,
  getSources,
  togglePause,
  curStream,
} from "./recorder.js";

if (typeof utools != "undefined") {
  utools.onPluginReady(() => {
    const store = useStore();
    if (utools.isWindows()) {
      store.selectedAudioSource = { key: "system" };
    } else {
      store.selectedAudioSource = { key: "muted" };
    }
    store.delayStart = utools.dbStorage.getItem("delayStart") || 3;

    const audioConfig = utools.dbStorage.getItem("audioSource");
    if (audioConfig) {
      store.selectedAudioSource = { key: audioConfig };
    }

    utools.setSubInput((text) => {},
    '可在utools 全局快捷键设置中绑定关键字 "开始录屏" "停止录屏" "暂停恢复录屏"');
  });

  utools.onPluginEnter(({ code, type, payload }) => {
    console.log("onPluginEnter:", code, type, payload);
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
  });

  utools.onPluginOut(() => {
    console.log("onPluginOut");
  });
}

export const openVideoDir = () => {
  window.utools && utools.shellOpenPath(mediaFile.getOutputDir());
};
