import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
// import { message } from "ant-design-vue";
// import "ant-design-vue/lib/message/style";
import "ant-design-vue/lib/notification/style";

// message.config({
//   duration: 10, // 持续时间
//   maxCount: 3, // 最大显示数, 超过限制时，最早的消息会被自动关闭
// });

createApp(App).use(createPinia()).mount("#app");
