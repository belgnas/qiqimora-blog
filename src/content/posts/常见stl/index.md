---
title: 常见的stl
published: 2025-12-12
pinned: false
description: 讲一下常见的STL容器和算法
tags: [算法]
category: 算法与数据结构
licenseName: "Unlicensed"
author: qiqimora
draft: false
---

# stl 核心知识点
这部分非常重要，一定要好好学习STL，它可以代替大部分数据结构和算法的实现，可以少写很多代码。

![最喜欢的STL酱喵](image1.jpg)

## 一、常用通用函数
- `sort(a.begin(), a.end())`：对容器`a`进行排序，默认升序。(`sort(a, a + n)`表示对数组`a[0]`到`a[n-1]`进行排序)
- `reverse(a.begin(), a.end())`：对数组/容器`a`进行反转。
- `lower_bound(a.begin(), a.end(), x)`：返回第一个大于等于`x`的元素的位置。
- `unique(a.begin(), a.end())`：去重，返回去重后的数组/容器的末尾位置。对`vector`去重时，`a.erase(unique(a.begin(), a.end()), a.end())`可以删除重复元素。
- `prev/next`：返回迭代器的前一个/后一个元素。

## 二、string 字符串
下标从0开始的字符串，可以直接使用下标访问字符（`s[i]`表示第i个字符）；支持`+`号拼接字符串（`s1 + s2`拼接成新字符串）；可使用`==、!=、<、>`等运算符进行字符串比较。

### 常用函数
- `s.substr(l, len)`：返回从`l`开始的`len`长度的子串。
- `s.find("abc")`：返回子串"abc"在字符串`s`中的位置，未找到返回`-1`。
- `s.size()`：返回字符串的长度。

### 代码示例
```cpp
#include <bits/stdc++.h>

using namespace std;

int main() {
    string s = "hello world";
    cout << s[0] << endl; // h
    cout << s.substr(0, 5) << endl; // hello
    cout << s.find("world") << endl; // 6
    cout << s.find("abc") << endl; // -1
    cout << s + "!" << endl; // hello world!

    // 字符串比较
    string s1 = "abc";
    string s2 = "abcd";
    cout << (s1 < s2) << endl; // 1
    cout << (s1 > s2) << endl; // 0
    cout << (s1 == s2) << endl; // 0
    cout << (s1 != s2) << endl; // 1
    
    // 输出带空格的字符串
    string s3;
    // getline 会读取整行（包括空格，不包括换行符）
    // 若上一行有残留换行符，需先调用一次getline清空
    getline(cin, s3); // 输入一行包含空格的字符串
    cout << s3 << endl; // 输出字符串 
    return 0;
}
```

## 三、vector/array
- `vector`：动态数组，大小可动态改变。
- `array`：静态数组，大小编译时确定。
两者下标均从0开始，默认比较方式为小于号。`vector`常用于动态开数组，`array`常用于定长数组（可替代pair/简单结构体）。

### vector 常用函数
- `push_back(x)`：在末尾添加元素`x`。
- `pop_back()`：删除末尾元素。
- `insert(pos, x)`：在`pos`位置插入元素`x`。
- `erase(it)`：删除迭代器`it`指向的元素。
- `clear()`：清空容器。
- `size()`：返回容器大小。
- `begin()`：返回容器首地址。
- `end()`：返回容器末尾地址。

### 代码示例
```cpp
#include <bits/stdc++.h>

using namespace std;

int main() {
    vector<int> a = {1, 2, 3, 4, 5}; // 初始化vector
    a.push_back(6); // 末尾添加6
    a.pop_back(); // 删除末尾元素
    a.insert(a.begin() + 2, 7); // 下标2位置插入7
    a.erase(a.begin() + 2); // 删除下标2位置元素
    cout << a.size() << endl; // 输出容器大小
    cout << a[0] << endl; // 输出第一个元素
    cout << a.front() << endl; // 输出第一个元素
    cout << a.back() << endl; // 输出最后一个元素

    array<int, 5> b = {1, 2, 3, 4, 5}; // 初始化array
    for (int i = 0; i < b.size(); i++) { // 遍历array
        cout << b[i] << " ";
    }
    cout << b.size() << endl; // 输出数组大小

    int n = 5, m = 10;
    vector<vector<int>> c(n, vector<int>(m)); // 初始化n*m二维数组
    for (auto &x : c) { // 遍历二维数组
        for (auto &y : x) { // 遍历一维数组
            cin >> y; // 输入元素
        }
    }

    return 0;
}
```

