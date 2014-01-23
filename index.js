var Connection = require('./lib/Connection')
var connect = module.exports = function(options) {
  return new Connection(options)
}
connect.Connection = Connection
connect.Client = require('./lib/client')
