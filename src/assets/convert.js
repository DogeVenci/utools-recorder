
import { useStore } from "../store.js";
import { notification, Button } from "ant-design-vue";
import { h, defineComponent } from 'vue';

const openNotification = (msg, desp, filepath) => {
    notification.open({
        message: msg,
        key: "saved",
        description: desp,
        btn: () =>
            h(
                Button,
                {
                    type: 'primary',
                    onClick: () => {
                        window?.utools?.shellShowItemInFolder(filepath);
                        notification.close(key)
                    },
                },
                { default: () => '打开' },
            ),
    })
}
export const convertVideo = async () => {
    const runFFmpeg = window.runFFmpeg;
    const convert2Gif = window.convert2Gif;
    const store = useStore();
    console.log("convertVideo", store.outFileFormat)
    if (store.outFileFormat == "webm") {
        openNotification("录像保存成功", store.savedFilePath, store.savedFilePath)
        return
    }
    store.loading = true;
    setTimeout(() => {
        if (store.outFileFormat == 'gif') {
            convert2Gif(store.savedFilePath).then(filepath => {
                openNotification("格式转换成功", filepath, filepath)
            }).catch((err) => {
                store.errorText = "转换格式失败,请选择保存目录为非系统目录重试";
            }).finally(() => {
                store.loading = false;
            });;
        }
        else if (store.outFileFormat == "mp4") {
            runFFmpeg(store.savedFilePath)
                .then((filepath) => {
                    // window?.utools?.shellShowItemInFolder(filepath);
                    openNotification("格式转换成功", filepath, filepath)
                })
                .catch((err) => {
                    store.errorText = "转换格式失败,请选择保存目录为非系统目录重试";
                })
                .finally(() => {
                    store.loading = false;
                });
        }
    }, 500);
}

