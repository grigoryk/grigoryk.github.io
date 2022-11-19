---
layout: post
title:  "When Gradle composite builds don't work, but you really want them"
date:   2022-11-19 03:03:13 -0800
categories: gradle android
permalink: /2022/11/when-gradle-composite-builds-dont-work/
---

(I wrote this post a while back while still at Mozilla, but I didn't publish it then. looking at the codebase today, even though some stuff got monorepo'd, this flow is still used as of Nov 2022 for dependencies that are still silo'd in their own repositories)

I work on Firefox for Android (aka Fenix). It has a highly modular architecture - composed out of hundreds of libraries (aka components) that mostly plug-and-play, like a Lego set; albeit, with some distinctively non-Lego-like glue here and there. The Fenix codebase could be thought of that "glue", to some extent. These different pieces of the system live across several repositories. They have somewhat aligned lifecycles, and the final app is composed out of a set of published, tested-to-work-together versions of these modules.

It all mostly works out, most of the time. This post won't discuss the trade-offs between a mono repo vs splitting code across multiple repositories. That's a much larger topic that should touch on organizational dynamics almost more than the technical aspects involved. That hypothetical post will need to start with a definition of Conway's Law.

Instead, I'll simply describe how we make the local development experience not-terrible when working across these multiple large gradle projects.

Here is how you'd build Fenix and most of its dependencies split across multiple repositories:
- checkout the main repo and the "library" repos you care about
- in a Fenix local.properties config file, specify which overarching sets of libraries you'd like to build locally
- open Fenix in Android Studio, press 'play'
- done!

This will build everything locally - some libs in Rust, some in Java, some in Kotlin - and tie it all together. If you didn't specify local versions of some set of libraries, they'll be pinned to whatever is listed in the regular build config.

## Demo

A while back I recorded a quick little demo of this flow, to help out external contributors and encourage internal folks to work across our entire stack. Names I use in the video are [Fenix](https://github.com/mozilla-mobile/fenix/) for Firefox for Android, [application services](https://github.com/mozilla/application-services/) are various Rust libs that do auth, storage, sync, etc, and [android components](https://github.com/mozilla-mobile/android-components/) are all the Kotlin libraries you'd need to create your own browser.

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/qZKlBzVvQGc" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## Gradle Composite Builds?
You'd assume we're using [Gradle Composite Builds](https://docs.gradle.org/current/userguide/composite_builds.html) for this - and I did try! And perhaps, I should try again. These Composite Builds are simply builds that include other builds - sounds exactly like what we want here. But at the time, something about our projects got Gradle really freaked out - to the point of poisoning the local Android Studio, forcing its victims (aka users) to reinstall the world and bang their heads against nearby walls.

So, if Gralde Composite builds don't work for you for whatever reason, but you really need to, uhm, compose multiple gradle projects together into a build, what do you do?

## Local publication workflow

What you could do _manually_ is fairly simple, but tedious:
- run builds of all configured dependencies
- [publish them locally](https://docs.gradle.org/current/userguide/publishing_maven.html) into a maven repository; don't forget to bump their versions!
- configure your "parent" project - add local maven repository, make sure gradle uses locally published dependencies when available
- finally, build the parent project and hope you got all these steps just right.

Nobody's excited to do this, and when they're forced to they often mess up _something_ and lose time figuring out why their code isn't working (when perhaps it's not even in the build being tested!).

## Autopublication workflow

Let's automate this! Roughly in three steps:

- when parent project builds, as a prerequisite Gradle needs to trigger builds/publication of its dependent projects. Simplest way to do that is by "abusing" [Gradle's initialization phase](https://docs.gradle.org/current/userguide/build_lifecycle.html#sec:build_phases), by adding some code to `settings.gradle` which will `runCmd` your dependencies' publish-if-modified script that lives within a dependent project. [Here's a real example](https://github.com/mozilla-mobile/fenix/blob/7bbee763a6822f8f13b1cb13efdecbf16fbb2873/settings.gradle#L45-L59).
- create a publish-if-modified flow for dependencies. Simple Gradle task can work here, but they'll be slow - in case of no modifications, Gradle needs to do a bunch of stuff before it can figure out there's nothing to do. Instead, let's pick something we already have and that's hyper-optimized for checking if a project has been modified - Git! So, use git commands to produce a hash of everything you care about, keep track of it locally, and check if that hash changed between builds. If it did, then build & publish locally. Here's [a python script we wrote for this](https://github.com/mozilla-mobile/android-components/blob/5d2314d081859fcd8d7aead5d210a2c8c6706e8e/automation/publish_to_maven_local_if_modified.py).
- allow dependent projects to change how parent consumes their modules. E.g., we need to make sure that what's picked up is the latest published versions in a local maven repository. You can do this by prepending `mavenLocal()` to list of repositories, and switching versions of every relevant module to `0.0.1-+`. That last '+' bit tells Gradle to resolve relevant modules to the latest available version, which will happen to have been just published to maven local. [Here's an example](https://github.com/mozilla-mobile/android-components/blob/5d2314d081859fcd8d7aead5d210a2c8c6706e8e/substitute-local-ac.gradle) gradle script that does this, which you'd then apply during a Configuration Phase [of the parent project](https://github.com/mozilla-mobile/fenix/blob/7bbee763a6822f8f13b1cb13efdecbf16fbb2873/app/build.gradle#L797-L800).

Once you put it all together, the dev experience is actually quite nice. You make a change in some Rust or Kotlin file in some separate repository, click 'Play' in Android Studio, and it "just works". Magic! And if you make no change there's no perf penalty for your local builds, since git is really good at hashing stuff.

## In closing...

I realize that this is basically a giant hack, and if I look at it long enough my head starts to hurt, mostly from disappointment with our build systems. But, at risk of sounding apologetic - this flow works! It took less than a week to figure out/implement, and requires no maintanence. It involves no manual steps. It adds almost no additional overhead to the builds. And most importantly: it saved real engineering teams a lot of time, and enabled team members to work better across the stack, helping us deal with the Conway's law.