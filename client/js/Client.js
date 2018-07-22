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
            this.socket.on(eventName+'_response', result => {
                resolve(result)
            })
            this.socket.emit(eventName, args)
        })
    }
}