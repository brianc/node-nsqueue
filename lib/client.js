var EventEmitter = require('events').EventEmitter
var util = require('util')
var Connection = require('./connection')

var Client = module.exports = function(options) {
  if(!(this instanceof Client)) return new Client(options);
  EventEmitter.call(this)
  this.con = new Connection(options)
  var self = this
  this.concurrency = 1
  this.con.on('message', this._handleIncommingMessage.bind(this))

  //only emit an error if we are the only person
  //listening for connection errors - not waiting
  //for a possible error from a callback
  this.con.on('error', function(err) {
    if(self.con.listeners('error').length == 1) {
      self.emit('error', err)
    }
  })
}

util.inherits(Client, EventEmitter)

Client.prototype._handleIncommingMessage = function(msg) {
  msg.setClient(this)
  this.emit('message', msg)
}

Client.prototype.connect = function(cb) {
  this.con.connect(cb)
}

var bufferize = function(message) {
  if(typeof message == 'object') {
    if(message instanceof Buffer) {
      return message
    }
    return Buffer(JSON.stringify(message), 'utf8')
  }
  return Buffer(message, 'utf8')
}

var maybeCallback = function(con, cb) {
  if(cb) {
    //absorb any error response
    con.once('error', cb)
    con.once('response', function(res) {
      con.removeListener('error', cb)
      cb(null, res)
    })
  }
}

Client.prototype.publish = function(topic, message, cb) {
  this.con.PUB(topic, bufferize(message))
  maybeCallback(this.con, cb)
}

Client.prototype.publishAll = function(topic, messages, cb) {
  this.con.MPUB(topic, messages.map(bufferize))
  maybeCallback(this.con, cb)
}

Client.prototype.subscribe = function(topic, channel, cb) {
  //subscribe to a topic+channel & set the initial
  //READY counter to the concurrency level
  this.con.SUB(topic, channel, cb)
  this.con.RDY(this.concurrency)
  maybeCallback(this.con, cb)
}

Client.prototype.finish = function(message) {
  this.con.FIN(message.id)
  this.con.RDY(this.concurrency)
}

Client.prototype.requeue = function(message, delay) {
  this.con.REQ(message.id, delay)
  this.con.RDY(this.concurrency)
}

Client.prototype.touch = function(message) {
  this.con.TOUCH(message.id)
}

Client.prototype.identify = function(options, cb) {
  this.con.IDENTIFY(options, cb)
  if(cb) {
    maybeCallback(this.con, function(err, res) {
      if(err) return cb(err);
      try {
        cb(null, JSON.parse(res.toString('utf8')))
      } catch(e) {
        cb(null, res)
      }
    })
  }
}

Client.prototype.end = function(cb) {
  this.con.end(cb)
}
