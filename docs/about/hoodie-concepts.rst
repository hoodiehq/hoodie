Hoodie's Concepts
=====================================================================

Hoodie was designed around a few core beliefs and concepts, and they
explain a lot of the choices made in the code and the functionality.
They are:

-  `Dreamcode <#dreamcode>`__
-  `noBackend <#nobackend>`__
-  `Offline First <#offline-first>`__

Dreamcode
~~~~~~~~~

While designing Hoodie's API, we realised that we wanted to do more than
simply expose some server code to the frontend. **We wanted to reduce
complexity, not move it around**. And to make something simple and
intuitive, you can't start with the tech stack, you have to start with
the humans that are going to use it. What would their dream API look
like? Dreamcode is essentially user-centered design for APIs.

To put it bluntly: **Hoodie’s API is optimized for being awesome**. For
being intuitive and accessible. And it’s optimized for making the lives
of frontend developers as good as possible. It’s also an API first: it’s
a promise - everything else can change or is replaceable. The API is all
that matters.

Forget all the constraints of today's browsers. Then write down the code
of your dreams for all the tasks you need to build your app. The
implementation behind the API doesn't matter, it can be simple or tough
as nails, but crucially: the users shouldn't have to care. This is
dreamcode.

**Everything is hard until someone makes it easy**. We're making web app
development easy.

Here's some further information and links to Dreamcode examples.

noBackend
~~~~~~~~~

Servers are difficult. Databases are difficult. The interplay between
client and server is difficult, there are many moving parts, there are
many entertaining mistakes to make, and **the barrier to entry for web
app development is, in our mind, needlessly high**. You shouldn't have
to be a full stack developer to build a functioning app prototype, or
code a small tool for yourself or your team, or launch a simple MVP.

People have been building web apps for quite a while now, and their
basic operations (sign up, sign in, sign out, store and retrieve data,
etc.) must have been written a million separate times by now. These
things really shouldn't be difficult anymore. So we're proposing Hoodie
as a noBackend solution. Yes, a backend does exist, but it doesn't have
to exist in your head. You don't have to plan it or set it up. You
simply don't have to worry about it for those basic operations, you can
do all of them with Hoodie's frontend API. Of course, we let you dig as
deep as you want, but for the start, you don't have to.

noBackend gives you time to work on the hard problems, the parts of the
app that are justifiably difficult and non-abstractable, like the
interface, the user experience, the things that make your product what
it is.

With Hoodie, you scaffold out your app with

.. raw:: html

   <pre><code class="language-bash">$ hoodie new best-app-ever</code></pre>

and you're good to go. Sign up users, store data… it's all right there,
immediately. It's a backend in a box, empowering frontend developers to
build entire apps without thinking about the backend at all. Check out
some example Hoodie apps if you'd like to see some code.

More information about noBackend
''''''''''''''''''''''''''''''''

See nobackend.org, Examples for noBackend solutions and @nobackend on
Twitter.

Offline First
~~~~~~~~~~~~~

We make websites and apps for the web. The whole point is to be online,
right? We're online when we build these things, and we generally assume
our users to be in a state of permanent connectivity. That state,
however, is a myth, and that assumption causes all sorts of problems.

With the stellar rise of mobile computing, we can no longer assume
anything about our users' connections. Just as we all had to learn to
accept that screens now come in all shapes and sizes, **we'll have to
learn that connections can be present or absent, fast or slow, steady or
intermittent, free or expensive…** We reacted to the challenge of
unknowable screen sizes with Responsive Webdesign and Mobile First, and
we will react to the challenge of unknowable connections with Offline
First.

**Offline First means: build your apps without the assumption of
permanent connectivity**. Cache data and apps locally. Build interfaces
that accommodate the offline state elegantly. Design user interactions
that will not break if their train goes into a tunnel. Don't freak out
your users with network error messages or frustrate them with
inaccessible data. **Offline First apps are faster, more robust, more
pleasant to use, and ultimately: more useful.**

More information about Offline First
''''''''''''''''''''''''''''''''''''

See offlinefirst.org, on GitHub and discussions and research

So now you know what motivates us
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

We hope this motivated you too! So let's continue to the system
requirements for Hoodie.
