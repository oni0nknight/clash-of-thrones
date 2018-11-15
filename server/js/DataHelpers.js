'use strict'

const data = require('../assets/data.json')

module.exports = {

    factionExists(factionId) {
        return data.factions.some(f => f.id === factionId)
    },

    getWallInfos(factionId) {
        const faction = data.factions.find(f => f.id === factionId)
        if (faction) {
            const wallInfos = data.walls.find(w => w.name === faction.stats.wall)
            return wallInfos ? wallInfos : null
        }
        else {
            return null
        }
    },

    getFactionStats(factionId) {
        const faction = data.factions.find(f => f.id === factionId)
        return faction ? faction.stats : null
    },

    getUnitsStats(factionId) {
        const faction = data.factions.find(f => f.id === factionId)
        return faction ? faction.units : null
    }
}