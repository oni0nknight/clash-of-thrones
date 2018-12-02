'use strict'

const Field = require('./Field')
const Serializable = require('./Serializable')
const Change = require('./Change')

module.exports = class Game extends Serializable {
    /**
     * @constructor
     */
    constructor(config) {
        super()

        this.field1 = new Field(this, config.faction1)
        this.field2 = new Field(this, config.faction2)
        this.field1.setEnnemyField(this.field2)
        this.field2.setEnnemyField(this.field1)

        this.turn = 'field1' // field1 or field2 : indicates the field whose turn it is
    }

    changeTurn() {
        // end old turn
        const endTurnChanges = this[this.turn].endTurn()

        // change turn
        this.turn = this.turn === 'field1' ? 'field2' : 'field1'

        // begin new turn
        const beginTurnChanges = this[this.turn].beginTurn()

        // return changes
        const changes = [
            [ new Change('turnChanged', {}) ],
            ...endTurnChanges,
            ...beginTurnChanges
        ]
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