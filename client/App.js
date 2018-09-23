import Game from './js/Game'
import $ from 'jquery'
import Client from './js/Client'

const client = new Client()
client.subscribe('err', errorHandler)
let game = null
let stateStack = []
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
                isHost = false
                switchToState('join_lobby')
                client.subscribe('gameListUpdated', updatePendingGames)
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
            client.subscribe('gameReady', launchGameAsHost)
        }
    })

    $('#join-lobby-form button[data-type="submit"]').on('click', (e) => {
        const form = $('#join-lobby-form')
        form.addClass('was-validated')
        if (form[0].checkValidity()) {
            // subscibe to event
            client.subscribe('gameReady', launchGameAsJoin)

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

function updatePendingGames() {
    // fill the available games list
    client.query('pendingGames').then(pendingGames => {
        $('#gameSelect').html(pendingGames.map(pendingGame => {
            return '<option value="'+pendingGame.id+'">' + pendingGame.gameName + '</option>'
        }))
    })
}

function switchToState(newState) {
    $('.view').hide()
    $('#header').show()
    switch (newState) {
        case 'init' : $('#init-form').show(); break;
        case 'host_lobby' : $('#host-lobby-form').show(); break;
        case 'join_lobby' : $('#join-lobby-form').show(); updatePendingGames(); break;
        case 'host_wait' : $('#host_wait').show(); break;
        case 'game' : $('#game').show(); $('#header').hide(); break;
        default : break;
    }
    stateStack.push(newState)
}

function leaveState(oldState) {
    if (oldState === 'host_wait') {
        client.unsubscribe('gameReady', launchGameAsHost)
        client.call('leaveGame') // destroy the created game on the server
    }
    else if (oldState === 'join_lobby') {
        client.unsubscribe('gameListUpdated', updatePendingGames)
    }
    else if (oldState === 'game') {
        client.unsubscribe('gameDestroyed', onGameDestroyed)

        // destroy local game
        destroyGame()
        
        // update the statestack & go to lobby
        stateStack = ['init']
        switchToState(isHost ? 'host_lobby' : 'join_lobby')
    }
}

function launchGameAsHost() {
    client.unsubscribe('gameReady', launchGameAsHost)
    game = new Game(client, true)
    launchGame()
}

function launchGameAsJoin() {
    client.unsubscribe('gameReady', launchGameAsJoin)
    game = new Game(client, false)
    launchGame()
}

function launchGame() {
    if (game) {
        // display game
        // /!\ : must be called before game.initialize (game needs a visible parent node)
        switchToState('game')

        // initialize phaser game
        game.initialize($('#playerName').val(), $('#factionSelect').val())

        client.subscribe('gameDestroyed', onGameDestroyed)

        // send start game event
        if (isHost) {
            client.call('startGame')
        }

        // DEBUG
        $('#test_btn').text('reset game')
        $('#test_btn').on('click', e => {
            client.call('resetGame')
        })
    }
}

function onGameDestroyed() {
    leaveState('game')
    alert('the other player left the game')
}

function destroyGame() {
    if (game) {
        game.destroy()
    }
    game = null
}


// Error handling
//=====================================

function errorHandler(error) {
    console.error(error.code, '::', error.msg)
}