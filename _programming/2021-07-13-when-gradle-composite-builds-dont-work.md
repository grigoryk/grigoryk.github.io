---
layout: post
title:  "When Gradle composite builds don't work"
date:   2021-07-13 10:14:13 -0800
categories: gradle android
permalink: /2021/07/when-gradle-composite-builds-dont-work/
---

During the day I work on Firefox for Android (codename Fenix). It has a highly modular architecture - composed out of many different libraries that mostly plug-and-play, like a Lego set (albeit, with some distinctively non-Lego-like glue here and there, aka the Fenix codebase itself). These different pieces of the system live across several repositories. They have somewhat aligned lifecycles, and the final app is composed out of a set of published, tested-to-work-together versions of these modules.

It all mostly works out, most of the time. This post won't discuss the trade-offs between a mono repo vs splitting code across multiple repositories. That's a much larger topic that should touch on organizational dynamics almost more than the technical aspects involved. This hypothetical post will need to start with a definition of Conway's Law.

So, instead, I'll simply describe how we make the local development experience more-pleasant-than-one-would-assume when working across multiple gradle projects.

Here is how you'd build Fenix:
- checkout the main repo and the "library" repos you care about
- in a Fenix config file, specify which sets of libraries you'd like to build locally
- open Fenix in Android Studio, press 'play'
- done!

This could build the libraries you have locally - some in Rust, some in Java, some in Kotlin, and tie it all together. If you didn't specify local versions of something, that'll be pinned to whatever version is listed in the build files.

You'd assume we're using [Gradle Composite Builds](https://docs.gradle.org/current/userguide/composite_builds.html) for this - and I did try! And perhaps, I should try again. After all, Gradle Composite Builds are simply builds that include other builds - sounds exactly like what we want. But, at the time, something about our specific projects got Gradle really, really confused - to the point of poisoning the local Android Studio, forcing its victims (err, users) to reinstall the world and bang their hypothetical heads against nearby hypothetical walls.

So, if Gralde Composite builds don't work for you for whatever reason, but you really need to, uhm, compose the builds, what do you do?

## Local publication workflow

So, what you do is fairly simple, but tedious. You use the `maven-publish` plugin, which

It's pretty simple:
- run builds of all configured dependencies
- publish them locally (into a maven repository)
- configure Fenix to take locally published dependencies instead of what it configures by default
- finally, build Fenix itself.

All of this could be done manually, which is what we had to do in the past. However, that's a very cumbersome process and there are many steps and local code modifications involved, making it both annoying and error-prone. So, how do we automate this?

Also, fairly simple:
- in Fenix,

There are some pitfalls, mainly around speed:
- Gradle is fairly slow; even if there are no changes in the project, running a build will take a bit of time.
- So, if we just rely on Gradle to produce incremental builds, we'll slow down Fenix builds with every configured local repository

It's straightforward to consume a dependency from a local repository. We use a [Maven Publish Plugin](https://docs.gradle.org/current/userguide/publishing_maven.html) to publish our libraries to local repositories.

## Our core dependencies

To make this example clearer, here's are some of our repositories:
- [fenix](https://github.com/mozilla-mobile/fenix/) is the Android application itself. All in Kotlin.
- [android-components](https://github.com/mozilla-mobile/android-components/) are the main building blocks, hundreds of modules that provide everything from UI components to telemetry and storage systems. All in Kotlin.
- [application-services](https://github.com/mozilla/application-services) are the lower-level building blocks that provide libraries that manage our core browser storage, data synchronization and some services integrations. All in Rust, with platform-specific bindings (in Kotlin, and Swift for Firefox for iOS). These are not consumed directly, but via higher-level wrappers in `android-components`.
- [glean](https://github.com/mozilla/glean) is our main telemetry system, also written in Rust with necessary platform bindings.
- [GeckoView](https://mozilla.github.io/geckoview/) is our Gecko-powered WebView alternative. This is what renders pages, runs JS, provides APIs letting the application interact with web content, etc. Its code is part of the main Firefox tree, `mozilla-central`.

In a local build, there are some common combinations of what a developer may need to compile locally, depending on what part of the stack they're working on.

E.g. if I'm adding or modifying some SQLite tables storing browsing data, I'll need to compile `fenix`+`android-components`+`applicaton-services`. This build will include compiling Rust code into native libraries, generating Kotlin bindings, compiling Kotlin modules against the newly generated library, and finally compiling Fenix against the Kotlin modules.

## Composite builds

Let's consider this last example. All of these repositories are Gradle-managed projects. So, in theory, we should be able to use composite builds. A composite build is a [build that includes other builds](https://docs.gradle.org/current/userguide/composite_builds.html), which is what we want A couple of years ago I've spent some time trying to get this to work for our repositories. It _mostly_ worked, except when it didn't and would corrupt Android Studio to the point of non-recovery, and produce strange build artifacts. I'm not entirely sure what was tripping it up - perhaps the scale of our projects (we have 100+ modules), perhaps the way they're configured. I also don't think that composite builds are used by most projects, and so it's likely that they don't work all that well in certain scenarios. Since the composite build system is a bit of a black-box, it was hard to debug - and there's nothing worse than working with a build system that you can't depend on. Am I running the latest code changes, or is this some stale old code instead? These are _not_ the questions you want anyone asking while just trying to get on with their jobs (or, trying to contribute to OSS). So, what's the alternative?

## Autopublication workflow

Here's how you build Fenix locally, with hundreds of locally modified modules, spanning Kotlin and Rust:
- checkout the repositories you want to modify
- in Fenix, set local paths of where your dependencies are via `local.properties`
  - e.g. `autoPublish.android-components.dir=../android-components`
- in the same way, tell `android-components` where to find a local checkout of `application-services`:
  - e.g. `autoPublish.application-services.dir=../application-services`
- open Fenix in Android Studio
- press 'play'
- done!

This will produce an incremental build that includes any modifications made across the stack.

I've even recorded a little video demo, to help out external contributors and encourage internal folks to work across our entire stack:

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/qZKlBzVvQGc" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

