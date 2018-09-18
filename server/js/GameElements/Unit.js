'use strict'

const Entity = require('./Entity')
const DataHelper = require('../DataHelpers')

module.exports = class Unit extends Entity {
    static get UnitSizes() {
        return {
            normal: 1,
            elite: 2,
            normalPacked: 3,
            elitePacked: 3
        }
    }

    /**
     * @constructor
     * @param {string} faction the faction ID of the unit
     * @param {string} type the type of the unit
     * @param {string} color the color of the unit
     */
    constructor(faction, type, color) {
        const unitInfos  = DataHelper.getUnitInfos(faction, type)
        
        super(unitInfos.idleStrength)

        this.faction = faction
        this.type = type
        this.color = color

        this.attackDelay = unitInfos.attackDelay

        this.unitInfos = unitInfos // store the unitInfos for runtime access. Should not be streamed
    }

    get size() {
        return Unit.UnitSizes[this.type]
    }

    pack() {
        this.strength = this.unitInfos.packedBaseStrength
        this.type = this.type.startsWith('normal') ? 'normalPacked' : 'elitePacked'
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
            attackDelay: this.attackDelay,
        }
    }
}