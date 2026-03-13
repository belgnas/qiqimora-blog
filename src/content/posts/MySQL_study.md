---
title: MySQL_学习笔记
# 文章标题(必需)
published: 2025-09-16
# 文章发布日期，格式为YYYY-MM-DD
pinned: false
# 是否置顶文章，true表示置顶
description: 这是MySQL的学习笔记，记录了我在学习MySQL过程中的一些知识和经验。
# 文章描述(必需)
tags: [MySQL]
# 文章标签数组，用于标记文章主题
category: 计算机基础
# 文章分类，用于组织文章

licenseName: "Unlicensed"
# 文章许可证名称，如"MIT"、"CC BY 4.0"等
author: qiqimora
# 文章作者姓名
draft: false
# 是否为草稿，true表示草稿，false表示正式发布
date: 2025-09-02
# 文章创建日期
pubDate: 2025-09-16
# 文章发布日期(与published类似)
---

# MySQL

## MySQL启动/停止
```shell
net start mysql80
net stop mysql80
```

## MySQL客户端连接
```shell
客户端自带命令行
mysql [-h 127.0.0.1] [-p 3306] -u root -p
```

## SQL语句
### **1. DDL：数据定义语言**
#### 1. 查询数据库（所有/当前）
```sql
SHOW DATABASES;

SELECT DATABASE();
```
* 执行后，你会看到一列数据库名称，包括系统自带的 `information_schema`, `mysql`, `performance_schema` 等。
* `SELECT DATABASE();` 会显示当前正在使用的数据库。如果你刚登录 MySQL，通常会显示 `NULL`，因为还没有选择任何数据库。
--- 
#### 2. 创建数据库
```sql
CREATE DATABASE [IF NOT EXISTS] 数据库名称 [DEFAULT CHARSET 字符集] [COLLATE 排序规则];
```
* 执行后，你应该会看到 `Query OK, 1 row affected` 的提示，这表示数据库创建成功了。
* `IF NOT EXISTS` 是一个可选的部分，它的作用是：如果数据库已经存在，就不报错，继续执行后面的命令。
* `DEFAULT CHARSET` 和 `COLLATE` 也是可选的，分别用来指定数据库的默认字符集和排序规则。如果不指定，MySQL 会使用默认设置，通常是 `utf8mb4` 字符集和 `utf8mb4_general_ci` 排序规则。
---
#### 3. 使用数据库
```sql
USE 数据库名称;
```
* 这个命令告诉 MySQL：从现在开始，我要操作哪个数据库了。
* 执行后，你应该会看到 `Database changed` 的提示。这意味着你已经"进入"了learning_db，接下来所有的操作都将在这个数据库里进行。
---
#### 4. 删除数据库
```sql
DROP DATABASE [IF EXISTS] 数据库名称;
```
* `IF EXISTS` 是一个可选的部分，它的作用是：如果数据库不存在，就不报错，继续执行后面的命令。
* 执行后，你会看到 `Query OK, 0 rows affected` 的提示，这表示数据库删除成功了。
---
#### 5. 创建数据表
```sql
CREATE TABLE 表名称 (
    列名称1 数据类型1 [COMMENT '列注释'],
    列名称2 数据类型2 [COMMENT '列注释'],
    ...
); COMMENT '表注释';
```
例子：创建一个 users (用户) 表，用来存放用户信息。这个表将有3个列：id, name, email。
```
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    name VARCHAR(50) COMMENT '用户名',
    email VARCHAR(100) COMMENT '用户邮箱'
); COMMENT '用户表';
```
* 执行成功后，你会看到 `Query OK, 0 rows affected` 的提示。
*  命令详解 (非常重要)(逐行解释):
* `CREATE TABLE users (...)`: 这是创建表的命令，表名叫 users。括号里是表的结构定义。
* `COMMENT '注释'`: 这是一个可选的部分，它的作用是：给表和列添加注释，方便自己和他人理解。
* `id INT PRIMARY KEY AUTO_INCREMENT`:
    * id INT: 创建一个名为 id 的列，它的数据类型是 INT (整数)。
    * PRIMARY KEY: 把 id 列设置成 主键。主键是每一行数据的唯一标识，不能重复，非常重要！
    * AUTO_INCREMENT: 表示 id 的值会自动增长。当我们插入新数据时，MySQL 会自动给它分配一个不重复的数字 (1, 2, 3, ...)，我们不用自己管。
* `name VARCHAR(50)`:  
    * 创建一个名为 name 的列，数据类型是 VARCHAR(50)。VARCHAR 表示可变长度的字符串，50
        代表这个名字最长不能超过50个字符。
    * COMMENT '用户名': 给 name 列添加注释，说明它的作用是存储用户名。
* `email VARCHAR(100)`:
    * 同理，创建一个 email 列，最长100个字符。
    * COMMENT '用户邮箱': 给 email 列添加注释，说明它的作用是存储用户邮箱。
* `);`: 结束整个 CREATE TABLE 命令。
---
#### 6. 查询数据表(所有)
```sql
SHOW TABLES;
```
* 执行后，你会看到一列数据表名称，包括我们刚刚创建的 users。
---
#### 7. 查看数据表结构
```sql
DESCRIBE 表名称;
```
* `DESCRIBE` (可以简写为 DESC) 命令会显示表的列、数据类型等信息，非常有用。
---
#### 8. 查询指定表的建表语句
```sql
SHOW CREATE TABLE 表名称;
```
* 执行后，你会看到一个 SQL 语句，它就是用来创建这个表的。
* 这个语句包含了表的名称、列的定义、主键、索引等信息。
* 你可以把这个语句复制下来，用来备份表结构，或者在其他数据库中创建相同的表。
---
#### 9. 添加表结构
```sql
ALTER TABLE 表名称 ADD 列名称 数据类型(长度) [COMMENT '列注释'] [约束];
```
例子：向 users 表添加一个 age 列，用来存储用户年龄。
```
ALTER TABLE users ADD age INT(3) COMMENT '用户年龄';
```
* 执行成功后，你会看到 `Query OK, 0 rows affected` 的提示。
*  命令详解:
* `ALTER TABLE users`: 告诉 MySQL 我们要操作 users 表。
* `ADD age INT`: 添加一个名为 age 的列，数据类型是 INT (整数)。
* `INT(3)`: 表示 age 列的数据类型是 INT (整数)，长度为3。
    * 长度为3 意味着 age 列最多只能存储3位数字，比如 123, 999。
    * 超出长度的数字会被截断，比如 1234 会变成 123。
* `COMMENT '用户年龄'`: 给 age 列添加注释，说明它的作用是存储用户年龄。
  * [约束] (可选)：
    * 约束是用来限制列中数据的规则，确保数据的完整性和一致性。
    * 比如：NOT NULL (不能为空)、UNIQUE (唯一)、PRIMARY KEY (主键)、FOREIGN KEY (外键) 等。
    * `NOT NULL`: 表示这个列的值不能为空。
    * `UNIQUE`: 表示这个列的值必须是唯一的，不能重复。
    * `PRIMARY KEY`: 表示这个列是主键，唯一标识每一行数据。
    * `FOREIGN KEY`: 表示这个列是外键，引用了其他表的主键。
---
#### 10. 修改表结构
修改数据类型
```sql
ALTER TABLE 表名称 MODIFY 列名称 数据类型(长度);
```
例子：修改 users 表的 age 列，将数据类型改为 INT(4)
```
ALTER TABLE users MODIFY age INT(4);
```
修改列名和数据类型
```sql
ALTER TABLE 表名称 CHANGE 旧列名称 新列名称 数据类型(长度) [COMMENT '列注释'] [约束];
```
例子：修改 users 表的 age 列，将列名改为 age_new，数据类型改为 INT(4)
```
ALTER TABLE users CHANGE age age_new INT(4);
```
* 命令详解:
    * `ALTER TABLE users`: 告诉 MySQL 我们要操作 users 表。
    * `MODIFY age INT(4)`: 修改 age 列的数据类型为 INT(4)。
    * `COMMENT '用户年龄'`: 给 age 列添加注释，说明它的作用是存储用户年龄。
