import $ from 'jquery'
import Client from './js/Client'

import InitState from './js/States/InitState'
import HostLobbyState from './js/States/HostLobbyState'
import JoinLobbyState from './js/States/JoinLobbyState'
import WaitState from './js/States/WaitState'
import GameState from './js/States/GameState'

const client = new Client()
client.subscribe('err', errorHandler)

let stateStack = []
let currentState = null

const states = {
    'init': null,
    'hostLobby': null,
    'joinLobby': null,
    'wait': null,
    'game': null
}

window.onload = () => {
    // load states
    states.init = new InitState(client)
    states.hostLobby = new HostLobbyState(client)
    states.joinLobby = new JoinLobbyState(client)
    states.wait = new WaitState(client)
    states.game = new GameState(client)

    // hide everything
    $('#header').hide()
    $('.view').hide()

    // bind events
    bindEvents()

    // start with 1st state
    switchToState('init')
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
        stateStack.pop() // remove current state from stack
        const newState = stateStack.pop() // remove last state from stack (will be put back by switchToState)
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
    console.error(error.code, '::', error.msg)
}