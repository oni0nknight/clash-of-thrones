window.PIXI = require('phaser-ce/build/custom/pixi')
window.p2 = require('phaser-ce/build/custom/p2')
window.Phaser = require('phaser-ce/build/custom/phaser-split')

// main frame
import _frame from '../assets/frame.png'

// spritesheets
import _targaryensNormal from '../assets/sprites/targaryensNormal.png'
import _targaryensNormalPacked from '../assets/sprites/targaryensNormalPacked.png'
import _targaryensElite from '../assets/sprites/targaryensElite.png'
import _targaryensElitePacked from '../assets/sprites/targaryensElitePacked.png'
import _targaryensWall from '../assets/sprites/targaryensWall.png'

// UI
import _endOfTurn from '../assets/UI/end_of_turn.png'
import _mana from '../assets/UI/manaFrame.png'
import _units from '../assets/UI/unitsFrame.png'


const SPRITE_SIZE = 40
const GHOST_ALPHA = 0.2

const FIELD = {
    X : 30,
    Y : 339,
    WIDTH : 8,
    HEIGHT : 6
}
FIELD.RECT = new Phaser.Rectangle(FIELD.X, FIELD.Y, FIELD.WIDTH * SPRITE_SIZE, FIELD.HEIGHT * SPRITE_SIZE)

const ENNEMY_FIELD = {
    Y : 259
}

const UI = {
    END_TURN : {
        X : 319,
        Y : 589
    },
    MANA : {
        X : 109,
        Y : 589
    },
    UNITS : {
        X : 271,
        Y : 589
    },
    HEALTH: {
        X : 24,
        Y : 589,
        FRAME: {
            W : 75,
            H : 37
        }
    },
    ENNEMY_HEALTH: {
        X : 281,
        Y : 12,
        FRAME: {
            W : 75,
            H : 37
        }
    }
}

const spriteFrames = {
    green: 0,
    red: 1,
    blue: 2,
    yellow: 3,
    white: 4,
    purple: 5
}

export default class Game {
    constructor(client, isHost) {
        this.game = null
        this.client = client
        
        this.playerName = null
        this.faction = null

        this.fieldId = isHost ? 'field1' : 'field2'

        this.lastGameState = null

        this.gameObjects = {
            frame: null,
            fields: {
                field1: null,
                field2: null
            },
            actions: null,
            ui: null
        }

        this.receiveState = this.receiveState.bind(this)
    }

    initialize(playerName, faction) {
        this.playerName = playerName
        this.faction = faction

        const config = {
            renderer: Phaser.AUTO,
            parent: 'game-container',
            width: 380,
            height: 680,
            state: {
                init: this.init.bind(this),
                preload: this.preload.bind(this),
                create: this.create.bind(this),
                update: this.update.bind(this)
            }
        }
           
        this.game = new Phaser.Game(config)
    }

    // Phaser lifecycle
    //============================================

    init() {
        // scale to fit page
        this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL
        this.game.scale.pageAlignVertically = true
        this.game.scale.pageAlignHorizontally = true
    }

    preload() {
        this.game.load.image('frame', _frame)
        
        // sprites
        this.game.load.spritesheet('targaryens-normal', _targaryensNormal, SPRITE_SIZE, SPRITE_SIZE)
        this.game.load.spritesheet('targaryens-elite', _targaryensElite, SPRITE_SIZE, SPRITE_SIZE * 2)
        this.game.load.spritesheet('targaryens-wall', _targaryensWall, SPRITE_SIZE, SPRITE_SIZE)
        this.game.load.spritesheet('targaryens-normal-packed', _targaryensNormalPacked, SPRITE_SIZE, SPRITE_SIZE * 3)
        this.game.load.spritesheet('targaryens-elite-packed', _targaryensElitePacked, SPRITE_SIZE, SPRITE_SIZE * 3)

        // UI
        this.game.load.image('endOfTurn', _endOfTurn)
        this.game.load.image('mana', _mana)
        this.game.load.image('units', _units)
    }

    create() {
        this.gameObjects.frame = this.game.add.image(0, 0, 'frame')

        this.gameObjects.fields.field1 = this.game.add.group()
        this.gameObjects.fields.field2 = this.game.add.group()

        this.gameObjects.actions = this.game.add.group()
        this.gameObjects.ui = this.game.add.group()

        // subscibe to events
        this.client.subscribe('gameState_push', this.receiveState)

        // init game state
        this.updateGameState()
    }

    update() {
    }

    destroy() {
        // unsubscribe to events
        this.client.unsubscribe('gameState_push', this.receiveState)

        // warn the server
        this.client.call('leaveGame')

        // destroy Phaser game
        this.game.destroy()
    }

    // Response handler
    //============================================

    receiveState(response) {
        const gameState = response.gameState
        this.refresh(gameState)
    }

