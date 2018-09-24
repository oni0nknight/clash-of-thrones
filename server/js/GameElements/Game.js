'use strict'

const Field = require('./Field')
const Serializable = require('./Serializable')

const DEFAULT_CONF = {
    WIDTH: 7,
    HEIGHT: 7,
    START_UNIT_COUNT : 8
}

module.exports = class Game extends Serializable {
    /**
     * @constructor
     * @param {number} width
     * @param {number} height
     * @param {string} player1Faction
     * @param {string} player2Faction
     * @param {number} startUnitCount
     */
    constructor(config) {
        super()

        const width = config.width ? config.width : DEFAULT_CONF.WIDTH
        const height = config.height ? config.height : DEFAULT_CONF.HEIGHT
        const player1Faction = config.player1Faction ? config.player1Faction : ''
        const player2Faction = config.player2Faction ? config.player2Faction : ''
        const startUnitCount = config.startUnitCount ? config.startUnitCount : DEFAULT_CONF.START_UNIT_COUNT

        this.field1 = new Field(width, height, player1Faction, startUnitCount)
        this.field2 = new Field(width, height, player2Faction, startUnitCount)

        this.turn = 1 // 1 or 2 : indicates the player whose turn it is
    }

    changeTurn() {
        this.turn = this.turn === 1 ? 2 : 1
    }

    serialize() {
        return {
            field1: this.field1.serialize(),
            field2: this.field2.serialize(),
            turn: this.turn
        }
    }
}