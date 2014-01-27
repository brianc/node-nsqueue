//test message behaviors
var Client = require('../').Client
var helper = require('./helper')
var assert = require('assert')
var ok = require('okay')

describe('client', function() {
  var topic = helper.client()

  it('can be requeued', function(done) {
    var client = this.client
    client.publish(topic, Buffer('hi', 'ascii'), ok(done, function(){}))
    client.subscribe(topic, 'test', ok(done, function() {
      client.once('message', function(msg) {
        msg.requeue(100)
        client.once('message', function(msg) {
          assert.equal(msg.data.toString(), 'hi')
          msg.requeue(100)
          done()
        })
      })
    }))
  })

  //this test depends on the test above it
  //to have already created a message
  //and subscribed to the topic
  it('can be touched', function(done) {
    var client = this.client
    client.once('message', function(msg) {
      msg.touch()
      done()
    })
  })
})
