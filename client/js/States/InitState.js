import AppState from './AppState'
import $ from 'jquery'

export default class InitState extends AppState {
    constructor(client) {
        super(client)

        this.dom = {
            header: $('#header'),
            form: $('#init-form'),
            playerName: $('#playerName'),
            factionSelect: $('#factionSelect')
        }
    }

    start() {
        // get faction list and then bind events
        this.client.query('factions').then(factions => {
            // fill the faction list
            $('#factionSelect').html(factions.map(fac => {
                return '<option value="'+fac.id+'">' + fac.id + '</option>'
            }))
        })
    }

    stop() {}

    bindEvents() {
        const self = this

        $('#init-form button[data-type="submit"]').on('click', function(e) {
            self.dom.form.addClass('was-validated')
            if (self.dom.form[0].checkValidity()) {
                // register the player to server
                self.client.call('register', {
                    name: self.dom.playerName.val(),
                    faction: self.dom.factionSelect.val()
                })
    
                // go to next step
                if ($(this).data('action') === 'host') {
                    self.switchToState('hostLobby')
                } else {
                    self.switchToState('joinLobby')
                }
            }
        })
    }

    unBindEvents() {
        $('#init-form button[data-type="submit"]').off()
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