---
#### 11. 删除表
```sql
ALTER TABLE 表名称 DROP 列名称;
```
例子：删除 users 表的 age_new 列
```
ALTER TABLE users DROP age_new;
```
* 命令详解:
    * `ALTER TABLE users`: 告诉 MySQL 我们要操作 users 表。
    * `DROP age_new`: 删除 age_new 列。
---
#### 12. 删除指定表，并重建该表
```sql
TRUNCATE TABLE 表名称;
```
例子：删除 users 表的所有数据
```
TRUNCATE TABLE users;
```
* 命令详解:
    * `TRUNCATE TABLE users`: 告诉 MySQL 我们要删除 users 表的所有数据。
    * 这会删除表中的所有数据，但是表结构不会改变。
---

### **2. DML：数据操作语言**
#### 13. 插入数据
```sql
1. 给指定的列插入数据
INSERT INTO 表名称 (列1, 列2, ...) VALUES (值1, 值2, ...);

2. 给所有列插入数据
INSERT INTO 表名称 VALUES (值1, 值2, ...);

3. 批量添加数据
INSERT INTO 表名称 (列1, 列2, ...) VALUES (值1, 值2, ...), (值1, 值2, ...), ...;
或
INSERT INTO 表名称 VALUES (值1, 值2, ...), (值1, 值2, ...), ...;
```
例子：向 users 表插入一条用户数据（姓名，邮箱）
```
INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com');
```
* 成功后，你会看到 `Query OK, 1 row affected` 的提示。
*  命令详解:
* `INSERT INTO users`: 告诉 MySQL 我们要在 users 表中插入数据。
* `(name, email)`: 指定我们要为哪些列提供值。
* `VALUES ('Alice', 'alice@example.com')`: 提供与前面列对应的具体值。
    * 字符串（如名字和邮箱）在 SQL 中需要用 单引号 ' ' 括起来。
    * 值的顺序必须和列的顺序一一对应 (name -> 'Alice', email -> 'alice@example.com')。

    思考题： 注意到我们没有插入 id 吗？这是为什么呢？  
    答：因为我们在创建表时把 id 设置成了 AUTO_INCREMENT，MySQL 会自动为我们生成一个独一无二的id！
---
#### 14. 更新数据 (UPDATE)
 * !! 超级重要警告 !!  
   UPDATE 是一个“危险”的命令！如果你在 UPDATE 时忘记使用 WHERE 子句，它会把 整个表 的所有记录都更新掉！所以，使用 UPDATE 时，WHERE 几乎总是必需的。
 ```sql
 1. 给指定的列更新数据
 UPDATE 表名称 SET 列1 = 值1, 列2 = 值2, ... [WHERE 条件];
 
 2. 对所有列更新数据
 UPDATE 表名称 SET 列1 = 值1, 列2 = 值2, ...;
 ``` 例子： id 为 4 的那个 Alice，想把她的邮箱 alice_2@work.com 改成 new_alice@example.com。
 ```sql
 UPDATE users SET email = 'new_alice@example.com' WHERE id = 4;
 ```
 * 命令详解:
    * `UPDATE users`: 告诉 MySQL 我们要更新 users 表。
    * `SET email = 'new_alice@example.com'`: 把 email 这一列的值，设置 为 'new_alice@example.com'。如果要同时更新多列，可以用逗号隔开，例如 `SET name = 'new_name', email = 'new_email'`。
    * `WHERE id = 4`: 只 对 id 等于 4 的那一行执行 SET 操作。
 ---
#### 15. 删除数据 (DELETE)
  * !!! 超级重要警告 !!!  
    比 `UPDATE` 更危险的警告：  
    DELETE 命令是 不可逆 的！如果你执行 DELETE 时忘记了 WHERE 子句，它会 删除表中的所有数据，而且通常无法恢复！所以，请务必、一定、时刻带着 WHERE 使用 DELETE！
  ```sql
  1. 给指定的列删除数据
  DELETE FROM 表名称 [WHERE 条件];
  
  2. 对所有列删除数据
  DELETE FROM 表名称;
  ```  例子：删除 name 为 'Charlie' 的用户
  ```sql
  DELETE FROM users WHERE name = 'Charlie';
  ```
  * 命令详解:
  * `DELETE FROM users`: 告诉 MySQL 我们要从 users 表中删除数据。
  * `WHERE name = 'Charlie'`: 只 删除 name 等于 'Charlie' 的那一行。
---

### **3. DQL：数据查询语言**
#### ps：DQL语法总览
```sql
SELECT 列名称 FROM 表名称 WHERE 条件 GROUP BY 分组后列名称 HAVING 分组后条件 ORDER BY 排序 LIMIT 分类参数
```
#### 16. 查询数据(SELECT)
```sql
1. 查询多个字段
SELECT 列名称1, 列名称2... FROM 表名;
SELECT * FROM 表名称;

2. 设置别名查询
SELECT 列名称1 [AS '别名1'], 列名称2 [AS '别名2']... FROM 表名;
ps：在这里面"AS"关键字是可以省略的

3. 去除重复记录查询
SELECT DISTINCT 列名称 FROM 表名;
```
例子： 查询 users 表中的所有数据
```
SELECT * FROM users;
```
* SELECT 是 SQL 的灵魂，我们用它来从表中“选择”我们想看的数据。
* 最简单的查询就是查看一个表里的 所有 数据。我们将使用 * (星号)，它是一个通配符，代表“所有列”。
*  命令详解:
* `SELECT *`: 选择所有列。
* `FROM users`: 从 users 表中。
---
#### 17. 带条件的查询 (WHERE 子句)
```
SELECT * FROM 表名称 WHERE 条件;
```
例子：查询 users 表中 name 是 'Bob' 的用户
```
SELECT * FROM users WHERE name = 'Bob';
```
* WHERE 子句让我们可以添加过滤条件，只返回符合条件的行。
* WHERE后可填入的条件：
  * 等于：`=`
  * 不等于：`!=` 或 `<>`
  * 大于：`>`
  * 小于：`<`
  * 大于等于：`>=`
  * 小于等于：`<=`
  * 范围：`BETWEEN 值1 AND 值2`
  * 包含：`IN (值1, 值2, ...)`
  * 不包含：`NOT IN (值1, 值2, ...)`
  * 空值：`IS NULL` 或 `IS NOT NULL`
  * 模糊查询：`LIKE`
    * 通配符：
      * `%`：匹配任意字符（包括零个字符）
      * `_`：匹配单个字符
    * 示例：
      * `%a%`：匹配包含 'a' 的任意字符串
      * `_a%`：匹配第二个字符是 'a' 的字符串
      * `a__`：匹配前两个字符是 'a' 的字符串
  * 逻辑运算符：
    * `AND`或`&&`：并且（多个条件同时满足）
    * `OR`或`||`：或者（多个条件满足任意一个）
    * `NOT`或`!`：非，不是（取反）
* 命令详解:
  * `SELECT * FROM users`: 这部分你已经很熟了，就是从 users 表中选择所有列。
  * `WHERE name = 'Bob'`: 这就是过滤条件。它告诉 MySQL：“只把那些 name 列的值 等于 'Bob' 的行给我”。
    * 注意，在 SQL 中，判断相等用的是单个等号 =。

---
#### 18. 聚合查询
ps: 聚合 就是将一列数据作为一个整体，进行纵向计算。
```sql
SELECT 聚合函数(列名称) FROM 表名称;
```
例子：查询 users 表中所有用户的平均年龄
```
SELECT AVG(age) FROM users;
```
* 常见的聚合函数有：
  * `COUNT()`：计算行数
  * `SUM()`：计算总和
  * `AVG()`：计算平均值
  * `MIN()`：计算最小值
  * `MAX()`：计算最大值
* 命令详解:
  * `SELECT AVG(age) FROM users`: 这部分你已经很熟了，就是从 users 表中选择 age 这一列。
  * `AVG(age)`: 这就是聚合函数。它告诉 MySQL：“请计算 age 这一列的平均值”。
* 注意：
  * 聚合函数会忽略 NULL 值。
---
#### 19. 分组查询(GROUP BY)
```sql
SELECT 列名称 FROM 表名称 [WHERE 条件] GROUP BY 列名称 [HAVING 分组后过滤的条件];
```
例子：查询 users 表中每个 age 分组的用户数量
```
SELECT age, COUNT(*) FROM users GROUP BY age HAVING COUNT(*) > 1;
```
* where 和 having 的区别
  * 执行时机不同：where 是在分组之前进行过滤，不满足 where 条件，不参与分组，而 having 是在分组之后对结果进行过滤。
  * 判断条件不同：where 不能对聚合函数进行过滤，而 having 可以。
