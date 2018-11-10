const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io').listen(server)

const LifecycleHandler = require('./js/SocketHandlers/LifecycleHandler')
const QueriesHandler = require('./js/SocketHandlers/QueriesHandler')
const GameHandler = require('./js/SocketHandlers/GameHandler')
const PlayHandler = require('./js/SocketHandlers/PlayHandler')

const Logger = require('./js/Logger/Logger')

const SERVER_PORT = 8080

// Express routing
//=================================================

// express routing for client serving
app.use(express.static(__dirname + '/../client/dist'))
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/../client/dist/index.html')
})

// express routing for the test route (useful during dev)
app.get('/server-test', (req, res) => {
    res.send('use this route to make tests')
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
const games = []

/**
 * @typedef {Object} PlayerObj
 * @property {socket} socket the players's io socket
 * @property {string} name the players's name
 * @property {string} socket the players's faction
 * @property {(string|null)} socket the players's game id
 */
const players = {}

io.on('connection', socket =>
{
    Logger.log(socket.id, 'new connection !')

    const lifecycleHandler = new LifecycleHandler(io, socket, players, games)
    lifecycleHandler.bindSockets()

    const queriesHandler = new QueriesHandler(io, socket, players, games)
    queriesHandler.bindSockets()

    const gameHandler = new GameHandler(io, socket, players, games)
    gameHandler.bindSockets()

    const playHandler = new PlayHandler(io, socket, players, games)
    playHandler.bindSockets()
    
    // Disconnect
    socket.on('disconnect', () => {
        if (players[socket.id]) {
            gameHandler.destroyGame()
        }
        delete players[socket.id]
    })
})

server.listen(SERVER_PORT)
Logger.log('SERVER', 'Server running at localhost:8080/')
