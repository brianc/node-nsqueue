# nsqueue

Simple, well-tested node client for nsqd.  nslookupd smarts not included.

## install

```sh
$ npm install nsqueue
```

## example

```js
var nsqueue = require('nsqueue')

var client = new nsqueue.Client({
  host: 'localhost',
  port: 4150
})

//connect to the nsqd server process over TCP
client.connect()

//publish buffers
client.publish('your-topic', Buffer('Hi Mom', 'ascii'))

//publish strings (utf8 assumed)
client.publish('your-topic', 'Hi again, Mom!')

//publish json
client.publish('your-topic', {say: 'hi', to: 'mom'}, function(err) {
  //OPTIONAL callback
  //called when your message has been received by nsqd
})

//publish multiple messages in a batch
var messages = [
  Buffer('Hi Dad', 'ascii'),
  'Hi again, Dad!',
  {say: 'hi', to: 'dad'}
]

client.publishAll('your-topic', messages, function(err) {
  //OPTIONAL callback
  //called when all your messages
  //in this batch have been received by nsqd
})

client.subscribe('your-topic', 'your-channel', function(err) {
  //OPTIONAL callback
  //called when you have successfully subscribed
  //to the given topic/channel pair
})

client.on('message', function(msg) {
  console.log(msg.data) //Buffer <...>
  console.log(msg.data.toString()) // 'hi mom'

  msg.finish() //finish the message - nsqd does not support
               //success notification so there is no callback
})

client.on('error', function(err) {
  //something bad happened. :(
})

client.end(function(err) {
  console.log('client closed')
})

```

## api

### new Client(options)

__options: object__ `options` should be an object with `port` & `host` properties.  No default value is assumed if they are not supplied.

#### client.connect([callback])

Connects the client to the `host` & `port` pair supplied in the constructor.

_optional_ __callback(error: Error)__ callback called with error event if a connection error was encountered.  If no callback is supplied and an error is encountered during connection, the client will emit the error as an `error` event.


#### client.publish(topic, data, [callback])

__topic: string__ must be a string of valid nsqd topic characters

__data: buffer, string, or object__ the payload of the message
  - if string, assumed to be utf8 encoded
  - if object, passed to `JSON.stringify` before publishing

_optional_ __callback(error: Error)__ called when the message has been received by the nsqd server.  Passed an `Error` object if there was a problem publishing the message.

If no callback is supplied any publish error will be emitted as an `error` event.


#### client.publishAll(topic, datums, [callback])

The same as `client.publish` but takes an array of data payloads as the second argument and publishes them as a batch.  Batch publishing is part of the nsqd protocol and is generally more efficient when publishing many messages at once, though error handling is harder because you only know `m of n` messages failed in the event of an error, not which ones.  Each of the items in the `datam` array will be considered its own message by nsqd.

__topic: string__ must be a string of valid nsqd topic characters

__datam: Array of buffers, strings, and/or objects__ the payloads of the messages

_optional_ __callback(error: Error)__ called when the messages have all been received by the nsqd server.  Passed an `Error` object if there was a problem publishing any of the messages.

If no callback is supplied any publish error will be emitted as an `error` event.


#### client.subscribe(topic, channel, [callback])

__topic: string__ the topic this client should subscribe to
__channel: string__ the channel this client should subscribe to
_optional_ __callback(error: Error)__ called when the client has successfully subscribed to the topic/channel pair. Passed an `Error` object i there was a problem subscribing to the channel/topic pair.

If no callback is supplied any error during subscribing will be emitted as an `error` event.

#### client.on('message', callback(message))

Adds an event listener which is called _every time_ a message is received on this client.  Messages will only be received on the channel/topic pair the client is subscribed to.  Note: the client does no internal buffering of incomming messages.  Once the client is subscribed to a topic/channel pair events will start 'flowing' in immediately after the subscribe callback is called.  You can add a `message` event listener before even calling subscribe.  If no callback is supplied, any er

If no callback is supplied any publish error will be emitted as an `error` event.

#### client.end([callback])

Disconnects the client.

_optional_ __callback(error: Error)__ called when the client has disconnected cleanly from the server nsqd process and the socket is closed.

#### client.concurrency: int

Default value: `1`

The maximum number of in-flight messages the nsqd server will deliver to this client at one time.  Setting this to `5` for example will allow 5 in-flight messages sent to this client.  As each message is finished or requeued the server will send more messages down to the client until it again has 5 in-flight at a time.  This value can be changed at any time and will take affect as soon as the next in-flight message is either requeued or finished.
### message

Message objects are not created by you directly.  They are emitted from clients with an active subscription on a topic/channel pair through the `message` event.

#### message.data: Buffer

The raw binary data of the message.  Call `message.data.toString('utf8')` for a string representation.

_note:_ because the nsqd protocol does not allow empty messages, this will never be null.

#### message.json(): Object

A helper which calls `JSON.parse(message.data.toString('utf8'))` and returns the results because it is so common to send & receive JSON messages.

_note:_ calling this on a message which has non-valid JSON contents will throw a json parsing exception.

#### message.finish()

Call this when you're done processing the message.  Tells the nsqd server process you have successfully finished processing this message.  The server will remove this message from the queue and not send it out to any more clients.

If there is an error finishing this message, the client will emit an `error` event.

_note:_ currently the binary protocol does not communicate anything back in the event of a successful `FIN` message.  There's no way to have a callback for `message.finish()` at this time -- it's fire and forget.

#### message.requeue(timeoutInMilliseconds: int)

__timeoutInMilliseconds: int__ millisecond timeout the nsqd server will wait before attempting to deliver the message again.

Signals the nsqd server to requeue the message and deliver it again.  You usually call this if the message consumer has failed to process the message appropriately.

If there is a problem requeuing this message, the client will emit an `error` event.

_note:_ currently the binary protocol does not communicate anything back in the event of a successful `REQ` message.  There's no way to have a callback for `message.requeue(1000)` at this time -- it's fire and forget.

#### message.touch()

Signal the nsqd server you want more time to process this message.

_note:_ currently the binary protocol does not communicate anything back in the event of a successful `TOUCH` message.  There's no way to have a callback for `message.touch()` at this time -- it's fire and forget.

#### message.responded: bool

Initially set to `false`. This will be set this to `true` after calling `message.finish()` or `message.requeu()`.

_note:_ it is currently considered an error for a client to respond to a message more than once.  Calling `message.finish()` or `message.requeue()` more than once on a message will result in the client emitting an error, so it is best to check `message.responded` if you're unsure.

```js
client.on('message', function(msg) {
  console.log(msg.responded) //false
  msg.finish()
  console.log(msg.responded) //true

  //don't do this:
  msg.finish() //client will soon emit an `error` event saying the message as already handled
  //or this:
  msg.requeue(100)

  //do this instead:
  if(!msg.responded) {
    msg.finish()
  }
})
```

## contributions

I love contributions! Fork & send pull requests please!  After a few pull requests I can add you as a contributor with push & pull acess if you're interested.  If you find any problems or want to undertake more advanced/crazy refactorings please feel free to open an issue and we can discuss.

## LICENSE

Copyright (c) 2014 Brian Carlson (brian.m.carlson@gmail.com)

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
