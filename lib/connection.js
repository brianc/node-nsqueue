var net = require('net')
var EventEmitter = require('events').EventEmitter
var util = require('util')

var Reader = require('packet-reader')

var Message = require('./message')

// low level, direct binary protocol
var Connection = module.exports = function(options, cb) {
  EventEmitter.call(this)
  this.reader = new Reader()
  this.lastCommad = null
  this.stream = null
  this.options = options
}

util.inherits(Connection, EventEmitter)

//connect to the given host/port
//and handle any connection errors
//calls callback with error argument if there
//was a connection error, or null if connection
//was a success
Connection.prototype.connect = function(cb) {
  var self = this
  var connectError = function(e) {
    if(cb) {
      return cb(e)
    }
    self.emit('error', e)
  }
  this.stream = net.connect(this.options, function() {
    self.stream.on('error', function(err) {
      self.emit('error', err)
    })
    self.stream.removeListener('error', connectError)
    self._writeText('  V2')
    if(cb) {
      cb(null, self)
    }
  })
  this.stream.on('error', connectError)
  this.stream.on('data', this.parse.bind(this))
}

//parse raw bytes off the stream
Connection.prototype.parse = function(buffer) {
  this.reader.addChunk(buffer)
  var packet;
  while(packet = this.reader.read()) {
    var frameId = packet.readInt32BE(0)
    this['_handleTypeResponse' + frameId](packet.slice(4))
  }
}

Connection.prototype._handleTypeResponse0 = function(message) {
  if(message == '_heartbeat_') {
    return this.NOP()
  }
  return this.emit('response', message)
}

Connection.prototype._handleTypeResponse1 = function(packet) {
  this.emit('error', new Error(packet.toString('ascii')))
}

Connection.prototype._handleTypeResponse2 = function(packet) {
  this.emit('message', new Message(packet))
}

Connection.prototype._writeText = function(text) {
  this.stream.write(text, 'ascii')
}

//sends the SUB (subscribe) command
Connection.prototype.SUB = function(topic, channel) {
  var cmdText = 'SUB ' + topic + ' ' + channel + '\n'
  this._writeText(cmdText)
}

//sends the RDY (ready) command
Connection.prototype.RDY = function(count) {
  this._writeText('RDY ' + count + '\n')
}

//sends the NOP command
Connection.prototype.NOP = function() {
  this._writeText('NOP\n')
}

//sends the FIN (finish) command
Connection.prototype.FIN = function(messageId) {
  this._writeText('FIN ' + messageId + '\n')
}

var sizeBuffer = function(size) {
  var buff = new Buffer(4)
  buff.writeInt32BE(size, 0)
  return buff
}

//sends the PUB (publish) command
Connection.prototype.PUB = function(topic, buffer) {
  this._writeText('PUB ' + topic + '\n')
  this.stream.write(sizeBuffer(buffer.length))
  this.stream.write(buffer)
}

//sends the MPUB (publish multiple) command
Connection.prototype.MPUB = function(topic, buffers) {
  this._writeText('MPUB ' + topic + '\n')
  var bodySize = buffers.reduce(function(val, buff) {
    return val + buff.length + 4
  }, 4 + 4)
  this.stream.write(sizeBuffer(bodySize))
  this.stream.write(sizeBuffer(buffers.length))
  var self = this
  buffers.forEach(function(buff) {
    self.stream.write(sizeBuffer(buff.length))
    self.stream.write(buff)
  })
}

//sends the REQ (requeue) command
Connection.prototype.REQ = function(messageId, timeout) {
  this._writeText('REQ ' + messageId + ' ' + timeout + '\n')
}

//sends the TOUCH command
Connection.prototype.TOUCH = function(messageId) {
  this._writeText('TOUCH ' + messageId + '\n')
}

//sends the IDENTIFY length prefixed json
Connection.prototype.IDENTIFY = function(options, cb) {
  this._writeText('IDENTIFY\n')
  var body = Buffer(JSON.stringify(options), 'utf8')
  this.stream.write(sizeBuffer(body.length))
  this.stream.write(body)
}

//sends the CLS (close) command
Connection.prototype.CLS = function() {
  this._writeText('CLS\n')
}

//handles the close logic
//calls the callback when
//an all-clear message is received
Connection.prototype.end = function(cb) {
  this.CLS()
  if(cb) {
    var done = function(msg) {
      if(msg == 'CLOSE_WAIT') {
        this.removeListener('response', done)
        cb()
      }
    }
    this.on('response', done)
  }
}
