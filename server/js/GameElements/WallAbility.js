'use strict'

const Serializable = require('./Serializable')
const Logger = require('../Logger/Logger')

module.exports = class WallAbility extends Serializable {
    constructor(name, source) {
        super()
        this.name = name

        try {
            this.executor = new Function('context', 'wall', source)
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