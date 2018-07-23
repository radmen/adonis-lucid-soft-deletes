const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const lucidFactory = require('@adonisjs/lucid')

const helpers = require('./helpers')

chai.use(sinonChai)

const { expect } = chai

const dateToSeconds = date => Math.floor(new Date(date).getTime() / 1000, 0)

describe('softDeletes', () => {
  let lucid;

  before(async () => {
    lucid = lucidFactory(helpers.lucidConfig)

    await helpers.createTables(lucid.db)
  })

  beforeEach(async () => {
    await lucid.db.table('users').truncate()
  })

  after(async () => {
    await helpers.dropTables(lucid.db)
    await lucid.db.close(helpers.lucidConfig.connection)
  })

  it('lols', () => {
    expect(1).to.equal(1)
  })
})
