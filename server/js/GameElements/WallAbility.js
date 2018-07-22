'use strict'

const Serializable = require('../Serializable')

module.exports = class WallAbility extends Serializable {
    constructor(source) {
        super()
        this.source = source
        
        try {
            this.executor = new Function('context', 'wall', source)
        } catch(err) {
            console.error(err)
            this.executor = new Function('return')
        }
    }

    execute(gameContext, wall) {
        try {
            this.executor.call(null, gameContext, wall)
        } catch(err) {
            console.error(err)
        }
    }
}