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