window.PIXI   = require('phaser-ce/build/custom/pixi')
window.p2     = require('phaser-ce/build/custom/p2')
window.Phaser = require('phaser-ce/build/custom/phaser-split')

import frame from '../assets/frame.png'
import sprites from '../assets/sprites/sprites.png'

export default class Game {
    constructor() {
        this.game = null
        
        this.playerName = null
        this.faction = null

        this.gameObjects = {}
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
        this.game.load.spritesheet('sprites', sprites, 72, 72, -1, 8, 8)
    }

    create() {
        this.game.add.image(0, 0, 'frame')
        this.game.add.sprite(49, 663, 'sprites', 0)
    }

    update() {
    }

    // Events
    //============================================

    updateGameState(newState) {
        console.log('received a new state : ', newState)
    }
}