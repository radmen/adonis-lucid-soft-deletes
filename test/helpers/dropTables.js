module.exports = db => Promise.all([
  db.schema.dropTable('users')
])
