'use strict'
var Moo = require("mootools")

let sharedsession = require("express-socket.io-session")

let use = function(app){
  return extended(app)
}

var debug = require('debug')('express-app:io');
var debug_events = require('debug')('express-app:io:Events');
var debug_internals = require('debug')('express-app:Internals');


let extended = function(EApp){

	let ExpressApp = new Class({
		Extends: EApp,

    // initialize: function(options){
    //   this.parent(options)
    //
    //   //console.log('IO INIT')
    //
    //   if(this.io){
    //     this.io.on('connection', (socket) => this.socket)
    //
    //   }
    // },
    add_io: function(io){
      this.io = io
      this.io.on('connection', function(socket){ this.socket(socket) }.bind(this))
    },
		socket: function(socket){

      if(this.options.io){
        if(this.options.io.rooms){

          Array.each(this.options.io.rooms, function(room){
            socket.join(room, () => {
              let rooms = Object.keys(socket.rooms);
              //console.log(rooms); // [ <socket.id>, 'room 237' ]
            });
          }.bind(this))
        }

        // if(this.options.io.routes)

        this.apply_io_routes(socket)
      }

      // socket.on('disconnect', function () {
      //
      // });
    },
    apply_io_routes: function(socket){

  		if(this.options.io.routes){
  			// let app = this.io;

  			Object.each(this.options.io.routes, function(routes, message){

          let route_index = 0
  				routes.each(function(route){//each array is a route

  					let path = route.path || route_index;

            let currents = [];

            for(let i = route.callbacks.length - 1; i >= 0 ; i--){
              let callback = this.__callback(route.callbacks[i], message)

        			if(i == route.callbacks.length - 1){

                  currents[i] = function(...args){
                    // console.log('arguments LAST ', i, route.callbacks[i], args)
                    args.push(message)
                    args.push(this.uuid+'_io_'+path)

                    callback.attempt([socket, undefined].append(args), this)
                  }.bind(this)

        			}
        			else if(i != 0){

                currents[i] = function(...args){
                  args.push(message)
                  args.push(this.uuid+'_io_'+path)
                  console.log('args ', i, route.callbacks[i], args)

                  callback.attempt([socket, currents[i+1].pass(args)].append(args), this)
                }.bind(this)


        			}

        			if(i == 0){//first filter, start running

                currents[i] = function(...args){
                  // console.log('arguments ', i, route.callbacks[i], args)

                  args.push(message)
                  args.push(this.uuid+'_io_'+path)
                  callback.attempt([socket, currents[i+1].pass(args, this)].append(args), this)

                }.bind(this)

                if(route.once && route.once === true){
                  socket.once(message, currents[i])
                }
                else{
                  socket.on(message, currents[i])
                }

        			}

        		}//end loop

  					var perms = [];

						perms.push(this.create_authorization_permission(message, this.uuid+'_io_'+path));

            this.apply_authorization_permissions(perms);
            //
  					this.apply_authorization_roles_permission(route, perms);

            debug('created perms', message, route, perms)
            route_index++
  				}.bind(this));

  			}.bind(this));
  		}

    },
    __callback: function(fn, message){
      let callback = (typeof(fn) == 'function') ? fn : this[fn].bind(this);

      if(process.env.PROFILING_ENV && this.logger){
        // console.log('PROFILING_ENV')
        var profile = 'ID['+this.options.id+']:IO:MESSAGE['+message+']:CALLBACK['+fn+']';

        var profiling = function(){
          // console.log('---profiling...'+profile);
          this.profile(profile);

          callback.attempt(arguments, this);

          this.profile(profile);
          //////console.log('---end profiling...'+profile);
        }.bind(this);

        // callbacks.push(profiling);
        return profiling
      }
      else{
        return callback
      }

    },
    use: function(mount, app){
      // if(instanceOf(app, EApp))//extends apps tu support io
      //   app = use(app)
      // //console.log('mounting..', mount, mount.split('/'))

      // app.implement({
      //   io: this.io.of(mount)
      // })
      if(this.io){
        let io = undefined
        if(this.session){
          io = this.io.of(mount).use(sharedsession(this.session, {
              autoSave: true
          }));
        }
        else{
          io = this.io.of(mount)
        }

        app.add_io ( io )
      }

  		this.parent(mount, app)
    },
	})


	return ExpressApp
}

module.exports = extended
