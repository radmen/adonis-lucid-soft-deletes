const queryBuilderPatch = require('./QueryBuilder')

const Model = use('Model')

Object.defineProperty(Model, 'usesSoftDeletes', {
  get () {
    return false
  }
})

const parentQuery = Model.query

Model.query = function () {
  return queryBuilderPatch(parentQuery.call(this))
}
