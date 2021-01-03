self.addEventListener('install', event => {
    console.log('install', event);
    //self.skipWaiting()让service worker跳过等待，直接进入到activate状态
    //event.waitUntil等待skipWaiting结束，才进入到activate状态
    event.waitUntil(self.skipWaiting())
})
self.addEventListener('activate', event => {
        console.log('activate', event);
        //表示service worker激活后，能立即获取控制权
        event.waitUntil(self.clients.claim())

    })
    //请求发送的时候会触发
self.addEventListener('fetch', event => {
    console.log('fetch', event);

})