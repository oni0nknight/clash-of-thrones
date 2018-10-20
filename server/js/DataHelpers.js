'use strict'

const data = require('../assets/data.json')

module.exports = {

    factionExists(factionId) {
        return data.factions.some(f => f.id === factionId)
    },

    getFactionInfos(factionId) {
        const faction = data.factions.find(f => f.id === factionId)
        let factionInfos = null
        if (faction) {
            factionInfos = {
                colors: faction.colors.slice(),
                wall: faction.wall
            }
        }
        return factionInfos
    },

    getUnitInfos(factionId, unitType) {
        const faction = data.factions.find(f => f.id === factionId)
        return faction && faction.units[unitType] ? faction.units[unitType] : null
    },

    getWallInfos(factionId) {
        const faction = data.factions.find(f => f.id === factionId)
        if (faction) {
            const wallInfos = data.walls.find(w => w.name === faction.wall)
            return wallInfos ? wallInfos : null
        }
        else {
            return null
        }
    },

    getPlayerStats(factionId) {
        const faction = data.factions.find(f => f.id === factionId)
        return faction ? faction.playerStats : null
    }
}