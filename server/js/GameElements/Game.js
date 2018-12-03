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

        this.field1 = new Field(this, 'field1', config.faction1)
        this.field2 = new Field(this, 'field2', config.faction2)

        this.turn = 'field1' // field1 or field2 : indicates the field whose turn it is
    }

    getEnnemyField(fieldId) {
        return fieldId === 'field1' ? 'field2' : 'field1'
    }

    changeTurn() {
        // end old turn
        const endTurnChanges = this[this.turn].endTurn()

        // change turn
        this.turn = this.getEnnemyField(this.turn)
        const emptyChange = new Change('empty', {}, this.serialize()) // empty change to instant switch the turn
        const turnChange = new Change('turnChanged', {}, this.serialize())

        // begin new turn
        const beginTurnChanges = this[this.turn].beginTurn()

        // return changes
        const changes = [
            emptyChange,
            turnChange,
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