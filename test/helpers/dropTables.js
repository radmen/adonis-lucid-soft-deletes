module.exports = db => Promise.all([
  db.schema.dropTable('user_tags'),
  db.schema.dropTable('users'),
  db.schema.dropTable('tags'),
  db.schema.dropTable('comments')
])
