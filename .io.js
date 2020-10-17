'use strict'
var Moo = require("mootools")

let sharedsession = require("express-socket.io-session")

let use = function(app){
  return extended(app)
}
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

          // console.log('message', message)

          let route_index = 0
  				routes.each(function(route){//each array is a route

            // console.log('route', route)

  					var path = route.path;

            let currents = [];
            // let prev = null;

            for(let i = route.callbacks.length - 1; i >= 0 ; i--){
              let callback = this.__callback(route.callbacks[i], message)

              // console.log('callback', i, route.callbacks[i], message)

        			if(i == route.callbacks.length - 1){
        				// console.log('_apply_filters last')

        				// if(route.callbacks.length == 1){//if there is only one filter, 'next' must be sent to "output/save"
                //
        				// 	current = undefined
        				// 	//console.log('_apply_filters last 1')
                //
        				// }
        				// else{
        					// let self = this
        					// current = function(socket){
                  //   let callback = this.__callback(route.callbacks[i], message)
        					// 	callback(socket, undefined);
                  //
        					// }.bind(this);
                  // current = callback.pass([socket, undefined], this)
                  currents[i] = function(){
                    // console.log('arguments LAST ', i, route.callbacks[i], args)
                    callback.attempt([socket, undefined].append(arguments), this)
                  }.bind(this)
        					//console.log('_apply_filters last 2')

        				// }
        			}
        			else if(i != 0){
        				//console.log('_apply_filters not zero ', i);
                // prev = (args) => current.pass(args)
                // prev = current

                // current = callback
                // current = callback.pass([socket, current], this)
                currents[i] = function(){
                  console.log('arguments ', i, route.callbacks[i], arguments)
                  callback.attempt([socket, currents[i+1].pass(arguments)].append(arguments), this)
                }.bind(this)


                // current = function(socket, next){
                //   // callback(socket, function(socket){
        				// 	// 	prev(socket, next);
        				// 	// }.bind(this))
                //   prev(socket, current)
        				// }.bind(this);
        				// prev = current;
        				// current = function(socket){
                //   let callback = this.__callback(route.callbacks[i], message)
                //
        				// 	// callback(socket, function(socket){
        				// 	// 	prev(socket, undefined);
        				// 	// }.bind(this))
                //   callback(socket, function(socket){
        				// 		prev(socket, undefined);
        				// 	}.bind(this))
                //
        				// }.bind(this);
        			}

        			if(i == 0){//first filter, start running
        				//console.log('_apply_filters start ', message);

        				// route.callbacks[i](socket, current);
                currents[i] = function(){
                  // console.log('arguments ', i, route.callbacks[i], arguments)
                  callback.attempt([socket, currents[i+1].pass(arguments, this)].append(arguments), this)

                }.bind(this)

                if(route.once && route.once === true){
                  socket.once(message, currents[i])
                }
                else{
                  socket.on(message, currents[i])
                }

        			}


        			//current(doc, opts, prev);


        		}

  					// var callbacks = [];
  					// route.callbacks.each(function(fn){
            //   //console.log('apply_io_routes', message)
  					// 	var callback = (typeof(fn) == 'function') ? fn : this[fn].bind(this);
            //
  					// 	if(process.env.PROFILING_ENV && this.logger){
  					// 		var profile = 'ID['+this.options.id+']:IO:MESSAGE['+message+']:PATH['+path+']:CALLBACK['+fn+']';
            //
  					// 		var profiling = function(socket, next){
  					// 			//////console.log('---profiling...'+profile);
  					// 			this.profile(profile);
            //
            //       callback(socket, next);
            //
  					// 			this.profile(profile);
  					// 			//////console.log('---end profiling...'+profile);
  					// 		}.bind(this);
            //
  					// 		// callbacks.push(profiling);
            //     socket.on(message, profiling(socket, next))
  					// 	}
  					// 	else{
            //
						// 		// callbacks.push(callback);
            //     socket.on(message, callback.pass(socket))
            //
  					// 	}
            //
  					// }.bind(this));



  					// app[message](route.path, callbacks);
  					// app[message](route.path, this._parallel(callbacks));
            // socket.on(message, (socket) => callbacks)

  					var perms = [];
  					// var routes = this.options.io.routes;
  					// //var path = (route.path != '' ) ? route.path : '/';
  					// if(message == '*'){
            //
  					// 	methods.each(function(method){
  					// 		var path_found = false;
  					// 		if(routes[method]){
  					// 			path_found = routes[method].every(function(item){
  					// 				if(item['path'] == '')
  					// 					item['path'] = '/';
            //
  					// 					return item['path'] == path;
  					// 			});
            //
  					// 		}
            //
  					// 		//if(!this.options.routes[method])//ommit verbs that have a specific route already
  					// 		if( !routes[method] || !path_found ){//ommit verbs that have a specific route already
  					// 			perms.push(this.create_authorization_permission(method, this.uuid+'_'+route.path));
  					// 		}
            //
  					// 	}.bind(this));
  					// }
  					// else{
  						perms.push(this.create_authorization_permission(message, this.uuid+'_io_'+route_index));
  					// }
            //
  					this.apply_authorization_permissions(perms);
            //
  					this.apply_authorization_roles_permission(route, perms);

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
