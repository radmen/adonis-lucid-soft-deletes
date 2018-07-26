#!/bin/bash

case "$NODE_ENV" in
  "mysql")
    docker run -d --rm --name knex-db -p 7000:3306 \
      -e MYSQL_DATABASE=test \
      -e MYSQL_USER=test \
      -e MYSQL_PASSWORD=test \
      -e MYSQL_ROOT_PASSWORD=secret \
      mysql

    sleep 60

    docker exec knex-db mysql -uroot -psecret -e"ALTER USER 'test'@'%' IDENTIFIED WITH mysql_native_password BY 'test';"
    docker exec knex-db mysql -uroot -psecret -e"FLUSH PRIVILEGES;"
    ;;

  "mysql5")
    docker run -d --rm --name knex-db -p 7000:3306 \
      -e MYSQL_DATABASE=test \
      -e MYSQL_USER=test \
      -e MYSQL_PASSWORD=test \
      -e MYSQL_RANDOM_ROOT_PASSWORD=1 \
      mysql:5

    sleep 20
    ;;

  "postgres")
    docker run -d --rm --name knex-db -p 7000:5432 \
      -e POSTGRES_USER=test \
      -e POSTGRES_USER=test \
      -e POSTGRES_PASSWORD=test \
      postgres:alpine

    sleep 10
    ;;

  "postgres9")
    docker run -d --rm --name knex-db -p 7000:5432 \
      -e POSTGRES_USER=test \
      -e POSTGRES_USER=test \
      -e POSTGRES_PASSWORD=test \
      postgres:9-alpine

    sleep 10
    ;;

  *)
    ;;
esac
