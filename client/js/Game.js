window.PIXI   = require('phaser-ce/build/custom/pixi')
window.p2     = require('phaser-ce/build/custom/p2')
window.Phaser = require('phaser-ce/build/custom/phaser-split')

import frame from '../assets/frame.png'
import targaryensNormal from '../assets/sprites/targaryensNormal.png'
import targaryensElite from '../assets/sprites/targaryensElite.png'

const X_OFFSET = 30
const Y_OFFSET = 379
const SPRITE_SIZE = {
    normal: {
        x: 40,
        y: 40
    },
    elite: {
        x: 40,
        y: 80
    },
}

const spriteFrames = {
    green: 0,
    red: 1,
    blue: 2,
    yellow: 3,
    white: 4,
    purple: 5
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
        this.game.load.spritesheet('targaryens-normal', targaryensNormal, SPRITE_SIZE.normal.x, SPRITE_SIZE.normal.y)
        this.game.load.spritesheet('targaryens-elite', targaryensElite, SPRITE_SIZE.elite.x, SPRITE_SIZE.elite.y)
    }

    create() {
        this.gameObjects.frame = this.game.add.image(0, 0, 'frame')

        // init game state
        this.client.query('gameState').then(gs => this.updateGameState(gs))
    }

    update() {
    }


    // Helpers
    //============================================

    displayUnit(col, row, unit) {
        const xpos = X_OFFSET + col * SPRITE_SIZE[unit.type].x
        const ypos = Y_OFFSET + row * SPRITE_SIZE[unit.type].y
        const spritesheet = this.faction + '-' + unit.type
        this.gameObjects.sprites.push(this.game.add.sprite(xpos, ypos, spritesheet, spriteFrames[unit.color]))
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