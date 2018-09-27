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
            field1: null,
            field2: null,
            debug: null,
            cursors: null
        }

        this.refresh = this.refresh.bind(this)
    }

    initialize(playerName, faction) {
        this.playerName = playerName
        this.faction = faction

        const config = {
            renderer: Phaser.AUTO,
            parent: 'game',
            width: '100',
            height: '100',
            state: {
                preload: this.preload.bind(this),
                create: this.create.bind(this),
                update: this.update.bind(this)
            }
        }
           
        this.game = new Phaser.Game(config)
    }

    // Phaser lifecycle
    //============================================

    preload() {
        this.game.load.image('frame', frame)
        this.game.load.spritesheet('targaryens-normal', targaryensNormal, SPRITE_SIZE, SPRITE_SIZE)
        this.game.load.spritesheet('targaryens-elite', targaryensElite, SPRITE_SIZE, SPRITE_SIZE * 2)
    }

    create() {
        this.gameObjects.frame = this.game.add.image(0, 0, 'frame')

        this.gameObjects.field1 = this.game.add.group()
        this.gameObjects.field2 = this.game.add.group()

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
            this.lastGameState = gs
            this.refresh(gs)
        })
    }

    displayUnit(fieldId, col, row, unit) {
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
            sprite.events.onInputUp.add(this.onInputUp, { context: this })
        }
        
        // add it to the right group
        this.gameObjects[fieldId].add(sprite)
    }

    removeUnit(sprite) {
        this.client.call('removeUnit', { uuid: sprite.name })
    }

    // Events
    //============================================

    refresh(gameState = {}) {
        console.log('received a new state : ', gameState)
        const fieldIds = ['field1', 'field2']

        fieldIds.forEach(fieldId => {
            // destroy every sprite
            this.gameObjects[fieldId].removeAll(true)

            // rebuild all sprites
            gameState[fieldId].grid.forEach((col, colId) => {
                let currentRow = 0
                if (fieldId !== this.fieldId && col[0]) {
                    currentRow = col[0].size - 1
                }
                col.forEach((unit, idx) => {
                    this.displayUnit(fieldId, colId, currentRow, unit)

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

    onInputUp(sprite, pointer) {
        if (pointer.middleButton.justReleased()) {
            this.context.removeUnit(sprite)
        }
    }
}