'use strict'

module.exports = class Change {
    /**
     * @constructor
     */
    constructor(name, args, newState) {
        this.name = name
        this.args = args
        this.newState = newState
    }
}