'use strict'

const Field = require('./Field')
const Serializable = require('./Serializable')
const Change = require('./Change')

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

        const field1Conf = {
            width: config.width,
            height: config.height,
            faction: config.player1Faction,
            startUnitCount: config.startUnitCount
        }
        const field2Conf = {
            width: config.width,
            height: config.height,
            faction: config.player2Faction,
            startUnitCount: config.startUnitCount
        }
        this.field1 = new Field(this, field1Conf)
        this.field2 = new Field(this, field2Conf)

        this.turn = 'field1' // field1 or field2 : indicates the field whose turn it is
    }

    changeTurn() {
        // end old turn
        this[this.turn].endTurn()

        // change turn
        this.turn = this.turn === 'field1' ? 'field2' : 'field1'

        // begin new turn
        this[this.turn].beginTurn()

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