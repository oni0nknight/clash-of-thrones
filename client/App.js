import $ from 'jquery'
import Client from './js/Client'

import InitState from './js/States/InitState'
import LoaderState from './js/States/LoaderState'
import HostLobbyState from './js/States/HostLobbyState'
import JoinLobbyState from './js/States/JoinLobbyState'
import WaitForPlayerState from './js/States/WaitForPlayerState'
import GameState from './js/States/GameState'

const client = new Client()
client.subscribe('err', errorHandler)

let stateStack = []
let currentState = null

let errorContainer = null

const states = {
    'init': null,
    'loader': null,
    'hostLobby': null,
    'joinLobby': null,
    'waitForPlayer': null,
    'game': null
}

window.onload = () => {
    // load states
    states.init = new InitState(client)
    states.loader = new LoaderState(client)
    states.hostLobby = new HostLobbyState(client)
    states.joinLobby = new JoinLobbyState(client)
    states.waitForPlayer = new WaitForPlayerState(client)
    states.game = new GameState(client)

    errorContainer = $('.error-container')

    // hide everything
    $('#header').hide()
    $('.state').hide()

    // bind events
    bindEvents()

    if (window.location.search.includes('dbg_hst')) {
        $('#playerName').text('player1')
        $('#factionSelect').html('<option selected value="targaryens">targaryens</option>')
        client.call('register', { name: 'player1', faction: 'targaryens' })
        setTimeout(() => client.call('createGame', 'game'), 100)
        setTimeout(() => switchToState('waitForPlayer', true), 200)
    }
    else if (window.location.search.includes('dbg_join')) {
        $('#playerName').text('player1')
        $('#factionSelect').html('<option selected value="targaryens">targaryens</option>')
        client.call('register', { name: 'player2', faction: 'targaryens' })
        switchToState('waitForPlayer', false)
        client.query('pendingGames').then(pg => {
            client.call('joinGame', pg[0].id)
        })
    }
    else {
        // start with 1st state
        switchToState('init')
    }
}

function bindEvents() {
    document.addEventListener('switchState', e => {
        switchToState(e.detail.state, ...e.detail.args)
    })

    document.addEventListener('leaveGame', e => {
        stateStack = ['init']
        switchToState(e.detail.state, ...e.detail.args)
    })

    document.addEventListener('rollbackState', e => {
        // remove current state from stack
        stateStack.pop()

        // find the new state to enter to (cannot be loader state)
        let newState = ''
        do {
            newState = stateStack.pop() // remove from stack
        } while (newState === 'loader')

        // switch to new state
        switchToState(newState)
    })
}

function switchToState(stateId, ...args) {
    if (currentState) {
        currentState.leave()
    }
    const state = states[stateId]
    if (state) {
        state.enter(...args)
        stateStack.push(stateId)
        currentState = state
    }
    else {
        console.error('This state does not exist')
    }
}


// Error handling
//=====================================

function errorHandler(error) {
    if (errorContainer) {
        let html = '<div class="alert alert-danger" role="alert" style="display:none;">'
        html += (error.code + ' :: ' + error.msg)
        html += '</div>'
        errorContainer.append(html)

        errorContainer.find(':last-child').fadeIn(150).delay(2000).fadeOut()

        errorContainer.scrollTop(errorContainer.prop('scrollHeight'))
    }
}