---
layout: post
title:  "Getting started with Django on AWS Elastic Beanstalk"
date:   2012-09-15 21:31:00
categories: jekyll update
permalink: /2012/09/getting-started-with-django-on-aws-elastic-beanstalk/
---
**Note #1**: this writeup made it into the [Python Weekly Newsletter #54](http://t.co/b4gwDd6M)!

**Note #2**: I wrote this post two years ago. I haven't used Beanstalk much in the past year, and have mostly used Heroku and gunicorn/nginx running off of VPS for python projects. I've ported this post from my old wordpress blog since it's still getting a lot of traffic from Google, but keep in mind its age.

Let's go!
---

I needed to pick a home for an ongoing Django project. In the past I’ve deployed Django to my own Linodes, to WebFaction (both of which have been really good to me) and to AppEngine. This time, I needed something robust and more or less hassle-free, meaning that time dealing with the infrastructure is, ideally, minimized. I also didn’t want to develop the project within the AppEngine’s ecosystem. On the other hand I wanted free tiers, ability to go “under the hood” if necessary, and ability to sanely migrate away from the vendor.

Just over a month ago, Amazon announced Python support for their Elastic Beanstalk. After doing some research, I decided to go with this option. It doesn’t cost anything extra beyond whatever Amazon resources Beanstalk provisions for you, and fits really well with all my other requirements. It was also really easy to set up and get my new Django project on the way. I found the documentation just a little thin, so perhaps this quick writeup will be helpful to others in the same boat. Keep in mind that Python’s support is only a few months old in Beanstalk, and that I myself never set up AWS services before. This is very much a learning process.

