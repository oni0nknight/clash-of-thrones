'use strict'

const Logger = require('../Logger/Logger')
const ErrorCodes = require('../ErrorCodes')

const Helpers = {
    
    sendError(socket, errorCode) {
        const errorMsg = ErrorCodes.get(errorCode)
        Logger.error(socket.id, 'ERROR => ' + errorMessage)
        
        socket.emit('err', {
            code: errorCode,
            msg: errorMsg
        })
    },
    
    generateUUID() {
        return 'xxxxxxxx-game-xxxxxxxx'.replace(/[x]/g, () => {
            return (Math.random() * 16 | 0).toString(16)
        })
    }
}

module.exports = Helpers