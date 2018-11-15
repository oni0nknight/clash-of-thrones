'use strict'

const Entity = require('./Entity')
const DataHelper = require('../DataHelpers')
const Logger = require('../Logger/Logger')

const UNIT_SIZE = {
    NORMAL: {
        IDLE: 1,
        PACKED: 3
    },
    ELITE: {
        IDLE: 2,
        PACKED: 2
    }
}

module.exports = class Unit extends Entity {
    /**
     * @constructor
     * @param {string} faction the faction ID of the unit
     * @param {string} type the type of the unit
     * @param {string} color the color of the unit
     */
    constructor(faction, type = 'normal', color) {
        const unitInfos = DataHelper.getUnitsStats(faction, type)[type]
        
        super(unitInfos.idleStrength, faction, true)

        this.type = type
        this.color = color
        this.packed = false
        this.attackDelay = unitInfos.attackDelay

        this.unitInfos = unitInfos // store the unitInfos for runtime access. Should not be streamed
    }

    get size() {
        if (this.type === 'normal') {
            return this.packed ? UNIT_SIZE.NORMAL.PACKED : UNIT_SIZE.NORMAL.IDLE
        } else if (this.type === 'elite') {
            return this.packed ? UNIT_SIZE.ELITE.PACKED : UNIT_SIZE.ELITE.IDLE
        } else {
            Logger.error('Unit.size :: unknown type unit')
            return -1
        }
    }

    pack() {
        this.strength = this.unitInfos.packedBaseStrength
        this.packed = true
        this.movable = false
    }

    evolve() {
        this.strength += this.unitInfos.strengthGain
        this.attackDelay--
    }

    serialize() {
        return {
            ...super.serialize(),
            type: this.type,
            color: this.color,
            packed: this.packed,
            attackDelay: this.attackDelay
        }
    }
}