    // Helpers
    //============================================

    updateGameState() {
        return this.client.query('gameState').then(this.receiveState)
    }

    displayUnit(fieldId, col, row, unit, options) {
        // find spritesheet
        const spritesheet = this.faction + '-' + unit.type + (unit.packed ? '-packed' : '')

        // compute position
        const xpos = FIELD.X + col * SPRITE_SIZE
        let ypos = 0
        if (fieldId === this.fieldId) {
            // field of the player
            ypos = FIELD.Y + row * SPRITE_SIZE
        }
        else {
            // field of the ennemy
            ypos = ENNEMY_FIELD.Y - row * SPRITE_SIZE
        }

        // instanciate sprite
        const sprite = new Phaser.Sprite(this.game, xpos, ypos, spritesheet, spriteFrames[unit.color])
        sprite.name = unit.uuid
        sprite.unit = unit

        if (options.bindDelete) {
            // enable inputs
            sprite.inputEnabled = true

            // bind button for delete
            sprite.events.onInputUp.add(this.deleteUnit, { context: this })
        }

        if (options.bindDrag) {
            // enable inputs
            sprite.inputEnabled = true

            // bind button for drag
            sprite.events.onInputDown.add(this.enableDrag, { context: this })

            // bind drag update & stop
            sprite.events.onDragUpdate.add(this.onDragUpdate, { context: this })
            sprite.events.onDragStop.add(this.onDragStop, { context: this })

            // define bounds of drag
            sprite.input.boundsRect = FIELD.RECT

            // create ghost sprite
            const ghostSprite = new Phaser.Sprite(this.game, xpos, ypos, spritesheet, spriteFrames[unit.color])
            ghostSprite.name = unit.uuid + '_ghost'
            ghostSprite.alpha = GHOST_ALPHA
            sprite.ghost = ghostSprite
            this.gameObjects.fields[fieldId].add(ghostSprite)
        }
        
        // add it to the right group
        this.gameObjects.fields[fieldId].add(sprite)

        // packed unit strength
        if (unit.packed || unit.type === 'wall') {
            const strengthStyle = { font: '20px Helvetica', fill: '#e7d3d3', backgroundColor: '#454545', boundsAlignH: 'center', boundsAlignV: 'middle' }
            const strengthText = new Phaser.Text(this.game, 0, 0, unit.strength, strengthStyle)
            strengthText.setTextBounds(xpos, ypos + 2, SPRITE_SIZE, SPRITE_SIZE)
            strengthText.alpha = 0.9
            this.gameObjects.actions.add(strengthText)
        }
    }

    removeUnit(sprite) {
        this.client.call('removeUnit', { uuid: sprite.name })
    }

    moveUnit(sprite, newColId) {
        this.client.call('moveUnit', { uuid: sprite.name, newColId })
    }


    // Events
    //============================================

    refresh(gameState) {
        if (!gameState) {
            return
        }

        this.lastGameState = gameState
        const isMyTurn = (gameState.turn === this.fieldId)
        const hasMana = gameState[this.fieldId].player.mana > 0
        const fieldIds = ['field1', 'field2']

        // clean action layer
        this.gameObjects.actions.removeAll()

        // rebuild fields
        fieldIds.forEach(fieldId => {
            const isMyUnit = (fieldId === this.fieldId)

            // destroy every unit sprite
            this.gameObjects.fields[fieldId].removeAll(true)

            // rebuild all unit sprites
            gameState[fieldId].grid.forEach((col, colId) => {
                // 1st unit of each enemy column : its row depends on its size
                let currentRow = 0
                if (fieldId !== this.fieldId && col[0]) {
                    currentRow = col[0].size - 1
                }
                col.forEach((unit, idx, units) => {
                    
                    const options = {
                        bindDelete: isMyTurn && isMyUnit && hasMana,
                        bindDrag: isMyTurn && isMyUnit && hasMana && unit.movable && (idx === units.length - 1)
                    }
                    this.displayUnit(fieldId, colId, currentRow, unit, options)

                    if (fieldId === this.fieldId) {
                        currentRow += unit.size
                    }
                    else if (fieldId !== this.fieldId && col[idx+1]) {
                        currentRow += col[idx+1].size
                    }
                })
            })
        })

        // rebuild UI
        this.buildUI(gameState)
    }

