async function getList() {
    const res = await fetch('/api/getData')
    const json = await res.json()
    return json
}

async function renderList() {
    const res = await getList();
    let html = '';
    res.forEach(item => {
        html += `
           <div class="text">
               <h3 class="title">${item.title} </h3>
               <p class="rate">评分：${item.rate}</p>
           </div>
         `
    });
    document.querySelector('.content').innerHTML = html
}


async function registerSW() {
    window.addEventListener('load', async() => {
        if ('serviceWorker' in navigator) {
            //避免存在作用域污染，注册之前先注销之前的serviceworker
            // navigator.serviceWorker.getRegistrations().then((regs) => {
            //         for (let reg of regs) {
            //             reg.unregister()
            //         }
            //     })
            //返回promise
            //.register('./sw.js',{scope:'/demo'})
            try {
                const registration = navigator.serviceWorker.register('./sw.js')
                console.log('注册成功', registration);
            } catch (e) {
                console.log('注册失败');

            }
        }
    })
}

renderList()
registerSW()


//用户没有授权，提示用户授权
if (Notification.permission === 'default') {
    Notification.requestPermission()
}
//如果页面一进来，用户没有网，给用户一个通知

if (!navigator.onLine) {
    new Notification('提示', {
        body: '你当前没有网络，访问的是缓存'
    })
}
//监听用户连上网了
window.addEventListener('online', () => {
    new Notification('提示', {
        body: '已经连上网了，可以刷新获取最新数据'
    })
})