//test high level client
var Client = require('../').Client
var helper = require('./helper')
var assert = require('assert')
var ok = require('okay')
var request = require('request')
var fs = require('fs')

describe('client', function() {
  var topic = helper.client()

  it('works', function(done) {
    this.timeout(5000)
    var options = {
      feature_negotiation: true,
      tls_v1: true,
      tls: {
        secureProtocol: 'TLSv1_method',
        //rejectUnauthorized: false,
        //cert: fs.readFileSync(__dirname + '/../nsq/cert.pem'),
        //key: fs.readFileSync(__dirname + '/../nsq/key.pem'),
        ca: [fs.readFileSync(__dirname + '/../nsq/cert.pem')]
      }
    }
    var client = this.client
    this.client.identify(options, ok(done, function(res) {
      assert.equal(res.tls_v1, true)
      client.publish('test', 'ok', done)
    }))
  })
})
