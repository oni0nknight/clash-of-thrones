'use strict'

const Field = require('./Field')
const Serializable = require('./Serializable')
const Change = require('./Change')

const DEFAULT_CONF = {
    WIDTH: 7,
    HEIGHT: 7,
    START_UNIT_COUNT : 20
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

        this.turn = 'field1' // field1 or field2 : indicates the field whose turn it is
    }

    changeTurn() {
        // change turn
        this.turn = this.turn === 'field1' ? 'field2' : 'field1'

        // reset mana
        this[this.turn].resetPlayerMana()

        // return changes
        const changes = [ new Change('turnChanged', {}) ]
        return changes
    }

    serialize() {
        return {
            field1: this.field1.serialize(),
            field2: this.field2.serialize(),
            turn: this.turn
        }
    }
}