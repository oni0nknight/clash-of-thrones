'use strict'

const Entity = require('./Entity')
const WallAbility = require('./WallAbility')
const DataHelper = require('../DataHelpers')

const STEP_THRESHOLDS = {
    LOW: 3,
    MIDDLE: 6
}
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
        this.wallAbility = new WallAbility(wallInfos.name, wallInfos.source)

        this.wallInfos = wallInfos // store the wallInfos for runtime access. Should not be streamed
    }

    get step() {
        if (this.strength <= STEP_THRESHOLDS.LOW) {
            return 'low'
        }
        else if (this.strength <= STEP_THRESHOLDS.MIDDLE) {
            return 'middle'
        }
        else {
            return 'high'
        }
    }

    executeAbility(gameContext) {
        this.wallAbility.execute(gameContext, this)
    }

    serialize() {
        return {
            ...super.serialize(),
            type: this.type,
            step: this.step,
            wallAbility: this.wallAbility.serialize()
        }
    }
}