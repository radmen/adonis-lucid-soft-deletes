module.exports = db => Promise.all([
  db.schema.createTable('users', (table) => {
    table.increments()
    table.string('username')
    table.timestamps()
    table.timestamp('deleted_at').nullable()
  }),

  db.schema.createTable('tags', (table) => {
    table.increments()
    table.string('title')
    table.timestamps()
    table.timestamp('deleted_at').nullable()
  }),

  db.schema.createTable('user_tags', (table) => {
    table.integer('user_id').unsigned()
    table.integer('tag_id').unsigned()
    table.timestamps()
    table.timestamp('deleted_at').nullable()
  })
])
