import Game from './js/Game'
import $ from 'jquery'
import Client from './js/Client'

const client = new Client()
const stateStack = ['init']

window.onload = () => {
    // init DOM
    switchToState('init')

    // get faction list and then bind events
    client.query('factions').then(factions => {
        // fill the faction list
        $('#factionSelect').html(factions.map(fac => {
            return '<option value="'+fac.id+'">' + fac.id + '</option>'
        }))

        // bind events
        bindEvents()
    })
}

function bindEvents() {
    $('#init-form button').on('click', function(e) {
        const form = $('#init-form')
        form.addClass('was-validated')
        if (form[0].checkValidity()) {
            // register the player to server
            client.call('register', {
                name: $('#playerName').val(),
                faction: $('#factionSelect').val()
            })

            // go to next step
            if ($(this).data('action') === 'host') {
                switchToState('host_lobby')
            } else {
                // fill the available games list
                client.query('pendingGames').then(pendingGames => {
                    $('#gameSelect').html(pendingGames.map(pendingGame => {
                        return '<option value="'+pendingGame.id+'">' + pendingGame.gameName + '</option>'
                    }))
                })
                switchToState('join_lobby')
            }
        }
    })

    $('#host-lobby-form button').on('click', function(e) {
        const form = $('#host-lobby-form')
        form.addClass('was-validated')
        if (form[0].checkValidity()) {
            client.call('hostGame', $('#gameName').val())
            switchToState('host_wait')
        }
    })

    $('#join-lobby-form button').on('click', function(e) {
        const form = $('#join-lobby-form')
        form.addClass('was-validated')
        if (form[0].checkValidity()) {
            alert('jquery .val() is : ' + $('#gameSelect option:selected').val())
            client.call('joinGame', $('#gameSelect option:selected').val())
            switchToState('???')
        }
    })
}

function switchToState(newState) {
    $('.view').hide()
    switch (newState) {
        case 'init' : $('#init-form').show(); break;
        case 'host_lobby' : $('#host-lobby-form').show(); break;
        case 'join_lobby' : $('#join-lobby-form').show(); break;
        case 'host_wait' : $('#host_wait').show(); break;
        default : break;
    }
    stateStack.push(newState)
}