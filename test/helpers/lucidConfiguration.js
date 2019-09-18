const connection = {
  user: 'test',
  database: 'test',
  password: 'test',
  port: 7000,
  host: 'localhost'
}

const drivers = {
  mysql5: 'mysql',
  mysql: 'mysql',
  postgres: 'pg',
  postgres10: 'pg'
}

const sqlite = {
  client: 'sqlite3',
  connection: {
    filename: './dev.sqlite3'
  },
  useNullAsDefault: true
}

const defaultConfig = {
  connection: process.env.NODE_ENV || 'sqlite',

  sqlite
}

module.exports = Object.keys(drivers)
  .reduce(
    (config, envName) => Object.assign({}, config, {
      [envName]: {
        client: drivers[envName],
        connection
      }
    }),
    defaultConfig
  )
