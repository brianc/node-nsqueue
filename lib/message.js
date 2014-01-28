var Message = module.exports = function(buffer) {
  this.timestamp = buffer.readInt32BE(0) + '' + buffer.readInt32BE(4)
  this.attempts = buffer.readInt16BE(8)
  this.id = buffer.toString('ascii', 10, 26)
  this.data = buffer.slice(26)
  this.client = null
  this.inFlight = true
}

//sets the client to use for communcation
Message.prototype.setClient = function(client) {
  this.client = client
}

Message.prototype.finish = function() {
  if(!this.inFlight) return false;
  this.inFlight = false
  this.client.finish(this)
  return true
}

Message.prototype.requeue = function(delay) {
  if(!this.inFlight) return false;
  this.inFlight = false
  this.client.requeue(this, delay)
  return true
}

Message.prototype.touch = function() {
  this.client.touch(this)
}

Message.prototype.json = function() {
  return JSON.parse(this.data.toString('utf8'))
}
