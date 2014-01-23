var helper = require('./helper')
describe('subscribe callback', function() {
  var topic = helper.client()
  it('works', function(done) {
    this.client.subscribe(topic, 'test', done)
  })
})

describe('subscribe and publish', function() {
  var topic = helper.client()

  it('works after publish callback', function(done) {
    var client = this.client
    client.publish(topic, 'test', function(err) {
      if(err) return done(err);
      client.subscribe(topic, 'test', done)
    })
  })
})
