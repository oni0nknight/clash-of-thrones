import io from 'socket.io-client'

const QUERY_TIMEOUT = 5000

export default class Client {
    constructor() {
        this.socket = io.connect()

        this.activeSubscriptions = []
    }

    call(eventName, args) {
        this.socket.emit(eventName, args)
    }

    query(eventName, args) {
        return new Promise((resolve, reject) => {
            let timeout = 0

            const handleResponse = (result) => {
                this.unsubscribe(eventName+'_response', handleResponse)
                this.unsubscribe(eventName+'_error', handleError)
                clearTimeout(timeout)
                resolve(result)
            }
            const handleError = (error) => {
                this.unsubscribe(eventName+'_response', handleResponse)
                this.unsubscribe(eventName+'_error', handleError)
                clearTimeout(timeout)
                reject(error)
            }

            // subscribe to response handler
            this.subscribe(eventName+'_response', handleResponse)
            this.subscribe(eventName+'_error', handleError)

            // emit the query
            this.socket.emit(eventName, args)

            // handle timeout
            timeout = setTimeout(handleError, QUERY_TIMEOUT)
        })
    }

    subscribe(eventName, callback) {
        if (callback instanceof Function) {
            this.socket.on(eventName, callback)
            this.activeSubscriptions.push({eventName, callback})
        }
    }

    unsubscribe(eventName, callback) {
        this.socket.off(eventName, callback)
        const idx = this.activeSubscriptions.findIndex(actsub => (actsub.eventName === eventName && actsub.callback === callback))
        if (idx !== -1) {
            this.activeSubscriptions.splice(idx, 1)
        }
    }
}
