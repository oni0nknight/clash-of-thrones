'use strict'

const Unit = require('./Unit')
const Wall = require('./Wall')
const Player = require('./Player')
const Serializable = require('./Serializable')
const Change = require('./Change')

const EliteProbability = 0.1

const CONFIG = {
    WIDTH: 8,
    HEIGHT: 6,
    STACK_NUMBER: 3
}

module.exports = class Field extends Serializable {
    /**
     * @constructor
     */
    constructor(game, faction) {
        super()

        this.game = game

        this.player = new Player(faction)

        this.grid = []
        for (let i = 0; i < CONFIG.WIDTH; ++i) {
            this.grid.push([])
        }

        this.ennemyField = null

        // initialize grid
        this.initUnits()
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
            this.player.reinforcement += unitInfos.unit.packed ? CONFIG.STACK_NUMBER : 1

            // consume mana
            this.player.consumeMana()

            // add the change
            changes.push( new Change('unitRemoved', {uuid}) )

            // create packs
            const packChanges = this.createPacks(true)
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
        if (unitInfos.unit && unitInfos.column && newColumnNumber >= 0 && newColumnNumber < CONFIG.WIDTH) {
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
                const packChanges = this.createPacks(false)
                changes.push(...packChanges)
            }
        }
        
        return changes
    }

    reinforce() {
        const changes = []

        // early out
        if (!this.player.hasMana() || this.player.reinforcement === 0) {
            return changes
        }

        // consume mana
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

        // create packs (TODO : should not create packs automatically)
        const packChanges = this.createPacks(false)

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

    createPacks(gainMana) {
        const changes = []
        changes.push(...this.createAttackPacks(gainMana))
        changes.push(...this.createDefensePacks(gainMana))
        return changes
    }

    createAttackPacks(gainMana) {
        const changes = []

        // iterate on each column
        this.grid.forEach((column, colId) => {
            let columnDone = true
            
            do {
                const columnLength = column.length
                columnDone = true
                for (let baseIndex = 0; baseIndex < columnLength; baseIndex++) {
                    const baseUnit = column[baseIndex]

                    // forbid to stack packs & to pack with walls
                    if (baseUnit.packed || baseUnit.type === 'wall') {
                        continue
                    }

                    // compute the number of similar units
                    let endIndex = baseIndex
                    while (column[endIndex+1] && column[endIndex+1].type === 'normal' && column[endIndex+1].color === baseUnit.color && !column[endIndex+1].packed) {
                        endIndex++
                    }
                    const similarUnits = endIndex - baseIndex + 1

                    // if stack is found
                    if (similarUnits >= CONFIG.STACK_NUMBER) {
                        // create a packed unit
                        const packedUnit = this.instanciateUnit(baseUnit.type, baseUnit.color)
                        packedUnit.pack()

                        // remove the old units
                        column.splice(baseIndex, CONFIG.STACK_NUMBER)

                        // add the packed unit
                        const newIndex = (column[0] && (column[0] instanceof Wall)) ? 1 : 0
                        column.splice(newIndex, 0, packedUnit)

                        // mana bonus
                        if (gainMana) {
                            this.player.mana++
                        }

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

    createDefensePacks(gainMana) {
        const changes = []
        let checkResult = []
        let wallCreated = false

        do {
            wallCreated = false

            // iterate on each row
            for (let rowId = 0; rowId < CONFIG.HEIGHT && !wallCreated; rowId++) {
                let similarUnits = []
                
                // iterate on each column
                for (let colId = 0; colId < CONFIG.WIDTH && !wallCreated; colId++) {
                    const unit = this.getUnitAt(colId, rowId)
                    
                    // update similar units stack
                    if (unit && unit.type === 'normal') {
                        const isUnitSimilar = similarUnits.length ? unit.color === similarUnits[0].color : true
                        if (isUnitSimilar) {
                            console.log('>>> pushing ' + unit.color + ' (' + unit.size + ')')
                            similarUnits.push(unit)
                        }
                        else {
                            // check for walls
                            checkResult = this.checkForWalls(similarUnits, colId - similarUnits.length, gainMana)
                            if (checkResult.length) {
                                wallCreated = true
                            }

                            // reinit similarUnits
                            console.log('>>> reinit (was ' + similarUnits.length + ') & add ' + unit.color + ' (' + unit.size + ')')
                            similarUnits = [ unit ]
                        }
                    }
                    else {
                        // check for walls
                        checkResult = this.checkForWalls(similarUnits, colId - similarUnits.length, gainMana)
                        if (checkResult.length) {
                            wallCreated = true
                        }

                        // reinit similarUnits
                        console.log('>>> reinit (was ' + similarUnits.length + ')')
                        similarUnits = []
                    }
                }

                // check for walls
                checkResult = this.checkForWalls(similarUnits, CONFIG.WIDTH - similarUnits.length, gainMana)
                if (checkResult.length) {
                    wallCreated = true
                }
            }

            if (wallCreated) {
                console.log('REDOING...')
            }
        } while (wallCreated)

        return changes
    }

    checkForWalls(similarUnits, firstColumnId, gainMana) {
        const changes = []

        if (similarUnits.length >= CONFIG.STACK_NUMBER) {
            // if stack is found, transform all idle units into walls
            similarUnits.forEach((unitToRemove, idx) => {
                const column = this.grid[firstColumnId + idx]
    
                // remove old unit
                const indexToRemove = column.indexOf(unitToRemove)
                column.splice(indexToRemove, 1)
    
                // create a new wall
                const wall = new Wall(unitToRemove.faction)
    
                if (column[0] instanceof Wall) {
                    // evolve the existing wall
                    column[0].incStrength(wall.strength)
    
                    // add the change
                    changes.push(new Change('WallEvolved', {uuid: column[0].uuid}))
                }
                else {
                    // add the wall
                    column.unshift(wall)
    
                    // add the change
                    changes.push(new Change('WallFormed', {uuid: wall.uuid}))
                }
            })

            // mana bonus
            if (gainMana) {
                this.player.mana++
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
        this.player.reinforcement += CONFIG.STACK_NUMBER

        return [ new Change('attack', { attackerUUID: unit.uuid, deletedUnits}) ]
    }

    
    // Helpers
    //=======================================
    
    initUnits() {
        for (let i = 0; i < this.player.factionStats.startingUnits; i++) {
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
            }
            else {
                break
            }
        }

        // create packs (TODO : should not create packs automatically)
        this.createPacks(false)
    }

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
        return CONFIG.HEIGHT - this.grid[columnNumber].reduce((acc, unit) => {
            return acc + unit.size
        }, 0)
    }

    instanciateUnit(type, color) {
        return new Unit(this.player.faction, type, color)
    }

    beginTurn() {
        // evolve packs
        const changes = this.evolvePacks()

        // wall abilities
        this.grid.forEach(column => {
            column.forEach(unit => {
                if (unit instanceof Wall) {
                    unit.executeAbility(this.game)
                    changes.push('WallAbility', {uuid: unit.uuid})
                }
            })
        })

        // reset mana
        this.player.resetMana()

        return changes
    }

    endTurn() {
        const changes = []

        return changes
    }


    // Lifecycle
    //=======================================

    serialize() {
        return {
            player: this.player.serialize(),
            grid: this.grid.map(col => col.map(unit => unit.serialize()))
        }
    }
}