var nsqueue = require('../')
var request = require('request')
var ok = require('okay')
var Client = require('../lib/client')

var helper = module.exports = {
  options: function() {
    return {
      host: 'localhost',
      port: 4150
    }
  },
  connect: function(cb) {
    var con = new nsqueue.Connection(module.exports.options())
    con.connect(function(err) {
      cb(err, con)
    })
    return con
  },
  publish: function(topic, message, cb) {
    var options = {
      url: 'http://localhost:4151/pub?topic=' + topic,
      body: message
    }
    request.post(options, cb)
  },
  client: function() {
    var topic = 'test-topic-' + Date.now()
    before(function(done) {
      var client = this.client = new Client(helper.options())
      client.connect(done)
    })

    after(function(done) {
      request.get('http://localhost:4151/delete_topic?topic=' + topic, done)
    })

    return topic
  },
  connection: function() {
    before(function(done) {
      this.connection = helper.connect(done)
    })

    var topic = 'test-topic-' + Date.now()

    after(function(done) {
      request.get('http://localhost:4151/delete_topic?topic=' + topic, done)
    })

    return topic
  },
  stats: function(topicName, cb) {
    var options = {
      url: 'http://localhost:4151/stats?format=json',
      json: true
    }
    request.get(options, ok(cb, function(res, body) {
      for(var i = 0; i < body.data.topics.length; i++) {
        var topic = body.data.topics[i]
        if(topic.topic_name == topicName) {
          return cb(null, topic)
        }
      }
      cb(null, null)
    }))
  }
}
