'use strict'

const data = require('../../assets/data.json')

module.exports = {

    getFactionInfos(factionId) {
        const faction = data.factions.find(f => f.id === factionId)
        let factionInfos = null
        if (faction) {
            factionInfos = {   
                colors: faction.colors.slice()
            }
        }
        return factionInfos
    },

    getUnitInfos(factionId, unitType) {
        const faction = data.factions.find(f => f.id === factionId)
        return faction && faction.units[unitType] ? faction.units[unitType] : null
    },

    getPlayerStats(factionId) {
        const faction = data.factions.find(f => f.id === factionId)
        return faction ? faction.playerStats : null
    },

    getWallAbilityInfos(name) {
        const wallAbility = data.wallAbilities.find(wa => wa.name === name)
        return wallAbility || null
    }
}