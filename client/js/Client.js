import io from 'socket.io-client'

export default class Client {
    constructor() {
        this.socket = io.connect()

        this.socket.on('err', err => {
            console.error(err)
        })

        this.activeSubscriptions = []
    }

    call(eventName, args) {
        this.socket.emit(eventName, args)
    }

    query(eventName, args) {
        return new Promise((resolve, reject) => {
            let timeout = 0

            const handleResponse = result => {
                this.unsubscribe(eventName+'_response', handleResponse)
                clearTimeout(timeout)
                resolve(result)
            }
            const handleError = () => {
                this.unsubscribe(eventName+'_response', handleResponse)
                clearTimeout(timeout)
                reject()
            }

            // subscribe to response handler
            this.subscribe(eventName+'_response', handleResponse)

            // emit the query
            this.socket.emit(eventName, args)

            // handle timeout
            timeout = setTimeout(handleError, 5000)
        })
    }

    subscribe(eventName, callback) {
        if (callback instanceof Function) {
            this.socket.on(eventName, callback)
            activeSubscriptions.push({eventName, callback})
        }
    }

    unsubscribe(eventName, callback) {
        this.socket.off(eventName, callback)
        const idx = activeSubscriptions.findIndex(actsub => (actsub.eventName === eventName && actsub.callback === callback))
        if (idx !== -1) {
            activeSubscriptions.splice(idx, 1)
        }
    }
}
