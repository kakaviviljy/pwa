const express = require('express')
const app = express()
const fs = require('fs')
const path = require('path')
let options = {
    setHeaders: function(res, path, stat) {
        res.set('Access-Control-Allow-Origin', '*')
    }
}
app.use(express.static(path.join(__dirname, 'public'), options));


//随机返回5条数据
app.get('/api/getData', async(req, res) => {
    try {
        const data = await getData()
        const books = random(data.subjects)
        res.send(books)
    } catch (e) {
        console.log(e);
        res.end('404')
    }
})

app.listen(8888, () => {
    console.log('访问地址：http://localhost:8888');
})

function getData() {
    return new Promise((resolve, reject) => {
        const filePath = path.join(__dirname, 'data.json')
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve(JSON.parse(data))
            }
        })
    })
}

function random(data) {
    return data.sort(() => Math.random() - 0.5).slice(0, 5)
}