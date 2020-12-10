'use strict'

const Database = use('Database')
const { retrieveTableDetails } = require('../utils')

class SoftDeletes {
  register (Model, customOptions) {
    const options = {
      deletedAtColumn: 'deleted_at',
      ...customOptions
    }

    const deletedAtColumn = options.deletedAtColumn

    Model.addGlobalScope(
      function (query) {
        const { table, alias } = retrieveTableDetails(query)

        // This might seem to be odd, yet there's a reason for this.
        // When using pivot models there's no easy way to retrieve
        // the correct name of the table from the query builder.
        // This simple check makes sure that we use the table (or alias)
        // retrieved from query builder only when the base table name
        // is the same as the table name from model.
        // If not, fallback to models default table name.
        const tableName = (Model.table === table)
          ? (alias || table)
          : Model.table

        query.whereNull(`${tableName}.${deletedAtColumn}`)
      },
      'soft_deletes'
    )

    Model.prototype.delete = async function ({ force = false } = {}) {
      await this.constructor.$hooks.before.exec('delete', this)

      const now = new Date()
      const query = Database.connection(Model.connection)
        .table(this.constructor.table)
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

      const query = Database.connection(Model.connection)
        .table(this.constructor.table)
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

    const { dates } = Model

    Object.defineProperties(Model.prototype, {
      /**
       * Assume that model is always in non-deleted state.
       * It's easier to work this way with models state.
       *
       * And if you wonder if that's safe, well - not really.
       */
      isDeleted: {
        get () {
          return false
        }
      },

      isTrashed: {
        get () {
          return !!this.$attributes[deletedAtColumn]
        }
      },

      wasTrashed: {
        get () {
          const dirtyAttributes = this.dirty
          return (deletedAtColumn in dirtyAttributes) && !this.isTrashed
        }
      }
    })

    Object.defineProperties(Model, {
      usesSoftDeletes: {
        get () {
          return true
        }
      },

      deletedColumnName: {
        get () {
          return deletedAtColumn
        }
      },

      dates: {
        get () {
          return dates.concat(deletedAtColumn)
        }
      }
    })
  }
}

module.exports = SoftDeletes
