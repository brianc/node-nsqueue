//test message behaviors
var Client = require('../').Client
var helper = require('./helper')
var assert = require('assert')
var ok = require('okay')

describe('message', function() {
  var topic = helper.client()

  it('can be requeued', function(done) {
    var client = this.client
    client.publish(topic, Buffer('hi', 'ascii'), ok(done, function(){}))
    client.subscribe(topic, 'test', ok(done, function() {
      client.once('message', function(msg) {
        assert.strictEqual(msg.inFlight, true)
        msg.requeue(100)
        assert.strictEqual(msg.inFlight, false)
        client.once('message', function(msg) {
          assert.strictEqual(msg.inFlight, true)
          assert.equal(msg.data.toString(), 'hi')
          msg.requeue(100)
          done()
        })
      })
    }))
  })

  describe('responding', function() {
    var topic = helper.client()
    it('will indicate it has already been responeded to', function(done) {
      var client = this.client
      client.subscribe(topic, 'test')
      client.on('message', function(msg) {
        assert.equal(msg.data.toString(), 'test')
        msg.finish()
        assert.strictEqual(msg.inFlight, false, 'msg should have inFlight === false')
        msg.inFlight = true
        msg.finish()
        client.once('error', function(err) {
          assert(err.message.indexOf('E_FIN_FAILED') > -1, 'Error should contain E_FIN_FAILED message')
          done()
        })
      })
      client.publish(topic, 'test')
    })
  })


  //this test depends on the test above it
  //to have already created a message
  //and subscribed to the topic
  it('can be touched', function(done) {
    var client = this.client
    client.once('message', function(msg) {
      msg.touch()
      assert.strictEqual(msg.inFlight, true)
      done()
    })
  })

})

describe('message', function() {
  var topic = helper.client()

  before(function(done) {
    var client = this.client
    client.subscribe(topic, 'test')
    client.publish(topic, 'yo', done)
  })

  it('can be requeued multiple times without error', function(done) {
    this.timeout(10000)
    this.client.once('message', function(msg) {
      assert.equal(msg.inFlight, true)
      assert.equal(msg.requeue(100), true)
      assert.equal(msg.inFlight, false)
      assert.equal(msg.requeue(100), false)
      assert.equal(msg.inFlight, false)
      assert.equal(msg.requeue(100), false)
      assert.equal(msg.inFlight, false)
      done()
    })
  })

  it('can be finished multiple times', function(done) {
    this.client.once('message', function(msg) {
      assert.equal(msg.inFlight, true)
      assert.equal(msg.finish(), true)
      assert.equal(msg.inFlight, false)
      assert.equal(msg.finish(), false)
      assert.equal(msg.inFlight, false)
      assert.equal(msg.finish(), false)
      assert.equal(msg.inFlight, false)
      done()
    })
  })
})

