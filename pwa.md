

## web worker

​      Web Worker (工作线程) 是 HTML5 中提出的概念，分为两种类型：

     1. 专用线程（Dedicated Web Worker） ：专用线程仅能被创建它的脚本所使用（一个专用线程对应一个主线程），浏览器支持97%
        2. 共享线程（Shared Web Worker）：而共享线程能够在不同的脚本中使用（一个共享线程对应多个主线程）。浏览器支持35%，共享线程在传递消息之前，端口必须处于打开状态

   需要注意的点

- 有同源限制

- 无法访问 DOM 节点，运行在另一个上下文中，无法使用Window对象

- Web Worker 的运行不会影响主线程，但与主线程交互时仍受到主线程单线程的瓶颈制约。换言之，如果 Worker 线程频繁与主线程进行交互，主线程由于需要处理交互，仍有可能使页面发生阻塞

  

##  fetch api

1. 基于promise实现，service worker无法使用XMLhttpRequest

2. response是一个二级制数据流，需要调用json()方法转化成json数据

   

## service worker

   一个独立的worker线程，独立于当前网页进程，是一个常驻在浏览器中的 JS 线程，不能直接操作页面 DOM。但可以通过事件机制来处理，例如使用postMessage。

   能做的功能依赖于API：跟 Fetch 搭配，可以从浏览器层面拦截请求，做数据 mock；跟 Fetch 和 CacheStorage 搭配，可以做离线应用；跟 Push 和 Notification 搭配，可以做像 Native APP 那样的消息推送

**对比：**

web worker：通过消息机制完成主线程和worker线程之间的数据通信。

2. 当页面关闭时，该页面新建的 Web Worker 也会随之关闭，不会常驻在浏览器中。每次做的事情的结果不能被持久化存下来，如果下次有同样的复杂操作，还得费时重新来一遍

service worker:

1. 一旦被install，永远存在，除非被手动unregister，服务于多个页面的（按照同源策略）,即使Chrome（浏览器）关闭也会在后台运行。利用这个特性可以实现离线消息推送功能

2. 用到的时候可以直接被唤醒，不用的时候自动睡眠

   

**生命周期：**

1. 注册（register）：调用navigator.serviceWorker.register()时所处理的事情。
2. 安装中( installing )：这个状态发生在 Service Worker 注册之后，表示开始安装。
3. 安装后( installed/waiting )：Service Worker 已经完成了安装，这时会触发install事件，在这里一般会做一些静态资源的离线缓存。如果还有旧的Service Worker正在运行，会进入waiting状态，如果你关闭当前浏览器，或者调用self.skipWaiting()方法表示强制当前处在 waiting 状态的 Service Worker 进入 activate 状态。
4. 激活( activating )：表示正在进入activate状态，调用self.clients.claim())会来强制控制未受控制的客户端，例如你的浏览器开了多个含有Service Worker的窗口，会在不切的情况下，替换旧的 Service Worker 脚本不再控制着这些页面，之后会被停止。此时会触发activate事件。
5. 激活后( activated )：在这个状态表示Service Worker激活成功，在activate事件回调中，一般会清除上一个版本的静态资源缓存，或者其他更新缓存的策略。这代表Service Worker已经可以处理功能性的事件fetch (请求)、sync (后台同步)、push (推送)，message（操作dom）。
6. fetch事件，在发送请求的时候触发，主要用于操作缓存或者读取网络资源
7. 废弃状态 ( redundant )：这个状态表示一个 Service Worker 的生命周期结束。



**作用域：**

1. 注册的时候可以指定{scope:"/demo"}，只会拦截`demo`目录下的`fetch`事件，但是在下面提到的`cache.addAll`仍然可以缓存`/`下面的`index.html`的内容。



**service work 触发更新**

1. 浏览器每24小时自动更新一次
2. 注册新的service work，带上版本号，如：./sw.js?v=20201212
3. 手动更新 registration.update()



**service worker更新过程**

1. 开始更新前，老的sw会是激活的状态
2. 更新后新的sw会和老的sw共同存在，新的sw进入install生命周期
3. 如果新的sw没有install成功，它将会被废弃，老的sw继续保持激活状态
4. 一旦新的sw安装成功，它会进入wait状态直到老的sw不控制任何clients
5. self.skipWaiting()方法可以跳过等待，让新sw安装成功后立即激活



**更新遇到的问题**

1. sw更新完成后，缓存在更新过程中已经更新为最新

