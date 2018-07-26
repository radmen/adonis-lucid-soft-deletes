# see: https://github.com/mysqljs/mysql/pull/1962#issuecomment-390900841

ALTER USER 'test'@'%' IDENTIFIED WITH mysql_native_password BY 'test';
FLUSH PRIVILEGES;
