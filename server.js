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

let pendingGames = []
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
            id: socket.id,
            name: playerName,
            faction: data.faction,
            game: null
        }
    })

    socket.on('disconnect', () => {
        if (players[socket.id]) {
            const playerName = players[socket.id].name
            pendingGames = pendingGames.filter(pg => (pg.playerName !== playerName))
        }
    })

    // calls
    //=======================================

    socket.on('hostGame', (gameName) => {
        const pendingGameId = generateUUID()
        if (players[socket.id]) {
            pendingGames.push({
                id: pendingGameId,
                playerName: players[socket.id].name,
                gameName: gameName
            })
        }
    })


    // queries
    //=======================================

    socket.on('pendingGames', () => {
        socket.emit('pendingGames_response', pendingGames)
    })

    socket.on('factions', () => {
        socket.emit('factions_response', gameData.factions)
    })
});

function generateUUID() {
    return 'xxxxxxxx-pending-xxxxxxxx'.replace(/[x]/g, () => {
        return (Math.random() * 16 | 0).toString(16)
    })
}

function playerNameExists(name) {
    return Object.keys(players).some(id => {
        return players[id].name === name
    })
}


server.listen(8080)
console.log('Server running at localhost:8080/')
