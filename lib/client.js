var EventEmitter = require('events').EventEmitter
var util = require('util')
var Connection = require('./connection')

var Client = module.exports = function(options) {
  if(!(this instanceof Client)) return new Client(options);
  EventEmitter.call(this)
  this.con = new Connection(options)
  var self = this
  this.concurrency = 1
  this.inFlight = 0
  this.con.on('message', this._handleIncommingMessage.bind(this))
}

util.inherits(Client, EventEmitter)

Client.prototype._handleIncommingMessage = function(msg) {
  msg.setClient(this)
  this.inFlight++;
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

Client.prototype.publish = function(topic, message, cb) {
  this.con.PUB(topic, bufferize(message))
  if(cb) {
    this.con.once('response', function(res) {
      cb(null)
    })
  }
}

Client.prototype.publishAll = function(topic, messages, cb) {
  this.con.MPUB(topic, messages.map(bufferize))
  if(cb) {
    this.con.once('response', function(res) {
      cb(null)
    })
  }
}

Client.prototype.subscribe = function(topic, channel, cb) {
  //subscribe to a topic+channel & set the initial
  //READY counter to the concurrency level
  this.con.SUB(topic, channel, cb)
  this.con.RDY(this.concurrency)
}

Client.prototype.finish = function(message) {
  this.con.FIN(message.id)
  //update the ready count to our max concurrency limit
  //minus the number of jobs we still have in-flight
  this.con.RDY(this.concurrency - (--this.inFlight))
}
