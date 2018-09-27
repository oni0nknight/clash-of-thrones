import AppState from './AppState'
import $ from 'jquery'

export default class HostLobbyState extends AppState {
    constructor(client) {
        super(client)

        this.dom = {
            header: $('#header'),
            form: $('#host-lobby-form'),
            gameName: $('#gameName')
        }
    }

    start() {}

    stop() {}

    bindEvents() {
        $('#host-lobby-form button[data-type="submit"]').on('click', (e) => {
            this.dom.form.addClass('was-validated')
            if (this.dom.form[0].checkValidity()) {
                // go to waiting state
                this.switchToState('loader', {next: 'waitForPlayer', args: [true], event: 'gameCreated'})

                // create game on server
                this.client.call('createGame', this.dom.gameName.val())
            }
        })

        $('#host-lobby-form button[data-action="back"]').on('click', this.rollbackState)
    }

    unBindEvents() {
        $('#host-lobby-form button[data-type="submit"]').off()
        $('#host-lobby-form button[data-action="back"]').off()
    }

    show() {
        this.dom.header.show()
        this.dom.form.show()
    }

    hide() {
        this.dom.header.hide()
        this.dom.form.hide()
    }
}