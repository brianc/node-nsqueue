var assert = require('assert')
var nsqueue = require('../')
var helper = require('./helper')
var ok = require('okay')


describe('stream errors', function() {
  describe('during connection', function() {

    it('calls back with error on problem', function(done) {
      var options = {
        host: 'laksjdflkajsfd',
        port: 88381
      }
      nsqueue(options).connect(function(err) {
        assert(err)
        done()
      })
    })

  })

  describe('after connection', function() {
    var options = {
      host: 'localhost',
      port: 4150
    }
    it('is emitted by connection', function(done) {
      helper.connect(ok(done, function(connection) {
        connection.on('error', function(err) {
          assert.equal(err.message, 'test')
          done()
        })
        connection.stream.emit('error', new Error('test'))
      }))
    })
  })
})

describe('subscribe', function() {
  var topic = helper.connection()

  it('emits response', function(done) {
    this.connection.SUB(topic, 'channel')
    this.connection.on('response', function(res) {
      assert.equal(res, 'OK')
      done()
    })
  })

})

describe('subscribe error', function() {
  var topic = helper.connection()
  it('returns error if topic is invalid', function(done) {
    this.connection.SUB('Hello!!!!', 'brooklyn')
    this.connection.on('error', function(err) {
      assert(err.message.indexOf('E_BAD_TOPIC') > -1)
      done()
    })
  })
})

describe('getting a message', function() {
  var topic = helper.connection()

  it('works', function(done) {
    var connection = this.connection
    helper.publish(topic, 'hi', ok(done, function() {
      connection.SUB(topic, 'test')
      connection.RDY(10)
      connection.on('message', function(msg) {
        assert(msg.timestamp)
        assert.equal(msg.attempts, 1)
        assert.equal(msg.data.toString('utf8'), 'hi')
        done()
      })
    }))
  })
})

describe('publishing a message', function() {
  var topic = helper.connection()

  it('works', function(done) {
    var connection = this.connection
    connection.PUB(topic, Buffer('yo', 'ascii'))
    connection.on('response', function(res) {
      assert.equal(res, 'OK')
      done()
    })
  })

  it('emits error on invalid body', function(done) {
    var connection = this.connection
    connection.PUB(topic, Buffer(0))
    connection.on('error', function(err) {
      assert(err.message.indexOf('BAD_MESSAGE') >= 0)
      done()
    })
  })
})

describe('publishing multiple messages', function() {
  var topic = helper.connection()
  it('works', function(done) {
    var buffers = [
      Buffer('one', 'ascii'),
      Buffer('two', 'ascii')
    ]
    this.connection.MPUB(topic, buffers)
    this.connection.on('response', function(res) {
      assert.equal(res, 'OK')
      done()
    })
  })

  it('adds two messages', function(done) {
    helper.stats(topic, ok(done, function(topic) {
      assert.equal(topic.message_count, 2)
      done()
    }))
  })
})

describe('message life-cycle', function() {
  var topic = helper.connection()
  it('enqueues and dequeues', function(done) {
    var connection = this.connection
    connection.PUB(topic, Buffer('1', 'ascii'))
    connection.PUB(topic, Buffer('2', 'ascii'))
    setTimeout(function() {
      connection.PUB(topic, Buffer('3', 'ascii'))
    }, 50)
    connection.SUB(topic, 'test')
    connection.RDY(100)
    var count = 0
    var sum = 0
    connection.on('message', function(msg) {
      connection.FIN(msg.id)
      sum += parseInt(msg.data.toString('ascii'))
      if(++count === 3) {
        helper.stats(topic, function(err, topic) {
          assert.equal(topic.channels[0].clients[0].finish_count, 3)
          assert.equal(topic.message_count, 3)
          assert.equal(topic.depth, 0)
          done()
        })
      }
    })
  })
})
