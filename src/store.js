import { defineStore } from "pinia";

// useStore could be anything like useUser, useCart
// the first argument is a unique id of the store across your application
export const useStore = defineStore("main", {
  state: () => {
    return {
      recorderState: "inactive",
      selectedVideoSource: { key: "screen:0:0" },
      videoSources: [],
      selectedAudioSource: { key: "muted" },
      delayStart: 3,
      disableOperation: false,
      errorText: "",
      savedText: "",
      savedFilePath: ""
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
  },
});
