var helper = require('./helper')
var ok = require('okay')
describe('one thousand messages', function() {

  var testConcurrency = function(total, level) {
    describe(total + ' messages with concurrency level ' + level, function() {
      var topic = helper.client()
      it('queues all messages in one batch', function(done) {
        var messages = []
        for(var j = 0; j < total; j++) {
          messages.push({number: 1})
        }
        this.client.publishAll(topic, messages, done)
      })

      it('reads ' + total + ' messages in chunks of ' + level, function(done) {
        this.client.concurrency = level
        this.client.subscribe(topic, 'test')
        var count = 0
        this.client.on('message', function(msg) {
          msg.finish()
          count += msg.json().number
          if(count >= total) {
            done()
          }
        })
      })
    })
  }

  testConcurrency(1000, 100)
  testConcurrency(1000, 1000)
  testConcurrency(1000, 3)
  testConcurrency(100, 1)
  testConcurrency(44, 3)
  testConcurrency(10, 100)
})
