'use strict'

const Field = require('./Field')
const Player = require('./Player')
const Serializable = require('../Serializable')

const EliteProbability = 0.3

module.exports = class Game extends Serializable {
    /**
     * @constructor
     * @param {number} width 
     * @param {number} height 
     * @param {Faction} player1Faction 
     * @param {Faction} player2Faction 
     * @param {number} startUnitCount 
     */
    constructor(width, height, player1Faction, player2Faction, startUnitCount) {
        super()
        this.field1 = new Field(width, height, player1Faction, startUnitCount)
        this.field2 = new Field(width, height, player2Faction, startUnitCount)

        this.turn = 1 // 1 or 2 : indicates the player whose turn it is
    }
}