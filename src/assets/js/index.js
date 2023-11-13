import "../css/index.css";

import Htmx from 'htmx.org';

window.htmx = Htmx;

console.log('initialized htmx');

import Alpine from 'alpinejs';
import persist from '@alpinejs/persist';
import Clipboard from "@ryangjchandler/alpine-clipboard"

Alpine.plugin(persist);
Alpine.plugin(Clipboard);

window.Alpine = Alpine;

console.log('initialized alpinejs');

Alpine.store('darkMode', {
  on: Alpine.$persist(false).as('darkMode'),
  
  toggle() {
    this.on = ! this.on
  }
});

Alpine.start();