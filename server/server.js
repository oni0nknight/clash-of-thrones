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

let games = []
let players = {}

io.on('connection', socket => 
{
    lifecycleHandler.bindSocket(socket, players, games)
    queriesHandler.bindSocket(socket, players, games)
    gameHandler.bindSocket(socket, players, games)
    playHandler.bindSocket(socket, players, games)
});

server.listen(8080)
console.log('Server running at localhost:8080/')
