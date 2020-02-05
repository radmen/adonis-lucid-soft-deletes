module.exports = (queryBuilderInstance) => {
  queryBuilderInstance.delete = function ({ force = false } = {}) {
    this._applyScopes()

    if (this.Model.usesSoftDeletes && !force) {
      return this.query.update({
        [this.Model.columnName]: this.Model.formatDates(this.Model.columnName, new Date())
      })
    }

    return this.query.delete()
  }

  return queryBuilderInstance
}
