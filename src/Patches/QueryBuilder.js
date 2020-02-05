module.exports = (queryBuilderInstance) => {
  queryBuilderInstance.delete = function ({ force = false } = {}) {
    this._applyScopes()

    if (this.Model.usesSoftDeletes && !force) {
      const updateData = {}
      updateData[this.Model.columnName] = this.Model.formatDates(this.Model.columnName, new Date())
      return this.query.update(updateData)
    }

    return this.query.delete()
  }

  return queryBuilderInstance
}
