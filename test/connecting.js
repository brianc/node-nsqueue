var assert = require('assert')
var nsqueue = require('../')
var helper = require('./helper')
var ok = require('okay')

describe('connection', function() {
  it('calls back on success', function(done) {
    nsqueue(helper.options()).connect(done)
  })

  it('connects from helper', function(done) {
    helper.connect(done)
  })
})

describe('connection without callback', function() {
  //need to split out end() and close()
  //end() - end the socket hard
  //close() - send CLS and keep socket open
  //also use --no-exit flag
  it('works', false, function(done) {
    var client = nsqueue(helper.options())
    client.connect()
    setTimeout(function() {
      client.end()
    }, 100)
  })

  it('emits error', function(done) {
    var client = nsqueue({host: 'asdfalsdkfjsdf', port: 1})
    client.connect()
    client.on('error', function(e) {
      assert(e, 'should have received an error argument on connection failure')
      done()
    })
  })
})

describe('disconnection', function() {
  var topic = helper.connection()

  it('disconnects', function(done) {
    var connection = this.connection
    connection.SUB(topic, 'test')
    connection.once('response', function() {
      connection.end(done)
    })
  })
})

describe('ending client', function() {
  var topic = helper.client()
  it('can disconnect', function(done) {
    var client = this.client
    client.subscribe(topic, 'test', function() {
      client.end(done)
    })
  })
})
