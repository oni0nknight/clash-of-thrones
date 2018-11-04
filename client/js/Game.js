window.PIXI = require('phaser-ce/build/custom/pixi')
window.p2 = require('phaser-ce/build/custom/p2')
window.Phaser = require('phaser-ce/build/custom/phaser-split')

import frame from '../assets/frame.png'
import endOfTurn from '../assets/UI/end_of_turn.png'
import targaryensNormal from '../assets/sprites/targaryensNormal.png'
import targaryensElite from '../assets/sprites/targaryensElite.png'

const X_OFFSET = 30
const Y_OFFSET = 379
const Y_ENNEMY_OFFSET = 299
const SPRITE_SIZE = 40
const FIELD_WIDTH = 7
const FIELD_HEIGHT = 7

const spriteFrames = {
    green: 0,
    red: 1,
    blue: 2,
    yellow: 3,
    white: 4,
    purple: 5
}

export default class Game {
    constructor(client, isHost) {
        this.game = null
        this.client = client
        
        this.playerName = null
        this.faction = null

        this.fieldId = isHost ? 'field1' : 'field2'

        this.lastGameState = null

        this.gameObjects = {
            frame: null,
            fields: [],
            ui: null
        }

        this.refresh = this.refresh.bind(this)
    }

    initialize(playerName, faction) {
        this.playerName = playerName
        this.faction = faction

        const config = {
            renderer: Phaser.AUTO,
            parent: 'game-container',
            width: 340,
            height: 720,
            state: {
                init: this.init.bind(this),
                preload: this.preload.bind(this),
                create: this.create.bind(this),
                update: this.update.bind(this)
            }
        }
           
        this.game = new Phaser.Game(config)
    }

    // Phaser lifecycle
    //============================================

    init() {
        // scale to fit page
        this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL
        this.game.scale.pageAlignVertically = true
        this.game.scale.pageAlignHorizontally = true
    }

    preload() {
        this.game.load.image('frame', frame)
        this.game.load.image('endOfTurn', endOfTurn)
        this.game.load.spritesheet('targaryens-normal', targaryensNormal, SPRITE_SIZE, SPRITE_SIZE)
        this.game.load.spritesheet('targaryens-elite', targaryensElite, SPRITE_SIZE, SPRITE_SIZE * 2)
        this.game.load.spritesheet('targaryens-wall', targaryensNormal, SPRITE_SIZE, SPRITE_SIZE)
    }

    create() {
        this.gameObjects.frame = this.game.add.image(0, 0, 'frame')

        this.gameObjects.fields.field1 = this.game.add.group()
        this.gameObjects.fields.field2 = this.game.add.group()

        this.gameObjects.ui = this.game.add.group()

        // subscibe to events
        this.client.subscribe('gameState_push', this.refresh)

        // init game state
        this.updateGameState()
    }

    update() {
    }

    destroy() {
        // unsubscribe to events
        this.client.unsubscribe('gameState_push', this.refresh)

        // warn the server
        this.client.call('leaveGame')

        // destroy Phaser game
        this.game.destroy()
    }


    // Helpers
    //============================================

    updateGameState() {
        return this.client.query('gameState').then(gs => {
            this.refresh(gs)
        })
    }

    displayUnit(fieldId, col, row, unit, options) {
        // find spritesheet
        const spritesheet = this.faction + '-' + unit.type

        // compute position
        const xpos = X_OFFSET + col * SPRITE_SIZE
        let ypos = 0
        if (fieldId === this.fieldId) {
            // field of the player
            ypos = Y_OFFSET + row * SPRITE_SIZE
        }
        else {
            // field of the ennemy
            ypos = Y_ENNEMY_OFFSET - row * SPRITE_SIZE
        }

        // instanciate sprite
        const sprite = new Phaser.Sprite(this.game, xpos, ypos, spritesheet, spriteFrames[unit.color])
        sprite.name = unit.uuid

        if (options.bindDelete) {
            // enable inputs
            sprite.inputEnabled = true

            // bind button for delete
            sprite.events.onInputUp.add(this.deleteUnit, { context: this })
        }

        if (options.bindDrag) {
            // enable inputs
            sprite.inputEnabled = true

            // bind button for drag
            sprite.events.onInputDown.add(this.enableDrag, { context: this })

            // bind drag update & stop
            sprite.events.onDragUpdate.add(this.onDragUpdate, { context: this })
            sprite.events.onDragStop.add(this.onDragStop, { context: this })

            // define bounds of drag
            sprite.input.boundsRect = new Phaser.Rectangle(X_OFFSET, Y_OFFSET, FIELD_WIDTH * SPRITE_SIZE, FIELD_HEIGHT * SPRITE_SIZE)

            // create ghost sprite
            const ghostSprite = new Phaser.Sprite(this.game, xpos, ypos, spritesheet, spriteFrames[unit.color])
            ghostSprite.name = unit.uuid + '_ghost'
            ghostSprite.alpha = 0.2
            this.gameObjects.fields[fieldId].add(ghostSprite)
        }
        
        // add it to the right group
        this.gameObjects.fields[fieldId].add(sprite)
    }

