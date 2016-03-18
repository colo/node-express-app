var moootools = require('mootools');

// var ImapConnection = require('imap').ImapConnection;

module.exports =  new Class({
  Implements: [Options, Events],
  
  options: {
	users: null,
  },
  
  initialize: function(options){
	this.setOptions(options);
  },
  authenticate: function (username, password, fn) {
	var user = null;
	var error = null;
	
	this.options.users.each(function(item){
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
