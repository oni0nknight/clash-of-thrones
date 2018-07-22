'use strict'

const Serializable = require('../Serializable')

/**
 * @typedef {Object} UnitsDefinition
 * @property {UnitDefinition} normal
 * @property {UnitDefinition} elite
 */

/**
 * @typedef {Object} UnitDefinition
 * @property {number} idleStrength the unit strength in IDLE mode
 * @property {number} packedBaseStrength the unit base strength when packed
 * @property {number} attackDelay the number of turns between pack formation and attack. Must be at least 1
 * @property {number} strengthGain the strength gained each turn during the attack delay
 */

/**
 * @typedef {Object} PlayerStats
 * @property {number} health the player start health
 * @property {number} allowedMoves the number of moves allowed at each turn
 * @property {number} eliteCount the number of elite units
 */

/**
 * @typedef {Object} Faction
 * @property {string} id
 * @property {UnitsDefinition} units
 * @property {Array.<string>} colors
 * @property {PlayerStats} playerStats
 */

module.exports = class Player extends Serializable {
    /**
     * @constructor
     * @param {Faction} faction
     */
    constructor(faction) {
        super()
        this.faction = faction //won't be serialized as it is a litteral
        
        this.factionId = faction.id
        this.health = faction.playerStats.health
    }

    takeDamage(damage) {
        this.health = Math.max(this.health - damage, 0)
    }
}