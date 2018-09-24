import AppState from './AppState'
import Game from '../Game'
import $ from 'jquery'

export default class GameState extends AppState {
    constructor(client) {
        super(client)

        this.dom = {
            header: $('#header'),
            gamePage: $('#game'),
            playerName: $('#playerName'),
            factionSelect: $('#factionSelect'),

            __DEBUGButton: $('#test_btn')
        }

        this.isHost = false
        this.game = null

        this.gameDestroyed = this.gameDestroyed.bind(this)
    }

    start(isHost) {
        this.isHost = isHost

        // create & initialize phaser game
        this.game = new Game(this.client, isHost)
        this.game.initialize(this.dom.playerName.val(), this.dom.factionSelect.val())

        // send start game event
        if (this.isHost) {
            this.client.call('startGame')
        }
    }

    stop() {
        this.game.destroy() // destroy local game
    }

    bindEvents() {
        this.client.subscribe('gameDestroyed', this.gameDestroyed)

        $('#game button[data-action="back"]').on('click', (e) => {
            this.leaveGame()
        })

        // DEBUG
        this.dom.__DEBUGButton.text('(DEBUG) reset game')
        this.dom.__DEBUGButton.on('click', e => {
            this.client.call('resetGame')
        })
    }

    unBindEvents() {
        this.client.unsubscribe('gameDestroyed', this.gameDestroyed)

        $('#game button[data-action="back"]').off()

        this.dom.__DEBUGButton.off()
    }

    show() {
        this.dom.header.hide()
        this.dom.gamePage.show()
    }

    hide() {
        this.dom.gamePage.hide()
    }

    leaveGame() {
        const state = this.isHost ? 'hostLobby' : 'joinLobby'
        const event = new CustomEvent('leaveGame', { detail: {state, args: []} })
        document.dispatchEvent(event)
    }

    gameDestroyed() {
        this.leaveGame()
        alert('The other player left the game')
    }
}