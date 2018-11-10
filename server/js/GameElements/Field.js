'use strict'

const Unit = require('./Unit')
const Wall = require('./Wall')
const Player = require('./Player')
const Serializable = require('./Serializable')
const Change = require('./Change')

const EliteProbability = 0.3

const STACK_NUMBER = 3

const DEFAULT_CONF = {
    WIDTH: 7,
    HEIGHT: 7,
    START_UNIT_COUNT : 20
}

module.exports = class Field extends Serializable {
    /**
     * @constructor
     * @param {number} width number of columns
     * @param {number} height number of rows
     * @param {string} faction the player faction
     * @param {number} startUnitCount number of units to instanciate at initialization
     */
    constructor(config) {
        super()

        const startUnitCount = config.startUnitCount ? config.startUnitCount : DEFAULT_CONF.START_UNIT_COUNT
        this.player = new Player(config.faction, startUnitCount)

        this.width = config.width ? config.width : DEFAULT_CONF.WIDTH
        this.height = config.height ? config.height : DEFAULT_CONF.HEIGHT

        this.grid = []
        for (let i = 0; i < this.width; ++i) {
            this.grid.push([])
        }

        this.ennemyField = null

        // initialize grid
        this.reinforce()

        // reset mana
        this.player.resetMana()
    }

    // Getters & Setters
    //=======================================

    setEnnemyField(field) {
        this.ennemyField = field
    }

    // State mutators
    //=======================================

    removeUnit(uuid) {
        const changes = []

        // mana management
        if (!this.player.hasMana()) {
            return changes
        }

        const unitInfos = this.getUnitInfos(uuid)
        if (unitInfos.unit && unitInfos.column) {
            // find unit's index in column
            const index = unitInfos.column.indexOf(unitInfos.unit)

            // remove the unit
            unitInfos.column.splice(index, 1)

            // increment reinforcement
            this.player.reinforcement += unitInfos.unit.packed ? STACK_NUMBER : 1

            // consume mana
            this.player.consumeMana()

            // add the change
            changes.push( new Change('unitRemoved', {uuid}) )

            // create packs
            const packChanges = this.createPacks()
            changes.push(...packChanges)
        }
        
        return changes
    }

    moveUnit(uuid, newColumnNumber) {
        const changes = []

        // mana management
        if (!this.player.hasMana()) {
            return changes
        }

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

                // consume mana
                this.player.consumeMana()

                // add the change
                changes.push( new Change('unitMoved', {uuid}) )

                // create packs
                const packChanges = this.createPacks()
                changes.push(...packChanges)
            }
        }
        
        return changes
    }

    reinforce() {
        const changes = []

        // mana management
        if (!this.player.hasMana()) {
            return changes
        }
        this.player.consumeMana()

        let fieldFull = false
        while (this.player.reinforcement > 0 && !fieldFull) {
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

            if (possibleColumns.length > 0) {
                // pick random column
                const column = possibleColumns[Math.floor(Math.random() * possibleColumns.length)]
                
                // put the unit in column
                column.push(unit)

                // decrement reinforcement
                this.player.reinforcement--

                // manage changes
                changes.push(new Change('unitAdded', {uuid: unit.uuid}))
            }
            else {
                fieldFull = true
            }
        }

        // create packs
        const packChanges = this.createPacks()

        return changes.concat(packChanges)
    }


    // Packs management
    //=======================================

    evolvePacks() {
        const changes = []

        // evolve all packs and perform attacks
        this.grid.forEach(column => {
            column.forEach(unit => {
                if (unit.packed) {
                    // evolve the unit
                    unit.evolve()

                    // attack if necessary
                    if (unit.attackDelay <= 0) {
                        changes.push(...this.attack(column, unit))
                    }
                }
            })
        })

        return changes
    }

    createPacks() {
        const changes = []
        changes.push(...this.createAttackPacks())
        changes.push(...this.createDefensePacks())
        return changes
    }

    createAttackPacks() {
        const changes = []

        // iterate on each column
        this.grid.forEach((column, colId) => {
            let columnDone = true
            
            do {
                const columnLength = column.length
                columnDone = true
                for (let baseIndex = 0; baseIndex < columnLength; baseIndex++) {
                    const baseUnit = column[baseIndex]

                    // forbid to stack packs
                    if (baseUnit.packed) {
                        continue
                    }

                    // compute the number of similar units
                    let endIndex = baseIndex
                    while (column[endIndex+1] && column[endIndex+1].color === baseUnit.color && column[endIndex+1].type === 'normal' && !column[endIndex+1].packed) {
                        endIndex++
                    }
                    const similarUnits = endIndex - baseIndex + 1

                    // if stack is found
                    if (similarUnits >= STACK_NUMBER) {
                        // create a packed unit
                        const packedUnit = this.instanciateUnit(baseUnit.type, baseUnit.color)
                        packedUnit.pack()

                        // remove the old units & add the packed one in place
                        column.splice(baseIndex, STACK_NUMBER, packedUnit)

                        // add the change
                        changes.push(new Change('attackPackFormed', {uuid: packedUnit.uuid}))

                        // need to check again the column
                        columnDone = false

                        // break the for loop to recalculate new column length
                        break
                    }
                }

            } while (!columnDone)
        })

        return changes
    }

    createDefensePacks() {
        const changes = []

        // iterate on each row
        for (let rowId = 0; rowId < this.height; rowId++) {
            let similarUnits = []

            // iterate on each column
            for (let colId = 0; colId < this.width; colId++) {
                const unit = this.getUnitAt(colId, rowId)

                // update similar units stack
                if (unit && unit.type === 'normal') {
                    const isUnitSimilar = similarUnits.length ? unit.color === similarUnits[0].color : true
                    if (isUnitSimilar) {
                        similarUnits.push(unit)
                    }
                    else {
                        similarUnits = [ unit ]
                    }
                }
                else {
                    similarUnits = []
                }

                // if stack is found
                if (similarUnits.length >= STACK_NUMBER) {
                    // transform all idle units into walls
                    for (let i = 0; i < STACK_NUMBER; i++) {
                        const unitToRemove = similarUnits[STACK_NUMBER - 1 - i]
                        const columnOfUnitToRemove = this.grid[colId - i]
                        const indexToRemove = columnOfUnitToRemove.indexOf(unitToRemove)
                        const wall = new Wall(unitToRemove.faction, unitToRemove.color)

                        // remove old unit and add the wall
                        columnOfUnitToRemove.splice(indexToRemove, 1, wall)

                        // add the change
                        changes.push(new Change('WallFormed', {uuid: wall.uuid}))
                    }

                    // reinit similarUnits
                    similarUnits = []
                }
            }
        }

        return changes
    }

    attack(column, unit) {
        const deletedUnits = []

        // get other player's corresponding column
        const colId = this.grid.indexOf(column)
        const ennemyColumn = this.ennemyField.grid[colId]

        // attack
        while(unit.strength > 0 && ennemyColumn.length) {
            const unitStrength = unit.strength
            unit.strength -= ennemyColumn[0].strength
            ennemyColumn[0].strength -= unitStrength

            if (ennemyColumn[0].strength <= 0) {
                const deletedUnit = ennemyColumn.shift()
                deletedUnits.push(deletedUnit.uuid)              
            }
        }

        // deal ennemy damage if necessary
        if (unit.strength > 0) {
            this.ennemyField.player.takeDamage(unit.strength)
        }

        // remove unit
        column.splice(column.indexOf(unit), 1)

        // increment reinforcement
        this.player.reinforcement += STACK_NUMBER

        return [ new Change('attack', { attackerUUID: unit.uuid, deletedUnits}) ]
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

        // build a scheme of the column (insert n times each unit, where n is its size)
        const scheme = column.reduce((acc, unit) => {
            acc.push(...Array(unit.size).fill(unit))
            return acc
        }, [])

        return scheme[rowNumber] ? scheme[rowNumber] : null
    }

    getFreeSpace(columnNumber) {
        return this.height - this.grid[columnNumber].reduce((acc, unit) => {
            return acc + unit.size
        }, 0)
    }

    instanciateUnit(type, color) {
        return new Unit(this.player.faction, type, color)
    }

    beginTurn() {
        // evolve packs
        const changes = this.evolvePacks()

        return changes
    }

    endTurn() {
        // reset mana
        this.player.resetMana()

        return []
    }


    // Lifecycle
    //=======================================

    serialize() {
        return {
            player: this.player.serialize(),
            width: this.width,
            height: this.height,
            grid: this.grid.map(col => col.map(unit => unit.serialize()))
        }
    }
}