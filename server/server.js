const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io').listen(server)

const lifecycleHandler = require('./js/SocketHandlers/LifecycleHandler')
const queriesHandler = require('./js/SocketHandlers/queriesHandler')
const gameHandler = require('./js/SocketHandlers/GameHandler')
const playHandler = require('./js/SocketHandlers/PlayHandler')


// Express routing
//=================================================

// express routing for client serving
app.use(express.static(__dirname + '/../client/dist'))
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/../client/dist/index.html')
})

// express routing for the test route (useful during dev)
app.get('/server-test', (req, res) => {
    const Game = require("./js/GameElements/Game")
    const gameData = require("./assets/data.json")

    const factions = gameData.factions
    const game = new Game(7, 6, factions[0], factions[0], 8)
    res.send(game.serialize())
})


// Socket.io server
//=================================================

/**
 * @typedef {Object} GameObj
 * @property {string} id game unique ID
 * @property {string} playerId socket ID of the host player
 * @property {string} playerName name of the host player
 * @property {string} gameName game name
 * @property {string} joinedPlayerId socket ID of the join player
 * @property {(Game|null)} gameInstance the Game instance. null if not started
 */
let games = []

/**
 * @typedef {Object} PlayerObj
 * @property {socket} socket the players's io socket
 * @property {string} name the players's name
 * @property {string} socket the players's faction
 * @property {(string|null)} socket the players's game id
 */
let players = {}

io.on('connection', socket => 
{
    console.log(socket.id + ' :: ' + 'new connection !')

    lifecycleHandler.bindSocket(io, socket, players, games)
    queriesHandler.bindSocket(io, socket, players, games)
    gameHandler.bindSocket(io, socket, players, games)
    playHandler.bindSocket(io, socket, players, games)
});

server.listen(8080)
console.log('Server running at localhost:8080/')
