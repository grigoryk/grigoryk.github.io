---
layout: post
title:  "Running Fedora 23 on Macbook Air 5,2 (mid-2012 model)"
date:   2015-11-08 22:31:00
categories: personal meta
permalink: /2015/11/fedora-23-on-macbook-air-52/
---
I finally got around to installing a desktop linux distro on my daily laptop! Last time I've used linux full-time was somewhere around 2007-2008, and since then it was all Macbooks and OSX. I briefly mentioned in my (post about dealing with "Developer's Block")[http://grigory.ca/2015/11/developers-block-and-dealing-with-it] that over the years I have felt that not using a Linux desktop environments must have had a certain negative effect on my desire to tinker with stuff and build new things. Fedora 23 was just released, so I figured why not give it a spin!

## Installation
Surprisingly very easy! I've downloaded the workstation iso, made myself a bootable SD Card using `dd` command (which took its sweet time, average copying speed was around 300kb/s). I've ensured that I had enough free space on the harddrive, and using Disk Utilities shrunk my main OSX partition to free up around 100gb for Fedora.
I even installed rEFInd boot manager, but it turned out not to be necessary - Fedora installs its own boot manager, which is "good enough" (although I can't boot into OSX from it). The rest of the installation was simple - boot into the live environment, and go through the installation wizard. I've pointed it to the 100gb "free space" to auto-partition for its needs.

## Tweaking
Out of the box, at the first glance, everythign seemed to work. WiFi works, screen looks fine, backlight adjusts, keyboard backlight works. Suspend seems to do the correct thing. So far so good!

Once I started to use it more, I've realized that there are a few annoyances. The biggest one for me was the behaviour of the Command and Control Keys. After years of OSX, I'm used to using Command key as the Control key - so they needed to be swapped. Thankfully, `gnome-tweak-tool` made it super easy.

Another thing I really needed to install was `Guake`. It's a slide-out, always accessible terminal. I spend a good portion of my time in OSX using TotalTerminal, so this is a direct replacement. So far I'm pretty happy with it!

## Problems
==usb==
The biggest hurdle so far is that I can't get fedora to recognize USB devices. Specifically, I needed to upload some books to Kobo ereader, and transfer some files to-from an external USB3 hard-drive. For both tasks I had to resort to re-booting into OSX. I did had some hardware issues with this laptop (spilled jam onto the keyboard...), but over time things just started to work again in OSX. But not here. I'll update this post if I'll get this stuff to work correctly.

Another problem is the touchpad. It generally works, and switching to tap-to-click was a huge improvement. But it doesn't feel as good as in OSX. Generally issues seem to be around sensitivity and accidental clicks. I haven't had time to investigate this further, but there are multiple guides online to adjusting macbook touchpads in linux.

==battery?==
While battery on my macbook seems to be dying after three years of use (OSX asks me to replace it ASAP, and sometimes can't seem to figure out how much time is left), Fedora seems to be struggling with it as well. Or is it? I've only spent couple of days with it and have been mostly plugged in, but generally it seemed that charge levels never climbed about 30-40% (while OSX would show 70-80%). It's hard to say which one is more accurate, since I haven't really timed how much life I get out of a full charge just yet; but there's certainly a discrepancy in reporting. Time will tell which OS does a better job.
