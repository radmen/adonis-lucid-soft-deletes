'use strict'

const Database = use('Database')

class SoftDeletes {
  register (Model) {
    const deletedAtColumn = 'deleted_at'

    Model.addGlobalScope(
      query => {
        query.whereNull(`${Model.table}.${deletedAtColumn}`)
      },
      'soft_deletes'
    )

    Model.prototype.delete = async function ({ force = false } = {}) {
      await this.constructor.$hooks.before.exec('delete', this)

      const now = new Date()
      const query = Database.table(this.constructor.table)
        .where(this.constructor.primaryKey, this.primaryKeyValue)

      const updatePromise = force
        ? query.delete()
        : query.update({ [deletedAtColumn]: Model.formatDates(deletedAtColumn, now) })

      const affected = await updatePromise

      if (affected > 0) {
        // this attribute will be marked as `dirty`
        this.set(deletedAtColumn, force ? null : now)
        this.freeze()
      }

      await this.constructor.$hooks.after.exec('delete', this)

      return !!affected
    }

    Model.prototype.restore = async function () {
      await this.constructor.$hooks.before.exec('restore', this)

      const query = Database.table(this.constructor.table)
      const affected = await query.where(this.constructor.primaryKey, this.primaryKeyValue)
        .update({ [deletedAtColumn]: null })

      if (affected > 0) {
        this.$frozen = false

        // this attribute will be marked as `dirty`
        this.set(deletedAtColumn, null)
      }

      await this.constructor.$hooks.after.exec('restore', this)

      return !!affected
    }

    Model.scopeWithTrashed = function (query) {
      return query.ignoreScopes(['soft_deletes'])
    }

    Model.withTrashed = function () {
      return this.query().withTrashed()
    }

    Model.scopeOnlyTrashed = function (query) {
      return query.ignoreScopes(['soft_deletes'])
        .whereNotNull(deletedAtColumn)
    }

    Model.onlyTrashed = function () {
      return this.query().onlyTrashed()
    }

    /**
     * Assume that model is always in non-deleted state.
     * It's easier to work this way with models state.
     *
     * And if you wonder if that's safe, well - not really.
     */
    Object.defineProperty(Model.prototype, 'isDeleted', {
      get () {
        return false
      }
    })

    Object.defineProperty(Model.prototype, 'isTrashed', {
      get () {
        return !!this.$attributes[deletedAtColumn]
      }
    })

    Object.defineProperty(Model.prototype, 'wasTrashed', {
      get () {
        const dirtyAttributes = this.dirty

        return (deletedAtColumn in dirtyAttributes) && !this.isTrashed
      }
    })

    Object.defineProperty(Model, 'usesSoftDeletes', {
      get () {
        return true
      }
    })
  }
}

module.exports = SoftDeletes
