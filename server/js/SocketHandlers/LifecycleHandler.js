'use strict'

const helpers = require('./Helpers')
const dataHelpers = require('../DataHelpers')
const Logger = require('../Logger/Logger')

const GameHandler = require('./GameHandler')

let uniqueID = 0

const bindSocket = (io, socket, players, games) => {

    socket.on('register', (data) => {
        Logger.log(socket.id, 'requesting to register player.')

        if (data.name && data.faction && dataHelpers.factionExists(data.faction)) {
            let playerName = data.name
            playerName += Object.keys(players).some(id => players[id].name === playerName) ? '#' + (uniqueID++).toString() : ''
            Logger.log(socket.id, 'Player registered with name ' + data.name + ' and faction ' + data.faction)

            players[socket.id] = {
                socket,
                name: playerName,
                faction: data.faction,
                gameId: null
            }

            // validate the register
            socket.emit('registered')
        }
        else {
            helpers.sendError(socket, '0002')
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