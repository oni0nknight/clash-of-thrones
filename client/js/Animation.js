'use strict'

import Logger from './Logger'
import { GAME } from './Constants'

const Animations = {
    unitRemoved: {
        duration: 800,
        computeNextState: (currentState, change) => {
            // TODO
            return currentState
        },
        animate: (currentState, change, context) => {
            Logger.log(`Animating ${change.type}`)
        }
    },
    unitMoved: {
        duration: 0,
        computeNextState: (currentState, change) => {
            // TODO
            return currentState
        },
        animate: (currentState, change, context) => {
            Logger.log(`Animating ${change.type}`)
        }
    },
    unitAdded: {
        duration: 800,
        computeNextState: (currentState, change) => {
            // TODO
            return currentState
        },
        animate: (currentState, change, context) => {
            Logger.log(`Animating ${change.type}`)
        }
    },
    attackPackFormed: {
        duration: 800,
        computeNextState: (currentState, change) => {
            // TODO
            return currentState
        },
        animate: (currentState, change, context) => {
            Logger.log(`Animating ${change.type}`)
        }
    },
    wallFormed: {
        duration: 800,
        computeNextState: (currentState, change) => {
            // TODO
            return currentState
        },
        animate: (currentState, change, context) => {
            Logger.log(`Animating ${change.type}`)
        }
    },
    wallEvolved: {
        duration: 800,
        computeNextState: (currentState, change) => {
            // TODO
            return currentState
        },
        animate: (currentState, change, context) => {
            Logger.log(`Animating ${change.type}`)
        }
    },
    wallAbility: {
        duration: 500,
        computeNextState: (currentState, change) => {
            // TODO
            return currentState
        },
        animate: (currentState, change, context) => {
            Logger.log(`Animating ${change.type}`)
        }
    },
    attack: {
        duration: 1200,
        computeNextState: (currentState, change) => {
            // TODO
            return currentState
        },
        animate: (currentState, change, context) => {
            Logger.log(`Animating ${change.type}`)
        }
    },
    turnChanged: {
        duration: 1200,
        computeNextState: (currentState, change) => {
            const turn = currentState.turn === 'field1' ? 'field2' : 'field1'
            return { ...currentState, turn}
        },
        animate: (currentState, change, context) => {
            // Create the text
            const message = currentState.turn === context.fieldId ? 'Ennemy\'s Turn' : 'Your Turn'
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

export function Animate(currentState, concurrentChanges, context) {
    return new Promise((resolve, reject) => {
        let duration = 0
        let newState = currentState

        concurrentChanges.forEach(change => {
            const anim = Animations[change.type]
            if (anim) {
                // play the animation
                anim.animate(currentState, change, context)

                // compute max duration
                duration = Math.max(duration, anim.duration)

                // compute next state if there is a difference
                if (anim.computeNextState) {
                    newState = anim.computeNextState(newState, change)
                }
            }
        })

        // Create a timer for promise resolve
        setTimeout(() => resolve(newState), duration)
    })
}

export default { Animate }
