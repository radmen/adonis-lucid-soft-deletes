const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const lucidFactory = require('@adonisjs/lucid')
const fold = require('@adonisjs/fold')
const iocResolver = require('@adonisjs/lucid/lib/iocResolver')
const { ServiceProvider } = require('../')

const helpers = require('./helpers')

chai.use(sinonChai)

const { expect } = chai
const { ioc } = fold

fold.resolver.appNamespace('Adonis')

const dateToSeconds = date => Math.floor(new Date(date).getTime() / 1000, 0)
const noop = () => {}

const defineModel = async (lucid, bootCallback = noop) => {
  const User = class extends lucid.Model {
    static boot() {
      super.boot()

      this.addTrait('@provider:Lucid/SoftDelete')
      bootCallback.call(this)
    }
  }

  await lucid.Models.add('user', User)

  return User
}

iocResolver.setFold(fold)

describe('softDeletes', () => {
  let lucid
  let User

  before(async () => {
    lucid = lucidFactory(helpers.lucidConfig)
    Model = lucid.Model

    ioc.singleton('Adonis/Src/Database', () => lucid.db)
    ioc.alias('Adonis/Src/Database', 'Database')

    await helpers.createTables(lucid.db)

    new ServiceProvider(ioc).register()
  })

  beforeEach(async () => {
    await lucid.db.table('users').truncate()

    User = await defineModel(lucid)
  })

  after(async () => {
    await helpers.dropTables(lucid.db)
    await lucid.db.close(helpers.lucidConfig.connection)
  })

  it('marks model as deleted', async () => {
    const clock = sinon.useFakeTimers()
    const user = await User.create({ username: 'Jon' })

    const model = await User.firstOrFail()

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
      deleted_at: new Date()
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
      User.create({ username: 'Ed', deleted_at: new Date }),
    ])

    const list = await User.all()

    expect(list.rows.length).to.equal(2)
  })

  describe('events', () => {
    it('triggers delete hooks', async () => {
      const beforeSpy = sinon.spy()
      const afterSpy = sinon.spy()

      const User = await defineModel(lucid, function () {
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

      const User = await defineModel(lucid, function () {
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
})
