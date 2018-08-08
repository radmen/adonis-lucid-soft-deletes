const Model = use('Model')

Object.defineProperty(Model, 'usesSoftDeletes', {
  get () {
    return false
  }
})
