'use strict'

const Serializable = require('./Serializable')
const DataHelper = require('../DataHelpers')

const DEFAULT_CONF = {
    MANA : 3
}

module.exports = class Player extends Serializable {
    /**
     * @constructor
     * @param {string} faction
     */
    constructor(faction) {
        super()
        const factionStats = DataHelper.getFactionStats(faction)
        const unitsStats = DataHelper.getUnitsStats(faction)

        this.faction = faction

        this.reinforcement = factionStats.totalUnits - factionStats.startingUnits
        this.health = factionStats.health
        this.mana = DEFAULT_CONF.MANA

        this.factionStats = factionStats // store the player stats for runtime access. Should not be streamed
        this.unitStats = unitsStats // store the units stats for runtime access. Should not be streamed
    }

    get nbEliteAllowed() {
        return this.factionStats.totalElites
    }

    get factionColors() {
        return this.unitStats.colors
    }

    // Mana
    //=======================================

    hasMana() {
        return this.mana > 0
    }

    consumeMana() {
        this.mana--
    }

    resetMana() {
        this.mana = DEFAULT_CONF.MANA
    }


    // Health
    //=======================================

    takeDamage(damage) {
        this.health = Math.max(this.health - damage, 0)
    }

    serialize() {
        return {
            faction: this.faction,
            health: this.health,
            mana: this.mana,
            reinforcement: this.reinforcement
        }
    }
}