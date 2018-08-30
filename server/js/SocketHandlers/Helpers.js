'use strict'

const Helpers = {
    
    serverLog(socketId, message) {
        console.log(socketId + ' :: ' + message)
    },
    
    sendError(socket, errorMessage) {
        Helpers.serverLog(socket.id, 'ERR : ' + errorMessage)
        socket.emit('err', errorMessage)
    },
    
    generateUUID() {
        return 'xxxxxxxx-game-xxxxxxxx'.replace(/[x]/g, () => {
            return (Math.random() * 16 | 0).toString(16)
        })
    }
}

module.exports = Helpers