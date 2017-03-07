var moootools = require('mootools');

// var ImapConnection = require('imap').ImapConnection;

module.exports =  new Class({
  Implements: [Options, Events],
  
  //options: {
	//users: null,
  //},
  
  //initialize: function(options){
	//this.setOptions(options);
  //},
  users: [],
  
  initialize: function(users){
		this.users = users;
  },
  
  authenticate: function (username, password, fn) {
	var user = null;
	var error = null;
	
	console.log('libs/mockups/authentication/type/users.authenticate');
	console.log(this.users);
	
	//this.options.users.each(function(item){
	this.users.each(function(item){
	  if(item.username == username && item.password == password){
		user = username;
	  }
	});
	
	if(user == null){
	  error = 'Invalid user or password';
	}
	
	return fn(error, user);
	
  },
});
