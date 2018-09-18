'use strict'

const Entity = require('./Entity')

module.exports = class Wall extends Entity {
    /**
     * @constructor
     * @param {number} strength wall's strength
     * @param {WallAbility} wallAbility wall's ability
     */
    constructor(strength, wallAbility) {
        super(strength)

        this.wallAbility = wallAbility
    }

    executeAbility(gameContext) {
        this.wallAbility.execute(gameContext, this)
    }

    serialize() {
        return {
            ...super.serialize(),
            wallAbility: this.wallAbility.serialize()
        }
    }
}