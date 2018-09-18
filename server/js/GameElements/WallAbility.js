'use strict'

const Serializable = require('./Serializable')
const DataHelper = require('../DataHelpers')
const Logger = require('../Logger/Logger')

module.exports = class WallAbility extends Serializable {
    constructor(name) {
        super()
        this.name = name

        try {
            const wallAbilityInfos = DataHelper.getWallAbilityInfos(name)
            this.executor = new Function('context', 'wall', wallAbilityInfos.source)
        } catch(err) {
            Logger.error(err)
            this.executor = new Function('return')
        }
    }

    execute(gameContext, wall) {
        try {
            this.executor.call(null, gameContext, wall)
        } catch(err) {
            Logger.error(err)
        }
    }

    serialize() {
        return {
            name: this.name
        }
    }
}