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
        const playerStats = DataHelper.getPlayerStats(faction)

        this.faction = faction
        
        this.health = playerStats.health

        this.mana = DEFAULT_CONF.MANA

        this.playerStats = playerStats // store the player stats for runtime access. Should not be streamed
        this.factionInfos = DataHelper.getFactionInfos(faction) // store the faction infos for runtime access. Should not be streamed
    }

    get nbEliteAllowed() {
        return this.playerStats.eliteCount
    }

    get factionColors() {
        return this.factionInfos.colors
    }

    hasMana() {
        return this.mana > 0
    }

    consumeMana() {
        this.mana--
    }

    resetMana() {
        this.mana = DEFAULT_CONF.MANA
    }

    takeDamage(damage) {
        this.health = Math.max(this.health - damage, 0)
    }

    serialize() {
        return {
            faction: this.faction,
            health: this.health,
            mana: this.mana
        }
    }
}