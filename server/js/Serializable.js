'use strict'

const _serializeArr = (array) => {
    return array.map(el => {
        if (el.serialize instanceof Function) {
            return el.serialize()
        } else if (Array.isArray(el)) {
            return _serializeArr(el)
        } else if (!(el instanceof Object)) {
            return el
        } else {
            // litterals must inherit from Serializable in order to be serialized
            return undefined
        }
    }, [])
}

function _generateUUID() {
    return 'xxxxxxxx-0xxx-xxxxxxxx'.replace(/[x]/g, () => {
        return (Math.random() * 16 | 0).toString(16)
    })
}

module.exports = class Serializable {
    constructor() {
        this.uuid = _generateUUID()
    }

    serialize() {
        return Object.keys(this).reduce((acc, key) => {
            let returnValue = { ...acc }
            if (this[key].serialize instanceof Function) {
                returnValue[key] = this[key].serialize()
            } else if (Array.isArray(this[key])) {
                returnValue[key] = _serializeArr(this[key])
            } else if (!(this[key] instanceof Object)) {
                returnValue[key] = this[key]
            } else {
                // litterals must inherit from Serializable in order to be serialized
            }
            return returnValue
        }, {})
    }
}