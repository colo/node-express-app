'use strict'
var Moo = require("mootools")

let use = function(app){
  return extended(app)
}
let extended = function(EApp){

	let ExpressApp = new Class({
		Extends: EApp,

		socket: function(socket){

      socket.on('disconnect', function () {

      });
    },
    use: function(mount, app){
      // if(instanceOf(app, EApp))//extends apps tu support io
      //   app = use(app)
      app.io = this.io.of(mount)
  		this.parent(mount, app)
    },
	})


	return ExpressApp
}

module.exports = extended
