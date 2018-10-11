window.PIXI = require('phaser-ce/build/custom/pixi')
window.p2 = require('phaser-ce/build/custom/p2')
window.Phaser = require('phaser-ce/build/custom/phaser-split')

import frame from '../assets/frame.png'
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
            fields: []
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
        this.game.load.spritesheet('targaryens-normal', targaryensNormal, SPRITE_SIZE, SPRITE_SIZE)
        this.game.load.spritesheet('targaryens-elite', targaryensElite, SPRITE_SIZE, SPRITE_SIZE * 2)
    }

    create() {
        this.gameObjects.frame = this.game.add.image(0, 0, 'frame')

        this.gameObjects.fields.field1 = this.game.add.group()
        this.gameObjects.fields.field2 = this.game.add.group()

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

    displayUnit(fieldId, col, row, unit, draggable) {
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

        if (fieldId === this.fieldId) {
            sprite.inputEnabled = true
            sprite.events.onInputUp.add(this.deleteUnit, { context: this })
            if (draggable) {
                // bind buttons
                sprite.events.onInputDown.add(this.enableDrag, { context: this })
                sprite.events.onInputUp.add(this.disableDrag, { context: this })

                // define drag snaping & bounds
                sprite.input.enableSnap(SPRITE_SIZE, SPRITE_SIZE, true, true, X_OFFSET, Y_OFFSET)
                sprite.input.boundsRect = new Phaser.Rectangle(X_OFFSET, Y_OFFSET, FIELD_WIDTH * SPRITE_SIZE, FIELD_HEIGHT * SPRITE_SIZE)

                // drag control update
                sprite.events.onDragUpdate.add(this.onDragUpdate, { context: this })
                sprite.events.onDragStop.add(this.onDragStop, { context: this })
            }
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
        const fieldIds = ['field1', 'field2']

        fieldIds.forEach(fieldId => {
            // destroy every sprite
            this.gameObjects.fields[fieldId].removeAll(true)

            // rebuild all sprites
            gameState[fieldId].grid.forEach((col, colId) => {
                let currentRow = 0
                if (fieldId !== this.fieldId && col[0]) {
                    currentRow = col[0].size - 1
                }
                col.forEach((unit, idx, units) => {
                    const draggable = (idx === units.length - 1)
                    this.displayUnit(fieldId, colId, currentRow, unit, draggable)

                    if (fieldId === this.fieldId) {
                        currentRow += unit.size
                    }
                    else if (fieldId !== this.fieldId && col[idx+1]) {
                        currentRow += col[idx+1].size
                    }
                })
            })
        })
    }

    // Input handlers

    deleteUnit(sprite, pointer) {
        const pointerOnSprite = sprite.getBounds().contains(pointer.x, pointer.y)
        if (pointer.rightButton.justReleased() && pointerOnSprite) {
            this.context.removeUnit(sprite)
        }
    }

    enableDrag(sprite, pointer) {
        if (pointer.leftButton.isDown) {
            // enable drag
            sprite.input.enableDrag(true)
            sprite.input.setDragLock(true, false)
        }
    }

    disableDrag(sprite, pointer) {
        sprite.input.disableDrag()
    }
    
    onDragUpdate(sprite, pointer, x, y, snapPoint) {
        if (pointer.leftButton.isDown && this.context.lastGameState) {
            const colId = Number.parseInt((snapPoint.x - X_OFFSET) / SPRITE_SIZE)
            const column = this.context.lastGameState[this.context.fieldId].grid[colId]
            const columnSize = column.reduce((acc, unit) => {
                return acc + (unit.uuid !== sprite.name ? unit.size : 0)
            }, 0)
            sprite.y = Y_OFFSET + columnSize * SPRITE_SIZE
        }
    }
    
    onDragStop(sprite, pointer) {
        if (this.context.lastGameState) {
            const lastColId = this.context.lastGameState[this.context.fieldId].grid.findIndex(col => {
                return !!col.find(unit => unit.uuid === sprite.name)
            })
            const newColId = Number.parseInt((sprite.x - X_OFFSET) / SPRITE_SIZE)
            if (lastColId !== -1 && lastColId !== newColId) {
                this.context.moveUnit(sprite, newColId)
            }
        }
    }
}