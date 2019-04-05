'use strict'

const Logger = require('../Logger/Logger')
const ErrorCodes = require('../ErrorCodes')

const HEXA_BASE = 16

const Helpers = {
    
    sendError(socket, errorCode) {
        const errorMsg = ErrorCodes.get(errorCode)
        Logger.error(socket.id, 'ERROR => ' + errorMsg)
        
        socket.emit('err', {
            code: errorCode,
            msg: errorMsg
        })
    },

    replyError(socket, query, errorCode) {
        const errorMsg = ErrorCodes.get(errorCode)
        Logger.error(socket.id, 'ERROR => ' + errorMsg)
        
        socket.emit(query + '_error', {
            code: errorCode,
            msg: errorMsg
        })
    },
    
    generateUUID() {
        return 'xxxxxxxx-game-xxxxxxxx'.replace(/[x]/g, () => {
            return (Math.random() * HEXA_BASE | 0).toString(HEXA_BASE)
        })
    }
}

module.exports = Helpers