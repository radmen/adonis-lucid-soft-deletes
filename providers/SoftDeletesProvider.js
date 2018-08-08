const { ServiceProvider } = require('@adonisjs/fold')

class SoftDeletesProvider extends ServiceProvider {
  register () {
    require('../src/Patches/Model')
    require('../src/Patches/QueryBuilder')

    this.app.bind('Adonis/Addons/SoftDeletes', () => {
      const SoftDeletes = require('../src/Traits/SoftDeletes')

      return new SoftDeletes()
    })

    this.app.alias('Adonis/Addons/SoftDeletes', 'Lucid/SoftDeletes')
  }
}

module.exports = SoftDeletesProvider
