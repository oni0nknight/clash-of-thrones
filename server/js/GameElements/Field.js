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
    constructor(game, name, faction) {
        super()

        this.game = game
        this.name = name

        this.player = new Player(faction)

        this.grid = []
        for (let i = 0; i < CONFIG.WIDTH; ++i) {
            this.grid.push([])
        }

        // initialize grid
        this.initUnits()
    }


    // State mutators
    //=======================================

    /**
     * Performs all actions related to the beginning of a turn
     * @returns {Changes[]} An array of changes
     */
    beginTurn() {
        const changes = []

        // execute wall abilities
        const wallIds = []
        this.grid.forEach(column => {
            column.forEach(unit => {
                if (unit instanceof Wall) {
                    unit.executeAbility(this.game)
                    wallIds.push(unit.uuid)
                }
            })
        })
        if (wallIds.length > 0) {
            changes.push(new Change('wallAbility', { walls: wallIds }, this.game.serialize()))
        }

        // evolve attack packs
        const evolveChanges = this.evolvePacks()
        changes.push(...evolveChanges)

        // reset mana
        this.player.resetMana()

        return changes
    }

    /**
     * Performs all actions related to the end of a turn
     * @returns {Changes[]} An array of changes
     */
    endTurn() {
        const changes = []

        return changes
    }

    /**
     * Removes the given unit from the field
     * @param {number} uuid the uuid of the unit to remove
     * @returns {Changes[]} An array of changes
     */
    removeUnit(uuid) {
        const changes = []

        // mana management
        if (!this.player.hasMana()) {
            return changes
        }

        const unitInfos = this.getUnitInfos(uuid)
        if (unitInfos.unit && unitInfos.column) {
            // remove the unit
            this.transferUnitBack(unitInfos.unit, unitInfos.column)
            
            // consume mana
            this.player.consumeMana()

            // add the change
            changes.push( new Change('unitRemoved', { uuid }, this.game.serialize()) )

            // create packs
            const packChanges = this.createPacks(true)
            changes.push(...packChanges)
        }
        
        return changes
    }

    /**
     * Moves the given unit at the end of the given column
     * @param {string} uuid the uuid of the unit to move
     * @param {number} newColumnNumber the new column index
     * @returns {Changes[]} An array of changes
     */
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
                changes.push( new Change('unitMoved', { uuid }, this.game.serialize()) )

                // create packs
                const packChanges = this.createPacks(false)
                changes.push(...packChanges)
            }
        }
        
        return changes
    }

    /**
     * Reinforce the field with new units
     * @returns {Changes[]} An array of changes
     */
    reinforce() {
        const changes = []
        const addedUnitIDs = []

        // early out
        if (!this.player.hasMana() || this.player.reinforcement === 0) {
            return changes
        }

        // consume mana
        this.player.consumeMana()

        while (this.player.reinforcement > 0) {
            const createdUnit = this.createUnit()
            if (createdUnit !== null) {
                // decrement reinforcement
                this.player.reinforcement--

                // manage changes
                addedUnitIDs.push(createdUnit.uuid)
            }
            else {
                break
            }
        }

        if (addedUnitIDs.length > 0) {
            changes.push( new Change('unitsAdded', { units: addedUnitIDs }, this.game.serialize()) )
        }

        return changes
    }


    // Packs management
    //=======================================

    /**
     * Evolves all attack packs & launch attacks if necessary
     * @returns {Changes[]} An array of changes (each of which contains infos about the attacks)
     */
    evolvePacks() {
        const changes = []
        const evolvedPacks = []

        // evolve all packs
        this.grid.forEach(column => {
            column.forEach(unit => {
                if (unit.packed) {
                    // evolve the unit
                    unit.evolve()

                    // store the uuid of evolved pack
                    evolvedPacks.push(unit.uuid)
                }
            })
        })

        // add a change for the packs evolved
        if (evolvedPacks.length > 0) {
            changes.push(new Change('attackPackEvolved', { packs: evolvedPacks }, this.game.serialize()))
        }

        // perform attacks if any
        this.grid.forEach(column => {
            column.forEach(unit => {
                if (unit.packed && unit.attackDelay <= 0) {
                    const attackChanges = this.attack(column, unit)
                    changes.push(...attackChanges)
                }
            })
        })

        return changes
    }

    /**
     * Create all attack packs & all walls on the field
     * @param {boolean} gainMana tells if mana should be gained in case of pack created
     * @returns {Changes[]} An array of changes (each of which contains the infos related to the formed pack)
     */
    createPacks(gainMana) {
        const changes = []
        changes.push(...this.createDefensePacks(gainMana)) // create walls first...
        changes.push(...this.createAttackPacks(gainMana)) // ...and then attack packs
        return changes
    }

    /**
     * Create all attack packs on the field
     * @param {boolean} gainMana tells if mana should be gained in case of pack created
     * @returns {Changes[]} An array of changes (each of which contains infos about the created attack pack)
     */
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
                        changes.push( new Change('attackPackFormed', { uuid: packedUnit.uuid }) )

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

    /**
     * Create all walls on the field
     * @param {boolean} gainMana tells if mana should be gained in case of pack created
     * @returns {Changes[]} An array of changes (each of which contains the infos of created/moved walls)
     */
    createDefensePacks(gainMana) {
        const changes = []
        let wallChanges = []
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
                            similarUnits.push(unit)
                        }
                        else {
                            // check for walls
                            wallChanges = this.checkForWalls(similarUnits, colId - similarUnits.length, gainMana)
                            changes.push(...wallChanges)
                            wallCreated = wallChanges.length > 0

                            // reinit similarUnits
                            similarUnits = [ unit ]
                        }
                    }
                    else {
                        // check for walls
                        wallChanges = this.checkForWalls(similarUnits, colId - similarUnits.length, gainMana)
                        changes.push(...wallChanges)
                        wallCreated = wallChanges.length > 0

                        // reinit similarUnits
                        similarUnits = []
                    }
                }

                // check for walls
                if (!wallCreated) {
                    wallChanges = this.checkForWalls(similarUnits, CONFIG.WIDTH - similarUnits.length, gainMana)
                    changes.push(...wallChanges)
                    wallCreated = wallChanges.length > 0
                }
            }
        } while (wallCreated)

        return changes
    }

    /**
     * Checks if walls can be created out of the similarUnits array. If so, it creates them or evolves existing walls
     * @param {Unit[]} similarUnits Array of similar units
     * @param {number} firstColumnId the column of the 1st unit in the similarUnits array
     * @param {boolean} gainMana tells if mana should be gained in case of pack created
     * @returns {Changes[]} If walls to create, the array of changes (which contain the list of created/moved walls), otherwise empty array
     */
    checkForWalls(similarUnits, firstColumnId, gainMana) {
        const changes = []

        // if stack is found...
        if (similarUnits.length >= CONFIG.STACK_NUMBER) {
            // ...transform all idle units into walls
            const createdWalls = []
            const createdWallsInfos = []
            similarUnits.forEach((unitToRemove, idx) => {
                const column = this.grid[firstColumnId + idx]
                
                // create a new wall
                const wall = new Wall(unitToRemove.faction)
                
                // replace unit by wall
                const indexToRemove = column.indexOf(unitToRemove)
                column.splice(indexToRemove, 1, wall)
                
                // store the infos of the created wall
                createdWallsInfos.push({ unitRemoved: unitToRemove.uuid, wallCreated: wall.uuid })
                createdWalls.push(wall)
            })
            
            // fill the changes list
            changes.push(new Change('wallsFormed', createdWallsInfos, this.game.serialize()))

            // ...and move them to the first row (merge if already a wall)
            const movedWallsInfos = []
            similarUnits.forEach((unitToRemove, idx) => {
                const column = this.grid[firstColumnId + idx]
                const createdWall = createdWalls[idx]

                // if the created wall is already at first row, nothing to do
                if (column[0] === createdWall) {
                    return
                }

                // the first row is another wall -> need to merge the created wall into it
                if (column[0] instanceof Wall) {
                    // remove the just added wall
                    const indexToRemove = column.indexOf(createdWall)
                    column.splice(indexToRemove, 1)

                    // evolve the existing wall
                    column[0].incStrength(createdWall.strength)

                    // increment reinforcement as the unit has been removed
                    this.player.reinforcement++
    
                    // add the change
                    movedWallsInfos.push({ movedWall: createdWall.uuid, mergedWall: column[0].uuid })
                }
                // last case : the fisrt row is NOT a wall -> need to move the created wall to 1st row
                else {
                    // remove the just added wall
                    const indexToRemove = column.indexOf(createdWall)
                    column.splice(indexToRemove, 1)

                    // add it back to the first row
                    column.unshift(createdWall)
    
                    // add the change
                    movedWallsInfos.push({ movedWall: createdWall.uuid })
                }
            })
            
            // fill the changes list
            if (movedWallsInfos.length) {
                changes.push(new Change('wallsMoved', movedWallsInfos, this.game.serialize()))
            }

            // mana bonus
            if (gainMana) {
                this.player.mana++
            }
        }

        return changes
    }

    /**
     * Performs an attack with the given unit
     * @param {Unit[]} column the column of the attack
     * @param {Unit} unit the attacking unit
     * @returns {Changes[]} An array of 1 change (which contains the attack infos)
     */
    attack(column, unit) {
        const deletedUnitsUUID = []
        const ennemyField = this.game[this.game.getEnnemyField(this.name)]

        // get other player's corresponding column
        const columnId = this.grid.indexOf(column)
        const ennemyColumn = ennemyField.grid[columnId]

        // attack
        while(unit.strength > 0 && ennemyColumn.length) {
            const unitStrength = unit.strength
            unit.strength -= ennemyColumn[0].strength
            ennemyColumn[0].strength -= unitStrength

            if (ennemyColumn[0].strength <= 0) {
                // delete the ennemy unit
                const unitToDelete = ennemyColumn[0]
                ennemyField.transferUnitBack(unitToDelete, ennemyColumn)

                deletedUnitsUUID.push(unitToDelete.uuid)
            }
        }

        // deal ennemy damage if necessary
        if (unit.strength > 0) {
            ennemyField.player.takeDamage(unit.strength)
        }

        // remove unit
        this.transferUnitBack(unit, column)

        const changeArgs = {
            columnId,
            attackerUUID: unit.uuid,
            deletedUnitsUUID,
            damageDone: unit.strength
        }
        return [ new Change('attack', changeArgs, this.game.serialize()) ]
    }

    
    // Helpers
    //=======================================
    
    createUnit() {
        // compute the probability for an elite to be created
        const elitesOnGrid = this.grid.reduce((acc1, column) => {
            return acc1 + column.reduce((acc2, unit) => {
                return acc2 + (unit.type === 'elite' ? 1 : 0)
            }, 0)
        }, 0)
        const nbEliteAllowed = this.player.nbEliteAllowed
        const eliteProba = (nbEliteAllowed - elitesOnGrid) / nbEliteAllowed * EliteProbability

        // compute infos for each columns and filter out full ones
        const possibleColumns = this.grid.map((column, colIndex) => {
            const freeSpace = this.getFreeSpace(colIndex)
            const elitePossible = freeSpace >= 2

            // get the surrounding colors
            const surroundingColors = []
            const realRow = CONFIG.HEIGHT - freeSpace
            if (freeSpace > 0) {
                if (realRow > 0) {
                    const bottomUnit = this.getUnitAt(colIndex, realRow-1)
                    if (bottomUnit) {
                        surroundingColors.push(bottomUnit.color)
                    }
                }
                if (colIndex > 0) {
                    const leftUnit = this.getUnitAt(colIndex-1, realRow)
                    if (leftUnit) {
                        surroundingColors.push(leftUnit.color)
                    }
                }
                if (colIndex < CONFIG.WIDTH - 1) {
                    const rightUnit = this.getUnitAt(colIndex+1, realRow)
                    if (rightUnit) {
                        surroundingColors.push(rightUnit.color)
                    }
                }
            }

            // compute the possible colors (colors not in surroundingColors)
            const possibleColors = this.player.factionColors.filter(color => {
                return surroundingColors.indexOf(color) === -1
            })

            return {
                column,
                hasFreeSpace: freeSpace > 0,
                elitePossible,
                possibleColors
            }
        })
        .filter(colInfos => {
            return colInfos.hasFreeSpace
        })

        let createdUnit = null
        if (possibleColumns.length > 0) {
            // pick random column
            const columnInfos = possibleColumns[Math.floor(Math.random() * possibleColumns.length)]
            
            // select units infos
            let unitType = 'normal'
            if (columnInfos.elitePossible) {
                unitType = (Math.random() < eliteProba) ? 'elite' : 'normal'
            }
            const unitColor = columnInfos.possibleColors[Math.floor(Math.random() * columnInfos.possibleColors.length)]
            
            // create the unit and put it in the column
            createdUnit = this.instanciateUnit(unitType, unitColor)
            columnInfos.column.push(createdUnit)
        }
        
        return createdUnit
    }

    initUnits() {
        for (let i = 0; i < this.player.factionStats.startingUnits; i++) {
            const createdUnit = this.createUnit()
            if (createdUnit === null) {
                break
            }
        }
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

    transferUnitBack(unit, column) {
        // find unit's index in column
        const index = column.indexOf(unit)

        if (index !== -1) {
            // remove the unit
            column.splice(index, 1)

            // increment reinforcement
            this.player.reinforcement += unit.packed ? CONFIG.STACK_NUMBER : 1
        }
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