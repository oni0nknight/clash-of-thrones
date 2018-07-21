'use strict'

import Entity from './Entity'

export const UnitSizes = {
    normal: 1,
    elite: 2,
    packed: 3
}

/**
 * @typedef UnitInfo
 * @property {number} idleStrength the unit strength in IDLE mode
 * @property {number} packedBaseStrength the unit base strength when packed
 * @property {number} attackDelay the number of turns between pack formation and attack. Must be at least 1
 * @property {number} strengthGain the strength gained each turn during the attack delay
 * @property {string} type one of the types defined by UnitSizes
 * @property {string} color the unit color
 */

export default class Unit extends Entity {
    /**
     * @constructor
     * @param {UnitInfo} unitInfo the unit information object
     */
    constructor(unitInfo) {
        super(unitInfo.idleStrength)

        this.size = UnitSizes[unitInfo.type]
        this.type = unitInfo.type
        this.status = 'idle'

        this.color = unitInfo.color
        this.packedBaseStrength = unitInfo.packedBaseStrength
        this.attackDelay = unitInfo.attackDelay
        this.strengthGain = unitInfo.strengthGain
    }

    pack() {
        this.strength = this.packedBaseStrength
        this.status = 'packed'
    }

    evolve() {
        this.strength += this.strengthGain
        this.attackDelay--
    }
}