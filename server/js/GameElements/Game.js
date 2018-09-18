'use strict'

const Field = require('./Field')
const Player = require('./Player')
const Serializable = require('./Serializable')

module.exports = class Game extends Serializable {
    /**
     * @constructor
     * @param {number} width 
     * @param {number} height 
     * @param {string} player1Faction 
     * @param {string} player2Faction 
     * @param {number} startUnitCount 
     */
    constructor(width, height, player1Faction, player2Faction, startUnitCount) {
        super()
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