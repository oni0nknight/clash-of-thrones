'use strict'

import Entity from './Entity'
import WallAbility from './WallAbility'

/**
 * @typedef WallInfo
 * @property {number} strength the wall strength
 * @property {WallAbility} wallAbility the wall ability
 */

export default class Wall extends Entity {
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