//test high level client
var Client = require('../').Client
var helper = require('./helper')
var assert = require('assert')
var ok = require('okay')
var request = require('request')

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

  describe('topic error tests', function() {
    var topic = helper.client()
    it('will handle publish error due to queue name in callback', function(done) {
      this.client.publish('', {test: true}, function(err) {
        assert(err)
        done()
      })
    })
  })

  describe('message error tests', function() {
    var topic = helper.client()
    it('will handle publish error due to null message in callback', function(done) {
      this.client.publish(topic, Buffer(0), function(err) {
        assert(err)
        done()
      })
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

describe('connection callback', function() {
  var topic = 'test-topic-' + Date.now()

  after(function(done) {
    request.get('http://localhost:4151/delete_topic?topic=' + topic, done)
  })

  it('is called once only', function(done) {
    var client = this.client = new Client(helper.options())
    var callCount = 0
    client.connect(function() {
      assert.equal(callCount++, 0)
      client.publishAll(topic, ['test', 'test', 'test'], function() {
      client.publishAll(topic, ['test', 'test', 'test'], function() {
        setTimeout(done, 1000)
      })
      })
    })
  })
})
