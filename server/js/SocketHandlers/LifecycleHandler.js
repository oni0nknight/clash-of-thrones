'use strict'

const helpers = require('./Helpers')
const Logger = require('../Logger/Logger')
const gameData = require('../../assets/data.json')

const GameHandler = require('./GameHandler')

let uniqueID = 0

const bindSocket = (io, socket, players, games) => {

    socket.on('register', (data) => {
        Logger.log(socket.id, 'requesting to register player ' + data.name + ' with faction ' + data.faction)

        let playerName = data.name
        playerName += Object.keys(players).some(id => players[id].name === playerName) ? '#' + (uniqueID++).toString() : ''

        if (playerName) {
            players[socket.id] = {
                socket: socket,
                name: playerName,
                faction: data.faction,
                gameId: null
            }
        } else {
            helpers.sendError(socket, 'this faction doesn\'t exists. Impossible to register player')
        }
    })

    socket.on('disconnect', () => {
        if (players[socket.id]) {
            GameHandler.destroyGame(io, socket, players, games)
        }
        delete players[socket.id]
    })
}

module.exports = {
    bindSocket
}