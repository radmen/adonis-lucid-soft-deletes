const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const lucidFactory = require('@adonisjs/lucid')
const fold = require('@adonisjs/fold')
const moment = require('moment')
const iocResolver = require('@adonisjs/lucid/lib/iocResolver')
const ServiceProvider = require('../providers/SoftDeletesProvider')

const helpers = require('./helpers')

chai.use(sinonChai)

const { expect } = chai
const { ioc } = fold
const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss'

fold.resolver.appNamespace('Adonis')

const noop = () => {}

const defineModel = (lucid, bootCallback = noop) => {
  const User = class extends lucid.Model {
    static boot () {
      super.boot()

      this.addTrait('@provider:Lucid/SoftDeletes')
      bootCallback.call(this)
    }
  }

  lucid.Models.add('user', User)

  return User
}

iocResolver.setFold(fold)

describe('softDeletes', () => {
  let lucid
  let User

  before(async () => {
    lucid = lucidFactory(helpers.lucidConfig)

    ioc.singleton('Adonis/Src/Database', () => lucid.db)
    ioc.alias('Adonis/Src/Database', 'Database')

    ioc.bind('Adonis/Src/Model', () => lucid.Model)
    ioc.alias('Adonis/Src/Model', 'Model')

    await helpers.createTables(lucid.db)

    new ServiceProvider(ioc).register()
  })

  beforeEach(async () => {
    await lucid.db.table('users').truncate()

    User = defineModel(lucid)
  })

  after(async () => {
    await helpers.dropTables(lucid.db)
    await lucid.db.close(helpers.lucidConfig.connection)
  })

  it('marks model as deleted', async () => {
    const clock = sinon.useFakeTimers({
      now: new Date()
    })
    const model = await User.create({ username: 'Jon' })

    await model.delete()

    expect(model.isTrashed).to.equal(true)
    expect(+model.deleted_at).to.equal(+new Date())

    const check = await lucid.db.table('users')
      .where({
        id: model.id,
        deleted_at: null
      })
      .first()

    expect(check).to.be.undefined // eslint-disable-line

    clock.restore()
  })

  it('restores deleted model', async () => {
    const user = await User.create({
      username: 'Jon',
      deleted_at: moment().format(DATE_FORMAT)
    })

    await user.restore()

    const check = await lucid.db.table('users')
      .where({ id: user.id, deleted_at: null })
      .first()

    expect(user.wasTrashed).to.equal(true)
    expect(check).to.not.be.undefined // eslint-disable-line
  })

  it('force deletes model', async () => {
    const user = await User.create({ username: 'Jon' })

    await user.delete({ force: true })

    const check = await lucid.db.table('users')
      .where({ id: user.id })
      .first()

    expect(check).to.be.undefined // eslint-disable-line
  })

  it('does not query deleted records', async () => {
    await Promise.all([
      User.create({ username: 'Jon' }),
      User.create({ username: 'Array' }),
      User.create({ username: 'Ed', deleted_at: moment().format(DATE_FORMAT) })
    ])

    const list = await User.all()

    expect(list.rows.length).to.equal(2)
  })

  it('has scope which includes deleted models', async () => {
    await Promise.all([
      User.create({ username: 'Jon' }),
      User.create({ username: 'Array' }),
      User.create({ username: 'Ed', deleted_at: moment().format(DATE_FORMAT) })
    ])

    const list = await User.query().withTrashed().fetch()
    expect(list.rows.length).to.equal(3)
  })

  it('has static scope which includes deleted models', async () => {
    await Promise.all([
      User.create({ username: 'Jon' }),
      User.create({ username: 'Array' }),
      User.create({ username: 'Ed', deleted_at: moment().format(DATE_FORMAT) })
    ])

    const list = await User.withTrashed().fetch()
    expect(list.rows.length).to.equal(3)
  })

  it('has scope which gets only deleted models', async () => {
    await Promise.all([
      User.create({ username: 'Jon' }),
      User.create({ username: 'Array' }),
      User.create({ username: 'Ed', deleted_at: moment().format(DATE_FORMAT) })
    ])

    const list = await User.query().onlyTrashed().fetch()
    expect(list.rows.length).to.equal(1)
  })

  it('has static scope gets only includes deleted models', async () => {
    await Promise.all([
      User.create({ username: 'Jon' }),
      User.create({ username: 'Array' }),
      User.create({ username: 'Ed', deleted_at: moment().format(DATE_FORMAT) })
    ])

    const list = await User.onlyTrashed().fetch()
    expect(list.rows.length).to.equal(1)
  })

  describe('events', () => {
    it('triggers delete hooks', async () => {
      const beforeSpy = sinon.spy()
      const afterSpy = sinon.spy()

      const User = defineModel(lucid, function () {
        this.addHook('beforeDelete', beforeSpy)
        this.addHook('afterDelete', afterSpy)
      })

      const model = await User.create({ username: 'Jon' })

      await model.delete()

      expect(beforeSpy).to.have.been.calledWith(model)
      expect(afterSpy).to.have.been.calledWith(model)
    })

    it('triggers restore hooks', async () => {
      const beforeSpy = sinon.spy()
      const afterSpy = sinon.spy()

      const User = defineModel(lucid, function () {
        this.addHook('beforeRestore', beforeSpy)
        this.addHook('afterRestore', afterSpy)
      })

      const model = await User.create({ username: 'Jon' })

      await model.delete()
      await model.restore()

      expect(beforeSpy).to.have.been.calledWith(model)
      expect(afterSpy).to.have.been.calledWith(model)
    })
  })

  describe('QueryBuilder', () => {
    it('marks as deleted query records', async () => {
      const clock = sinon.useFakeTimers({
        now: new Date()
      })

      await Promise.all([
        User.create({ username: 'Jon' }),
        User.create({ username: 'Array' }),
        User.create({ username: 'Ed' })
      ])

      await User.query()
        .delete()

      const [{ count }] = await lucid.db.table('users')
        .where({
          deleted_at: moment().format(DATE_FORMAT)
        })
        .count('* as count')

      expect(parseInt(count)).to.equal(3)

      clock.restore()
    })

    it('force deletes query records', async () => {
      await Promise.all([
        User.create({ username: 'Jon' }),
        User.create({ username: 'Array' }),
        User.create({ username: 'Ed' })
      ])

      await User.query()
        .delete({ force: true })

      const [{ count }] = await lucid.db.table('users').count('* as count')
      expect(parseInt(count)).to.equal(0)
    })

    it('removes records for models without soft-deletes', async () => {
      class User extends lucid.Model {}

      lucid.Models.add('user', User)

      await Promise.all([
        User.create({ username: 'Jon' }),
        User.create({ username: 'Array' }),
        User.create({ username: 'Ed' })
      ])

      await User.query()
        .delete()

      const [{ count }] = await lucid.db.table('users').count('* as count')
      expect(parseInt(count)).to.equal(0)
    })
  })

  describe('Model', () => {
    it('usesSoftDeletes property', () => {
      class Product extends lucid.Model {}

      lucid.Models.add('product', Product)

      expect(Product.usesSoftDeletes).to.equal(false)
      expect(User.usesSoftDeletes).to.equal(true)
    })
  })
})
