'use strict'

const _serializeArr = (array) => {
    return array.map(el => {
        if (el.serialize instanceof Function) {
            return el.serialize()
        } else if (el.isArray()) {
            return _serializeArr(el)
        } else if (!(el instanceof Object)) {
            return el
        } else {
            // litterals must inherit from Serializable in order to be serialized
        }
    }, [])
}

function _generateUUID() {
    return 'xxxxxxxx-0xxx-xxxxxxxx'.replace(/[x]/g, () => {
        return (Math.random() * 16 | 0).toString(16)
    })
}

export default class Serializable {
    constructor() {
        this.uuid = _generateUUID()
    }

    serialize() {
        return Object.keys(this).reduce(function(acc, key) {
            if (this[key].serialize instanceof Function) {
                return {
                    ...acc, 
                    key: this[key].serialize()
                }
            } else if (this[key].isArray()) {
                return {
                    ...acc,
                    key: _serializeArr(this[key])
                }
            } else if (!(this[key] instanceof Object)) {
                return {
                    ...acc,
                    key: this[key]
                }
            } else {
                // litterals must inherit from Serializable in order to be serialized
            }
        }, {})
    }
}