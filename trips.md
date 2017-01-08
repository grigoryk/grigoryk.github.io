---
layout: page-no-title
title: Trip Reports
permalink: /trips/
---

<style>
    h1 {
        font-size: 18pt;
    }
</style>

<h1>Trip reports</h1>

For 2017, I'll try to post descriptions and photographs from some of the skiing, hiking, biking, (whatever else) trips here. Perhaps I'll back-fill this page with some of the previous trips as well!

<ul class="posts trips">
    {% for trip in site.trips reversed %}
      <li>
          <span class="post-date">{{ trip.date | date: "%b %-d, %Y" }}</span>
          <a class="post-link" href="{{ trip.url | prepend: site.baseurl }}">{{ trip.title }}</a>
      </li>
    {% endfor %}
</ul>