## 四、map/unordered_map（multimap/unordered_multimap）
### 简介
- `map`：有序、元素唯一，查找/插入时间复杂度`O(logn)`。
- `unordered_map`：无序、元素唯一，查找/插入均摊时间复杂度`O(1)`。
- `multimap/unordered_multimap`：支持重复键值对。

### 常用函数
- `insert({x, y})`：插入键值对`(x, y)`。
- `erase(x)/erase(it)`：删除键`x`（不存在则不删）/删除迭代器`it`指向元素。
- `find(x)`：查找键`x`，返回迭代器。
- `count(x)`：查找键`x`，返回1/0（multimap返回个数）。
- `lower_bound(x)`：返回第一个≥`x`的元素位置。
- `begin()`：返回首迭代器。
- `end()`：返回末尾迭代器。
- `clear()`：清空容器。
- `size()`：返回容器大小。

### 代码示例
```cpp
#include <bits/stdc++.h>

using namespace std;

int main() {
    map<int, int> m; // 初始化map
    m.insert({1, 2}); // 插入键值对(1,2)
    m[3] = 4; // 插入键值对(3,4)
    m.erase(1); // 删除键1
    cout << m.size() << endl; // 输出大小
    cout << m[3] << endl; // 输出键3的值

    if (m.count(3)) { // 检查键3是否存在
        cout << m[3] << endl;
    } else {
        cout << "3 does not exist" << endl;
    }

    unordered_map<int, int> um; // 初始化unordered_map
    um.insert({1, 2});
    um[3] = 4;
    um.erase(1);
    cout << um.size() << endl;
    cout << um[3] << endl;

    // 遍历并删除键为3的元素
    for (auto it = m.begin(); it != m.end();) {
        if (it->first == 3) {
            it = m.erase(it); // 删除后返回下一个迭代器
        } else {
            ++it;
        }
    }

    for (auto [x, y] : m) { // 遍历map
        cout << x << " " << y << endl;
    }

    return 0;
}
```

## 五、set/unordered_set（multiset/unordered_multiset）
### 简介
- `set`：有序集合、元素唯一，查找/插入时间复杂度`O(logn)`。
- `unordered_set`：无序集合、元素唯一，查找/插入均摊`O(1)`。
- `multiset/unordered_multiset`：支持重复元素。
可理解为“键值相等的map”，仅存储key。

### 常用函数
- `insert(x)`：插入元素`x`。
- `erase(x)/erase(it)`：删除所有值为`x`的元素/删除迭代器`it`指向元素。
- `find(x)`：查找元素`x`，返回迭代器。
- `count(x)`：返回元素`x`的个数（非multi版本返回1/0）。
- `lower_bound(x)`：返回第一个≥`x`的元素位置（unordered版本无此函数）。
- `begin()`：返回首迭代器。
- `end()`：返回末尾迭代器。
- `clear()`：清空容器。
- `size()`：返回容器大小。

### 代码示例
```cpp
#include <bits/stdc++.h>

using namespace std;

int main() {
    set<int> s; // 初始化set
    s.insert(1); // 插入1
    s.insert(2); // 插入2
    s.erase(1); // 删除1
    cout << s.size() << endl; // 输出大小
    cout << *s.begin() << endl; // 输出第一个元素

    if (s.count(2)) { // 检查2是否存在
        cout << "2 exists" << endl;
    } else {
        cout << "2 does not exist" << endl;
    }

    // 遍历并删除值为2的元素
    for (auto it = s.begin(); it != s.end();) {
        if (*it == 2) {
            it = s.erase(it);
        } else {
            ++it;
        }
    }

    for (auto x : s) { // 遍历set
        cout << x << " ";
    }
    cout << endl;

    // 查找并删除第一个≥2的元素
    auto it = s.lower_bound(2);
    if (it != s.end()) {
        cout << *it << endl;
        s.erase(it);
    } else {
        cout << "not found" << endl;
    }

    // 查找并删除第一个≤2的元素
    auto it2 = s.lower_bound(3);
    if (it2 != s.begin()) {
        --it2;
        cout << *it2 << endl;
        s.erase(it2);
    } else {
        cout << "not found" << endl;
    }

    unordered_set<int> us; // 初始化unordered_set
    us.insert(1);
    us.insert(2);
    us.erase(1);
    cout << us.size() << endl;
    cout << *us.begin() << endl;

    return 0;
}
```

