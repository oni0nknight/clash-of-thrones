'use strict'

const Serializable = require('./Serializable')

module.exports = class Entity extends Serializable {
    constructor(strength) {
        super()
        this.strength = strength
        this.movable = true
    }

    serialize() {
        return {
            uuid: this.uuid,
            strength: this.strength,
            movable: this.movable
        }
    }
}