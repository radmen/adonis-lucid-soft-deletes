const { ServiceProvider } = require('@adonisjs/fold')

class SoftDeleteProvider extends ServiceProvider {
  register () {
    this.app.bind('Adonis/Addons/SoftDelete', () => {
      const SoftDelete = require('../src/Traits/SoftDelete')

      return new SoftDelete()
    })

    this.app.alias('Adonis/Addons/SoftDelete', 'Lucid/SoftDelete')
  }
}

module.exports = SoftDeleteProvider