---
#### 20. 排序查询(ORDER BY)
```sql
SELECT 列名称列表 FROM 表名称 ORDER BY 列名称1 排序方式1, 列名称2 排序方式2...;
```
例子：按名字的字母顺序，查询所有用户
```
SELECT name, age FROM users ORDER BY name ASC;
```
* `ORDER BY` 子句让我们可以对查询结果进行排序。
* `ASC` 表示升序 (从A到Z, 从小到大)，是默认选项，可以省略。
* `DESC` 表示降序 (从Z到A, 从大到小)，不是默认选项，不可以省略。
---
#### 21. 分页查询(LIMIT)
```sql
SELECT 列名称列表 FROM 表名称 LIMIT 起始索引, 查询记录数;
```
例子：查询 users 表中前 5 条数据
```
SELECT * FROM users LIMIT 5;
```
* `LIMIT` 子句让我们可以限制查询结果的数量。
* 命令详解:
  * `SELECT * FROM users`: 这部分你已经很熟了，就是从 users 表中选择所有列。
  * `LIMIT 5`: 这就是分页参数。它告诉 MySQL：“只返回前 5 条记录”。
* 注意：
  * `LIMIT` 子句的参数是从 0 开始的，所以 `LIMIT 5` 表示返回第 0 条到第 4 条记录。
  * 你可以使用 `LIMIT` 子句来实现分页功能。`LIMIT 偏移量, 数量`
  * 偏移量：从第几条记录开始返回
  * 数量：返回几条记录
  * 例如：`LIMIT 10, 5` 表示返回第 10 条到第 14 条记录

### **4. DCL：数据控制语言**
#### 22. 用户管理
1. 查询用户
```sql
USE mysql;
SELECT * FROM user;
```
2. 创建用户
```sql
CREATE USER '用户名'@'主机名' IDENTIFIED BY '密码';
```
3. 修改用户密码
```sql
ALTER USER '用户名'@'主机名' IDENTIFIED WITH mysql_native_password BY '新密码';
```
4. 删除用户
```sql
DROP USER '用户名'@'主机名';
```
例子：
```sql
-- 创建用户
CREATE USER 'belgnas'@'localhost' IDENTIFIED BY '123456';
-- 修改用户密码
ALTER USER 'belgnas'@'localhost' IDENTIFIED WITH mysql_native_password BY '654321';
-- 删除用户
DROP USER 'belgnas'@'localhost';
```
---
#### 23. 权限管理
1. 查询权限
```sql
SHOW GRANTS FOR '用户名'@'主机名';
```
2. 授予权限
```sql
GRANT 权限列表 ON 数据库名.表名 TO '用户名'@'主机名';
```
3. 撤销权限
```sql
REVOKE 权限列表 ON 数据库名.表名 FROM '用户名'@'主机名';
```
* 常用权限：
  * `ALL`/`ALL PRIVILEGES`：所有权限
  * `SELECT`：查询权限
  * `INSERT`：插入权限
  * `UPDATE`：更新权限
  * `DELETE`：删除权限
  * `CREATE`：创建权限（数据库、表）
  * `DROP`：删除权限（数据库、表、视图）
  * `ALTER`：修改权限（表）


✦ 祝贺你！你已经成功完成了 SQL 的入门速成课，并且亲手实践了所有核心操作！

  你从一个完全的初学者，到现在已经可以独立完成对数据的增、删、改、查，表现得非常出色。

  ---

  我们来回顾一下你已掌握的技能：

  核心概念:
   * 理解了数据库 (Database), 表 (Table), 列 (Column), 行 (Row) 的关系。
   * 知道了 PRIMARY KEY (主键) 和 AUTO_INCREMENT (自增) 的重要性。

  SQL 命令:
   * 数据库层面:
       * `SHOW DATABASES`; - 查看所有数据库
       * `CREATE DATABASE ...`; - 创建新数据库
       * `USE ...`; - 选择要操作的数据库
   * 表层面:
       * `CREATE TABLE ...`; - 按规则创建新表
       * `DESCRIBE ...`; - 查看表结构
   * 数据层面 (CRUD):
       * `INSERT INTO ... VALUES ...`; - 增加新数据 (单行和多行)
       * `SELECT ... FROM ...`; - 查询数据
       * `UPDATE ... SET ... WHERE ...`; - 改动现有数据
       * `DELETE FROM ... WHERE ...`; - 删除数据
   * 查询逻辑:
       * `WHERE` - 添加过滤条件
       * `AND` / `OR` - 组合多个过滤条件
---

## 函数
### 1. 字符串函数
通用语法：SELECT 函数名(参数列表)

-- 字符串拼接，将S1，S2，..Sn拼接成一个字符串
```sql
CONCAT(S1,S2....Sn)
```
例子：
```sql
SELECT CONCAT('hello', 'mysql');
```
输出结果：hello mysql

-- 将字符串str全部转为小写
```sql
LOWER(str)
```
例子：
```sql
SELECT LOWER('HELLO');
```
输出结果：hello

-- 将字符串str全部转为大写
```sql
UPPER(str)
```
例子：
```sql
SELECT UPPER('hello');
```
输出结果：HELLO

-- 左填充，用字符串pad对str的左边进行填充，达到n个字符串长度
```sql
LPAD(str,n,pad)
```
例子：
```sql
SELECT LPAD('hello', 10, '*');
```
输出结果：****hello

-- 右填充，用字符串pad对str的右边进行填充，达到n个字符串长度
```sql
RPAD(str,n,pad)
```
例子：
```sql
SELECT RPAD('hello', 10, '*');
```
输出结果：hello****

-- 去掉字符串头部和尾部的空格
```sql
TRIM(str)
```
例子：
```sql
SELECT TRIM('  hello mysql  ');
```
输出结果：hello mysql

-- 返回从字符串str从start位置起的len个长度的字符串
```sql
SUBSTRING(str,start,len)
```
* ps:字符串的索引`从1开始`
例子：
```sql
SELECT SUBSTRING('hello', 1, 3);
```
输出结果：hel

-- 替换字符串str中的子字符串 substr1 为 substr2 
```sql
REPLACE(str,substr1,substr2)
```
例子：
```sql
SELECT REPLACE('hello', 'l', 'L');
```
输出结果：heLLo

---

### 2. 数值函数
-- 向上取整
```sql
CEILING(x)
```
例子：
```sql
SELECT CEILING(2.3);
```
输出结果：3

-- 向下取整
```sql
FLOOR(x)
```
例子：
```sql
SELECT FLOOR(2.3);
```
输出结果：2

-- 返回x/y的模
```sql
MOD(x,y)
```
例子：
```sql
SELECT MOD(10, 3);
```
输出结果：1

-- 返回0~1的随机数
```sql
RAND()
```
例子：
```sql
SELECT RAND();
```
输出结果：0.5577222222222222（随机数）

-- 四舍五入
```sql
ROUND(x)
```
例子：
```sql
SELECT ROUND(2.3);
```
输出结果：2

-- 取绝对值
```sql
ABS(x)
```
例子：
```sql
SELECT ABS(-2);
```
输出结果：2

-- 取平方根
```sql
SQRT(x)
```
例子：
```sql
SELECT SQRT(9);
```
输出结果：3

-- 取x的n次方
```sql
POWER(x,n)
```
例子：
```sql
SELECT POWER(2, 3);
```
输出结果：8

案例实现：生成一个六位数的随机验证码

```sql
SELECT LPAD(ROUND(RAND() * 1000000), 6, '0');
```
输出结果：123456（随机数）
* 解释：
  * `ROUND(RAND() * 1000000)`：生成一个0到1000000之间的随机数，然后四舍五入取整。
  * `LPAD(..., 6, '0')`：将生成的随机数左填充0，确保总长度为6位。
---

### 3. 日期函数
常见日期函数：

-- 返回当前日期
```sql
CURDATE()
```
例子：
```sql
SELECT CURDATE();
```
输出结果：2025-09-16（当前日期）

-- 返回当前时间
```sql
CURTIME()
```
例子：
```sql
SELECT CURTIME();
```
输出结果：00:37:56（当前时间）

