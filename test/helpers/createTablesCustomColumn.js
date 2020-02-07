module.exports = db => Promise.all([
  db.schema.createTable('users', (table) => {
    table.increments()
    table.string('username')
    table.timestamps()
    table.timestamp('d_delete').nullable()
  }),

  db.schema.createTable('tags', (table) => {
    table.increments()
    table.string('title')
    table.timestamps()
    table.timestamp('d_delete').nullable()
  }),

  db.schema.createTable('user_tags', (table) => {
    table.increments()
    table.integer('user_id').unsigned()
    table.integer('tag_id').unsigned()
    table.timestamps()
    table.timestamp('d_delete').nullable()
  }),

  db.schema.createTable('comments', (table) => {
    table.increments()
    table.integer('reply_to_comment_id').unsigned().nullable()
    table.timestamps()
    table.timestamp('d_delete').nullable()
  })
])
