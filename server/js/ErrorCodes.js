'use strict'

const errors = {
    '000' : 'Unhandled error',

    '001' : 'Game was destroyed'
}

function get(errorCode) {
    return errors[errorCode] ? errors[errorCode] : errors['000']
}

module.exports = {
    get
}