import Game from './js/Game'
import $ from 'jquery'

window.onload = () => {
    const form = $('#form')
    $('#host-btn').on('click', e => {
        form.addClass('was-validated')

        if (form[0].checkValidity()) {
            hostGame()
        }
    })
    $('#find-btn').on('click', e => {
        form.addClass('was-validated')

        if (form[0].checkValidity()) {
            findGame()
        }
    })
}

function hostGame() {

}

function findGame() {

}