'use strict'

const helpers = require('./Helpers')
const gameData = require('../../assets/data.json')

const GameHandler = require('./GameHandler')

let uniqueID = 0

const bindSocket = (socket, players, games) => {

    socket.on('register', (data) => {
        helpers.serverLog(socket.id, 'requesting to register player ' + data.name + ' with faction ' + data.faction)

        let playerName = data.name
        playerName += Object.keys(players).some(id => players[id].name === playerName) ? '#' + (uniqueID++).toString() : ''
        let faction = gameData.factions.find(faction => faction.id === data.faction)

        if (playerName && faction) {
            players[socket.id] = {
                socket: socket,
                name: playerName,
                faction: faction,
                gameId: null
            }
        } else {
            helpers.sendError(socket, 'this faction doesn\'t exists. Impossible to register player')
        }
    })

    socket.on('disconnect', () => {
        if (players[socket.id]) {
            GameHandler.destroyGame(socket)
        }
        delete players[socket.id]
    })
}

module.exports = {
    bindSocket
}