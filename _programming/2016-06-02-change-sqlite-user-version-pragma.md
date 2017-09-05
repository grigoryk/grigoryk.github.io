---
layout: post
title:  "Easily change SQLite user_version pragma with a hex editor"
date:   2016-06-02 23:17:13 -0800
categories: sqlite
permalink: /2016/06/change-sqlite-user-version-pragma-hex-editor/
---

Do you find yourself trying to change sqlite database file's `user_version` back and forth (perhaps, you're making databases for migration testing... or it's a boring Wednesday evening, or...), but don't want to mess around with libraries for such a simple task?

Get out your favourite HEX editor, and open up the SQLite file in question, and [look at offset 60](https://www.sqlite.org/fileformat.html#section_1_2_14). That's part of database file's header, and it's a 4-byte, big-endian number which represents the `user_version` pragma. Change it (keeping in mind that number you're seeing is in base 16), save the file, and you're done.

In the image below I have it set to version 32.
![](http://i.imgur.com/U1PiQ1q.png)
