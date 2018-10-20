'use strict'

const Serializable = require('./Serializable')

module.exports = class Entity extends Serializable {
    constructor(strength, faction, color, movable) {
        super()
        
        this.strength = strength
        this.faction = faction
        this.color = color
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
            color: this.color,
            movable: this.movable
        }
    }
}