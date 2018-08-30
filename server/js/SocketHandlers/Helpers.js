'use strict'

module.exports = {
    
    serverLog(socketId, message) {
        console.log(socketId + ' :: ' + message)
    },
    
    sendError(socket, errorMessage) {
        serverLog(socket.id, 'ERR : ' + errorMessage)
        socket.emit('err', errorMessage)
    },
    
    generateUUID() {
        return 'xxxxxxxx-game-xxxxxxxx'.replace(/[x]/g, () => {
            return (Math.random() * 16 | 0).toString(16)
        })
    }
}