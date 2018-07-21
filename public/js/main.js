import Game from "./GameElements/Game"

console.log("coucou")

const factions = [
  {
    id: "targaryens",
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
    colors: ["#ff0000", "#00ff00", "#0000ff"],
    playerStats: {
      health: 12,
      allowedMoves: 3,
      eliteCount: 7
    }
  }
]

const game = new Game(7, 6, factions[0], factions[0], 8)
