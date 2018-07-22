import Game from './js/Game'
import $ from 'jquery'
import Client from './js/Client'

const client = new Client()

window.onload = () => {
    // init DOM
    startInitView()

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
                startHostView()
            } else {
                startJoinView()
            }
        }
    })
    $('#host-form button').on('click', function(e) {
        const form = $('#host-form')
        form.addClass('was-validated')
        if (form[0].checkValidity()) {
            client.call('hostGame', $('#gameName').val())
            startWaitingView()
        }
    })
    $('#find-form button').on('click', function(e) {
        const form = $('#find-form')
        form.addClass('was-validated')
        if (form[0].checkValidity()) {
            startJoiningView()
        }
    })
}

function startInitView() {
    $('.view').hide()
    $('#init-form').show()
}
function startHostView() {
    $('.view').hide()
    $('#host-form').show()
}
function startWaitingView() {
    $('.view').hide()
    $('#waiting').show()
}
function startJoiningView() {
    $('.view').hide()
    $('#joining').show()
}
function startJoinView() {
    $('.view').hide()
    $('#find-form').show()

    client.query('pendingGames').then(pendingGames => {
        $('#gameSelect').html(pendingGames.map(pendingGame => {
            return '<option value="'+pendingGame.id+'">' + pendingGame.gameName + '</option>'
        }))
    })
}