    buildUI(gameState) {
        // remove all UI elements
        this.gameObjects.ui.removeAll(true)

        // health texts
        const healthStyle = { font: '30px Helvetica', fill: '#1a1a1a', boundsAlignH: 'center', boundsAlignV: 'middle' }
        const otherField = this.fieldId === 'field1' ? 'field2' : 'field1'
        const healthText = new Phaser.Text(this.game, 0, 0, gameState[this.fieldId].player.health, healthStyle)
        const ennemyHealthText = new Phaser.Text(this.game, 0, 0, gameState[otherField].player.health, healthStyle)
        healthText.setTextBounds(UI.HEALTH.X, UI.HEALTH.Y + 2, UI.HEALTH.FRAME.W, UI.HEALTH.FRAME.H)
        ennemyHealthText.setTextBounds(UI.ENNEMY_HEALTH.X, UI.ENNEMY_HEALTH.Y + 2, UI.ENNEMY_HEALTH.FRAME.W, UI.ENNEMY_HEALTH.FRAME.H)
        this.gameObjects.ui.add(healthText)
        this.gameObjects.ui.add(ennemyHealthText)

        // reinforcement counter frame
        const unitsFrame = new Phaser.Button(this.game, UI.UNITS.X, UI.UNITS.Y, 'units', this.reinforce, this)
        this.gameObjects.ui.add(unitsFrame)
        // reinforcement counter text
        const unitsStyle = { font: '30px Helvetica', fill: '#1a1a1a', boundsAlignH: 'center', boundsAlignV: 'middle' }
        const unitsText = new Phaser.Text(this.game, 0, 0, gameState[this.fieldId].player.reinforcement, unitsStyle)
        unitsText.setTextBounds(UI.UNITS.X, UI.UNITS.Y + 2, unitsFrame.width, unitsFrame.height)
        this.gameObjects.ui.add(unitsText)

        // specific UI when it is player's turn
        const isMyTurn = (gameState.turn === this.fieldId)
        if (isMyTurn) {
            // end-of-turn button
            const button = new Phaser.Button(this.game, UI.END_TURN.X, UI.END_TURN.Y, 'endOfTurn', this.endTurn, this)
            this.gameObjects.ui.add(button)

            // mana counter frame
            const manaFrame = new Phaser.Image(this.game, UI.MANA.X, UI.MANA.Y, 'mana')
            this.gameObjects.ui.add(manaFrame)
            // mana counter text
            const manaStyle = { font: '30px Helvetica', fill: '#1a1a1a', boundsAlignH: 'center', boundsAlignV: 'middle' }
            const manaText = new Phaser.Text(this.game, 0, 0, gameState[this.fieldId].player.mana, manaStyle)
            manaText.setTextBounds(UI.MANA.X, UI.MANA.Y + 2, manaFrame.width, manaFrame.height)
            this.gameObjects.ui.add(manaText)
        }
    }

    endTurn() {
        this.client.call('endTurn')
    }

    // Input handlers
    //============================================

    deleteUnit(sprite, pointer) {
        const pointerOnSprite = sprite.getBounds().contains(pointer.x, pointer.y)
        if (pointer.rightButton.justReleased() && pointerOnSprite) {
            this.context.removeUnit(sprite)
        }
    }

    enableDrag(sprite, pointer) {
        if (pointer.leftButton.justPressed()) {
            sprite.input.enableDrag(true)
        }
    }

    onDragUpdate(sprite, pointer, x, y, snapPoint) {
        // update ghost position if drag is from left button
        if (pointer.leftButton.isDown && this.context.lastGameState && sprite.ghost) {
            const colId = Number.parseInt((pointer.x - FIELD.X) / SPRITE_SIZE)
            const column = this.context.lastGameState[this.context.fieldId].grid[colId]

            // set to front
            this.context.gameObjects.fields[this.context.fieldId].bringToTop(sprite)

            // if column found
            if (column) {
                const columnSize = column.reduce((acc, unit) => {
                    return acc + (unit.uuid !== sprite.name ? unit.size : 0)
                }, 0)

                // update ghost sprite position
                sprite.ghost.x = FIELD.X + colId * SPRITE_SIZE
                sprite.ghost.y = FIELD.Y + columnSize * SPRITE_SIZE

                // hide ghost if no place left
                sprite.ghost.alpha = (columnSize + sprite.unit.size > FIELD.HEIGHT) ? 0 : GHOST_ALPHA
            }
        }
    }
    
    onDragStop(sprite, pointer) {
        // make (or cancel) the move
        if (pointer.leftButton.justReleased() && this.context.lastGameState && sprite.ghost) {
            const lastColId = this.context.lastGameState[this.context.fieldId].grid.findIndex(col => {
                return !!col.find(unit => unit.uuid === sprite.name)
            })

            // get new column from ghost's position
            const newColId = Number.parseInt((sprite.ghost.x - FIELD.X) / SPRITE_SIZE)
            if (lastColId !== -1 && lastColId !== newColId) {
                // make the move
                this.context.moveUnit(sprite, newColId)
            }
            else {
                // rebuild last state
                this.context.refresh(this.context.lastGameState)
            }
        }
    }

    reinforce(image, pointer) {
        if (pointer.leftButton.justReleased()) {
            this.client.call('reinforce')
        }
    }
}