'use strict'

const Serializable = require('./Serializable')

module.exports = class Entity extends Serializable {
    constructor(strength, faction, movable) {
        super()
        
        this.strength = strength
        this.faction = faction
        this.movable = movable
    }

    get size() {
        return 1
    }

    serialize() {
        return {
            uuid: this.uuid,
            strength: this.strength,
            faction: this.faction,
            size: this.size,
            movable: this.movable
        }
    }
}