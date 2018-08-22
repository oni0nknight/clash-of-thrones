import io from 'socket.io-client'

export default class Client {
    constructor() {
        this.socket = io.connect()
    }

    call(eventName, args) {
        this.socket.emit(eventName, args)
    }

    query(eventName, args) {
        return new Promise((resolve, reject) => {
            let timeout = 0
            this.socket.on(eventName+'_response', result => {
                clearTimeout(timeout)
                resolve(result)
            })
            this.socket.emit(eventName, args)
            timeout = setTimeout(() => {
                reject('timeout')
            }, 10000)
        })
    }
}