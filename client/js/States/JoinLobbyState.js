import AppState from './AppState'
import $ from 'jquery'

export default class JoinLobbyState extends AppState {
    constructor(client) {
        super(client)

        this.dom = {
            header: $('#header'),
            form: $('#join-lobby-form'),
            gameSelect: $('#gameSelect')
        }

        this.updatePendingGames = this.updatePendingGames.bind(this)
    }

    start() {
        this.updatePendingGames()
    }

    stop() {}

    bindEvents() {
        this.client.subscribe('gameListUpdated', this.updatePendingGames)

        $('#join-lobby-form button[data-type="submit"]').on('click', (e) => {
            this.dom.form.addClass('was-validated')
            if (this.dom.form[0].checkValidity()) {
                // go to waiting state
                this.switchToState('wait', false)

                // join game on server
                this.client.call('joinGame', $('#gameSelect option:selected').val())
            }
        })

        $('#join-lobby-form button[data-action="back"]').on('click', this.rollbackState)
    }

    unBindEvents() {
        this.client.unsubscribe('gameListUpdated', this.updatePendingGames)

        $('#join-lobby-form button[data-type="submit"]').off()
        $('#join-lobby-form button[data-action="back"]').off()
    }

    show() {
        this.dom.header.show()
        this.dom.form.show()
    }

    hide() {
        this.dom.header.hide()
        this.dom.form.hide()
    }

    updatePendingGames() {
        // fill the available games list
        this.client.query('pendingGames').then(pendingGames => {
            this.dom.gameSelect.html(pendingGames.map(pendingGame => {
                return '<option value="'+pendingGame.id+'">' + pendingGame.gameName + '</option>'
            }))
        })
    }
}