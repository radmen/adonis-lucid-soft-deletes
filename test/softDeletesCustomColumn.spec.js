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
const always = (value) => () => value

const defineModel = (name, lucid, bootCallback = noop, extendObject = {}) => {
  const Model = class extends lucid.Model {
    static boot () {
      super.boot()

      this.addTrait('@provider:Lucid/SoftDeletes', {
        deletedAtColumn: 'd_delete'
      })
      bootCallback.call(this)
    }
  }

  lucid.Models.add(name, Model)

  const { staticMethods = {}, methods = {} } = extendObject
  Object.defineProperty(Model, 'name', { value: name })
  Object.assign(Model, staticMethods)
  Object.assign(Model.prototype, methods)

  return Model
}

iocResolver.setFold(fold)

describe('softDeletesCustomColumn', () => {
  let lucid
  let User

  before(async () => {
    lucid = lucidFactory(helpers.lucidConfig)

    ioc.singleton('Adonis/Src/Database', always(lucid.db))
    ioc.alias('Adonis/Src/Database', 'Database')

    ioc.bind('Adonis/Src/Model', always(lucid.Model))
    ioc.alias('Adonis/Src/Model', 'Model')

    await helpers.createTablesCustomColumn(lucid.db)

    const provider = new ServiceProvider(ioc)

    provider.register()
    provider.boot()
  })

  beforeEach(async () => {
    await lucid.db.table('user_tags').truncate()
    await lucid.db.table('tags').truncate()
    await lucid.db.table('users').truncate()
    await lucid.db.table('comments').truncate()

    User = defineModel('User', lucid)
  })

  after(async () => {
    await helpers.dropTables(lucid.db)
    await lucid.db.close(helpers.lucidConfig.connection)
  })

  it('marks model as deleted custom column', async () => {
    const clock = sinon.useFakeTimers({
      now: new Date()
    })
    const model = await User.create({ username: 'Jon' })

    await model.delete()

    expect(model.isTrashed).to.equal(true)
    expect(+model.d_delete).to.equal(+new Date())

    const check = await lucid.db.table('users')
      .where({
        id: model.id,
        d_delete: null
      })
      .first()

    expect(check).to.be.undefined // eslint-disable-line

    clock.restore()
  })

  it('restores deleted model custom column', async () => {
    const user = await User.create({
      username: 'Jon',
      d_delete: moment().format(DATE_FORMAT)
    })

    await user.restore()

    const check = await lucid.db.table('users')
      .where({ id: user.id, d_delete: null })
      .first()

    expect(user.wasTrashed).to.equal(true)
    expect(check).to.not.be.undefined // eslint-disable-line
  })

  it('force deletes model custom column', async () => {
    const user = await User.create({ username: 'Jon' })

    await user.delete({ force: true })

    const check = await lucid.db.table('users')
      .where({ id: user.id })
      .first()

    expect(check).to.be.undefined // eslint-disable-line
  })

  it('does not query deleted records custom column', async () => {
    await Promise.all([
      User.create({ username: 'Jon' }),
      User.create({ username: 'Array' }),
      User.create({ username: 'Ed', d_delete: moment().format(DATE_FORMAT) })
    ])

    const list = await User.all()

    expect(list.rows.length).to.equal(2)
  })

  it('has scope which includes deleted models custom column', async () => {
    await Promise.all([
      User.create({ username: 'Jon' }),
      User.create({ username: 'Array' }),
      User.create({ username: 'Ed', d_delete: moment().format(DATE_FORMAT) })
    ])

    const list = await User.query().withTrashed().fetch()
    expect(list.rows.length).to.equal(3)
  })

  it('has static scope which includes deleted models custom column', async () => {
    await Promise.all([
      User.create({ username: 'Jon' }),
      User.create({ username: 'Array' }),
      User.create({ username: 'Ed', d_delete: moment().format(DATE_FORMAT) })
    ])

    const list = await User.withTrashed().fetch()
    expect(list.rows.length).to.equal(3)
  })

  it('has scope which gets only deleted models custom column', async () => {
    await Promise.all([
      User.create({ username: 'Jon' }),
      User.create({ username: 'Array' }),
      User.create({ username: 'Ed', d_delete: moment().format(DATE_FORMAT) })
    ])

    const list = await User.query().onlyTrashed().fetch()
    expect(list.rows.length).to.equal(1)
  })

  it('has static scope gets only includes deleted models custom column', async () => {
    await Promise.all([
      User.create({ username: 'Jon' }),
      User.create({ username: 'Array' }),
      User.create({ username: 'Ed', d_delete: moment().format(DATE_FORMAT) })
    ])

    const list = await User.onlyTrashed().fetch()
    expect(list.rows.length).to.equal(1)
  })

  it('adds d_delete column to dates custom column', () => {
    expect(User.dates).to.eql(['created_at', 'updated_at', 'd_delete'])
  })

  describe('events custom column', () => {
    it('triggers delete hooks custom column', async () => {
      const beforeSpy = sinon.spy()
      const afterSpy = sinon.spy()

      const User = defineModel('User', lucid, function () {
        this.addHook('beforeDelete', beforeSpy)
        this.addHook('afterDelete', afterSpy)
      })

      const model = await User.create({ username: 'Jon' })

      await model.delete()

      expect(beforeSpy).to.have.been.calledWith(model)
      expect(afterSpy).to.have.been.calledWith(model)
    })

    it('triggers restore hooks custom column', async () => {
      const beforeSpy = sinon.spy()
      const afterSpy = sinon.spy()

      const User = defineModel('User', lucid, function () {
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

  describe('QueryBuilder custom column', () => {
    it('marks as deleted query records custom column', async () => {
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
          d_delete: moment().format(DATE_FORMAT)
        })
        .count('* as count')

      expect(parseInt(count)).to.equal(3)

      clock.restore()
    })

    it('force deletes query records custom column', async () => {
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

    it('removes records for models without soft-deletes custom column', async () => {
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

  describe('Model custom column', () => {
    it('usesSoftDeletes property custom column', () => {
      class Product extends lucid.Model {}

      lucid.Models.add('product', Product)

      expect(Product.usesSoftDeletes).to.equal(false)
      expect(User.usesSoftDeletes).to.equal(true)
    })
  })

  describe('Many-to-many relation custom column', () => {
    let User
    let Tag
    let UserTag

    before(() => {
      User = defineModel('User', lucid, noop, {
        methods: {
          tags () {
            return this.belongsToMany('Tag').pivotModel('UserTag')
          }
        }
      })
      Tag = defineModel('Tag', lucid)
      UserTag = defineModel('UserTag', lucid)

      ioc.bind('Tag', always(Tag))
      ioc.bind('UserTag', always(UserTag))
    })

    it('does not include deleted pivots custom column', async () => {
      const user = await User.create({ username: 'Jon' })
      const tags = await Promise.all([
        Tag.create({ title: 'Foo' }),
        Tag.create({ title: 'Bar' })
      ])

      await Promise.all(tags.map(model => user.tags().save(model)))

      await lucid.db.table('user_tags')
        .where({ tag_id: tags[0].id })
        .update({ d_delete: new Date() })

      const userTags = await user.tags().fetch()
      expect(userTags.rows.length).to.equal(1)

      const freshUser = await User.query()
        .with('tags')
        .first()
      expect(freshUser.getRelated('tags').rows.length).to.equal(1)
    })

    // Fails due to bug in Lucid
    it.skip('appends scope to whereHas() statement custom column', async () => {
      const user = await User.create({ username: 'Jon' })
      const tags = await Promise.all([
        Tag.create({ title: 'Foo' }),
        Tag.create({ title: 'Bar' })
      ])

      await Promise.all(tags.map(model => user.tags().save(model)))

      await lucid.db.table('user_tags')
        .where({ tag_id: tags[0].id })
        .update({ d_delete: new Date() })

      const freshUser = await User.query()
        .whereHas('tags', (query) => {
          query.where('title', 'Foo')
        })
        .first()

      expect(freshUser).to.be.undefined // eslint-disable-line
    })
  })

  describe('Regression tests custom column', () => {
    it('gh-10', async () => {
      const Comment = defineModel('Comment', lucid, noop, {
        methods: {
          replies () {
            return this.hasMany(Comment, 'id', 'reply_to_comment_id')
          }
        }
      })

      const comment = await Comment.create()

      await Promise.all([
        Comment.create({ reply_to_comment_id: comment.id }),
        Comment.create({ reply_to_comment_id: comment.id, d_delete: new Date() }),
        Comment.create({ reply_to_comment_id: comment.id, d_delete: new Date() })
      ])

      const results = await Comment.query()
        .whereNull('reply_to_comment_id')
        .withCount('replies')
        .first()

      expect(parseInt(results.replies_count, 10)).to.equal(1)
    })
  })
})