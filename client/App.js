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

    // hide everything
    $('#header').hide()
    $('.state').hide()

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
    console.error(error.code, '::', error.msg)
}