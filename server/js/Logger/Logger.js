/* eslint-disable no-console */

'use strict'

module.exports = {
    log(socketId, ...args) {
        console.log(socketId, '::', ...args)
    },

    warn(socketId, ...args) {
        console.warn(socketId, '::', ...args)
    },

    error(socketId, ...args) {
        console.error(socketId, '::', ...args)
    }
}