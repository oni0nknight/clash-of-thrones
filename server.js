const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io').listen(server)

const Game = require("./server/js/GameElements/Game")

// express routing for client download
app.use(express.static(__dirname + '/client/dist'))
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/dist/index.html')
})

app.get('/server-test', (req, res) => {
    const game = new Game(7, 6, factions[0], factions[0], 8)
    res.send(game.field1.height.toString())
})

// socket.io server	
const factions = [
    {
        id: 'targaryens',
        units: {
            normal: {
                idleStrength: 1,
                packedBaseStrength: 1,
                attackDelay: 1,
                strengthGain: 1
            },
            elite: {
                idleStrength: 2,
                packedBaseStrength: 4,
                attackDelay: 2,
                strengthGain: 2
            }
        },
        colors: [
            '#ff0000', '#00ff00', '#0000ff'
        ],
        playerStats: {
            health: 12,
            allowedMoves: 3,
            eliteCount: 7
        }
    }
]

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
