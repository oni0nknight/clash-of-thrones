'use strict'

const helpers = require('./Helpers')
const dataHelpers = require('../DataHelpers')
const Logger = require('../Logger/Logger')

let uniqueID = 0

module.exports = class LifecycleHandler {
    constructor(io, socket, players, games) {
        this.io = io
        this.socket = socket
        this.players = players
        this.games = games
    }

    bindSockets() {
        this.register = this.register.bind(this)

        this.socket.on('register', this.register)
    }


    // Socket functions
    //===================================

    register(data) {
        Logger.log(this.socket.id, 'requesting to register player.')

        if (data.name && data.faction && dataHelpers.factionExists(data.faction)) {
            let playerName = data.name
            playerName += Object.keys(this.players).some(id => this.players[id].name === playerName) ? '#' + (uniqueID++).toString() : ''
            Logger.log(this.socket.id, 'Player registered with name ' + data.name + ' and faction ' + data.faction)

            this.players[this.socket.id] = {
                socket: this.socket,
                name: playerName,
                faction: data.faction,
                gameId: null
            }

            // validate the register
            this.socket.emit('registered')
        }
        else {
            helpers.sendError(this.socket, '0002')
        }
    }
}