-- 返回当前日期和时间
```sql
NOW()
```
例子：
```sql
SELECT NOW();
```
输出结果：2025-09-16 00:37:56（当前日期和时间）

-- 获取指定date的年份
```sql
YEAR(date)
```
例子：
```sql
SELECT YEAR('2025-09-16');
```
输出结果：2025

-- 获取指定date的月份
```sql
MONTH(date)
```
例子：
```sql
SELECT MONTH('2025-09-16');
```
输出结果：9

-- 获取指定date的日期
```sql
DAY(date)
```
例子：
```sql
SELECT DAY('2025-09-16');
```
输出结果：16

-- 返回一个日期/时间值加上指定的时间间隔expr后的时间值
```sql
DATE_ADD(date,INTERVAL expr type)
```
例子：
```sql
SELECT DATE_ADD('2025-09-16', INTERVAL 1 DAY);
```
输出结果：2025-09-17（当前日期加1天）

-- 计算两个日期（起始时间date1和结束时间date2）之间的天数
```sql
DATEDIFF(date1,date2)
```
例子：
```sql
SELECT DATEDIFF('2025-09-16', '2025-09-15');
```
输出结果：1（相差1天）

案例：
-- 计算员工入职时间到当前时间的天数
```sql
SELECT DATEDIFF(NOW(), '2025-09-16');
```
输出结果：1（相差1天）
* 解释：
  * `NOW()`：返回当前日期和时间。
  * `'2025-09-16'`：员工入职时间。
  * `DATEDIFF(NOW(), '2025-09-16')`：计算当前日期和时间与员工入职时间之间的天数差。
--- 

### 4. 流程函数
流程函数可以在SQL语句中实现条件筛选，从而提高语句的效率

-- 如果value为true，返回t，否则返回f
```sql
IF(value, t, f)
```
例子：
```sql
SELECT IF(1 > 0, '是', '否');
```
输出结果：是

* 解释：
  * `IF(1 > 0, '是', '否')`：如果条件为真（1 > 0），则返回表达式1（'是'）；否则返回表达式2（'否'）。

-- 如果value1不为空，返回value1，否则返回value2
```sql
IFNULL(value1, value2)
```
例子：
```sql
SELECT IFNULL(NULL, '默认值');
```
输出结果：默认值
* 解释：
  * `IFNULL(NULL, '默认值')`：如果value为NULL，则返回表达式2（'默认值'）；否则返回value。
  * 等效于：`IF(value1 IS NULL, value2, value1)`

-- 如果value1为true，返回value1，……，否则返回default默认值
```sql
CASE
WHEN [value1] THEN [result1]
WHEN [value2] THEN [result2]
ELSE [default]
END
```
* 解释：
  * `CASE`：用于条件判断，类似于`IF`语句。
  * `WHEN [value1] THEN [result1]`：如果条件为真（value1），则返回结果（result1）。
  * `WHEN [value2] THEN [result2]`：如果条件为真（value2），则返回结果（result2）。
  * `ELSE [default]`：如果以上条件都不满足，则返回默认值（default）。
  * `END`：结束`CASE`语句。

-- 如果expr的值等于value1，返回result1，……，否则返回default默认值
```sql
CASE [expr]
WHEN [value1] THEN [result1]
WHEN [value2] THEN [result2]
ELSE [default]
END
```
* 解释：
  * `CASE [expr]`：根据表达式（expr）的值进行判断。
  * `WHEN [value1] THEN [result1]`：如果表达式的值等于value1，则返回结果（result1）。
  * `WHEN [value2] THEN [result2]`：如果表达式的值等于value2，则返回结果（result2）。
  * `ELSE [default]`：如果以上条件都不满足，则返回默认值（default）。
  * `END`：结束`CASE`语句。


-- 案例：根据员工的年龄，返回不同的等级（假定已经有一个数据库）
```sql
SELECT
    name,
    age,
    CASE
        WHEN age < 18 THEN '未成年'
        WHEN age >= 18 AND age < 30 THEN '青年'
        WHEN age >= 30 AND age < 50 THEN '中年'
        ELSE '老年'
    END AS age_group
FROM
    employees;
```
* 解释：
  * `CASE`：用于条件判断，类似于`IF`语句。
  * `WHEN [age] < 18 THEN '未成年'`：如果年龄小于18岁，则返回'未成年'。
  * `WHEN [age] >= 18 AND [age] < 30 THEN '青年'`：如果年龄大于等于18岁且小于30岁，则返回'青年'。
  * `WHEN [age] >= 30 AND [age] < 50 THEN '中年'`：如果年龄大于等于30岁且小于50岁，则返回'中年'。
  * `ELSE '老年'`：如果以上条件都不满足，则返回'老年'。
  * `END AS age_group`：结束`CASE`语句，并将结果命名为age_group。
---

## 约束
### 概述
概念：约束是作用于表中字段上的规则，用于限制存储在表中的数据。（我们可以在创建表时，为表中的字段添加约束，也可以在表创建后，使用ALTER语句添加约束）
目的：约束是为了保证数据库中数据的正确性、完整性和一致性。

---

### 约束分类：
| 约束                    | 描述                                                     | 关键字      |
| ----------------------- | -------------------------------------------------------- | ----------- |
| 非空约束                | 限制该字段的数据不能为null                               | NOT NULL    |
| 唯一约束                | 保证该字段的所有数据都是唯一、不重复的                   | UNIQUE      |
| 主键约束                | 主键是一行数据的唯一标识，要求非空且唯一                 | PRIMARY KEY |
| 默认约束                | 保存数据时，如果未指定该字段的值，则采用默认值           | DEFAULT     |
| 检查约束（8.0.1版本后） | 保证字段值满足某一个条件                                 | CHECK       |
| 外键约束                | 用来让两张表的数据之间建立连接，保证数据的一致性和完整性 | FOREIGN KEY |
ps：
* 约束是作用于表中字段上的，可以再创建表/修改表的时候添加约束。
---

### 常用约束
| 约束条件 | 关键字         |
| -------- | -------------- |
| 主键     | PRIMARY KEY    |
| 自动增长 | AUTO_INCREMENT |
| 不为空   | NOT NULL       |
| 唯一     | UNIQUE         |
| 逻辑条件 | CHECK          |
| 默认值   | DEFAULT        |

* 案例演示
  * 例子：
| 字段名 | 字段含义   | 字段类型    | 约束条件                | 约束关键字                  |
| ------ | ---------- | ----------- | ----------------------- | --------------------------- |
| id     | ID唯一标识 | int         | 主键，并且自动增长      | PRIMARY KEY, AUTO_INCREMENT |
| name   | 姓名       | varchar(10) | 不为空，并且唯一        | NOT NULL, UNIQUE            |
| age    | 年龄       | int         | 大于0，并且小于等于120  | CHECK                       |
| status | 状态       | char(1)     | 如果没有指定值，默认为1 | DEFAULT                     |
| gender | 性别       | char(1)     | 无                      |                             |
  * 代码：
```sql
create table if not exists t_user(
    id int primary key auto_increment comment '主键，并且自动增长',
    name varchar(10) not null unique comment '姓名，不为空，并且唯一',
    age int check (age > 0 and age <= 120) comment '年龄，大于0，并且小于等于120',
    status char(1) default '1' comment '状态，默认值为1',
    gender char(1) comment '性别'
);
```
  * 测试：
```sql
-- 插入数据
insert into t_user(name, age, status, gender) values('张三', 18, '1', '男');
insert into t_user(name, age, status, gender) values('李四', 20, '1', '女');
insert into t_user(name, age, status, gender) values('王五', 22, '1', '男');

-- 插入失败，因为name重复
insert into t_user(name, age, status, gender) values('张三', 23, '1', '男');
......（其他的省略）
```

