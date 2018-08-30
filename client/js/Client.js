import io from 'socket.io-client'

export default class Client {
    constructor() {
        this.socket = io.connect()

        this.socket.on('err', err => {
            console.error(err)
        })
    }

    call(eventName, args) {
        this.socket.emit(eventName, args)
    }

    query(eventName, args) {
        return new Promise((resolve, reject) => {
            let timeout = 0

            const handleResponse = result => {
                this.socket.off(eventName+'_response', handleResponse)
                clearTimeout(timeout)
                resolve(result)
            }
            const handleError = () => {
                this.socket.off(eventName+'_response', handleResponse)
                clearTimeout(timeout)
                reject()
            }

            // subscribe to response handler
            this.socket.on(eventName+'_response', handleResponse)

            // emit the query
            this.socket.emit(eventName, args)

            // handle timeout
            timeout = setTimeout(handleError, 5000)
        })
    }

    subscribe(eventName, callback) {
        if (callback instanceof Function) {
            this.socket.on(eventName, callback)
        }
    }

    unsubscribe(eventName, callback) {
        this.socket.off(eventName, callback)
    }
}
