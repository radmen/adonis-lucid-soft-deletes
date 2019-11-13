const chai = require('chai')
const {retrieveTableDetails} = require('../src/utils')

const { expect } = chai

describe('utils', () => {
  describe('retrieveTableDetails', () => {
    const buildQueryObject = (tableName, alias) => ({
      query: {
        _single: {
          table: alias
            ? `${tableName} as ${alias}`
            : tableName
        }
      }
    })

    it('returns simple table name', () => {
      const query = buildQueryObject('comments')
      expect(retrieveTableDetails(query)).to.eql({table: 'comments', alias: null})
    })

    it('returns aliased table name', () => {
      const query = buildQueryObject('comments', 'sj_1')
      expect(retrieveTableDetails(query)).to.eql({table: 'comments', alias: 'sj_1'})
    })
  })
})
