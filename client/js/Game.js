window.PIXI   = require('phaser-ce/build/custom/pixi')
window.p2     = require('phaser-ce/build/custom/p2')
window.Phaser = require('phaser-ce/build/custom/phaser-split')

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
        this.game.load.spritesheet('sprites', sprites, 72, 72, -1, 8, 8)
    }

    create() {
        this.game.add.sprite(0, 0, 'sprites', 0)
    }

    update() {
    }

    // Events
    //============================================

    updateGameState(newState) {
        console.log('received a new state : ', newState)
    }
}