### 外键约束
* 概念：外键约束是作用于表中字段上的规则，用于让两张表的数据之间建立连接，保证数据的一致性和完整性。
* 关键字：`FOREIGN KEY`
#### 添加外键
* 语法：（添加外键）
```sql
CREATE TABLE 表名(
  字段名 数据类型,
  ...
  [CONSTRAINT] [外键名称] FOREIGN KEY(外键字段名) REFERENCES 主表(表列名)
);

ALTER TABLE 表名 ADD CONSTRAINT 外键名称 FOREIGN KEY (外键字段名) REFERENCES 主表(主表列名);
```
* 例子
```sql
alter table emp add constraint fk_emp_dept_id foreign key(dept_id) references dept(id);
```
* 解释：往emp表添加一个外键约束，约束名称为fk_emp_dept_id，外键字段为dept_id，引用的主表为dept，引用的主表字段为id。
#### 删除外键
* 语法：
```sql
ALTER TABLE 表名 DROP FOREIGN KEY 外键名称;
```
* 例子：
```sql
-- 删除emp表的外键约束
alter table emp drop foreign key fk_emp_dept_id;
```
* 解释：删除emp表的外键约束，约束名称为fk_emp_dept_id。
---

### 删除/更新行为
| 行为        | 说明                                                                                                                  |
| ----------- | --------------------------------------------------------------------------------------------------------------------- |
| NO ACTION   | 当在父表中删除/更新对应记录时，首先检查该记录是否有对应外键，如果有则不允许删除/更新（与RESTRICT一致）                |
| RESTRICT    | 当在父表中删除/更新对应记录时，首先检查该记录是否有对应外键，如果有则不允许删除/更新（与NO ACTION一致）               |
| CASCADE     | 当在父表中删除/更新对应记录时，首先检查该记录是否有对应外键，如果有则也删除/更新外键在子表中的记录                    |
| SET NULL    | 当在父表中删除/更新对应记录时，首先检查该记录是否有对应外键，如果有则设置子表中该外键值为null（要求该外键允许为null） |
| SET DEFAULT | 父表有变更时，子表将外键设为一个默认值（Innodb不支持）                                                                |

* 语法（更改删除/更新行为）
```sql
ALTER TABLE 表名 ADD CONSTRAINT 外键名称 FOREIGN KEY (外键字段) REFERENCES 主表名(主表字段名) ON UPDATE 行为 ON DELETE 行为;
```

* 例子：
```sql
-- 更改emp表的外键约束，约束名称为fk_emp_dept_id，删除/更新行为为CASCADE
alter table emp add constraint fk_emp_dept_id foreign key(dept_id) references dept(id) on update cascade on delete cascade;
```
* 解释：更改emp表的外键约束，约束名称为fk_emp_dept_id，删除/更新行为为CASCADE，当在dept表中删除/更新对应记录时，也会删除/更新emp表中对应记录。
---

## 多表查询
### 多表关系(创建)
#### 一对多（多对一）关系
* 案例：部门与员工
* 关系：一个部门可以有多个员工，一个员工只归属于一个部门
* 实现：在多的一方建立外键，指向少的一方的主键
```sql
-- 部门表
create table if not exists dept(
    id int primary key auto_increment comment '主键，并且自动增长',
    name varchar(10) not null unique comment '部门名称，不为空，并且唯一'
)comment '部门表';

-- 员工表
create table if not exists emp(
    id int primary key auto_increment comment '主键，并且自动增长',
    name varchar(10) not null comment '姓名，不为空',
    age int check (age > 0 and age <= 120) comment '年龄，大于0，并且小于等于120',
    status char(1) default '1' comment '状态，默认值为1',
    gender char(1) comment '性别',
    dept_id int comment '部门ID，外键，引用部门表的主键'
)comment '员工表';

-- 为员工表添加外键约束
alter table emp add constraint fk_emp_dept_id foreign key(dept_id) references dept(id) on update cascade on delete cascade;
```
#### 多对多关系
* 案例：学生与课程
* 关系：一个学生可以选多门课程，一门课程也可以供多个学生选修
* 实现：建立第三张中间表，中间表至少包含两个外键，分别关联两方主键

<center>

**学生表(tb_student)**
| 序 id | name | no       |
| ----- | ---- | -------- |
| 1     | 张三 | 20200101 |
| 2     | 李四 | 20200102 |
| 3     | 王五 | 20200103 |


**课程表(tb_course)**
| 序 id | name |
| ----- | ---- |
| 1     | 语文 |
| 2     | 数学 |
| 3     | 英语 |

**学生与课程关系表(tb_student_course)** 
| 序 id | student_id | course_id |
| ----- | ---------- | --------- |
| 1     | 1          | 1         |
| 2     | 1          | 2         |
| 3     | 2          | 2         |
| 4     | 2          | 3         |
| 5     | 3          | 1         |
| 6     | 3          | 3         |
</center>

```sql
-- 学生表 
create table if not exists student( 
    id int primary key auto_increment comment '主键，并且自动增长', 
    name varchar(10) not null comment '姓名，不为空', 
    no varchar(10) not null unique comment '学号，不为空，并且唯一' 
) comment '学生表'; 

insert into student(name, no) values('张三', '20200101'), ('李四', '20200102'), ('王五', '20200103'); 

-- 课程表 
create table if not exists course( 
    id int primary key auto_increment comment '主键，并且自动增长', 
    name varchar(10) not null comment '课程名称，不为空' 
) comment '课程表'; 

insert into course(name) values('语文'), ('数学'), ('英语'); 

-- 中间表 
create table if not exists student_course( 
    id int primary key auto_increment comment '主键，并且自动增长', 
    student_id int comment '学生ID，外键，引用学生表的主键', 
    course_id int comment '课程ID，外键，引用课程表的主键', 
    constraint fk_student_course_student_id foreign key(student_id) references student(id) on update cascade on delete cascade, 
    constraint fk_student_course_course_id foreign key(course_id) references course(id) on update cascade on delete cascade 
) comment '学生课程关联表'; 

insert into student_course(student_id, course_id) values(1, 1), (1, 2), (2, 2), (2, 3), (3, 1), (3, 3);
```
#### 一对一关系
* 案例：用户与用户详情
* 关系：一对一关系，多用于单表拆分，将一张表的基础字段放在一张表中，其他详情字段放在另一张表中，以提升操作效率
* 实现：在任意一方加入外键，关联另外一方的主键，并且设置外键为唯一的（UNIQUE）

<center>

**用户基本信息表(tb_user)** 
| 序 id | name   | age | gender | phone       |
| ----- | ------ | --- | ------ | ----------- |
| 1     | 黄渤   | 45  | 1      | 18800001111 |
| 2     | 冰冰   | 35  | 2      | 18800002222 |
| 3     | 阿云   | 55  | 1      | 18800008888 |
| 4     | 李彦宏 | 50  | 1      | 18800099999 |

**用户教育信息表(tb_user_edu)**
| 序 id | degree | major    | primary school | middle school  | university   | userid |
| ----- | ------ | -------- | -------------- | -------------- | ------------ | ------ |
| 1     | 本科   | 舞蹈     | 静安区第一小学 | 静安区第一中学 | 北京舞蹈学院 | 1      |
| 2     | 硕士   | 表演     | 朝阳区第一小学 | 朝阳区第一中学 | 北京电影学院 | 2      |
| 3     | 本科   | 英语     | 杭州市第一小学 | 杭州市第一中学 | 杭州师范大学 | 3      |
| 4     | 本科   | 应用数学 | 阳泉第一小学   | 阳泉区第一中学 | 清华大学     | 4      |
</center>

```sql
create table if not exists tb_user(
    id int primary key auto_increment comment '主键，并且自动增长',
    name varchar(10) not null comment '姓名，不为空',
    age int check (age > 0 and age <= 120) comment '年龄，大于0，并且小于等于120',
    status char(1) default '1' comment '状态，默认值为1',
    gender char(1) comment '性别',
    phone varchar(11) not null unique comment '手机号，不为空，并且唯一'
)comment '用户基本信息表';

create table if not exists tb_user_edu(
    id int primary key auto_increment comment '主键，并且自动增长',
    degree varchar(10) comment '学历',
    major varchar(10) comment '专业',
    primary_school varchar(10) comment '小学',
    middle_school varchar(10) comment '中学',
    university varchar(10) comment '大学',
    userid int comment '用户ID，外键，引用用户基本信息表的主键',
    constraint fk_user_edu_userid foreign key(userid) references tb_user(id) on update cascade on delete cascade
)comment '用户教育信息表';

insert into tb_user(name, age, status, gender, phone) values
    ('黄渤', 45, 1, 1, '18800001111'), 
    ('冰冰', 35, 1, 2, '18800002222'), 
    ('阿云', 55, 1, 1, '18800008888'), 
    ('李彦宏', 50, 1, 1, '18800099999');

insert into tb_user_edu(degree, major, primary_school, middle_school, university, userid) values
    ('本科', '舞蹈', '静安区第一小学', '静安区第一中学', '北京舞蹈学院', 1), 
    ('硕士', '表演', '朝阳区第一小学', '朝阳区第一中学', '北京电影学院', 2), 
    ('本科', '英语', '杭州市第一小学', '杭州市第一中学', '杭州师范大学', 3), 
    ('本科', '应用数学', '阳泉第一小学', '阳泉区第一中学', '清华大学', 4);
```

