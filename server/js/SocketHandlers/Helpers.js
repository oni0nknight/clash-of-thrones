'use strict'

const Logger = require('../Logger/Logger')

const Helpers = {
    
    sendError(socket, errorMessage) {
        Logger.error(socket.id, 'ERR : ' + errorMessage)
        socket.emit('err', errorMessage)
    },
    
    generateUUID() {
        return 'xxxxxxxx-game-xxxxxxxx'.replace(/[x]/g, () => {
            return (Math.random() * 16 | 0).toString(16)
        })
    }
}

module.exports = Helpers