'use strict'

const Logger = require('../Logger/Logger')
const gameData = require('../../assets/data.json')

const bindSocket = (socket, players, games) => {

    socket.on('pendingGames', () => {
        Logger.log(socket.id, 'requesting pending games')
        const pendingGames = games.filter(g => g.joinedPlayerId == null).map(g => {
            return {
                id: g.id,
                gameName: g.gameName,
                playerName: g.playerName
            }
        })

        socket.emit('pendingGames_response', pendingGames)
    })

    socket.on('factions', () => {
        Logger.log(socket.id, 'requesting factions')
        socket.emit('factions_response', gameData.factions)
    })

    socket.on('players', () => {
        Logger.log(socket.id, 'requesting players')
        const data = Object.values(players).map(pl => ({name: pl.name, faction: pl.faction, playing: !!pl.gameId}))
        socket.emit('factions_response', data)
    })
}

module.exports = {
    bindSocket
}