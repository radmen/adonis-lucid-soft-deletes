const { ServiceProvider } = require('@adonisjs/fold')

class SoftDeletesProvider extends ServiceProvider {
  register () {
    this.app.bind('Adonis/Addons/SoftDeletes', () => {
      const SoftDeletes = require('../src/Traits/SoftDeletes')

      return new SoftDeletes()
    })

    this.app.alias('Adonis/Addons/SoftDeletes', 'Lucid/SoftDeletes')
  }

  boot () {
    require('../src/Patches/Model')
  }
}

module.exports = SoftDeletesProvider
