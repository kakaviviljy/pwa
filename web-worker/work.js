//计算1-1亿之间所有数的和
//web worker是一个独立的进程，不能操作DOM和BOM
//适合做大量的运算

let total = 0;
for (let index = 0; index < 100000000; index++) {
    total += index
}

//发消息给主线程，把结果给他
self.postMessage({ total: total })