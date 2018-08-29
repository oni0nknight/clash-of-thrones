import Game from './js/Game'
import $ from 'jquery'
import Client from './js/Client'

const client = new Client()
const game = new Game()
const stateStack = []
let isHost = false

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
    $('#init-form button[data-type="submit"]').on('click', function(e) {
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
                isHost = true
                switchToState('host_lobby')
            } else {
                // fill the available games list
                client.query('pendingGames').then(pendingGames => {
                    $('#gameSelect').html(pendingGames.map(pendingGame => {
                        return '<option value="'+pendingGame.id+'">' + pendingGame.gameName + '</option>'
                    }))
                })
                isHost = false
                switchToState('join_lobby')
            }
        }
    })

    $('#host-lobby-form button[data-type="submit"]').on('click', (e) => {
        const form = $('#host-lobby-form')
        form.addClass('was-validated')
        if (form[0].checkValidity()) {
            client.call('createGame', $('#gameName').val())
            switchToState('host_wait')

            // subscibe to event
            client.subscribe('gameReady', launchGame)
        }
    })

    $('#join-lobby-form button[data-type="submit"]').on('click', (e) => {
        const form = $('#join-lobby-form')
        form.addClass('was-validated')
        if (form[0].checkValidity()) {
            // subscibe to event
            client.subscribe('gameReady', launchGame)

            // join game
            client.call('joinGame', $('#gameSelect option:selected').val())
        }
    })

    $('button[data-action="back"]').on('click', (e) => {
        const oldState = stateStack.pop()
        leaveState(oldState)
        const newState = stateStack.pop()
        switchToState(newState)
    })
}

function switchToState(newState) {
    $('.view').hide()
    switch (newState) {
        case 'init' : $('#init-form').show(); break;
        case 'host_lobby' : $('#host-lobby-form').show(); break;
        case 'join_lobby' : $('#join-lobby-form').show(); break;
        case 'host_wait' : $('#host_wait').show(); break;
        case 'game' : $('#game').show(); break;
        default : break;
    }
    stateStack.push(newState)
}

function leaveState(oldState) {
    switch (oldState) {
        case 'host_wait' : client.call('destroyGame')
        case 'game' : client.unsubscribe('gameStat', game.updateGameState)
        default : break;
    }
}

function launchGame() {
    client.unsubscribe('gameReady', launchGame)

    // initialize phaser game
    game.initialize($('#playerName').val(), $('#factionSelect').val())

    // display game
    switchToState('game')

    // subscibe to events
    client.subscribe('gameState', game.updateGameState)

    // send start game event
    if (isHost) {
        client.call('startGame')
    }
}