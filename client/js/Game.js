

export default class Game {
    constructor() {
        this.game = null
        this.scene = null
        
        this.playerName = null
        this.faction = null

        this.gameObjects = {}
    }

    initialize(playerName, faction) {
        this.playerName = playerName
        this.faction = faction

        const config = {
            type: Phaser.AUTO,
            parent: 'game',
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

    // Events
    //============================================

    updateGameState(newState) {
        console.log('received a new state : ', newState)
    }
}