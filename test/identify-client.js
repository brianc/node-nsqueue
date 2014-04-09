var helper = require('./helper')
var ok = require('okay')
var assert = require('assert')

describe('client.identify', function() {
  var topic = helper.client()

  it('works', function(done) {
    var options = {
      short_id: 'hi',
      long_id: 'hello!',
      feature_negotiation: true,
      heartbeat_interval: -1
    }
    this.client.identify(options, function(err, res) {
      assert.ifError(err)
      assert(res)
      assert.equal(res.msg_timeout, 60000)
      assert.equal(res.deflate, false)
      assert.equal(res.snappy, false)
      done()
    })
  })

  it('responds with nothing when no feature negotation is given', function(done) {
    this.client.identify({short_id: 'hi'}, done)
  })

  it('responds with error', function(done) {
    var options = {
      feature_negotiation: true,
      snappy: true,
      deflate: true
    }
    this.client.identify(options, function(err) {
      assert(err)
      done()
    })
  })
})
