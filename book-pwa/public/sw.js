//主要缓存内容
const CACHE_NAME = 'cache_v8'
const URLS = [
    '/',
    '/index.js',
    '/img/icon.png',
    '/index.css',
    '/manifest.json',
    '/api/getData'
]
self.addEventListener('install', async event => {
    console.log('install', event);
    //开启一个cache,得到一个cache对象
    const cache = await caches.open(CACHE_NAME)
        //等待cache把所有静态资源存储起来
    await cache.addAll(URLS)
        //让service worker跳过等待，直接进入到activate状态
        //event.waitUntil等待skipWaiting结束，才进入到activate状态
    await self.skipWaiting()
})


//主要清除旧的缓存
self.addEventListener('activate', async event => {
        console.log('activate', event);
        //清除旧的资源,获取到所有资源的key
        const keys = await caches.keys()
        keys.forEach(key => {
            if (key !== CACHE_NAME) {
                caches.delete(key);
            }
        })

        //表示service worker激活后，能立即获取控制权
        await self.clients.claim()

    })
    //请求发送的时候会触发
    /**
     * 静态数据缓存优先，接口数据网络优先
     * 只缓存同源的内容
     */
self.addEventListener('fetch', e => {
    console.log('fetch', e);
    //只缓存同源的内容
    const req = e.request
    const url = new URL(req.url)
    if (url.origin !== self.origin) {
        return
    }

    if (req.url.includes('/api')) {
        //接口走网络优先
        e.respondWith(networkFirst(e.request))
    } else {
        //静态资源走缓存优先
        e.respondWith(cacheFirst(e.request))
    }


})

//缓存优先,一般适用于静态资源
async function cacheFirst(req) {
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(req)
    if (cached) {
        return cached
    } else {
        const res = await fetch(req)
        return res
    }
}
//网络优先
async function networkFirst(req) {
    const cache = await caches.open(CACHE_NAME)
    try {
        const res = await fetch(req)
            // 请求失败，直接返回失败的结果
        if (!res || res.status !== 200) {
            return res;
        }
        // 请求成功的话，把响应的备份存储到缓存中
        cache.put(req, res.clone())
        return res

    } catch (e) {
        //如果fetch失败，从缓存中读取
        const cached = await cache.match(req)
        return cached

    }
}