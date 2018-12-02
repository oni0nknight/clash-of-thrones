/* eslint-disable no-console */

'use strict'

const MS_TO_S = 0.001

const Logger = {
    timer: 0,
    
    resetTimer() {
        Logger.timer = Date.now()
    },
    
    log(...args) {
        console.log(`[${(Date.now() - Logger.timer) * MS_TO_S}] ::`, ...args)
    },
    
    warn(socketId, ...args) {
        console.warn(`[${(Date.now() - Logger.timer) * MS_TO_S}] ::`, ...args)
    },
    
    error(socketId, ...args) {
        console.error(`[${(Date.now() - Logger.timer) * MS_TO_S}] ::`, ...args)
    }
}

export default Logger