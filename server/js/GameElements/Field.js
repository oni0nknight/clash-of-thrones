'use strict'

const Unit = require('./Unit')
const Player = require('./Player')
const Serializable = require('./Serializable')

const EliteProbability = 0.3

module.exports = class Field extends Serializable {
    /**
     * @constructor
     * @param {number} width number of columns
     * @param {number} height number of rows
     * @param {string} faction the player faction
     * @param {number} startUnitCount number of units to instanciate at initialization
     */
    constructor(width, height, faction, startUnitCount) {
        super()
        this.player = new Player(faction)
        this.width = width
        this.height = height

        this.reinforcement = startUnitCount

        this.grid = []
        for (let i = 0; i < width; ++i) {
            this.grid.push([])
        }

        this.reinforce() // initialize grid
    }

    // Units management
    //=======================================
    
    instanciateUnit(type, color) {
        return new Unit(this.player.faction, type, color)
    }

    removeUnit(uuid) {
        const unitInfos = this.getUnitInfos(uuid)

        if (unitInfos && unitInfos.column) {
            const index = unitInfos.column.indexOf(unitInfos.unit)
            col.splice(index, 1) // remove the unit
            this.reinforcement++ // increment reinforcement
            if (unitInfos.column[index]) {
                this.analyseAfterRemove(unitInfos.column, index) // check for changes
            }
        }
    }

    moveUnit(uuid, newColumnNumber) {
        const unitInfos = this.getUnitInfos(uuid)

        if (unitInfos && unitInfos.unit.size < this.getFreeSpace(newColumnNumber)) {
            // move unit
            this.removeUnit(uuid)
            this.grid[newColumnNumber].push(unitInfos.unit)

            // check for changes
            this.analyseAfterMove(uuid)
        }
    }

    reinforce() {
        for(;this.reinforcement > 0; this.reinforcement--) {
            // create unit
            const elitesOnGrid = this.grid.reduce((acc, column) => {
                return acc + column.reduce((acc, unit) => {
                    return acc + (unit.type === 'elite' ? 1 : 0)
                }, 0)
            }, 0)
            const nbEliteAllowed = this.player.nbEliteAllowed
            const eliteProba = (nbEliteAllowed - elitesOnGrid) / nbEliteAllowed * EliteProbability
            const unitType = (Math.random() < eliteProba) ? 'elite' : 'normal'
            const unitColor = this.player.factionColors[Math.floor(Math.random() * this.player.factionColors.length)]
            const unit = this.instanciateUnit(unitType, unitColor)

            // determine unit location
            const possibleColumns = this.grid.filter((column, index) => {
                return unit.size < this.getFreeSpace(index)
            })
            const column = possibleColumns[Math.floor(Math.random() * possibleColumns.length)]
            
            // add the unit in the column
            column.push(unit)
        }
    }


    // Packs management
    //=======================================

    analyseAfterMove(uuid) {
        const unitInfos = this.getUnitInfos(uuid)
        
        // check for attack pack (it can only be at the end of the column)
        const last3Units = unitInfos.column.slice(unitInfos.column.length - 3)
        if (last3Units.every((unit, idx) => {
            const colorPredicate = (unit.color === unitInfos.unit.color)
            const typePredicate = (idx > 0 ? (unit.type === 'normal') : true)
            return colorPredicate && typePredicate
        })) 
        {
            this.createAttackPack(unitInfos.column, unitInfos.column.length - 3, 3)
        }

        // check for wall pack
        // TODO
    }

    analyseAfterRemove(column, index) {
        // check for attack pack
        if (column[index].type === 'normal') {
            const color = column[index].color
            const lastIndex = (column[index+1] && column[index+1].type === 'normal' && column[index+1].color === color) ? index+1 : index
            for (let i = lastIndex; i >= 0 && column[i].color === color && column[i].type === 'normal'; --i); // find the first index
            let startIndex;
            if (i < 0) {
                startIndex = 0
            } else if (column[i].color === color && column[i].type === 'elite') {
                startIndex = i
            } else {
                startIndex = i + 1
            }

            if (lastIndex - startIndex >= 3) {
                this.createAttackPack(column, startIndex, lastIndex - startIndex)
            }
        }

        // check for wall pack
        // TODO
    }

    createAttackPack(column, startIndex, size) {
        const baseUnit = column[startIndex]
        const packedUnit = this.instanciateUnit(baseUnit.type, baseUnit.color) // create the pack unit
        packedUnit.pack() // make it a pack

        column.splice(startIndex, size, packedUnit) // remove former units and add the packed one
    }

    evolvePacks() {
        this.getAllPacks().forEach(pack => {
            pack.evolve()
        })
    }

    
    // Helpers
    //=======================================
    
    getUnitInfos(uuid) {
        const unitInfos = {
            unit: null,
            column: null,
            realRow: -1
        }
        this.grid.some(col => {
            const index = col.findIndex(u => {
                return u.uuid === uuid
            })
            if (index !== -1) {
                unitInfos.unit = col[index]
                unitInfos.column = col
                unitInfos.realRow = col.reduce((acc, unit, id) => (id < index ? acc + unit.size : acc), 0)
                return true
            }
            return false
        })
        return unitInfos
    }

    getFreeSpace(columnNumber) {
        return this.height - this.grid[columnNumber].reduce((acc, unit) => {
            return acc + unit.size
        }, 0)
    }


    // Lifecycle
    //=======================================

    serialize() {
        return {
            player: this.player.serialize(),
            width: this.width,
            height: this.height,
            reinforcement: this.reinforcement,
            grid: this.grid.map(col => col.map(unit => unit.serialize()))
        }
    }
}