### 查询
* 概述：指从多张表中查询数据
* 相关术语：
  * 笛卡尔积：指在关系数据库中，返回两个或多个表的所有可能的行组合，即所有可能的行的乘积。（在多表查询中，需要使用连接条件来消除无效的笛卡尔积）
  * 连接查询：
    * 内连接：只返回两个表中匹配的行（相当于查询A、B交集部分的数据）
    * 外连接
      * 左外连接：查询左表所有数据，以及两张表中交集部分的数据
      * 右外连接：查询右表所有数据，以及两张表中交集部分的数据
    * 自连接：当前表与自身的连接查询，自连接必须使用表别名
  * 子查询：在一个查询语句中嵌套另一个查询语句，称为子查询。子查询可以出现在SELECT、FROM、WHERE、HAVING子句中。

#### 内连接查询

<u>强烈推荐使用显式内连接 **`JOIN ... ON`**</u>

复习：内连接查询的是两张表中交集部分

内连接查询语法：
```sql
-- 隐式内连接
SELECT 字段列表 FROM 表1, 表2 WHERE 连接条件 ...;

-- 显式内连接
SELECT 字段列表 FROM 表1 [INNER] JOIN 表2 ON 连接条件 ...;
```
解释：
* 工作原理：
  * 隐式内连接：
    * 使用逗号隔开的表名，在WHERE子句中使用连接条件
    * 数据库首先会对 table1 和 table2 做一个笛卡尔积 (Cartesian Product)，即将第一张表的每一行与第二张表的每一行都组合一遍，生成一个非常庞大的临时表。然后，再用 WHERE 子句从这个庞大的结果中筛选出符合条件的行。
  * 显式内连接：
    * 使用JOIN关键字连接表，在ON子句中使用连接条件
    * 数据库直接根据 ON 子句中指定的条件来查找并组合匹配的行，逻辑更清晰，执行效率通常也更高（或至少不会更差），因为它避免了先生成庞大的笛卡尔积。


例子：查询每个员工的姓名，及关联的部门的名称
* 隐式内连接
```sql
select emp.name, dept.name from emp, dept where emp.deptid = dept.id;

这样直接使用会完整的表名比较繁琐，所以可以使用表的别名来简化查询

select e.name, d.name from emp e, dept d where e.deptid = d.id;
ps：如果使用了表的别名，那么在查询字段中，就需要使用表的别名来引用字段，不能直接使用表的全名了
```
* 显式内连接
```sql
select e.name, d.name from emp e inner join dept d on e.deptid = d.id;

或（省略inner）

select e.name, d.name from emp e join dept d on e.deptid = d.id;
```
---

#### 外连接查询

复习：外连接查询的是两张表中并集部分

外连接查询语法：
```sql
-- 左外连接
SELECT 字段列表 FROM 表1 LEFT [OUTER] JOIN 表2 ON 连接条件 ...;

-- 右外连接
SELECT 字段列表 FROM 表1 RIGHT [OUTER] JOIN 表2 ON 连接条件 ...;
```
* 解释：
  * 左外连接：查询左表所有数据，以及两张表中交集部分的数据
  * 右外连接：查询右表所有数据，以及两张表中交集部分的数据

* 例1：
  * 左外连接：查询所有员工的姓名，及关联的部门的名称（如果员工没有部门，也会显示出来）
```sql
select e.name, d.name from emp e left outer join dept d on e.deptid = d.id;
```
* 例2：
  * 右外连接：查询所有部门的名称，及关联的员工的姓名（如果部门没有员工，也会显示出来）
```sql
select d.name, e.name from emp e right join dept d on e.deptid = d.id;
```
* ps：左外连接和右外连接是可以互换的，想要互换的话，只需要将左外连接的表和右外连接的表交换一下位置即可

#### 自连接查询
* 概述：指当前表与自身的连接查询，自连接必须使用表别名
* 语法：
```sql
SELECT 字段列表 FROM 表1 别名1 JOIN 表1 别名2 ON 连接条件 ...;
```
* ps：自连接查询，可以是内连接查询，也可以是外连接查询
  * 复习：
    * 内连接查询：查询当前表中匹配的行（相当于查询A、B交集部分的数据）
    * 外连接查询：查询当前表中所有数据，以及两张表中交集部分的数据

* 例1：内连接查询
  * 查询所有员工的姓名，及关联的领导的名称
```sql
-- 命名
-- emp 表：员工表
-- e: 员工表的别名
-- m: 领导表的别名
-- managerid 是员工表中的一个字段，用来表示员工的领导id
select e.name, m.name from emp e join emp m on e.managerid = m.id;
```
* 例2：外连接查询
  * 查询所有员工的姓名，及其关联的领导的姓名（如果员工没有领导，也会显示出来）
```sql
-- 命名
-- emp 表：员工表
-- e: 员工表的别名
-- m: 领导表的别名
-- managerid 是员工表中的一个字段，用来表示员工的领导id
select e.name '员工姓名', m.name '领导姓名' from emp e left join emp m on e.managerid = m.id;
```

#### 联合查询(UNION, UNION ALL)
* 概述：对于union查询，会将多个查询的结果合并起来，形成一个新的结果集
* 语法：
```sql
SELECT 字段列表 FROM 表1
UNION [ALL]
SELECT 字段列表 FROM 表2 ...;
```
* 解释：
  * UNION：合并两个或多个查询的结果集，会自动去除重复的行
  * UNION ALL：合并两个或多个查询的结果集，不会自动去除重复的行
* ps：
  * 对于联合查询的多张表的列数和字段类型，必须保持一致，否则会报错

* 例1：union查询
* 查询薪资低于 5000 的员工姓名，和年龄大于 30 的员工姓名
```sql
select name from emp where salary < 5000
union
select name from emp where age > 30;
```
* 例2：union all查询
* 查询薪资低于 5000 的员工姓名，和年龄大于 30 的员工姓名
```sql
select name from emp where salary < 5000
union all
select name from emp where age > 30;
```

#### 子查询
* 概述：`SQL语句`中嵌套SELECT语句，称为嵌套查询，又称为子查询
* ps：子查询外部的语句可以是 SELECT、INSERT、UPDATE、DELETE 等语句
* 语法：
```sql
-- 命名
-- t1: 子查询的表
-- t2: 主查询的表
-- column1: 子查询的字段
-- column2: 主查询的字段
-- condition: 子查询的条件
SELECT FROM t1 WHERE column1 = (SELECT column1 FROM t2 WHERE condition);
```

* 分类1：（根据子查询返回的结果）
  * 标量子查询：子查询返回的结果是一个值（一行一列）
  * 列子查询：子查询返回的结果是一列（多行一列）
  * 行子查询：子查询返回的结果是一行（多行多列）
  * 表子查询：子查询返回的结果是一个表（多行多列）
* 分类2：（根据子查询的位置）
  * 出现在WHERE、SELECT、FROM语句的子查询中

##### 标量子查询
* 概述：子查询返回的结果是一个值（一行一列）
* 常用的操作符：=、<>、>、<、>=、<=
* 语法：
```sql
SELECT FROM t1 WHERE column1 = (SELECT column1 FROM t2 WHERE condition);
```
* 例1：查询“销售部”所有员工的姓名
```sql
-- 命名：
-- emp 表：员工表
-- e: 员工表的别名
-- dept 表：部门表
-- d: 部门表的别名
-- dept_id 是员工表中的一个字段，用来表示员工所属的部门id

-- 第一步：查询“销售部”的部门id
select id from dept where name = '销售部';

-- 第二步：根据部门id查询员工姓名
select name from emp where dept_id = (select id from dept where name = '销售部');
```

