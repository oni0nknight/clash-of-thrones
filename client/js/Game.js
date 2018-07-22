import Client from './Client'

export default class Game {
    constructor(playerName, playerColor) {
        this.game = null
        this.scene = null
        this.client = new Client(this)
        
        this.playerName = playerName
        this.playerColor = playerColor

        // test
        this.client.connect()
        this.client.registerPlayer(this.playerName, this.playerColor)

        this.gameObjects = {}
    }

    launch() {
        const config = {
            type: Phaser.AUTO,
            parent: 'phaser-example',
            width: 800,
            height: 600,
            physics: {
                default: 'arcade',
                arcade: {
                    debug: false,
                    gravity: { y: 0 }
                }
            },
            scene: { 
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
    }

    create() {
    }

    update() {
    }
}