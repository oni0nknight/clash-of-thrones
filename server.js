const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io').listen(server)

// express routing
app.use(express.static(__dirname + '/public'))
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
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

io.on('connection', socket => {
    console.log('new connection...')

    // add the new player
    players[socket.id] = {}
    
    socket.on('register', (data) => {
        console.log('player registration : ' + data.playerName + ' in team ' + data.playerColor)

        let playerName = data.playerName
        playerName += playerNameExists(playerName) ? (uniqueID++).toString() : ''

        players[socket.id] = {
            id: socket.id,
            name: data.playerName,
            x: Math.floor(Math.random() * 700) + 50,
            y: Math.floor(Math.random() * 500) + 50,
            rotation: 0,
            team: data.playerColor
        }

        // send the playerInfos to every other connected player
        socket.broadcast.emit('playerJoined', players[socket.id])

        // send the playerInfos to the new player
        socket.emit('initPlayers', players)
        // send the star object to the new player
        socket.emit('starLocation', star);
        // send the current scores
        socket.emit('scoreUpdate', scores);
    })

    socket.on('playerMove', ({ x, y, rotation }) => {
        players[socket.id].x = x
        players[socket.id].y = y
        players[socket.id].rotation = rotation
        socket.broadcast.emit('playerMoved', players[socket.id])
    })

    socket.on('starCollected', () => {
        scores[players[socket.id].team] += 1

        star.x = Math.floor(Math.random() * 700) + 50
        star.y = Math.floor(Math.random() * 500) + 50
        io.emit('starLocation', star)
        io.emit('scoreUpdate', scores)
    })

    socket.on('disconnect', () => {
        console.log('player disconnected : ' + players[socket.id].name)
        io.emit('playerLeft', socket.id)
        delete players[socket.id]

        // reinit game if last player left
        if (Object.keys(io.sockets.sockets).length === 0) {
            star.x = Math.floor(Math.random() * 700) + 50
            star.y = Math.floor(Math.random() * 500) + 50
            scores.blue = 0
            scores.red = 0
            uniqueID = 0
        }
    })
});

const playerNameExists = (name) => {
    return Object.keys(players).some(id => {
        return players[id].name === name
    })
}

server.listen(3000)

console.log('Server running at localhost:3000/')
