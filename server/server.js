const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io').listen(server)

const Game = require("./js/GameElements/Game")
const gameData = require("./assets/data.json")


// Express routing
//=================================================

// express routing for client serving
app.use(express.static(__dirname + '/../client/dist'))
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/../client/dist/index.html')
})

// express routing for the test route (useful during dev)
app.get('/server-test', (req, res) => {
    const factions = gameData.factions
    const game = new Game(7, 6, factions[0], factions[0], 8)
    res.send(game.field1.height.toString())
})


// Socket.io server
//=================================================

let games = []
let uniqueID = 0
let players = {}

io.on('connection', socket => 
{
    // lifecycle
    //=======================================

    socket.on('register', (data) => {
        let playerName = data.name
        playerName += playerNameExists(playerName) ? '#' + (uniqueID++).toString() : ''

        players[socket.id] = {
            socket: socket,
            name: playerName,
            faction: data.faction,
            gameId: null
        }
    })

    socket.on('disconnect', () => {
        if (players[socket.id]) {
            destroyGame(socket)
        }
        delete players[socket.id]
    })

    // calls
    //=======================================

    socket.on('createGame', (gameName) => {
        if (!players[socket.id]) {
            sendError(socket, 'Player must be registered to use this feature')
            return;
        }
        serverLog(socket.id, 'requesting to create game ' + gameName)
        if (players[socket.id].gameId == null) {
            // create the game
            const game = {
                id: generateUUID(),
                playerId: socket.id,
                playerName: players[socket.id].name,
                gameName: gameName,
                joinedPlayerId: null,
                lastGameState: null
            }

            // add it to games list
            games.push(game)

            // add a reference to it in player structure
            players[socket.id].gameId = game.id
        }
    })

    socket.on('joinGame', (gameId) => {
        if (!players[socket.id]) {
            sendError(socket, 'Player must be registered to use this feature')
            return;
        }
        serverLog(socket.id, 'requesting to join game ' + gameId)
        const game = games.find(g => g.id === gameId)
        if (game && players[socket.id].gameId == null && game.playerId != null && players[game.playerId]) {
            // join the game
            game.joinedPlayerId = socket.id
            
            // notify both players that the game is ready
            socket.emit('gameReady')
            players[game.playerId].socket.emit('gameReady')
        } else {
            sendError(socket, 'Error while joining game')
        }
    })
    
    socket.on('startGame', () => {
        if (!players[socket.id]) {
            sendError(socket, 'Player must be registered to use this feature')
            return;
        }
        serverLog(socket.id, 'requesting to start game')
        if (players[socket.id].gameId != null) {
            const game = games.find(g => g.id === players[socket.id].gameId)

            if (game && game.playerId === socket.id && game.joinedPlayerId != null && players[game.joinedPlayerId]) {
                const hostPlayer = players[socket.id]
                const joinedPlayer = players[game.joinedPlayerId]
                const gameObj = new Game(7, 6, hostPlayer.faction, joinedPlayer.faction, 8)

                // initialize game

                // generate game state & set it to game.lastGameState

                // send the game state to the 2 players
            }
        } else {
            sendError(socket, 'Must host or join a game first')
        }
    })

    socket.on('destroyGame', () => {
        if (!players[socket.id]) {
            sendError(socket, 'Player must be registered to use this feature')
            return;
        }
        serverLog(socket.id, 'requesting to destroy game')
        destroyGame(socket)
    })


    // queries
    //=======================================

    socket.on('pendingGames', () => {
        serverLog(socket.id, 'requesting pending games')
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
        serverLog(socket.id, 'requesting factions')
        socket.emit('factions_response', gameData.factions)
    })
});

function serverLog(socketId, message) {
    console.log(socketId + ' :: ' + message)
}

function sendError(socket, errorMessage) {
    socket.emit('err', errorMessage)
}

function generateUUID() {
    return 'xxxxxxxx-game-xxxxxxxx'.replace(/[x]/g, () => {
        return (Math.random() * 16 | 0).toString(16)
    })
}

function playerNameExists(name) {
    return Object.keys(players).some(id => {
        return players[id].name === name
    })
}

function destroyGame(socket) {
    if (players[socket.id].gameId != null)
    {
        // retrieve game infos before removing
        const game = games.find(g => g.id === players[socket.id].gameId)

        if (game && game.playerId === socket.id) {
            serverLog(socket.id, 'destroying game ' + game.gameName)

            // remove game from games list
            games.splice(games.indexOf(game), 1)

            // remove the reference in player structure
            players[socket.id].gameId = null

            // Notify both players that the game is destroyed
            socket.emit('gameDestroyed')
            if (game.joinedPlayerId != null && players[game.joinedPlayerId]) {
                players[game.joinedPlayerId].socket.emit('gameDestroyed')
            }

            serverLog(socket.id, 'new games list : ')
            serverLog(socket.id, games)
        } else {
            sendError(socket, 'You do not have the permission required for this action')
        }
    }
}


server.listen(8080)
console.log('Server running at localhost:8080/')
