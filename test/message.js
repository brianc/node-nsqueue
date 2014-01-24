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
          done()
        })
      })
    }))
  })

})
