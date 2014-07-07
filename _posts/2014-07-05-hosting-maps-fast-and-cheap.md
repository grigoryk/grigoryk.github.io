---
layout: post
title: "Hosting MBTiles maps, fast and cheap"
date: 2014-07-05 13:37:00
categories: maps loveyourmap mbtiles devops
---

My girlfriend was working on a data visualization project, creating a map of Vancouver's buildings colourized by their age of construction. She has created one several months ago in ArcGIS to aid us in our apartment hunt in Vancouver, but now we decided to make it interactive and publish it online. I've pointed her towards mapbox's great TileMill, and in a couple of days she came up with a great looking, at times trippy map.

Now, how do we get people to see it? TileMill, after some persistence, produced an MBTILE export, which is essentially a SQLITE database with bunch of rendered map tiles in it. Mapbox.com offers a map hosting service, but with her map, she was looking at a $50/month price tag at least.

Time for a DIY solution, and a birth of loveyourmap.com

After exploring different tile libraries out there, I went with TileStache (could both serve rendered mbtiles and render tiles on the fly, python, actively developed). Some tweaking with it later, and it's happily serving the map on my laptop. Next step, put it behind gunicorn, and put that behind nginx instance. We've got to package all of it for deployment, so create a Docker file which puts all of the pieces together.

Finally, get a couple of DigitalOcean droplets pre-configured with Docker, and deploy to them. So far, so good! I've set up all of the domain/subdomain stuff on Route53.

Initially when we launched the map, I've foolishly skipped the nginx step. It was just a naked gunicorn instance serving tiles, which worked fine until dozens of people started to actually browse the map at the same time. Nginx went in, Route53 updated, and it's been holding up really well, serving around 25 tiles/second on average for these past week.

With a DigitalOcean coupon I've found online after a 30 second search, the map is being hosted entirely free of charge.

It got around 15k uniques in the few days it's been online, and lots of attention from the local community, blogs and media. With an average session time of around 14 minutes, I think it's a success!
