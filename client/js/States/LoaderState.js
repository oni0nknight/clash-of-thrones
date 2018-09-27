import AppState from './AppState'
import $ from 'jquery'

export default class LoaderState extends AppState {
    constructor(client) {
        super(client)

        this.next = null
        this.nextArgs = []
        this.event = null

        this.dom = {
            header: $('#header'),
            form: $('#loader')
        }

        this.nextStep = this.nextStep.bind(this)
    }

    start({next, args = [], event} = {}) {
        this.next = next
        this.nextArgs = args
        this.event = event
    }

    stop() {}

    bindEvents() {
        if (this.event) {
            this.client.subscribe(this.event, this.nextStep)
        }
    }

    unBindEvents() {
        this.client.unsubscribe(this.event, this.nextStep)
    }

    show() {
        this.dom.header.show()
        this.dom.form.show()
    }

    hide() {
        this.dom.header.hide()
        this.dom.form.hide()
    }

    nextStep() {
        if (this.next) {
            this.switchToState(this.next, ...this.nextArgs)
        } else {
            console.error('LoaderState', '::', 'Unknown next state')
        }
    }
}