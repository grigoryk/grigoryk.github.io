---
layout: post
title: "Hosting MBTiles maps, fast and cheap"
date: 2014-07-05 13:37:00 -0800
categories: maps loveyourmap mbtiles devops
---
Intro
---
[Ekaterina](http://aristova.me) was working on a data visualization project, creating a map of Vancouver's buildings colourized by their age of construction. She has created one several months ago in ArcGIS to aid in our apartment hunt in Vancouver, but now we decided to make it interactive and publish it online. I've pointed her towards Mapbox's great map design tool [TileMill](https://www.mapbox.com/tilemill/), and in a couple of days she came up with a great looking, at times trippy map.

Check out the interactive version (click-click!):
<a href="http://www.aristova.me/projects/vancouver-building-age-map/" title="Vancouver's building age map">
    <img title="Vancouver's colourized building age map" src="http://i.imgur.com/Z8JpGgA.png" width="100%">
</a>

Now, how do we get people to see it? TileMill, after some persistence, produced an MBTiles export, which is a SQLite database consisting of a bunch of rendered map tiles and some meta information (including map legend, UTFGrid). [Mapbox.com](http://mapbox.com) offers a map hosting service, but with Ekaterina's map we were looking at $50/month at least - which would only go up if the map saw significant use.

DIY to the rescue, and the birth of [Love Your Map](http://loveyourmap.com)
---
I've decided to host everything myself, and in the process create a service others can use. I called this service [Love Your Map](http://loveyourmap.com), and currently getting it ready for a beta launch sometime later this week.

**Quick rundown of technical details**

After exploring different tile libraries, I went with [TileStache](http://tilestache.org/). It's a Python-based map server with WSGI support, which can easily serve pre-rendered tiles from MBTiles and render [Mapnik](http://mapnik.org/) maps (something I was trying out at that time, as TileMill has a Mapnik XML export option). After getting all of the dependencies installed and tweaking TileStache configs inside of a Vagrant VM, I've packaged everything using [Docker](http://www.docker.com/) for deployment. This project was a good excuse to try out Docker, and after getting a hang of the basics it's been a great experience.

I've been meaning to try out [DigitalOcean's VPS service](https://www.digitalocean.com/?refcode=5d67b1efd64e) (handy referral URL) for sometime now, having read good things about them on HackerNews. The experience so far was stellar. Droplets (their term for a VPS instance) launched quickly (although, one took a few minutes to get going), behaved well, and they have a ton of tutorials on a variety of things you can do with your servers. I haven't had to use their support, but I've read good things about it.

I've used their Docker-ready droplet to deploy the map server, and another droplet to run Nginx as a load balancer.

Initially when we launched the map, I've exposed the Gunicorn instance to the public (laziness, and a little bit of "let's see what happens"). This worked fine until ~20 concurrent users started to actively browse the map, at which point the poor map server started to timeout and generally die. Nginx went in, Route53 records were updated, and it's been holding up really well since. Some quick load testing with [loader.io](http://loader.io) confirmed that this setup should serve me well for now.

Note on DigitalOcean coupons: they're out there! After a 30 second search on google, everything is hosted entirely free of charge (for a month, and perhaps [loveyourmap.com](http://loveyourmap.com) will start paying for itself afterwards).

<img title="map pageview stats" src="http://i.imgur.com/8qVC7Ia.png" width="100%">

In the six days that it's been online, this map received around 20k unique pageviews, and got some amount of attention from the local community, blogs and media.