## 六、priority_queue（优先队列）
### 简介
默认是大根堆，插入/删除时间复杂度均为`O(logn)`；可通过参数改为小根堆。

### 常用函数
- `push(x)`：插入元素`x`。
- `pop()`：删除堆顶元素（堆为空时调用会报错）。
- `top()`：返回堆顶元素（堆为空时调用会报错）。
- `size()`：返回堆的大小。

### 代码示例
```cpp
#include <bits/stdc++.h>

using namespace std;

int main() {
    priority_queue<int> pq; // 初始化大根堆
    pq.push(1);
    pq.push(2);
    pq.push(3);
    cout << pq.size() << endl; // 输出大小
    cout << pq.top() << endl; // 输出堆顶（3）

    pq.pop(); // 删除堆顶
    cout << pq.top() << endl; // 输出堆顶（2）

    while (pq.size()) { // 遍历并输出所有元素
        cout << pq.top() << " ";
        pq.pop();
    }

    priority_queue<int, vector<int>, greater<int>> min_pq; // 初始化小根堆

    return 0;
}
```

## 七、queue/deque/stack
### 简介
- `queue`：队列（先进先出），插入/删除`O(1)`。
- `deque`：双端队列（两端可插入/删除），插入/删除`O(1)`。
- `stack`：栈（后进先出），插入/删除`O(1)`。

### 常用函数
#### queue
- `push(x)`：队尾插入`x`。
- `pop()`：删除队头（队列空时调用报错）。
- `front()`：返回队头（队列空时调用报错）。
- `size()`：返回队列大小。

#### stack
- `push(x)`：栈顶插入`x`。
- `pop()`：删除栈顶（栈空时调用报错）。
- `top()`：返回栈顶（栈空时调用报错）。
- `size()`：返回栈大小。

#### deque
- `push_front(x)`：队头插入`x`。
- `push_back(x)`：队尾插入`x`。
- `pop_front()`：删除队头（队列空时调用报错）。
- `pop_back()`：删除队尾（队列空时调用报错）。
- `front()`：返回队头。
- `back()`：返回队尾。
- `size()`：返回队列大小。

### 代码示例
```cpp
#include <bits/stdc++.h>

using namespace std;

int main() {
    queue<int> q; // 初始化队列
    q.push(1);
    q.push(2);
    cout << q.size() << endl; // 输出大小
    cout << q.front() << endl; // 输出队头（1）
    q.pop(); // 删除队头
    cout << q.front() << endl; // 输出队头（2）

    stack<int> s; // 初始化栈
    s.push(1);
    s.push(2);
    cout << s.size() << endl; // 输出大小
    cout << s.top() << endl; // 输出栈顶（2）
    s.pop(); // 删除栈顶
    cout << s.top() << endl; // 输出栈顶（1）

    deque<int> d; // 初始化双端队列
    d.push_front(1);
    d.push_back(2);
    cout << d.size() << endl; // 输出大小
    cout << d.front() << endl; // 输出队头（1）
    cout << d.back() << endl; // 输出队尾（2）
    d.pop_front(); // 删除队头
    cout << d.front() << endl; // 输出队头（2）

    return 0;
}
```

## 八、数组模拟栈和队列
```cpp
#include <bits/stdc++.h>

using namespace std;

#define MAXN 100000 // 定义最大容量

int stk[MAXN]; // 模拟栈
int top = -1; // 栈顶指针（初始-1表示空栈）

int que[MAXN]; // 模拟队列
int hh = 0, tt = -1; // hh=队头，tt=队尾

int main() {
    // 模拟栈
    stk[++top] = 1; // 入栈1
    stk[++top] = 2; // 入栈2
    cout << stk[top--] << endl; // 出栈，输出2

    while (top >= 0) { // 遍历栈并输出
        cout << stk[top--] << " ";
    }
    cout << endl;

    // 模拟队列
    hh = 0, tt = -1; // 重置队列指针
    que[++tt] = 1; // 入队1
    que[++tt] = 2; // 入队2
    cout << que[hh++] << endl; // 出队，输出1

    while (hh <= tt) { // 遍历队列并输出
        cout << que[hh++] << " ";
    }

    return 0;
}
```