//test high level client
var Client = require('../').Client
var helper = require('./helper')
var assert = require('assert')
var ok = require('okay')

describe('client', function() {
  var topic = helper.client()

  it('can publish buffer', function(done) {
    this.client.publish(topic, Buffer('hi', 'ascii'), done)
  })

  it('can publish text', function(done) {
    this.client.publish(topic, 'briân', done)
  })

  it('can publish json', function(done) {
    this.client.publish(topic, {name: 'Brian'}, done)
  })

  it('can consume first message', function(done) {
    this.client.subscribe(topic, 'test')
    var self = this
    this.client.once('message', function(msg) {
      assert.equal(msg.data.toString('ascii'), 'hi')
      self.lastMessage = msg
      done()
    })
  })

  it('can consume utf8 text message', function(done) {
    this.lastMessage.finish()
    var self = this
    this.client.once('message', function(msg) {
      assert.equal(msg.data.toString('utf8'), 'briân')
      self.lastMessage = msg
      done()
    })
  })

  it('can consume JSON message', function(done) {
    this.lastMessage.finish()
    this.client.once('message', function(msg) {
      assert.equal(JSON.parse(msg.data.toString('utf8')).name, 'Brian')
      assert.equal(msg.data.toString('utf8'), JSON.stringify(msg.json()))
      assert.equal(msg.json().name, 'Brian')
      done()
    })
  })

})

describe('client publish multiple', function() {
  var topic = helper.client()

  it('publishes', function(done) {
    var messages = [
      Buffer('one', 'ascii'),
      'twœ',
      {number: 3}
    ]
    this.client.publishAll(topic, messages, done)
  })

  it('publishes all the messages', function(done) {
    helper.stats(topic, ok(done, function(stat) {
      assert.equal(stat.depth, 3)
      done()
    }))
  })

  it('receives multiple', function(done) {
    var count = 0
    this.client.concurrency = 2
    this.client.subscribe(topic, 'test')
    this.client.on('message', function(msg) {
      msg.finish()
      if(++count >= 3) done()
    })
  })
})

