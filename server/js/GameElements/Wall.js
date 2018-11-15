'use strict'

const Entity = require('./Entity')
const WallAbility = require('./WallAbility')
const DataHelper = require('../DataHelpers')

module.exports = class Wall extends Entity {
    /**
     * @constructor
     * @param {string} faction the faction ID
     * @param {string} color the color
     */
    constructor(faction) {
        const wallInfos = DataHelper.getWallInfos(faction)

        super(wallInfos.wallBaseStrength, faction, false)

        this.type = 'wall'
        this.grow = 'low'

        this.wallAbility = new WallAbility(wallInfos.name, wallInfos.source)

        this.wallInfos = wallInfos // store the wallInfos for runtime access. Should not be streamed
    }

    executeAbility(gameContext) {
        this.wallAbility.execute(gameContext, this)
    }

    serialize() {
        return {
            ...super.serialize(),
            type: this.type,
            grow: this.grow,
            wallAbility: this.wallAbility.serialize()
        }
    }
}