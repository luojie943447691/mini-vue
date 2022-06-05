
const queue: any[] = [];
let isFlush = false

const p = Promise.resolve()

// nextTick的实现
export function nextTick(fn) {
    return fn ? p.then(fn) : p
}

export function queueJobs(fn) {
    if (!queue.includes(fn)) {
        queue.push(fn)
    }
    queueFlush();

}

function queueFlush() {
    if (isFlush) return;
    isFlush = true;
    nextTick(flushJobs).finally(() => {
        isFlush = false
    });
}

function flushJobs(){
    let job;
    while (job = queue.shift()) {
        job && job();
    }
}
