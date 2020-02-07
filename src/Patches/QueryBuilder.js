module.exports = (queryBuilderInstance) => {
  queryBuilderInstance.delete = function ({ force = false } = {}) {
    this._applyScopes()

    if (this.Model.usesSoftDeletes && !force) {
      return this.query.update({
        [this.Model.deletedColumnName]: this.Model.formatDates(this.Model.deletedColumnName, new Date())
      })
    }

    return this.query.delete()
  }

  return queryBuilderInstance
}
