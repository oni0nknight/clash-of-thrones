'use strict'

const HEXA_BASE = 16

function _generateUUID() {
    return 'xxxxxxxx-0xxx-xxxxxxxx'.replace(/[x]/g, () => {
        return (Math.random() * HEXA_BASE | 0).toString(HEXA_BASE)
    })
}

module.exports = class Serializable {
    constructor() {
        this.uuid = _generateUUID()
    }
}