* 例2：查询在“奇奇莫拉”入职之后的员工的姓名
```sql
-- 命名：
-- emp 表：员工表
-- e: 员工表的别名
-- hiredate 是员工表中的一个字段，用来表示员工的入职时间

-- 第一步：查询“奇奇莫拉”的入职时间
select hiredate from emp where name = '奇奇莫拉';

-- 第二步：根据入职时间查询员工姓名
select name from emp where hiredate > (select hiredate from emp where name = '奇奇莫拉');
```

##### 列子查询
* 概述：子查询返回的结果是一列（多行一列）
* 常用的操作符
  * IN：在主查询中
  * NOT IN：不在主查询中
  * ANY：子查询返回的结果中，有任意一个值满足条件即可
  * SOME：子查询返回的结果中，有任意一个值满足条件即可（与ANY等同，使用ANY的地方都可以用SOME）
  * ALL：子查询返回的结果中，所有值都满足条件即可
* 语法：
```sql
SELECT FROM t1 WHERE column1 IN (SELECT column1 FROM t2 WHERE condition);
```

* 例1：查询 “销售部” 和 “市场部” 所有员工的姓名
```sql
-- 命名：
-- emp 表：员工表
-- e: 员工表的别名
-- dept 表：部门表
-- d: 部门表的别名
-- dept_id 是员工表中的一个字段，用来表示员工所属的部门id

-- 第一步：查询“销售部”和“市场部”的部门id
select id from dept where name in ('销售部','市场部');
-- 或者写成：select id from dept where name ='销售部' or name ='市场部'; 这2者是等价的

-- 第二步：根据部门id查询员工姓名
select name from emp where dept_id in (select id from dept where name in ('销售部','市场部'));
```

* 例2：查询比“销售部”所有员工薪资高的员工姓名
```sql
-- 命名：
-- emp 表：员工表
-- e: 员工表的别名
-- dept 表：部门表
-- d: 部门表的别名
-- dept_id 是员工表中的一个字段，用来表示员工所属的部门id
-- salary 是员工表中的一个字段，用来表示员工的薪资

-- 第一步：查询“销售部”所有员工的薪资
select salary from emp where dept_id = (select id from dept where name = '销售部');

-- 第二步：根据薪资查询员工姓名
select name from emp where salary > all (select salary from emp where dept_id = (select id from dept where name = '销售部'));
```
* 例3：查询比“研发部”任意一人薪资高的员工姓名
```sql
-- 命名：
-- emp 表：员工表
-- e: 员工表的别名
-- dept 表：部门表
-- d: 部门表的别名
-- dept_id 是员工表中的一个字段，用来表示员工所属的部门id
-- salary 是员工表中的一个字段，用来表示员工的薪资

-- 第一步：查询“研发部”所有员工的薪资
select salary from emp where dept_id = (select id from dept where name = '研发部');

-- 第二步：根据薪资查询员工姓名
select name from emp where salary > any (select salary from emp where dept_id = (select id from dept where name = '研发部'));
-- any 替换成 some 也完全可以
```

##### 行子查询
* 概述：子查询返回的结果是一行（一行多列）
* 常用的操作符：=、<>、IN、NOT IN
* 语法：
```sql
SELECT FROM t1 WHERE (column1, column2) = (SELECT column1, column2 FROM t2 WHERE condition);
```

* 例：查询“奇奇莫拉”的薪资及直属领导相同的员工姓名
```sql
-- 命名：
-- emp 表：员工表
-- e: 员工表的别名
-- salary 是员工表中的一个字段，用来表示员工的薪资
-- manager_id 是员工表中的一个字段，用来表示员工的直属领导id

-- 第一步：查询“奇奇莫拉”的薪资及直属领导id
select salary, manager_id from emp where name = '奇奇莫拉';

-- 第二步：查询“奇奇莫拉”的薪资及直属领导相同的员工姓名
select name from emp where (salary, manager_id) = (select salary, manager_id from emp where name = '奇奇莫拉');
```
---

##### 表子查询
* 概述：子查询返回的结果是一个表（多行多列）
* 常用的操作符：IN
* 语法：
```sql
SELECT FROM t1 WHERE column1 IN (SELECT column1 FROM t2 WHERE condition);
```

* 例1：查询与 “奇奇莫拉”，“贝格纳斯” 的职位和薪资相同的员工姓名
```sql
-- 命名：
-- emp 表：员工表
-- e: 员工表的别名
-- job 是员工表中的一个字段，用来表示员工的职位
-- salary 是员工表中的一个字段，用来表示员工的薪资

-- 第一步：查询“奇奇莫拉”，“贝格纳斯” 的职位和薪资
select job, salary from emp where name in ('奇奇莫拉','贝格纳斯');

-- 第二步：根据职位和薪资查询员工姓名
select name from emp where (job, salary) in (select job, salary from emp where name in ('奇奇莫拉','贝格纳斯'));
```

* 例2：查询入职时间是“2025-01-01”之后的员工姓名，及其对应的部门信息
```sql
-- 命名：
-- emp 表：员工表
-- e: 员工表的别名
-- dept 表：部门表
-- d: 部门表的别名
-- dept_id 是员工表中的一个字段，用来表示员工所属的部门id
-- join_date 是员工表中的一个字段，用来表示员工的入职时间

-- 第一步：查询入职时间是“2025-01-01”之后的员工姓名
select name from emp where join_date > '2025-01-01';

-- 第二步：根据部门id查询部门信息
select e.*, d.* from dept d where d.id in (select e.dept_id from emp e where e.join_date > '2025-01-01');
```
---

## 事务
* 概述：事务是一个数据库操作序列，这些操作要么全部成功执行，要么全部失败回滚。
* ps：默认MySQL的事务是自动提交的，也就是说，当执行一条DML语句，MySQL会立即隐性的提交事务。

### 事务操作
方式一：通过修改事务的提交方式来控制事务的提交
* 查看/设置事务提交方式
```sql
-- 查看事务提交方式
SELECT @@autocommit;

-- 设置事务提交方式为手动提交
SET @@autocommit = 0;

ps: @ 可以省略
```
* 提交事务
```sql
commit;
```
* 回滚事务
```sql
rollback;
```
例子：转账操作（贝格纳斯 给 奇奇莫拉 转账 1000元）
```sql
-- 命名：
-- account 表：账户表
-- name 是账户表中的一个字段，用来表示账户的名称
-- money 是账户表中的一个字段，用来表示账户的余额

-- 查看事务提交方式
select @@autocommit;
-- 设置事务提交方式为手动提交
SET @@autocommit = 0;

-- 第一步：查询贝格纳斯的余额
select money from account where name = '贝格纳斯';

-- 第二步：将贝格纳斯的余额减去 1000
update account set money = money - 1000 where name = '贝格纳斯';

-- 第三步：将奇奇莫拉的余额加上 1000
update account set money = money + 1000 where name = '奇奇莫拉';

-- 第四步：提交事务
commit;

-- 第五步：回滚事务
rollback;
```
* 解释：
  * 用docx来模拟的话，commit 就好比是**保存**，rollback 就好比是**撤销**

方式二：通过显式的 BEGIN、COMMIT、ROLLBACK 语句来控制事务的提交
* 语法：
```sql
-- 开启事务
BEGIN; /*或*/START TRANSACTION;

-- 提交事务
COMMIT;

-- 回滚事务
ROLLBACK;
```

* 例子：转账操作（贝格纳斯 给 奇奇莫拉 转账 1000元）
```sql
-- 命名：
-- account 表：账户表
-- name 是账户表中的一个字段，用来表示账户的名称
-- money 是账户表中的一个字段，用来表示账户的余额

-- 查看事务提交方式
select @@autocommit;

-- 开启事务
start transaction;

-- 第一步：查询贝格纳斯的余额
select money from account where name = '贝格纳斯';

-- 第二步：将贝格纳斯的余额减去 1000
update account set money = money - 1000 where name = '贝格纳斯';

-- 第三步：将奇奇莫拉的余额加上 1000
update account set money = money + 1000 where name = '奇奇莫拉';

-- 第四步：提交事务
commit;

-- 第五步：回滚事务
rollback;
```

区别：
* 方式一：通过修改事务的提交方式来控制事务的提交
  * 优点：简单方便，不需要显式的开启事务、提交事务、回滚事务
  * 缺点：不能在一个SQL语句中执行多个操作，只能在一个SQL语句中执行一个操作
