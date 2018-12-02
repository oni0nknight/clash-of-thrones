'use strict'

export const GAME = {
    WIDTH: 380,
    HEIGHT: 680
}

export const SPRITE_SIZE = 40
export const GHOST_ALPHA = 0.2

export const FIELD = {
    X : 30,
    Y : 339,
    WIDTH : 8,
    HEIGHT : 6
}

export const ENNEMY_FIELD = {
    Y : 259
}

export const UI = {
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

export const UNIT_COLORS = {
    green: 0,
    red: 1,
    blue: 2,
    yellow: 3,
    white: 4,
    purple: 5
}
