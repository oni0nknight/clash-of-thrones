'use strict'

function _generateUUID() {
    return 'xxxxxxxx-0xxx-xxxxxxxx'.replace(/[x]/g, () => {
        return (Math.random() * 16 | 0).toString(16)
    })
}

module.exports = class Serializable {
    constructor() {
        this.uuid = _generateUUID()
    }
}