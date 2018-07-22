'use strict'

const Entity = require('./Entity')
const WallAbility = require('./WallAbility')

/**
 * @typedef WallInfo
 * @property {number} strength the wall strength
 * @property {WallAbility} wallAbility the wall ability
 */

module.exports = class Wall extends Entity {
    /**
     * @constructor
     * @param {WallInfo} wallInfo the wall information
     */
    constructor(wallInfo) {
        super(wallInfo.strength)

        this.wallAbility = wallInfo.wallAbility
    }

    executeAbility(gameContext) {
        this.wallAbility.execute(gameContext, this)
    }
}