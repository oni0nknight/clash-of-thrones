const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io').listen(server)

const Game = require("./server/js/GameElements/Game")
const gameData = require("./server/assets/data.json")


// Express routing
//=================================================

// express routing for client serving
app.use(express.static(__dirname + '/client/dist'))
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/dist/index.html')
})

// express routing for the test route (useful during dev)
app.get('/server-test', (req, res) => {
    const factions = gameData.factions
    const game = new Game(7, 6, factions[0], factions[0], 8)
    res.send(game.field1.height.toString())
})


// Socket.io server
//=================================================

const players = {}

io.on('connection', socket => {
    console.log('new connection...')

    // add the new player
    players[socket.id] = {}
    
    socket.on('register', (data) => {
        console.log('player registration : ' + data.playerName + ' in team ' + data.playerColor)
        players[socket.id] = {
            name: data.playerName,
            team: data.playerColor
        }
        socket.emit('registered', 'youhou !!!');
    })

    socket.on('disconnect', () => {
        console.log('player disconnected : ' + players[socket.id].name)
        delete players[socket.id]
    })
});

server.listen(8080)
console.log('Server running at localhost:8080/')