    removeUnit(sprite) {
        this.client.call('removeUnit', { uuid: sprite.name })
    }

    moveUnit(sprite, newColId) {
        this.client.call('moveUnit', { uuid: sprite.name, newColId })
    }


    // Events
    //============================================

    refresh(gameState = {}) {
        this.lastGameState = gameState
        const isMyTurn = (gameState.turn === this.fieldId)
        const fieldIds = ['field1', 'field2']

        fieldIds.forEach(fieldId => {
            const isMyUnit = (fieldId === this.fieldId)

            // destroy every unit sprite
            this.gameObjects.fields[fieldId].removeAll(true)

            // rebuild all unit sprites
            gameState[fieldId].grid.forEach((col, colId) => {
                // 1st unit of each enemy column : its row depends on its size
                let currentRow = 0
                if (fieldId !== this.fieldId && col[0]) {
                    currentRow = col[0].size - 1
                }
                col.forEach((unit, idx, units) => {
                    
                    const options = {
                        bindDelete: isMyTurn && isMyUnit,
                        bindDrag: isMyTurn && isMyUnit && unit.movable && (idx === units.length - 1)
                    }
                    this.displayUnit(fieldId, colId, currentRow, unit, options)

                    if (fieldId === this.fieldId) {
                        currentRow += unit.size
                    }
                    else if (fieldId !== this.fieldId && col[idx+1]) {
                        currentRow += col[idx+1].size
                    }
                })
            })

            // end of turn button
            this.gameObjects.ui.removeAll(true)
            if (isMyTurn) {
                const button = new Phaser.Button(this.game, 82, 673, 'endOfTurn', this.endTurn, this)
                this.gameObjects.ui.add(button)
            }
        })
    }

    endTurn() {
        this.client.call('endTurn')
    }

    // Input handlers
    //============================================

    deleteUnit(sprite, pointer) {
        const pointerOnSprite = sprite.getBounds().contains(pointer.x, pointer.y)
        if (pointer.rightButton.justReleased() && pointerOnSprite) {
            this.context.removeUnit(sprite)
        }
    }

    enableDrag(sprite, pointer) {
        if (pointer.leftButton.justPressed()) {
            sprite.input.enableDrag(true)
        }
    }

    onDragUpdate(sprite, pointer, x, y, snapPoint) {
        if (pointer.leftButton.isDown && this.context.lastGameState) {
            // find ghost sprite to update its position
            const ghostSprite = this.context.gameObjects.fields[this.context.fieldId].getByName(sprite.name + '_ghost')
            if (ghostSprite) {
                const colId = Number.parseInt((pointer.x - X_OFFSET) / SPRITE_SIZE)
                const column = this.context.lastGameState[this.context.fieldId].grid[colId]

                // if column found
                if (column) {
                    const columnSize = column.reduce((acc, unit) => {
                        return acc + (unit.uuid !== sprite.name ? unit.size : 0)
                    }, 0)

                    // update ghost sprite position
                    ghostSprite.x = X_OFFSET + colId * SPRITE_SIZE
                    ghostSprite.y = Y_OFFSET + columnSize * SPRITE_SIZE
                }
            }
        }
    }
    
    onDragStop(sprite, pointer) {
        if (pointer.leftButton.justReleased() && this.context.lastGameState) {
            // find ghost sprite to get the new column for drop
            const ghostSprite = this.context.gameObjects.fields[this.context.fieldId].getByName(sprite.name + '_ghost')
            if (ghostSprite) {
                const lastColId = this.context.lastGameState[this.context.fieldId].grid.findIndex(col => {
                    return !!col.find(unit => unit.uuid === sprite.name)
                })

                // get new column from ghost's position
                const newColId = Number.parseInt((ghostSprite.x - X_OFFSET) / SPRITE_SIZE)
                if (lastColId !== -1 && lastColId !== newColId) {
                    // make the move
                    this.context.moveUnit(sprite, newColId)
                }
                else {
                    // rebuild last state
                    this.context.refresh(this.context.lastGameState)
                }
            }

            // disable drag
            sprite.input.disableDrag()
        }
    }
}