'use strict'

const Database = use('Database')

class SoftDeletes {
  register (Model) {
    Model.addGlobalScope(
      query => {
        query.whereNull(`${Model.table}.deleted_at`)
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
        : query.update({ deleted_at: now })

      const affected = await updatePromise

      if (affected > 0) {
        // this attribute will be marked as `dirty`
        this.set('deleted_at', force ? null : now)
        this.freeze()
      }

      await this.constructor.$hooks.after.exec('delete', this)

      return !!affected
    }

    Model.prototype.restore = async function () {
      await this.constructor.$hooks.before.exec('restore', this)

      const query = Database.table(this.constructor.table)
      const affected = await query.where(this.constructor.primaryKey, this.primaryKeyValue)
        .update({ deleted_at: null })

      if (affected > 0) {
        this.$frozen = false

        // this attribute will be marked as `dirty`
        this.set('deleted_at', null)
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
        .whereNotNull('deleted_at')
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
        return !!this.$attributes.deleted_at
      }
    })

    Object.defineProperty(Model.prototype, 'wasTrashed', {
      get () {
        const dirtyAttributes = this.dirty

        return ('deleted_at' in dirtyAttributes) && !this.isTrashed
      }
    })
  }
}

module.exports = SoftDeletes
