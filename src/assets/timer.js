import { ref } from "vue";

export let recordedTime = ref("00:00:00");

let recordSecond = 0;
let interval = null;

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
    console.log(recordedTime.value);
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
