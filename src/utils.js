const tableRegex = /^(\w+)(?:\s+as\s+(\w+))?$/i

/**
 * @typedef TableDetails
 * @property {String} table
 * @property {?String} alias
 */

/**
 * Retrieve table name (and alias)
 * from the query builder object.
 *
 * @param {Object} query
 * @return {TableDetails}
 */
const retrieveTableDetails = ({query}) => {
  const {_single: {table}} = query
  const [_, tableName, alias = null] = tableRegex.exec(table)

  return {table: tableName, alias}
}

module.exports = {retrieveTableDetails}
