import AppState from './AppState'
import $ from 'jquery'

export default class WaitState extends AppState {
    constructor(client) {
        super(client)

        this.dom = {
            header: $('#header')
        }

        this.isHost = false

        this.launchGame = this.launchGame.bind(this)
    }

    start(isHost) {
        this.isHost = isHost
        this.dom.waitPage = isHost ? $('#host-wait') : $('#join-wait')
        this.dom.waitPage.show() // show it here because in show(), we don't know which yet
    }

    stop() {}

    bindEvents() {
        this.client.subscribe('gameReady', this.launchGame)

        $('#host-wait button[data-action="back"]').on('click', (e) => {
            // destroy the created game on the server
            this.client.call('leaveGame')
            this.rollbackState()
        })
    }

    unBindEvents() {
        this.client.unsubscribe('gameReady', this.launchGame)

        $('#host-wait button[data-action="back"]').off()
    }

    show() {
        this.dom.header.show()
    }

    hide() {
        this.dom.header.hide()
        this.dom.waitPage.hide()
    }

    launchGame() {
        this.switchToState('game', this.isHost)
    }
}