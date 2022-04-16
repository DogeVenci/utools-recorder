import { ref } from "vue";
import { useStore } from "../store.js";

export let recordedTime = ref("00:00:00");

let recordSecond = 0;
let interval = null;
let countDownInterval = null;

const formatSecond = (second) => {
  const h = Math.floor((second / 3600) % 24) + "";
  const m = Math.floor((second / 60) % 60) + "";
  const s = Math.floor(second % 60) + "";
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}:${s.padStart(2, "0")}`;
};

export const startCountTimer = () => {
  interval && clearInterval(interval);
  recordSecond = 0;
  interval = setInterval(() => {
    recordSecond++;
    recordedTime.value = formatSecond(recordSecond);
  }, 1000);
};

export const pauseCountTimer = () => {
  interval && clearInterval(interval);
};

export const resumeCountTimer = () => {
  interval && clearInterval(interval);
  interval = setInterval(() => {
    recordSecond++;
    recordedTime.value = formatSecond(recordSecond);
  }, 1000);
};

export const stopCountTimer = () => {
  interval && clearInterval(interval);
  recordSecond = 0;
  recordedTime.value = "00:00:00";
};

export const countDownTimer = (seconds, finalFunc, countFunc) => {
  const store = useStore();
  if (seconds <= 0) {
    typeof finalFunc == "function" && finalFunc();
    return;
  }
  store.disableOperation = true;
  let count = seconds;
  if (countDownInterval) clearInterval(countDownInterval);
  countDownInterval = setInterval(() => {
    count--;
    typeof countFunc == "function" && countFunc(count);
    if (count <= 0) {
      typeof finalFunc == "function" && finalFunc();
      store.disableOperation = false;
      clearInterval(countDownInterval);
    }
  }, 1000);
};

export const clearCountDownTimer = () => {
  const store = useStore();
  if (countDownInterval) clearInterval(countDownInterval);
  store.disableOperation = false;
};