2. 页面静态资源在sw更新完成之前已经加载完成，所有是老的

   

**方案：**

1. skipWaiting

2. skipWaiting + 刷新

   在注册 SW 的地方，可以通过监听 `controllerchange` 事件来得知控制当前页面的 SW 是否发生了变化，如果变化了，刷新一下，让自己从头到尾都被新的 SW 控制，就一定能保证数据的一致性,如下：

   ```  javascript
   let refreshing = false
   navigator.serviceWorker.addEventListener('controllerchange', () => {
     if (refreshing) {
       return
     }
     refreshing = true;
     window.location.reload();
   });
   
   ```

3. 给用户一个提示

   即“通过 SW 的变化触发事件，而在事件监听中执行刷新”。但毫无征兆的刷新页面的确不可接受，所以我们再改进一下，给用户一个提示，让他来点击后更新 SW

   大致的流程是：

   - 浏览器检测到存在新的（不同的）SW 时，安装并让它等待，同时触发 `updatefound` 事件

   - 我们监听事件，弹出一个提示条，询问用户是不是要更新 SW

   -  如果用户确认，则向处在等待的 SW 发送消息，要求其执行 `skipWaiting` 并取得控制权

   - 因为 SW 的变化触发 `controllerchange` 事件，我们在这个事件的回调中刷新页面即可

     https://blog.csdn.net/weixin_34245082/article/details/91426966





## cache storage

 cacheStorage接口表示cache对象的存储，配合service worker来实现资源的缓存

 caches api 类似数据库的操作：

1. caches.open(cacheName).then(），用于打开缓存，返回一个promise对象，类似于连接数据库
2. caches.keys() 返回一个promise对象，包括所有的缓存key（数据库名）
3. caches.delete(key) 根据key删除对应的缓存（数据库名）

cache对象常用的方法（单条数据的操作）

  cache接口为缓存的reqeset、response对象提供存储机制

cache.put(req,res)把请求当作key，并且把对象的响应存储起来

cache.add(url)根据URL发起请求，并且把响应结果存储起来

cache.addAll(urls)抓取一个URL数组，并且把结果存储起来

cache.match(req),获取req对应的response



## pwa

一个标准的pwa必须包含3个部分

https服务器或者http://localhost

manifest.json

service worker



一、manifest

```
{
  "name": "HackerWeb",
  "short_name": "HackerWeb",
  "start_url": ".",
  "display": "standalone",
  "background_color": "#fff",
  "description": "A simply readable Hacker News app.",
  "icons": [{
    "src": "images/touch/homescreen48.png",
    "sizes": "48x48",
    "type": "image/png"
  }, {
    "src": "images/touch/homescreen72.png",
    "sizes": "72x72",
    "type": "image/png"
  }, {
    "src": "images/touch/homescreen96.png",
    "sizes": "96x96",
    "type": "image/png"
  }, {
    "src": "images/touch/homescreen144.png",
    "sizes": "144x144",
    "type": "image/png"
  }, {
    "src": "images/touch/homescreen168.png",
    "sizes": "168x168",
    "type": "image/png"
  }, {
    "src": "images/touch/homescreen192.png",
    "sizes": "192x192",
    "type": "image/png"
  }],
}
```

display模式：

| 显示模式     | 描述                                                         |
| :----------- | :----------------------------------------------------------- |
| `fullscreen` | 全屏显示, 所有可用的显示区域都被使用, 并且不显示状态栏[chrome](https://developer.mozilla.org/en-US/docs/Glossary/chrome)。 |
| `standalone` | 让这个应用看起来像一个独立的应用程序，包括具有不同的窗口，在应用程序启动器中拥有自己的图标等。这个模式中，用户代理将移除用于控制导航的UI元素，但是可以包括其他UI元素，例如状态栏。 |
| `minimal-ui` | 该应用程序将看起来像一个独立的应用程序，但会有浏览器地址栏。 样式因浏览器而异。 |
| `browser`    | 该应用程序在传统的浏览器标签或新窗口中打开，具体实现取决于浏览器和平台。 这是默认的设置。 |



## 开发工具：

1. sw-precache 预缓存，集成了sw-toolbox
   * app shell 所需静态资源
   * cacheFirst 缓存策略
2. sw-toolbox 动态缓存
   * 动态内容
   * api
   * 第三方资源
3. workbox 集大成者

**工具特性**

1. 命令行，构建工具
2. 注入已有service worker
3. 生成全新service worker

项目环境：以webpack插件为例























