window.PIXI   = require('phaser-ce/build/custom/pixi')
window.p2     = require('phaser-ce/build/custom/p2')
window.Phaser = require('phaser-ce/build/custom/phaser-split')

import frame from '../assets/frame.png'
import targaryens from '../assets/sprites/targaryens.png'

const X_OFFSET = 49
const Y_OFFSET = 663
const SPRITE_SIZE = 72
const SPRITE_MARGIN = 8

const spriteFrames = {
    red: 0,
    blue: 1,
    green: 2,
    yellow: 3,
    purple: 4,
    orange: 5
}

export default class Game {
    constructor(client) {
        this.game = null
        this.client = client
        
        this.playerName = null
        this.faction = null

        this.gameObjects = {
            frame: null,
            sprites: []
        }
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
        };
           
        this.game = new Phaser.Game(config)
    }

    // Phaser lifecycle
    //============================================

    preload() {
        this.game.load.image('frame', frame)
        this.game.load.spritesheet('targaryens', targaryens, SPRITE_SIZE, SPRITE_SIZE, -1, SPRITE_MARGIN, SPRITE_MARGIN)
    }

    create() {
        this.gameObjects.frame = this.game.add.image(0, 0, 'frame')

        this.client.query('gameState').then(gs => this.updateGameState(gs))
    }

    update() {
    }


    // Helpers
    //============================================

    displayUnit(col, row, unit) {
        const xpos = X_OFFSET + col * (SPRITE_SIZE + SPRITE_MARGIN)
        const ypos = Y_OFFSET + row * (SPRITE_SIZE + SPRITE_MARGIN)
        this.gameObjects.sprites.push(this.game.add.sprite(xpos, ypos, this.faction, spriteFrames[unit.color]))
    }

    // Events
    //============================================

    updateGameState(gameState = {}) {
        console.log('received a new state : ', gameState)

        // destroy every sprite
        this.gameObjects.sprites.forEach(s => s.destroy())

        // rebuild all sprites
        let currentRow = 0
        gameState.field1.grid.forEach((col, colId) => {
            currentRow = 0
            col.forEach(unit => {
                this.displayUnit(colId, currentRow, unit)
                currentRow += unit.size
            })
        })
    }
}