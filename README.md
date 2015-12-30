##简介
* 此仓库中的代码为 回答 [segmentfault](http://segmentfault.com/q/1010000004221509?_ea=534428) 上网友的问题, 而创建的DEMO.
* 代码基于 `socket.io` + `express`, 前端样式部分来自于 `socket.io` 官网中的 `DEMO` 程序.

##使用参考
* 仓库 `clone` 之后, 执行 `npm install` 安装所需要的模块.
* 然后在命令行执行 `node index.js` (程序默认监听的端口为 `8163`).
* 再然后, 在浏览器中打开下面的页面, 查看效果(推荐浏览器为: `chrome`).
* `http://127.0.0.1:8163/index.html` 为访客所访问的页面.
* `http://127.0.0.1:8163/kefu.html` 为客服所访问的页面.
* 程序会自动为 `访客` 关联 在线的 `客服`, 如果当前没有可用的`客服`, 则会每隔5秒查找一次.

##效果图

![屏幕截图](https://github.com/xqin/socket.io_cs/raw/master/screenshot.png "屏幕截图")

> PS: 此仓库不接受任何形式的`Pull Request`或者`issue`, 请不要手贱乱点, 谢谢合作.
> 如果有意见, 请保留.
> 如果对功能上有其他需求, 请 `fork` 后自行实现.