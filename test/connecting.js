var nsqueue = require('../')
var helper = require('./helper')
var ok = require('okay')

describe('connection', function() {
  it('calls back on success', function(done) {
    var options = {
      port: 4150,
      host: 'localhost'
    }
    nsqueue(options).connect(done)
  })

  it('connects from helper', function(done) {
    helper.connect(done)
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
