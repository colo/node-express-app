'use strict'

var Moo = require("mootools"),
	path = require('path'),
	fs = require('fs'),
	express = require('express'),
	semver = require('semver'),
	session = require('express-session');//for passport session
	//bodyParser = require('body-parser'),//json parse

const uuidv5 = require('uuid/v5'),
			methods = require('methods'); //installed by expressjs


var Logger = require('node-express-logger'),
	Authorization = require('node-express-authorization'),
	Authentication = require('node-express-authentication'),
	Rbac = require('node-rbac');


var debug = require('debug')('express-app');
var debug_events = require('debug')('express-app:Events');
var debug_internals = require('debug')('express-app:Internals');

var async = require('async')

var ExpressApp = new Class({
  Implements: [Options, Events],

  ON_LOAD_APP: 'onLoadApp',
  ON_USE: 'onUse',
  ON_USE_APP: 'onUseApp',

  ON_INIT_AUTHORIZATION: 'onInitAuthorization',
  ON_INIT_AUTHENTICATION: 'onInitAuthentication',
  ON_BEFORE_ROUTES: 'onBeforeRoutes',
  ON_BEFORE_API_ROUTES: 'onBeforeApiRoutes',
  ON_INIT: 'onInit',

  app: null,
  logger: null,
  session: null,
  authorization:null,
  authentication: null,
  uuid: null,

	options: {
		app: undefined, //express

		/**
		 * array of express-middlewares to .use()
		 * middlewares: [cors(options), helmet(options)...]
		 * */
		middlewares: [],

		id: '',
		path: '',

		//logs: {
			//loggers: {
				//error: null,
				//access: null,
				//profiling: null
			//},

			//path: './',

		//},
		logs: null,

		session: {
			//store: new SessionMemoryStore,
			//proxy: true,
			//cookie: { path: '/', httpOnly: true, maxAge: null },
			//cookie : { secure : false, maxAge : (4 * 60 * 60 * 1000) }, // 4 hours
			//session: {store: null, proxy: true, cookie: { path: '/', httpOnly: true, maxAge: null }, secret: 'keyboard cat'},
			cookie: { path: '/', httpOnly: true, maxAge: null, secure: false },
			secret: 'keyboard cat',
			resave: true,
			saveUninitialized: true
		},

		authentication: null,

		//authentication: {
			//users : [],
			//init: true
		//},

		/**
		 * authorization: {
		 * 	config: path.join(__dirname,'./rbac.json'),
		 * 	process: extra rules loaded after config
		 * 	- init: true, //set false for not auto-init
		 * 	operations_routes: true
		 * 		create operations based en http verbs on your routes (GET|POST|PUT|...)
		 * 		& resources based on uuid_path
		 * },
		* */

		authorization: null,

		params: {
		},

		/**
		 * @content_type regex to restric allowed req.headers['content-type'], if undefined or '', allow all
		 * can be nested inside each route
		 * http://stackoverflow.com/questions/23190659/expressjs-limit-acceptable-content-types
		* */
		content_type: /text\/plain/,

		routes: {

			/**
			 *
			 *
			get: [
				{
					path: '/:param',
					callbacks: ['check_authentication', 'check_authorization', 'get'],
					content_type: /text\/plain/,
				},
			],
			post: [
				{
				path: '',
				callbacks: ['', 'post']
				},
			],
			all: [
				{
				path: '',
				callbacks: ['', 'get']
				},
			]
			*
			* */
		},

		api: {

			/**
			 * @content_type regex to restric allowed req.headers['content-type'], if undefined or '', allow all
			 * can be nested inside each route
			 * http://stackoverflow.com/questions/23190659/expressjs-limit-acceptable-content-types
			* */
			content_type: /^application\/(?:x-www-form-urlencoded|x-.*\+json|json)(?:[\s;]|$)/,

			//path: '/api',
			path: '',

			version: '0.0.0',

			versioned_path: false, //default false

			force_versioned_path: true, //default true, if false & version_path true, there would be 2 routes, filter with content-type

			accept_header: 'accept-version',

			routes: {
				/**
				 *
				get: [
					{
					path: '',
					callbacks: ['get_api'],
					content_type: /^application\/(?:x-www-form-urlencoded|x-.*\+json|json)(?:[\s;]|$)/,
					//version: '1.0.1',
					},
					{
					path: ':service_action',
					callbacks: ['get_api'],
					content_type: /^application\/(?:x-www-form-urlencoded|x-.*\+json|json)(?:[\s;]|$)/,
					version: '2.0.0',
					},
					{
					path: ':service_action',
					callbacks: ['get_api'],
					content_type: /^application\/(?:x-www-form-urlencoded|x-.*\+json|json)(?:[\s;]|$)/,
					version: '1.0.1',
					},
				],
				post: [
					{
					path: '',
					callbacks: ['check_authentication', 'post'],
					},
				],
				all: [
					{
					path: '',
					callbacks: ['get'],
					version: '',
					},
				]
				*
				* */
			},

			/*doc: {
				'/': {
					type: 'function',
					returns: 'array',
					description: 'Return an array of registered servers',
					example: '{"username":"lbueno","password":"40bd001563085fc35165329ea1ff5c5ecbdbbeef"} / curl -v -L -H "Accept: application/json" -H "Content-type: application/json" -X POST -d \' {"user":"something","password":"app123"}\'  http://localhost:8080/login'

				}
			},*/
		},
  },
  initialize: function(options){
		//options = options || {};
		//////console.log('----parent----');
		//////console.log(extra);
		//this.addEvent(this.ON_INIT_AUTHORIZATION, function(){
			//////console.log('---this.ON_INIT_AUTHORIZATION---');
			//////console.log(this.uuid)
		//}.bind(this));

		//this.addEvent(this.ON_BEFORE_ROUTES, function(){
			//////console.log('---this.ON_BEFORE_ROUTES---');
			//////console.log(this.uuid)
		//}.bind(this));

		//this.addEvent(this.ON_BEFORE_API_ROUTES, function(){
			//////console.log('---this.ON_BEFORE_API_ROUTES---');
			//////console.log(this.uuid)
		//}.bind(this));

		if(options && options.logs && options.logs.instance){//winston
			////console.log(options.id);
			////console.log(options.logs.instance.loggers);
				this.logger = options.logs;
				options.logs = null;
		}

		this.setOptions(options);//override default options

		this.uuid = uuidv5(this.options.path, uuidv5.URL);

		//////console.log('----UUID----');
		//////console.log(this.options.path);
		//////console.log(this.uuid);

		if(!this.options.app || this.options.app == null){
			this.app = express();
		}
		else{
			this.app = this.options.app;
		}

		let middlewares = []
		////console.log(typeof(this.options.middlewares));
		////console.log(this.options.middlewares);

		if(
			this.options.middlewares != null &&
			(typeof(this.options.middlewares) == 'array' || typeof(this.options.middlewares) == 'object')
		){
			// this.options.middlewares.forEach(function(middleware){
			// 	////console.log(middleware);
			// 	this.app.use(middleware);
			// }.bind(this));

			middlewares = this.options.middlewares
		}

		//app.use(bodyParser.urlencoded({ extended: false }))

		// parse application/json
		//app.use(bodyParser.json())


		/**
		 * logger
		 *  - start
		 * **/
		if(this.options.logs){
			////console.log('----instance----');
			////console.log(this.options.logs);

			if(typeof(this.options.logs) == 'class'){
				var tmp_class = this.options.logs;
				this.logger = new tmp_class(this, {});
				this.options.logs = {};
			}
			else if(typeof(this.options.logs) == 'function'){
				this.logger = this.options.logs;
				this.options.logs = {};
			}
			//else if(this.options.logs.instance){//winston
				//this.logger = this.options.logs;
				//this.options.logs = {};
			//}
			else{
				this.logger = new Logger(this, this.options.logs);
				//app.use(this.logger.access());
			}

			// app.use(this.logger.access());
			middlewares.push(this.logger.access())

			////console.log(this.logger.instance);
		}

		if(this.logger)
			this.logger.extend_app(this);

		////console.log(this.options.id);
		////console.log(this.logger);

		/**
		 * logger
		 *  - end
		 * **/

		//var SessionMemoryStore = require('express-session/session/memory');//for socket.io / sessions

		/**
		 * session
		 *  - start
		 * **/
		if(this.options.session){

			//var sess_middleware = null;

			if(typeof(this.options.session) == 'function'){
				////console.log('---typeof(this.options.session)---')
				////console.log(typeof(this.options.session))
				this.session = this.options.session;
				this.options.session = {};
			}
			else{
				this.session = session(this.options.session);
			}

			// app.use(this.session);
			middlewares.push(this.session)
		}
		/**
		 * session
		 *  - end
		 * **/


		 /**
 		 * authentication
 		 * - start
 		 * */
 		if(this.options.authentication && this.options.authentication.init !== false){
 			var authentication = null;

 			if(typeof(this.options.authentication) == 'class'){
 				authentication = new this.options.authentication(this, {});
 				this.options.authentication = {};
 			}
 			else if(typeof(this.options.authentication) == 'function'){
 				authentication = this.options.authentication;
 				this.options.authentication = {};
 			}
 			else{
 				let users = this.options.authentication.users

 				let store, auth

 				if(this.options.authentication.store){
 					if(this.options.authentication.store && !this.options.authentication.store.module){
 						debug_internals('Store', store)
 						store = new this.options.authentication.store(users)
 					}
 					else if(this.options.authentication.store.module){
 						store = new this.options.authentication.store.module(this.options.authentication.store.options)
 					}
 				}
 				else {
 					let MemoryStore = new require('node-authentication').MemoryStore;
 					store = new MemoryStore(users)
 				}



 				if(this.options.authentication.auth){
 					if(this.options.authentication.auth && !this.options.authentication.auth.module){
 						auth = new this.options.authentication.auth(users)
 					}
 					else if(this.options.authentication.auth.module){
 						auth = new this.options.authentication.auth.module(this.options.authentication.auth.options)
 					}
 				}
 				else {
 					let MemoryAuth = require('node-authentication').MemoryAuth;
 					auth = new MemoryAuth(users)
 				}

 				//----Mockups libs
 				//var UsersAuth = require(path.join(__dirname, 'libs/mockups/authentication/type/users'));

 				/*
 				 var MemcachedStore = require('connect-memcached')(require('express-session'));
 				 new MemcachedStore({
 					hosts: ['127.0.0.1:11211']
 				})
 				*/


 				//authentication = new Authentication(this, {
 										//store: new MemoryStore(users),
 										////auth: new UsersAuth({users: users}),
 										//auth: new MemoryAuth(users),
 										//passport: {session: (this.options.session) ? true : false}
 								  //});

 				authentication = new Authentication(this,
 													store,
 													auth,
 													{ passport: {session: (this.options.session) ? true : false} }
 												);
 			}

 			this.authentication = authentication;

 			if(this.options.authentication.users)//empty users data, as is easy accesible
 				this.options.authentication.users = {};

 			this.fireEvent(this.ON_INIT_AUTHENTICATION, authentication);
 		}
 		/**
 		 * authentication
 		 * - end
 		 * */

		/**
		 * authorization
		 * - start
		 * */
		 //if(this.options.authorization && this.options.authorization.init !== false){
		 if(this.options.authorization){
			 var authorization = null;

			 ////console.log('----typeof(his.options.authorization)---');
			 ////console.log(typeof(this.options.authorization));
			 ////console.log(this.options.authorization);

			 if(typeof(this.options.authorization) == 'class'){
				 authorization = new this.options.authorization({});
				 this.options.authorization = {};
			 }
			 else if(typeof(this.options.authorization) == 'function'){
				authorization = this.options.authorization;
				this.options.authorization = {};
			}
			else if(this.options.authorization.config){
				var rbac = this.options.authorization.config;

				if(typeof(this.options.authorization.config) == 'string'){
					//rbac = fs.readFileSync(path.join(__dirname, this.options.authorization.config ), 'ascii');
					rbac = JSON.decode(fs.readFileSync(this.options.authorization.config , 'ascii'));
					this.options.authorization.config = rbac;
				}

				authorization = new Authorization(this,
					rbac
				);
			}

			if(authorization){
				//if(this.options.authorization.init !== false){

					if(this.options.authorization.process){
						////console.log('----this.options.authorization.process---');
						authorization.processRules(
							this.options.authorization.process
						);
					}

					this.authorization = authorization;
					// app.use(this.authorization.session());
					middlewares.push(this.authorization.session())

					////console.log('--ROLES---')
					////console.log(this.authorization.getRoles());
					//if(this.options.authorization.init !== false){

						//throw new Error('revisar el problema de como se inicia la session,'+
						//"\n ya que ahora si voy primero a /test se queda siempre como anon, "+
						//"\n hasta q me voy a / y cambia a admin (en /test tambien)\n"
						//);
						//app.use(this.authorization.session());
					//}
				//else{
					//this._authorization = authorization;
				//}

				this.fireEvent(this.ON_INIT_AUTHORIZATION, authorization);
			}
		}

		if(middlewares.length > 0)
			this.app.use(this._parallel(middlewares))

		/**
		 * authorization
		 * - end
		 * */

		//this.profile('app_init');//start profiling

		if(this.options.api.versioned_path !== true)
			this.options.api.force_versioned_path = false;


		this.sanitize_params();

		this.fireEvent(this.ON_BEFORE_ROUTES);

		this.apply_routes();

		this.fireEvent(this.ON_BEFORE_API_ROUTES);

		this.apply_api_routes();


		//this.profile('app_init');//end profiling

		//this.log('admin', 'info', 'app started');
		this.fireEvent(this.ON_INIT, this);



  },
	_parallel: function(middlewares) {
		return function (req, res, next) {
			async.each(middlewares, function (mw, cb) {
				mw(req, res, cb);
			}, next);
		};
	},
  log: function(name, type, string){},
  profile: function(profile){},
	/**
	* @params
	* @todo should rise an Error???
	* */
  sanitize_params: function(){

		var params = Object.clone(this.options.params);

		if(params){
			var app = this.app;

			Object.each(params, function(condition, param){

				app.param(param, function(req, res, next, str){

					if(condition.exec(str) == null)
						req.params[param] = null;

					next();
				});
			});
		}
  }.protect(),

  apply_api_routes: function(){
		var api = this.options.api;

		if(api.routes){
			var app = this.app;

			Object.each(api.routes, function(routes, verb){//for each HTTP VERB (get/post/...) there is an arry of routes

				var content_type = (typeof(api.content_type) !== "undefined") ? api.content_type : '';
				var version = (typeof(api.version) !== "undefined") ? api.version : '';

				routes.each(function(route){//each array is a route

					content_type = (typeof(route.content_type) !== "undefined") ? route.content_type : content_type;
					version = (typeof(route.version) !== "undefined") ? route.version : version;

					var path = '';
					path += (typeof(api.path) !== "undefined") ? api.path : '';

					var versioned_path = '';

					if(api.versioned_path === true && version != ''){
						versioned_path = path + '/v'+semver.major(version);
						versioned_path += (typeof(route.path) !== "undefined") ? '/' + route.path : '';
					}

					path += (typeof(route.path) !== "undefined") ? '/' + route.path : '';

					var callbacks = [];
					route.callbacks.each(function(fn){
						var callback = (typeof(fn) == 'function') ? fn : this[fn].bind(this);
						////////console.log('apply_api_routes this[func]: '+fn);

						//if(content_type != ''){
							//~ callbacks.push(this.check_content_type_api.bind(this));
							//callbacks.push(
								//this.check_content_type.bind(this,
									//this.check_accept_version.bind(this,
										//this[fn].bind(this),
										//version),
								//content_type)
							//);
						//}
						//else{
							//callbacks.push(this[fn].bind(this));
						//}

						////console.log('---profiling...');
						////console.log(this.options.id)
						////console.log(this.logger)

						if(process.env.PROFILING_ENV && this.logger){


							var profile = 'ID['+this.options.id+']:METHOD['+verb+']';

							if(api.force_versioned_path){
								profile += ':PATH['+versioned_path+']:CALLBACK['+fn+']';
							}
							else{
								profile += ':PATH['+path+']:CALLBACK['+fn+']';
							}



							var profiling = function(req, res, next){
								////console.log('---profiling...'+profile);
								this.profile(profile);
								//this[fn](req, res, next);
								callback(req, res, next);

								this.profile(profile);
								////console.log('---end profiling...'+profile);
							}.bind(this);

							callbacks.push(
								this.check_content_type.bind(this,
									this.check_accept_version.bind(this,
										profiling,
										version),
								content_type)
							);

						}
						else{
							callbacks.push(
								this.check_content_type.bind(this,
									this.check_accept_version.bind(this,
										//this[fn].bind(this),
										callback,
										version),
								content_type)
							);
						}

					}.bind(this));

					////console.log('api path '+path);

					var usedPath = [];
					if(api.force_versioned_path){//route only work on api-version path
						app[verb](versioned_path, callbacks);
						// app[verb](versioned_path, this._parallel(callbacks));
						usedPath.push(versioned_path);
					}
					else{//route works on defined path
						if(api.versioned_path === true && version != ''){//route also works on api-version path
							app[verb](versioned_path, callbacks);
							// app[verb](versioned_path, this._parallel(callbacks));
							usedPath.push(versioned_path);
						}
						app[verb](path, callbacks);
						// app[verb](path, this._parallel(callbacks));
						usedPath.push(path);
					}

					var perms = [];
					usedPath.each(function(path){
						//if(path == '/')
							//path = '';

						if(verb == 'all'){
							methods.each(function(method){
								var path_found = false;
								if(api.routes[method]){
									path_found = api.routes[method].every(function(item){
										if(item['path'] == '')
											item['path'] = '/';

											return item['path'] == path;
									});

								}

								////console.log(api.routes[method]);
								////console.log(path);
								////console.log(path_found);

								if(!api.routes[method] || !path_found)//ommit verbs that have a specific route already
									perms.push(this.create_authorization_permission(method, this.uuid+'_'+path));

							}.bind(this));
						}
						else{
							perms.push(this.create_authorization_permission(verb, this.uuid+'_'+path));
						}
					}.bind(this));

					this.apply_authorization_permissions(perms);

					this.apply_authorization_roles_permission(route, perms);

				}.bind(this));

			}.bind(this));
		}
  },
	check_content_type: function(callback, content_type, req, res, next){

	  if(this.options.api.force_versioned_path ||//if apt-version path is forced, no checks needed
			content_type.test(req.get('content-type')) || //check if content-type match
			!req.get('content-type')){//or if no content-type it specified
			callback(req, res, next);
	  }
	  else{
			next();
	  }
  },
  check_accept_version: function(callback, version, req, res, next){

	  var accept_header = (this.options.api.accept_header) ? this.options.api.accept_header : 'accept-version';

	  //if(version.test(req.headers['accept-version']) || !version){
	  if(!version ||
		!req.headers[accept_header] ||
		semver.satisfies(version, req.headers[accept_header])){

			req.version = version;
			callback(req, res, next);
	  }
	  else{
			next();
	  }
  },
  apply_routes: function(){

		if(this.options.routes){
			var app = this.app;

			Object.each(this.options.routes, function(routes, verb){//for each HTTP VERB (get/post/...) there is an arry of routes

				var content_type = (typeof(this.options.content_type) !== "undefined") ? this.options.content_type : '';

				routes.each(function(route){//each array is a route
					var path = route.path;
					//var path = app.path + route.path;
					content_type = (typeof(route.content_type) !== "undefined") ? route.content_type : content_type;

					////////console.log('specific route content-type: '+content_type);

					var callbacks = [];
					route.callbacks.each(function(fn){
						var callback = (typeof(fn) == 'function') ? fn : this[fn].bind(this);

						//////console.log('route function: ' + fn);

						if(process.env.PROFILING_ENV && this.logger){
							var profile = 'ID['+this.options.id+']:METHOD['+verb+']:PATH['+path+']:CALLBACK['+fn+']';


							//profile += ':PATH['+path+']:CALLBACK['+fn+']';


							var profiling = function(req, res, next){
								////console.log('---profiling...'+profile);
								this.profile(profile);

								if(content_type != ''){
									//this.check_content_type(this[fn], content_type, req, res, next);
									this.check_content_type(callback, content_type, req, res, next);
								}
								else{
									//this[fn](req, res, next);
									callback(req, res, next);
								}

								this.profile(profile);
								////console.log('---end profiling...'+profile);
							}.bind(this);

							callbacks.push(profiling);

						}
						else{
							//callbacks.push(
								//this.check_content_type.bind(this,
									//this.check_accept_version.bind(this,
										//this[fn].bind(this),
										//version),
								//content_type)
							//);

							if(content_type != ''){
								//callbacks.push(this.check_content_type.bind(this, this[fn].bind(this), content_type));
								callbacks.push(this.check_content_type.bind(this, callback, content_type));
							}
							else{
								//callbacks.push(this[fn].bind(this));
								callbacks.push(callback);
							}

						}

						//if(content_type != ''){
							//callbacks.push(this.check_content_type.bind(this, this[fn].bind(this), content_type));
						//}
						//else{
							//callbacks.push(this[fn].bind(this));
						//}

					}.bind(this));



					app[verb](route.path, callbacks);
					// app[verb](route.path, this._parallel(callbacks));

					var perms = [];
					var routes = this.options.routes;
					//var path = (route.path != '' ) ? route.path : '/';
					if(verb == 'all'){

						methods.each(function(method){
							var path_found = false;
							if(routes[method]){
								path_found = routes[method].every(function(item){
									if(item['path'] == '')
										item['path'] = '/';

										return item['path'] == path;
								});

							}

							////console.log(routes[method]);
							////console.log(path);
							////console.log(path_found);

							//if(!this.options.routes[method])//ommit verbs that have a specific route already
							if( !routes[method] || !path_found ){//ommit verbs that have a specific route already
								perms.push(this.create_authorization_permission(method, this.uuid+'_'+route.path));
							}

						}.bind(this));
					}
					else{
						perms.push(this.create_authorization_permission(verb, this.uuid+'_'+route.path));
					}

					this.apply_authorization_permissions(perms);

					this.apply_authorization_roles_permission(route, perms);

					//if(route.roles){
						//route.roles.each(function(role){
							//////console.log('---route.role---');
						//});
					//}

				}.bind(this));

			}.bind(this));
		}

  },
  apply_authorization_roles_permission: function(route, perms){
		if(route.roles && this.authorization){
			route.roles.each(function(role){
				////console.log('---route.role---');
				////console.log(role);
				////console.log(this.authorization.getRoles()[role]);
				////console.log(perms);

				if(this.authorization.getRoles()[role]){
					perms.each(function(perm){
						////console.log('---route.role.perm---');
						////console.log(perm.getID());
						this.authorization.getRoles()[role].addPermission(perm);
					}.bind(this));

				}

			}.bind(this));
		}
	}.protect(),
	apply_authorization_permissions: function(perms){
		var perms_json = [];
		perms.each(function(perm){
			if(perm)
				perms_json.push(perm.toJSON());
		});

		if(this.authorization)
			this.authorization.processRules({permissions: perms_json});
	}.protect(),
  /**
   * return resource ID
   *
   * */
  create_authorization_permission: function(op, res){
		//////console.log('creating...');
		//////console.log({
			//'operation': op,
			//'resource': res,
			//'id': res+'_'+op
		//});
		var perm = null;
		if(
			this.authorization &&
			this.options.authorization &&
			this.options.authorization.operations_routes !== false
		){

			perm = new Rbac.Permission(res+'_'+op);
			perm.setResource(new Rbac.Resource(res));
			perm.setOperation(new Rbac.Operation(op));

			//////console.log(perm.toJSON());

			//this.authorization.processRules(
				//perm.toJSON()
			//);
			//this.authorization.processRules({
				//'permissions': [{
					//'operation': op,
					//'resource': res,
					//'id': res+'_'+op
				//}]
			//});
		}

		return perm;

	}.protect(),
  use: function(mount, app){
		//////console.log('app');
		//////console.log(typeOf(app));

		this.fireEvent(this.ON_USE, [mount, app, this]);

		if(typeOf(app) == 'class' || typeOf(app) == 'object')
			this.fireEvent(this.ON_USE_APP, [mount, app, this]);

		if(typeOf(app) == 'class')
			app = new app({}, { authorization: this.authorization });

		if(typeOf(app) == 'object'){
			////////console.log('extend_app.authorization');
			////////console.log(app.options.authorization);

			//if(this.authentication && !app.authentication){
				//app.authentication = this.authentication;

			//}


			//if(this.authorization && app.authorization){
				///**
				 //* sub-app gets parents rbac
				 //*
				 //* */
				//app.authorization.processRules(
					////JSON.decode(
						//this.authorization.getRules()
					////)
				//);


			//}



			this.app.use(mount, app.express());
		}
		else{
			this.app.use(mount, app);
		}
  },
  load: function(wrk_dir, options){
		options = options || {};

		var get_options = function(options){

			if(!options.authorization){
				options.authorization = {};
			}

			/**
			 * subapps will inherit app rbac rules
			 *
			 * */
			if(this.authorization)
				options.authorization.process = this.authorization.getRules();

			/**
			 * subapps will re-use main app session
			 * */
			if(!options.session){
				options.session = this.session;
			}

			if(!options.middlewares){
				options.middlewares = this.options.middlewares;
			}
			else{
				options.middlewares.combine(this.options.middlewares);
			}

			/**
			 * subapps will re-use main app logger
			 * */
			//if(!options.logs){
				//options.logs = this.logger;
				////options.logs = this.options.logs;
			//}
			if(this.logger)
				options.logs = this.logger;

			//if(this.app)
				//options.app = this.app;

			return options;

		}.bind(this);

		////////console.log('load.options');
		////////console.log(options);

		fs.readdirSync(wrk_dir).forEach(function(file) {

			var full_path = path.join(wrk_dir, file);


			if(! (file.charAt(0) == '.')){//ommit 'hiden' files
				////////console.log('-------');

				////////console.log('app load: '+ file);
				var app = null;
				var id = '';//app id
				var mount = '';

				if(fs.statSync(full_path).isDirectory() == true){//apps inside dir

					////////console.log('dir app: '+full_path);

					var dir = file;//is dir

					fs.readdirSync(full_path).forEach(function(file) {//read each file in directory

						if(path.extname(file) == '.js' && ! (file.charAt(0) == '.')){

							////////console.log('app load js: '+ file);
							app = require(path.join(full_path, file));

							debug_internals('typeof %o', typeof(app));

							if(file == 'index.js'){
								mount = id = dir;
							}
							else{
								id = dir+'.'+path.basename(file, '.js');
								mount = dir+'/'+path.basename(file, '.js');
							}

							if(typeOf(app) == 'class'){//mootools class
								////console.log('class app');

								this.fireEvent(this.ON_LOAD_APP, [app, this]);

								//app.addEvent(this.ON_INIT, function(app){
									//////console.log('---app.INIT---');
									//////console.log(app.uuid)
								//}.bind(app));


								app = new app(get_options(options));
								mount = (app.options && app.options.path ) ? app.options.path : '/'+mount




								/*////////console.log('mootols_app.params:');
								////////console.log(Object.clone(instance.params));*/

								//app = instance.express();
								//id = (instance.id) ? instance.id : id;
								//apps[app.locals.id || id]['app'] = app;
							}
							else{//nodejs module
								////////console.log('express app...nothing to do');
								mount = '/'+mount;
							}



							this.use(mount, app);
							//apps[app.locals.id || id] = {};
							//apps[app.locals.id || id]['app'] = app;
							//apps[app.locals.id || id]['mount'] = mount;
						}

					}.bind(this));//end load single JS files

				}
				else if(path.extname( file ) == '.js'){// single js apps
					////////console.log('file app: '+full_path);
					////////console.log('basename: '+path.basename(file, '.js'));

					app = require(full_path);

					debug_internals('typeof %o', typeof(app));

					id = path.basename(file, '.js');

					if(file == 'index.js'){
						mount = '/';
					}
					else{
						mount = '/'+id;
					}

					if(typeOf(app) == 'class'){//mootools class
						////console.log('class app');

						this.fireEvent(this.ON_LOAD_APP, [app, this]);

						//app.addEvent(this.ON_INIT, function(){
							//////console.log('---app.INIT---');
							//////console.log(this.uuid)
						//}.bind(app));


						app = new app(get_options(options));
						mount = (app.options && app.options.path ) ? app.options.path : '/'+mount


						//app = instance.express();
						//id = (instance.id) ? instance.id : id;
					}
					else{//nodejs module
						////////console.log('express app...nothing to do');
					}

					this.use(mount, app);
					//apps[app.locals.id || id] = {};
					//apps[app.locals.id || id]['app'] = app;
					//apps[app.locals.id || id]['mount'] = mount;
				}


			}
		}.bind(this))

		//return apps;
	},
  express: function(){
	  return this.app;
  },
  404: function(req, res, next, err){

		res.status(404);

		res.format({
			'text/plain': function(){
				res.send('Not Found');
			},

			'text/html': function(){
				res.send('Not Found');
			},

			'application/json': function(){
				res.send({error: 'Not Found'});
			},

			'default': function() {
				// log the request and respond with 406
				res.status(406).send('Not Found '+ err);
			}
		});
	},
  //required for 'check_authentication', should be 'implement' injected on another module, auto-loaded by authentication?
  403: function(req, res, next, err){

		res.status(403);

		res.format({
			'text/plain': function(){
				res.send(err);
			},

			'text/html': function(){
				res.send(err);
			},

			'application/json': function(){
				res.send(err);
			},

			'default': function() {
				// log the request and respond with 406
				res.status(406).send('Not Acceptable '+ err);
			}
		});
	},
	//required for 'check_authentication', should be 'implement' injected on another module, auto-loaded by authentication?
	500: function(req, res, next, err){

		////console.log('500');
		////console.log(err);

		res.status(500);

		res.format({
			'text/plain': function(){
				res.send(err);
			},

			'text/html': function(){
				res.send(err);
			},

			'application/json': function(){
				res.send(err);
			},

			'default': function() {
				// log the request and respond with 406
				res.status(406).send('Not Acceptable '+ err);
			}
		});
	},
	501: function(req, res, next, err){

		res.status(501);

		res.format({
			'text/plain': function(){
				res.send(err || 'Not Implemented');
			},

			'text/html': function(){
				res.send(err || 'Not Implemented');
			},

			'application/json': function(){
				res.send(err || { error: 'Not Implemented' });
			},

			'default': function() {
				// log the request and respond with 406
				res.status(406).send('Not Acceptable '+ err);
			}
		});
	},

});

module.exports = ExpressApp;
