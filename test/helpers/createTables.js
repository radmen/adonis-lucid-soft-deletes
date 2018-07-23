module.exports = db => Promise.all([
  db.schema.createTable('users', (table) => {
    table.increments()
    table.string('username')
    table.timestamps()
    table.timestamp('deleted_at').nullable()
  })
])
