### DEPLOYMENT

#### ONE LINE DEPLOY

After you’ve built your Hoodie app you probably want to put it online. You can
choose to deploy your app as read-only or deploy the backend couchdb database as well.
This [video]( https://youtu.be/29Uclxq_1Vw) and the text below describes how to deploy your app using one line of code. Alternatively, you can deploy your app using Docker, please refer to the Docker section.

#### DEPLOYING TO NOW

[Now](https://zeit.co/now) allows you to deploy a Node application with its
[command line tool](https://github.com/zeit/now-cli). It’s 100% free for Open Source projects.
You can deploy an app from your computer or right from a GitHub repository.
For example, to deploy our [Hoodie Tracker demo](https://github.com/hoodiehq/hoodie-app-tracker) app all you have to do is to run this command:

    $ now hoodiehq/hoodie-app-tracker --npm -e NODE_ENV=production -e hoodie_inMemory=true
To describe this further:

    hoodiehq/hoodie-app-tracker
Is the GitHub repository slug.

    --npm
Tells now to deploy using npm as there is also Dockerfile in the repository.

    -e NODE_ENV=production

Sets the NODE_ENV environment variable to production, which makes the deployment
faster as no devDependencies will be installed.

    -e hoodie_inMemory=true

Makes the Hoodie app run in-memory mode, meaning that no data is persisted and no files are written. This is important because now is a read-only file system. That means that all user accounts and data will be lost on the next deployment, but it is great for for a quick test or demo of your application.
Alternatively, add this script to your package.json and you are good to go:

    "now-start": "hoodie --inMemory",
#### STORE DATA WITH CLOUDANT

[Cloudant](https://cloudant.com/_) is a DBaaS (database-as-a-service). It provides
most of CouchDB’s APIs and can be used as Hoodie’s database backend. Signing up
for a free account only takes a moment. After sign up, you need to slightly adjust
the now deployment command above.

    $ now hoodiehq/hoodie-app-tracker -e NODE_ENV=production -e
    hoodie_inMemory=true -e hoodie_dbUrl=https://username:password@username.cloudant.com/

The *hoodie_inMemory* environment variable makes sure that Hoodie does not try to 
write any files like the bundled /hoodie/client.js library. The *hoodie_dbUrl*
environment variable sets the address and credentials to your CouchDB. Replace
username and password to whatever you signed up with.

#### TEST AND SET AN ALIAS

When you deploy with now you will receive a random subdomain where you can access
your application. It looks something like https://hoodie-app-tracker-randomxyz.now.sh/
and was already copied to your clipboard during the deployment. Open the URL in
your browser to give it a try. Once everything is good, you can change the subdomain
to your preference by running:

    $ now alias set hoodie-app-tracker-randomxyz my-tracker-app

That will make your deployed Hoodie Tracker app accessible at https://my-tracker-app.now.sh. For example, here is the app that I deployed myself: https://hoodie-app-tracker.now.sh/

#### DOCKER

We continuously deploy our [Hoodie Tracker App]( https://github.com/hoodiehq/hoodie-app-tracker)
 using Docker. You can read about our continuous deployment set at [hoodie-app-tracker/deployment.md.](https://github.com/hoodiehq/hoodie-app-tracker/blob/master/deployment.md
)

### DEPLOYMENT IN LINUX


This guide is for Linux only at this point.
I have tried to deploy [Hoodie-App-Tracker](https://github.com/hoodiehq/hoodie-app-tracker) as an example:

#### INSTALL DEPENDENCIES


1. [Install CouchDB](http://linoxide.com/linux-how-to/install-couchdb-futon-ubuntu-1604/) 1.2.0 or later, 1.4.0 or later recommended for performance.

2. [Install NodeJS](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-16-04) 0.10.0 or later.

3. [Install nginx](https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-16-04), any recent version will do.

4. [Install Monit](https://www.digitalocean.com/community/tutorials/how-to-install-and-configure-monit), any recent version will do.

5. [Install git](https://www.digitalocean.com/community/tutorials/how-to-install-git-on-ubuntu-16-04).

####  COUCHDB

We assume you set up CouchDB with your package manager or manually following the
[installation procedure]( http://linoxide.com/linux-how-to/install-couchdb-futon-ubuntu-1604/).

In order to test if CouchDB is running fine or not, we can simply run the following
command which will retrieve the information through curl.

    curl localhost:5984


If you are already using CouchDB for other things, we recommend starting a second
instance of CouchDB that is completely separate from your original one. See below
for instructions.

In this guide, we assume that your CouchDB is available at  [port 5984](http://127.0.0.1:5984/).

Create a CouchDB admin user called **admin** with a strong password of your choice at
by clicking on the *Fix this* at [Apache CouchDB-Futon:Overview](http://127.0.0.1:5984/_utils/) link in the
lower right corner. Keep that password in mind.

Next we want to change CouchDB’s default configuration on a few points. The easiest thing is to go to and change the following fields (double click a value to enter the editing mode):

    couchdb -> delayed_commits: false
    couchdb -> max_dbs_open: 1024
    couch_httpd_auth -> timeout: 1209600 ; that’s two weeks


#### SYSTEM


Add this to  /etc/security/limits.conf :

    hoodie    soft    nofile    768
    hoodie    hard    nofile    1024


### HOODIE

Create a new system user:

    sudo useradd --system \
      -m \
      --home /home/hoodie \
      --shell /bin/bash \
      --no-user-group \
      -c "Hoodie Administrator" hoodie


This will create a new user and its home directory /home/hoodie.
But unless you have a password, you can not be a user. To set a password run:

    sudo passwd hoodie

Give a password of your choice.

**cd** in to that directory.

To switch to **hoodie** user, run :

    sudo su hoodie

As user Hoodie, install your application, either with Hoodie’s application template function:

    hoodie new appname githubname/reponame
    think https://github.com/githubname/reponame

…or via a git checkout and manual setup

    git clone appname repourl

make sure package.json has a valid `name` property.

Here since we are trying to deploy *Hoodie-App-Tracker*
Run:

    git clone https://github.com/hoodiehq/hoodie-app-tracker.git hoodie

To start, copy over the script from [this gist](https://gist.github.com/janl/b097f7a578ec07e4101c).

    wget https://gist.githubusercontent.com/janl/b097f7a578ec07e4101c/raw/01ab9816f64660075e6fe9e5a787545097f22da8/hoodie-daemon.sh

Since this code was meant for the old hoodie version, to deploy the new one replace the following code-

    sudo -u $hoodie_user \
    COUCH_URL=http://127.0.0.1:5984 \
    HOODIE_ADMIN_USER=admin \
    HOODIE_ADMIN_PASS="$HOODIE_ADMIN_PASS" \
    HOME=$apphome \
    node node_modules/hoodie-server/bin/start \


with this :

    npm start -- --address=127.0.0.1 --port=someport

And change *apphome* field to:

    /home/hoodie/hoodie-app-tracker/

To run Hoodie as the root:

    sudo su hoodie

To get permission to execute the file, run-

    chmod +x hoodie-daemon.sh

To launch Hoodie now, as root :

    HOODIE_ADMIN_PASS=youradminpasswordfromearlier
      ./hoodie-daemon.sh start

That's it. The app should be running by now.
