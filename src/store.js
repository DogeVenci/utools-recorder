import { defineStore } from "pinia";

// useStore could be anything like useUser, useCart
// the first argument is a unique id of the store across your application
export const useStore = defineStore("main", {
  state: () => {
    return {
      recorderState: "inactive",
      selectedVideoSource: { key: "screen:0:0" },
      videoSources: [],
      audioSources: [],
      delayStart: 3,
      disableOperation: false,
      errorText: "",
      savedText: "",
      savedFilePath: "",
      loading: false,
      settingVisable: false,
      outputDir: "",
      recentFilelist: []
    };
  },
  getters: {
    videoOptions: (state) => {
      return state.videoSources.map((item) => {
        return {
          value: item.id,
          label: item.name,
          key: item.id,
          icon: item.appIconURL,
        };
      });
    },
    hasSysAudio: state => state.audioSources.findIndex(audio => audio == "system") !== -1,
    hasMicAudio: state => state.audioSources.findIndex(audio => audio == "mic") !== -1,
    isMuted: state => state.audioSources.length === 0
  },
});
