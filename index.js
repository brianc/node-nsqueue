var connect = module.exports = function(options) {
  return new module.exports.Client(options)
}

//export direct Client & Connection constructors
module.exports.Connection = require('./lib/connection')
module.exports.Client = require('./lib/client')
