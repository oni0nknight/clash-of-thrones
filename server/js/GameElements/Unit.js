'use strict'

const Entity = require('./Entity')
const DataHelper = require('../DataHelpers')
const Logger = require('../Logger/Logger')

module.exports = class Unit extends Entity {
    /**
     * @constructor
     * @param {string} faction the faction ID of the unit
     * @param {string} type the type of the unit
     * @param {string} color the color of the unit
     */
    constructor(faction, type = 'normal', color) {
        const unitInfos  = DataHelper.getUnitInfos(faction, type)
        
        super(unitInfos.idleStrength)

        this.faction = faction
        this.type = type
        this.color = color

        this.packed = false
        this.attackDelay = unitInfos.attackDelay

        this.unitInfos = unitInfos // store the unitInfos for runtime access. Should not be streamed
    }

    get size() {
        if (this.packed) {
            return 3
        } else if (this.type === 'normal') {
            return 1
        } else if (this.type === 'elite') {
            return 2
        } else {
            Logger.error('Unit.size :: unknown type unit')
            return -1
        }
    }

    pack() {
        this.strength = this.unitInfos.packedBaseStrength
        this.packed = true
    }

    evolve() {
        this.strength += this.unitInfos.strengthGain
        this.attackDelay--
    }

    serialize() {
        return {
            ...super.serialize(),
            faction: this.faction,
            type: this.type,
            color: this.color,
            size: this.size,
            packed: this.packed,
            attackDelay: this.attackDelay,
        }
    }
}