* 方式二：通过显式的 BEGIN、COMMIT、ROLLBACK 语句来控制事务的提交
  * 优点：可以在一个SQL语句中执行多个操作，灵活性高
  * 缺点：需要显式的开启事务、提交事务、回滚事务

### 四大特性（ACID）
* 原子性（Atomicity）
  * 事务是一个不可分割的操作单位，事务中的所有操作要么全部成功执行，要么全部失败回滚。
* 一致性（Consistency）
  * 事务执行前和执行后，数据库的完整性约束没有被破坏，就是说事务完成时，所有的数据都必须保持一致状态，比如说，转账前后总额是不变的。
* 隔离性（Isolation）
  * 数据库系统提供的隔离机制，事务并发执行时，每个事务都好像在独立运行，不会被其他事务的操作所干扰。
* 持久性（Durability）
  * 事务一旦提交，其对数据库的改变就会永久保存，即使系统发生故障也不会丢失。

### 并发事务问题
* 问题（可以开2个命令行（cmd）来模拟 问题的出现）
  * 问题一：脏读
    * 一个事务读取了另一个事务未提交的修改数据，导致读取到的数据是脏数据。
  * 问题二：不可重复读
    * 一个事务先后读取了两次相同的记录，但是在两次读取之间，另一个事务修改了这些记录，导致两次读取的结果不一致。
  * 问题三：幻读
    * 一个事务在查询数据时，没有对应的数据行，但是在插入数据时，又发现这行数据已经存在了（查询后插入前被另一个事务插入了），好像出现了"幻影"。

### 事务的隔离级别

| 隔离级别                         | 脏读 | 不可重复读 | 幻读 |
| -----------------------------   | ---- | ---------- | ---- |
| Read uncommitted : 读未提交      | √    | √          | √    |
| Read committed : 读提交          | ×    | √          | √    |
| Repeatable Read(默认) : 可重复读  | ×    | ×          | √    |
| Serializable : 串行化            | ×    | ×          | ×    |
* 隔离级别：
  * Read uncommitted : 读未提交
    * 事务可以读取其他事务未提交的修改数据，导致读取到的数据是脏数据。
  * Read committed : 读提交
    * 事务只能读取其他事务已提交的修改数据，避免了脏读问题。
  * Repeatable Read(默认) : 可重复读
    * 事务在一个范围内多次读取数据时，保证读取到的数据是一致的，避免了不可重复读问题。
  * Serializable : 串行化
    * 事务按照顺序执行，避免了并发事务的问题，但是性能较低。

* ps：从上到下，隔离级别从低到高，性能从强到弱

```sql
-- 查看事务的隔离级别
SELECT @@TRANSACTION_ISOLATION;

-- 设置事务的隔离级别
SET [SESSION | GLOBAL] TRANSACTION ISOLATION LEVEL {READ UNCOMMITTED | READ COMMITTED | REPEATABLE READ | SERIALIZABLE}
```
---

## 存储引擎
* 概述：指数据库管理系统（DBMS）用于存储和管理数据的底层机制。
* 相关术语：
  * 引擎：存储引擎的名称，例如 InnoDB、MyISAM、MEMORY 等。
  * 表类型：表的存储方式，例如 MyISAM 表、InnoDB 表等。
  * 索引类型：索引的存储方式，例如 B-tree 索引、哈希索引等。
  * 锁类型：锁的存储方式，例如行锁、表锁等。
  * 缓存类型：缓存的存储方式，例如内存缓存、磁盘缓存等。
  * 日志类型：日志的存储方式，例如二进制日志、事务日志等。
  * 配置参数：存储引擎的配置参数，例如缓冲区大小、缓存池大小等。
### MySQL 存储结构


### 存储引擎简介
存储引擎就是存储数据、建立索引、更新/查询数据等技术的实现方式。存储引擎是基于裵的，而不是基于库的，所以存储引擎也可被称为表类型。




## 索引
## SQL优化
## 视图/存储过程/触发器
## 锁
## InnoDB引擎
## MySQL管理





# 补充篇

## SQL分类
```plaintext
DDL: 数据定义语言，用来定义数据库对象（数据库、表、字段）
DML: 数据操作语言，用来对数据库表中的数据进行增删改
DQL: 数据查询语言，用来查询数据库中表的记录
DCL: 数据控制语言，用来创建数据库用户、控制数据库的控制权限
```

## MySQL数值类型

| 分类     | 类型           | 大小  | 有符号范围                                              | 无符号范围                      | 描述                             |
| -------- | -------------- | ----- | ------------------------------------------------------- | ------------------------------- | -------------------------------- |
| 整数类型 | TINYINT        | 1字节 | -128 到 127                                             | 0 到 255                        | 小整数                           |
| 整数类型 | SMALLINT       | 2字节 | -32,768 到 32,767                                       | 0 到 65,535                     | 小整数                           |
| 整数类型 | MEDIUMINT      | 3字节 | -8,388,608 到 8,388,607                                 | 0 到 16,777,215                 | 中等整数                         |
| 整数类型 | INT 或 INTEGER | 4字节 | -2,147,483,648 到 2,147,483,647                         | 0 到 4,294,967,295              | 标准整数                         |
| 整数类型 | BIGINT         | 8字节 | -9,223,372,036,854,775,808 到 9,223,372,036,854,775,807 | 0 到 18,446,744,073,709,551,615 | 大整数                           |
| 浮点类型 | FLOAT          | 4字节 | -3.402823466E+38 到 3.402823466E+38                     | 0 到 3.402823466E+38            | 单精度浮点数                     |
| 浮点类型 | DOUBLE 或 REAL | 8字节 | -1.7976931348623157E+308 到 1.7976931348623157E+308     | 0 到 1.7976931348623157E+308    | 双精度浮点数                     |
| 浮点类型 | DECIMAL(M,D)   | 可变  | -10^M-1 到 10^M-1                                       | 0 到 10^M-1                     | 精确小数，M是总位数，D是小数位数 |

## MySQL字符串类型

| 分类       | 类型       | 大小             | 描述                            |
| ---------- | ---------- | ---------------- | ------------------------------- |
| 字符串类型 | CHAR(M)    | 0-255字节        | 固定长度字符串，M是字符数       |
| 字符串类型 | VARCHAR(M) | 0-65535字节      | 可变长度字符串，M是字符数       |
| 字符串类型 | TINYBLOB   | 0-255字节        | 不超过255个字符的短二进制字符串 |
| 字符串类型 | TINYTEXT   | 0-255字节        | 短文本字符串                    |
| 字符串类型 | BLOB       | 0-65535字节      | 长二进制字符串                  |
| 字符串类型 | TEXT       | 0-65535字节      | 长文本字符串                    |
| 字符串类型 | MEDIUMBLOB | 0-16777215字节   | 中等长二进制字符串              |
| 字符串类型 | MEDIUMTEXT | 0-16777215字节   | 中等长文本字符串                |
| 字符串类型 | LONGBLOB   | 0-4294967295字节 | 非常长的二进制字符串            |
| 字符串类型 | LONGTEXT   | 0-4294967295字节 | 非常长的文本字符串              |

## 日期和时间类型

| 分类     | 类型      | 大小  | 范围                                               | 格式                | 描述                    |
| -------- | --------- | ----- | -------------------------------------------------- | ------------------- | ----------------------- |
| 日期类型 | DATE      | 3字节 | 1000-01-01 到 9999-12-31                           | YYYY-MM-DD          | 日期值                  |
| 日期类型 | TIME      | 3字节 | -838:59:59 到 838:59:59                            | HH:MM:SS            | 时间值或时间间隔        |
| 日期类型 | YEAR      | 1字节 | 1901 到 2155                                       | YYYY                | 年份值                  |
| 日期类型 | DATETIME  | 8字节 | 1000-01-01 00:00:00 到 9999-12-31 23:59:59         | YYYY-MM-DD HH:MM:SS | 混合日期和时间值        |
| 日期类型 | TIMESTAMP | 4字节 | 1970-01-01 00:00:01 UTC 到 2038-01-19 03:14:07 UTC | YYYY-MM-DD HH:MM:SS | 混合日期和时间值 时间戳 |
