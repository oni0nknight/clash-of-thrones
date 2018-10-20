'use strict'

const Unit = require('./Unit')
const Wall = require('./Wall')
const Player = require('./Player')
const Serializable = require('./Serializable')
const Change = require('./Change')

const EliteProbability = 0.3

const STACK_NUMBER = 3

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

    // State mutators
    //=======================================
    
    addUnit(unit, column, index) {
        // put at the end of column if index not provided
        const idx = index !== undefined ? index : column.length - 1

        // put the unit in column
        column.splice(idx, 0, unit)

        // decrement reinforcement
        this.reinforcement--

        // return changes
        return [ new Change('unitAdded', {uuid: unit.uuid}) ]
    }

    removeUnit(uuid) {
        const changes = []
        const unitInfos = this.getUnitInfos(uuid)

        if (unitInfos.unit && unitInfos.column) {
            // find unit's index in column
            const index = unitInfos.column.indexOf(unitInfos.unit)

            // remove the unit
            unitInfos.column.splice(index, 1)

            // increment reinforcement
            this.reinforcement++

            // return changes
            changes.push( new Change('unitRemoved', {uuid}) )
        }
        
        return changes
    }

    moveUnit(uuid, newColumnNumber) {
        const changes = []
        const unitInfos = this.getUnitInfos(uuid)

        if (unitInfos.unit && unitInfos.column && newColumnNumber >= 0 && newColumnNumber < this.width) {
            // check if movement is allowed
            const unitInLastPos = unitInfos.column.indexOf(unitInfos.unit) === unitInfos.column.length - 1
            const newColumnHasSpace = unitInfos.unit.size <= this.getFreeSpace(newColumnNumber)

            // check if there is enough space
            if (unitInLastPos && newColumnHasSpace) {
                // find unit's index in old column
                const index = unitInfos.column.indexOf(unitInfos.unit)

                // remove the unit from old column
                unitInfos.column.splice(index, 1)

                // add it at the end of new column
                this.grid[newColumnNumber].push(unitInfos.unit)

                this.createAttackPacks()
                this.createDefensePacks()
                
                // return change
                changes.push( new Change('unitMoved', {uuid}) )
            }
        }
        
        return changes
    }

    reinforce() {
        const changes = []

        while (this.reinforcement > 0) {
            // create unit
            const elitesOnGrid = this.grid.reduce((acc1, column) => {
                return acc1 + column.reduce((acc2, unit) => {
                    return acc2 + (unit.type === 'elite' ? 1 : 0)
                }, 0)
            }, 0)
            const nbEliteAllowed = this.player.nbEliteAllowed
            const eliteProba = (nbEliteAllowed - elitesOnGrid) / nbEliteAllowed * EliteProbability
            const unitType = (Math.random() < eliteProba) ? 'elite' : 'normal'
            const unitColor = this.player.factionColors[Math.floor(Math.random() * this.player.factionColors.length)]
            const unit = this.instanciateUnit(unitType, unitColor)

            // determine unit location
            const possibleColumns = this.grid.filter((column, index) => {
                return unit.size <= this.getFreeSpace(index)
            })
            const column = possibleColumns[Math.floor(Math.random() * possibleColumns.length)]
            
            // add the unit in the column
            const addChanges = this.addUnit(unit, column)
            changes.push(...addChanges)
        }

        return changes
    }


    // Packs management
    //=======================================

    evolvePacks() {
        this.getAllPacks().forEach(pack => {
            pack.evolve()
        })
    }

    createAttackPacks() {
        // iterate on each column
        this.grid.forEach((column, colId) => {
            let columnDone = true
            
            do {
                const columnLength = column.length
                columnDone = true
                for (let baseIndex = 0; baseIndex < columnLength; baseIndex++) {
                    const baseUnit = column[baseIndex]
                    let endIndex = baseIndex
                    while (column[endIndex+1] && column[endIndex+1].color === baseUnit.color && column[endIndex+1].type === 'normal') {
                        endIndex++
                    }
                    console.log('for column ' + colId + ' and row ' + baseIndex + ' : endIndex = ' + endIndex)

                    // if we find a stack
                    if (endIndex - baseIndex + 1 >= STACK_NUMBER) {
                        // create a packed unit
                        const packedUnit = this.instanciateUnit(baseUnit.type, baseUnit.color)
                        packedUnit.pack()

                        // remove the old units & add the packed one in place
                        column.splice(baseIndex, STACK_NUMBER, packedUnit)

                        // need to check again the column
                        columnDone = false

                        // break the for loop to recalculate new column length
                        break
                    }
                }

            } while (!columnDone)
        })
    }

    createDefensePacks() {
        // iterate on each row
        for (let rowId = 0; rowId < this.height; rowId++) {
            let similarUnits = []

            // iterate on each column
            for (let colId = 0; colId < this.width; colId++) {
                const unit = this.getUnitAt(colId, rowId)

                if (unit && unit.type === 'normal') {
                    const unitSimilar = similarUnits.length ? unit.color === similarUnits[0].color : true
                    if (unitSimilar) {
                        similarUnits.push(unit)

                        // if stack is found
                        if (similarUnits.length >= STACK_NUMBER) {
                            // transform all idle units into walls
                            for (let i = 0; i < STACK_NUMBER; i++) {
                                const unitToRemove = similarUnits[STACK_NUMBER - 1 - i]
                                const indexToRemove = this.grid[colId - i].indexOf(unitToRemove)
                                const wall = new Wall(unitToRemove.faction, unitToRemove.color)

                                // remove old unit and add the wall
                                this.grid[colId - i].splice(indexToRemove, 1, wall)
                            }

                            // reinit similarUnits
                            similarUnits = []
                        }
                    }
                }
                else {
                    // in other cases, reinit similarUnits
                    similarUnits = []
                }
            }
        }
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

    getUnitAt(columnNumber, rowNumber) {
        const column = this.grid[columnNumber]
        let unit = column[0]
        let currentRowId = 0
        let currentRowRealId = 0

        while (currentRowRealId < rowNumber) {
            unit = column[currentRowId]

            // return null : no unit at this position
            if (!unit) {
                currentRowRealId = rowNumber
            }
            else {
                currentRowRealId += unit.size
                currentRowId++
            }
        }

        return unit ? unit : null
    }

    getFreeSpace(columnNumber) {
        return this.height - this.grid[columnNumber].reduce((acc, unit) => {
            return acc + unit.size
        }, 0)
    }

    instanciateUnit(type, color) {
        return new Unit(this.player.faction, type, color)
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