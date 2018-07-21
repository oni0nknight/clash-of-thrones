'use strict'

import Serializable from '../Serializable'

export default class Entity extends Serializable {
    constructor(strength) {
        super()
        this.strength = strength
        this.movable = true
    }
}