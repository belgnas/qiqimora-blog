---
title: 一元三次方程求解
published: 2025-12-09
updated: 2026-03-15
pinned: false
description: 一道关于一元三次方程的的二分题解
tags: [算法, 刷题]
category: 算法与数据结构
licenseName: "Unlicensed"
author: qiqimora
draft: false
---

<!-- 管理图片和其他资源
使用这种方法，你可以将文章相关的所有资源都放在同一个文件夹中，便于管理：

src/content/posts/my-complex-post/
├── index.md
├── image1.png
├── image2.jpg
└── data.json
在文章中引用图片时，可以直接使用相对路径：

![图片描述](image1.png)
注意像这样直接填写文件的名字,这样才能让RSS正常构建图片的路径 
-->

<!-- 下面是正文 -->
# 题解：P1024 [NOIP2001 提高组] 一元三次方程求解

## 题目描述

给出一个形如 $ax^3 + bx^2 + cx + d = 0$ 的一元三次方程，系数均为实数。已知该方程在 $[-100, 100]$ 范围内存在三个不同的实根，且根与根之差的绝对值 $\ge 1$。要求从小到大输出这三个实根，精确到小数点后 2 位。

-----

## 方法一：求导分区间法（我的解法）

### 1\. 算法思路

一元三次函数 $f(x)$ 的图像通常呈“N”字形或倒“N”字形。为了找到三个根，我们需要确定函数的**单调区间**。
单调性的转折点就是函数的**极值点**。

1.  **求导**：对原函数求导得到二次函数 $f'(x) = 3ax^2 + 2bx + c$。
2.  **求极值点**：令 $f'(x) = 0$，利用求根公式 $x = \frac{-B \pm \sqrt{B^2 - 4AC}}{2A}$ 求出两个极值点 $x_1, x_2$。
      * 注意系数对应关系：$A=3a, B=2b, C=c$。
3.  **划分区间**：两个极值点将数轴（在题目范围内）划分为三个单调区间：
      * $[-100, x_1]$
      * $[x_1, x_2]$
      * $[x_2, 100]$
4.  **二分查找**：由于题目保证有三个不同的实根，根据函数的连续性和单调性，这三个区间内必然各有一个根。我们只需要在每个区间内分别进行二分查找即可。

### 2\. 代码实现

```cpp
#include <iostream>
#include <cmath>
#include <algorithm>
#include <iomanip>
#include <vector>

using namespace std;

#define IOS ios::sync_with_stdio(0), cin.tie(0), cout.tie(0);

typedef pair<double, double> PDD; 

double a, b, c, d;

// 计算函数值 f(x)
double f(double x) {
    return a * x * x * x + b * x * x + c * x + d;
}

int main() {

    IOS;
    
    cin >> a >> b >> c >> d;

    // 1. 求导 f'(x) = 3ax^2 + 2bx + c
    double A = 3 * a;
    double B = 2 * b;
    double C = c;
    
    // 2. 求极值点（导数为0的点）
    double delta = B * B - 4 * A * C;
    double x1 = (-B + sqrt(delta)) / (2 * A);
    double x2 = (-B - sqrt(delta)) / (2 * A);
    
    // 确保 x1 < x2
    if (x1 > x2) swap(x1, x2);

    // 3. 划分三个单调区间
    vector<PII> sections(3);
    sections[0] = {-100, x1};
    sections[1] = {x1, x2};
    sections[2] = {x2, 100};

    // 4. 在每个区间内二分查找
    for (int i = 0; i < 3; i++) {
        double l = sections[i].first;
        double r = sections[i].second;
        
        // 当区间长度大于 1e-7 时继续二分，保证精度
        while (r - l > 1e-7) {
            double mid = (l + r) / 2;
            // 零点存在定理：如果 f(mid) 和 f(l) 异号（或其中之一为0），说明根在左半边
            // 注意：这里利用 f(l) 作为参考点判断符号变化
            if (f(mid) * f(l) <= 0) {
                r = mid;
            } else {
                l = mid;
            }
        }
        // 输出结果，控制精度
        cout << fixed << setprecision(2) << l << " ";
    }
    
    return 0;
}
```

### 3\. 复杂度分析

  * **时间复杂度**：$O(K)$，其中 $K$ 是二分的次数（常数）。
  * **空间复杂度**：$O(1)$。

-----

## 方法二：暴力枚举 + 二分（答案推荐解法）

### 1\. 算法思路

利用题目给出的强力提示：**“根与根之差的绝对值 $\ge 1$”**。
这意味着，任意长度为 1 的区间 $[i, i+1]$ 内，最多只可能有一个根。

1.  **枚举**：从 $-100$ 到 $99$ 枚举每一个整数 $i$。
2.  **判断**：检查区间 $[i, i+1]$ 的左右端点函数值。
      * 如果 $f(i) = 0$，则 $i$ 是根。
      * 如果 $f(i) \cdot f(i+1) < 0$，说明根在 $(i, i+1)$ 之间。
3.  **二分**：对于确定的区间 $[i, i+1]$，进行二分查找精确求根。

### 2\. 代码片段

```cpp
#include <iostream>
#include <cmath>
#include <algorithm>
#include <iomanip>
#include <vector>

using namespace std;

#define IOS ios::sync_with_stdio(0), cin.tie(0), cout.tie(0);

typedef pair<double, double> PDD; 

double a, b, c, d;

// 计算函数值 f(x)
double f(double x) {
    return a * x * x * x + b * x * x + c * x + d;
}

int main() {

    IOS;
    
    cin >> a >> b >> c >> d;

    for (int i = -100; i < 100; i++) {
        double y1 = f(i);
        double y2 = f(i + 1);

        if (abs(y1) < 1e-9) { // 也就是 y1 == 0
            cout << fixed << setprecision(2) << (double)i << " ";
        } 
        else if (y1 * y2 < 0) { // 区间内有根
            double l = i, r = i + 1;
            for (int k = 0; k < 100; k++) { // 二分 100 次
                double mid = (l + r) / 2;
                if (f(mid) * f(l) <= 0) r = mid;
                else l = mid;
            }
            cout << fixed << setprecision(2) << l << " ";
        }
    }
    
    return 0;
}
```

*注：这种方法避开了繁琐的求导公式，且不用处理 $a=0$ 等特殊情况，在比赛中容错率更高。*