Basics
---
Amazon’s own [Deploy a Django Application](http://docs.amazonwebservices.com/elasticbeanstalk/latest/dg/create_deploy_Python_django.html) tutorial is a good starting point. I won’t repeat the steps listed there, so do follow them and come back here. Their steps won’t take you more than a few minutes.

Your infrastructure looks like this now, which is a great starting point, especially provided that it took you minutes to set up:

![Basic web app infrastructure](http://i.imgur.com/dilbbTM.png)

Here is an excellent presentation on [Scaling Django Apps with AWS](http://www.scribd.com/doc/54883641/Scaling-Django-Apps-With-Amazon-AWS), and we’re not terribly far away from what they’re talking about there. As a nice bonus, all of this should fit into the Amazon’s free usage tier.

Here’s is Amazon’s guide on how to hook up your domain name to this setup: [Using AWS Elastic Beanstalk with Amazon Route 53 to Map Your Root Domain to Your Load Balancer](http://docs.amazonwebservices.com/elasticbeanstalk/latest/dg/AWSHowTo.Route53.html).

Here’s how Amazon [illustrates their Beanstalk architecture](http://docs.amazonwebservices.com/elasticbeanstalk/latest/dg/concepts.concepts.architecture.html):

![AWS Elastic Beanstalk architecture concepts](http://i.imgur.com/AbLE23E.gif)

Notes on Amazon’s tutorial
---

Provided createadmin.py script didn’t work for me (getting PASSWORD_HASHERS errors when trying to log in), so I’d recommend using something like this:

{% highlight python %}
from django.contrib.auth.models import User
if User.objects.count() == 0:
    admin = User.objects.create_user('username', 'email@example.com', 'password')
    admin.is_superuser = True
    admin.is_staff = True
    admin.save()
{% endhighlight %}

If you follow all of the steps, you’ll end up with python.config file looking like this:

{% highlight bash %}
container_commands:
 01_syncdb:
  command: "django-admin.py syncdb --noinput"
  leader_only: true
 02_createadmin:
  command: "scripts/createadmin.py"
  leader_only: true
 03_collectstatic:
  command: "django-admin.py collectstatic --noinput"
option_settings:
 "aws:elasticbeanstalk:container:python:environment":
  DJANGO_SETTINGS_MODULE: "myproject.settings"
 "aws:elasticbeanstalk:container:python":
  WSGIPath: "myproject/wsgi.py"
 "aws:elasticbeanstalk:container:python:staticfiles":
  "/static/": "static/"
{% endhighlight %}

leader_only: true is an important flag, it tells Beanstalk to run the commend once per deployment only on the “leader” instance, and not once per EC2 instance.

You’re also now able to make some changes to your project, commit, and deploy a new version like this:

{% highlight bash %}
git add whatever/file.py
git commit -m "my changes"
git aws.push
{% endhighlight %}

Simple local development environment with local_settings
---

In your settings.py file, make sure the database section looks something like this:

{% highlight python %}

if 'RDS_DB_NAME' in os.environ:
 DATABASES = {
  'default': {
  'ENGINE': 'django.db.backends.mysql',
  'NAME': os.environ['RDS_DB_NAME'],
  'USER': os.environ['RDS_USERNAME'],
  'PASSWORD': os.environ['RDS_PASSWORD'],
  'HOST': os.environ['RDS_HOSTNAME'],
  'PORT': os.environ['RDS_PORT'],
  }
 }
{% endhighlight %}

We need that if statement because in all likelihood, your local environment won’t have these environmental variables set up and you’ll end up with KeyErrors.

Now, add the following to the bottom of your settings.py file:

{% highlight python %}
try:
 from local_settings import *
except ImportError, e:
 pass
{% endhighlight %}

And put something along these lines into your local_settings.py (don’t add it to source control though):

{% highlight python %}
DATABASES = {
 'default': {
  'ENGINE': 'django.db.backends.sqlite3',
  'NAME': 'db.db',
  'USER': '',
  'PASSWORD': '',
  'HOST': '',
  'PORT': '',
 }
}

MEDIA_ROOT = ''
MEDIA_URL = ''
STATIC_ROOT = ''
STATIC_URL = '/static/'
STATICFILES_DIRS = ()
TEMPLATE_DIRS = ()
{% endhighlight %}

S3 Storage with django-storages and boto
---

We want to use an S3 bucket that Beanstalk kindly created for us in order to server static files, and if you’re going to handle uploading of files in your project, these also should go straight to the S3.

Let’s use [django-storages](http://django-storages.readthedocs.org/en/latest/index.html) and [boto](https://github.com/boto/boto) to handle AWS communication.

{% highlight bash %}
pip install django-storages boto
pip freeze > requirements.txt
{% endhighlight %}

Add ‘storages’ to your INSTALLED_APPS. Set the following variables in your settings.py:

{% highlight python %}
STATIC_ROOT = os.path.join(
 os.path.dirname(
  os.path.dirname(
   os.path.abspath(__file__))), 'static')

DEFAULT_FILE_STORAGE = 'storages.backends.s3boto.S3BotoStorage'
STATICFILES_STORAGE = 'storages.backends.s3boto.S3BotoStorage'
AWS_ACCESS_KEY_ID = 'your_key'
AWS_SECRET_ACCESS_KEY = 'access_key'
AWS_STORAGE_BUCKET_NAME = 'bucket_name'
{% endhighlight %}

You can get the name of the S3 bucket that Beanstalk created from the [AWS S3 console](https://console.aws.amazon.com/s3/home). It will look something like this: elasticbeanstalk-us-west-2-1234567890.

The above achieves two things:

* collectstatic script will now move everything to your S3 bucket, and all of your static files will be served from there
* FileFields in your models will now also use the S3 bucket for storage

Check out more [docs on setting up django-storages with S3](http://django-storages.readthedocs.org/en/latest/backends/amazon-S3.html).

Schema migrations with South
---

I’m using Amazon RDS (which is an instance of MySQL). We’d like to manage our schema migrations in a sane way, and South is as good of a way to achieve that as we have available.

{% highlight bash %}
pip install south
pip freeze > requirements.txt
{% endhighlight %}

Add ‘south’ it to INSTALLED_APPS. Make manage.py executable, and create your first app:

{% highlight bash %}
chmod +x manage.py
./manage.py startapp myapp
{% endhighlight %}

Create your app’s models.py file, and run the initial migration:

{% highlight bash %}
./manage.py schemamigration myapp --initial
./manage.py migrate myapp
{% endhighlight %}

You want your migrations to run on the remote RDS as well, so add a new command to your python.config file which will execute migrations during deployment. Below I’ve added 04_migrate_myapp, and the python.config now looks something like this:

{% highlight bash %}
commands:
 01_syncdb:
  command: "django-admin.py syncdb --noinput"
  leader_only: true
 02_createadmin:
  command: "scripts/createadmin.py"
  leader_only: true
 03_collectstatic:
  command: "django-admin.py collectstatic --noinput"
 04_migrate_myapp:
  command: "./manage.py migrate myapp --noinput"
  leader_only: true
option_settings:
 "aws:elasticbeanstalk:container:python:environment":
  DJANGO_SETTINGS_MODULE: "myproject.settings"
 "aws:elasticbeanstalk:container:python":
  WSGIPath: "myproject/wsgi.py"
 "aws:elasticbeanstalk:container:python:staticfiles":
  "/static/": "static/"
{% endhighlight %}

Wrap up
---

Amazon’s own Django deployment tutorial plus the steps I’ve outlined above should, fairly  quickly and without too much hassle get you up and running with a semi-decent development environment, and on a very nicely infrastructure consisting of various AWS components, with auto-scaling, load balancing, and a great web console to manage it all.

I still need to figure out the best way to handle test/staging/production environments, and ideally throw in something like Jenkins CI into the mix, but this is a really good starting point.

Any comments, additions, and corrections are very welcomed.
