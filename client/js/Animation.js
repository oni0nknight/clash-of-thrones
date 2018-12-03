'use strict'

import Logger from './Logger'
import { GAME } from './Constants'

const Animations = {
    // An unit is removed
    unitRemoved: {
        duration: 1200,
        animate: (currentState, change, context) => {
            Logger.log(`Animating ${change.name}`)
        }
    },

    // An unit is moved
    unitMoved: {
        duration: 0,
        animate: (currentState, change, context) => {
            Logger.log(`Animating ${change.name}`)
        }
    },

    // An unit is added to the field
    unitsAdded: {
        duration: 2000,
        animate: (currentState, change, context) => {
            Logger.log(`Animating ${change.name}`)
        }
    },

    // An unit attack pack is created
    attackPackFormed: {
        duration: 1000,
        animate: (currentState, change, context) => {
            Logger.log(`Animating ${change.name}`)
        }
    },

    // An unit attack pack has evolved
    attackPackEvolved: {
        duration: 1500,
        animate: (currentState, change, context) => {
            Logger.log(`Animating ${change.name}`)
        }
    },

    // A wall is created
    wallsFormed: {
        duration: 1500,
        animate: (currentState, change, context) => {
            Logger.log(`Animating ${change.name}`)
        }
    },

    // Two walls are merged
    wallsMoved: {
        duration: 900,
        animate: (currentState, change, context) => {
            Logger.log(`Animating ${change.name}`)
        }
    },

    // A wall executes its ability
    wallAbility: {
        duration: 1500,
        animate: (currentState, change, context) => {
            Logger.log(`Animating ${change.name}`)
        }
    },

    // A packed unit performs an attack
    attack: {
        duration: 2000,
        animate: (currentState, change, context) => {
            Logger.log(`Animating ${change.name}`)
        }
    },

    // The turn changes
    turnChanged: {
        duration: 1200,
        animate: (currentState, change, context) => {
            Logger.log(`Animating ${change.name}`)

            // Create the text
            const message = currentState.turn === context.fieldId ? 'Your Turn' : 'Ennemy\'s Turn'
            const style = { font: '30px Helvetica', backgroundColor: '1a1a1a', fill: '#e5e5e5', boundsAlignH: 'center', boundsAlignV: 'middle' }
            const text = new Phaser.Text(context.game, 0, 0, message, style)
            text.setTextBounds(0, 0, GAME.WIDTH, GAME.HEIGHT)
            text.alpha = 0.7

            // Add it to the view
            context.gameObjects.ui.add(text)

            // Remove it after duration
            setTimeout(() => {
                context.gameObjects.ui.remove(text, true)
            }, Animations.turnChanged.duration)
        }
    }
}

export function Animate(currentState, change, context) {
    return new Promise((resolve, reject) => {
        let duration = 0
        const newState = change.newState

        const anim = Animations[change.name]
        if (anim) {
            // play the animation
            anim.animate(currentState, change, context)

            // use the found animation duration
            duration = anim.duration
        }

        // Create a timer for promise resolve
        setTimeout(() => resolve(newState), duration)
    })
}
