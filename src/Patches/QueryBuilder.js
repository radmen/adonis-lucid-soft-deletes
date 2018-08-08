/**
 * Monkey patches for Lucids QueryBuilder
 */

const QueryBuilder = require('@adonisjs/lucid/src/Lucid/QueryBuilder')

QueryBuilder.prototype.delete = function ({ force = false } = {}) {
  this._applyScopes()

  if (this.Model.usesSoftDeletes && !force) {
    return this.query.update({
      deleted_at: this.Model.formatDates('deleted_at', new Date())
    })
  }

  return this.query.delete()
}
