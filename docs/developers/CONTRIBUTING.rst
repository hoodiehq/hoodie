Contributing to Hoodie
======================

Please take a moment to review this document in order to make the
contribution process easy and effective for everyone involved.

Following these guidelines helps to communicate that you respect the
time of the developers managing and developing this open source project.
In return, they should reciprocate that respect in addressing your
issue, assessing changes, and helping you finalize your pull requests.

As for everything else in the project, the contributions to Hoodie are
governed by our `Code of Conduct <http://hood.ie/code-of-conduct/>`__.

Using the issue tracker
-----------------------

First things first: **Do NOT report security vulnerabilities in public
issues!** Please disclose responsibly by letting `the Hoodie
team <mailto:team@thehoodiefirm.com?subject=Security>`__ know upfront.
We will assess the issue as soon as possible on a best-effort basis and
will give you an estimate for when we have a fix and release available
for an eventual public disclosure.

The issue tracker is the preferred channel for `bug reports <#bugs>`__,
`features requests <#features>`__ and `submitting pull
requests <#pull-requests>`__, but please respect the following
restrictions:

-  Please **do not** use the issue tracker for personal support
   requests. Use the `Hoodie Chat <http://hood.ie/chat/>`__.

-  Please **do not** derail or troll issues. Keep the discussion on
   topic and respect the opinions of others.

Bug reports
-----------

A bug is a *demonstrable problem* that is caused by the code in the
repository. Good bug reports are extremely helpful - thank you!

Guidelines for bug reports:

1. **Use the GitHub issue search** — check if the issue has already been
   reported.

2. **Check if the issue has been fixed** — try to reproduce it using the
   latest ``master`` or ``next`` branch in the repository.

3. **Isolate the problem** — ideally create a reduced test case.

A good bug report shouldn't leave others needing to chase you up for
more information. Please try to be as detailed as possible in your
report. What is your environment? What steps will reproduce the issue?
What OS experiences the problem? What would you expect to be the
outcome? All these details will help people to fix any potential bugs.

Example:

    Short and descriptive example bug report title

    A summary of the issue and the browser/OS environment in which it
    occurs. If suitable, include the steps required to reproduce the
    bug.

    1. This is the first step
    2. This is the second step
    3. Further steps, etc.

    ``<url>`` - a link to the reduced test case

    Any other information you want to share that is relevant to the
    issue being reported. This might include the lines of code that you
    have identified as causing the bug, and potential solutions (and
    your opinions on their merits).

Feature requests
----------------

Feature requests are welcome. But take a moment to find out whether your
idea fits with the scope and aims of the project. It's up to *you* to
make a strong case to convince the project's developers of the merits of
this feature. Please provide as much detail and context as possible.

Pull requests
-------------

Good pull requests - patches, improvements, new features - are a
fantastic help. They should remain focused in scope and avoid containing
unrelated commits.

**Please ask first** before embarking on any significant pull request
(e.g. implementing features, refactoring code), otherwise you risk
spending a lot of time working on something that the project's
developers might not want to merge into the project.

For new Contributors
~~~~~~~~~~~~~~~~~~~~

If you never created a pull request before, welcome :tada: :smile: `Here
is a great
tutorial <https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github>`__
on how to send one :)

1. `Fork <http://help.github.com/fork-a-repo/>`__ the project, clone
   your fork, and configure the remotes using command line:

::

    # Clone your fork of the repo into the current directory    
    git clone https://github.com/<your-username>/<repo-name>    
   
    # Navigate to the newly cloned directory    
    cd <repo-name>    
   
    # Assign the original repo to a remote called "upstream"    
    git remote add upstream https://github.com/hoodiehq/<repo-name>

2. If you cloned a while ago, get the latest changes from upstream:

::

    git checkout master    git pull upstream master

3. Create a new topic branch (off the main project development branch)
   to contain your feature, change, or fix:

::    

    git checkout -b <topic-branch-name>

4. Make sure to update, or add to the tests when appropriate. Patches
   and features will not be accepted without tests. Run ``npm test`` to
   check that all tests pass after you've made changes. Look for a
   ``Testing`` section in the project’s README for more information.

5. If you added or changed a feature, make sure to document it
   accordingly in the ``README.md`` file.

6. Push your topic branch up to your fork:

::    

    git push origin <topic-branch-name>

8. `Open a Pull
   Request <https://help.github.com/articles/using-pull-requests/>`__
   with a clear title and description.

For Members of the Hoodie Contributors Team
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

1. Clone the repo and create a branch

::   

    git clone https://github.com/hoodiehq/<repo-name>    
    cd <repo-name>    
    git checkout -b <topic-branch-name>

2. Make sure to update, or add to the tests when appropriate. Patches
   and features will not be accepted without tests. Run ``npm test`` to
   check that all tests pass after you've made changes. Look for a
   ``Testing`` section in the project’s README for more information.

3. If you added or changed a feature, make sure to document it
   accordingly in the ``README.md`` file.

4. Push your topic branch up to our repo

::    

    git push origin <topic-branch-name>

5. Open a Pull Request using your branch with a clear title and
   description.

Optionally, you can help us with these things. But don’t worry if they
are too complicated, we can help you out and teach you as we go :)

1. Update your branch to the latest changes in the upstream master
   branch. You can do that locally with

::

    git pull --rebase upstream master

Afterwards force push your changes to your remote feature branch.

2. Once a pull request is good to go, you can tidy up your commit
   messages using Git's `interactive
   rebase <https://help.github.com/articles/interactive-rebase>`__.
   Please follow our commit message conventions shown below, as they are
   used by
   `semantic-release <https://github.com/semantic-release/semantic-release>`__
   to automatically determine the new version and release to npm. In a
   nutshell:

Commit Message Conventions
~~~~~~~~~~~~~~~~~~~~~~~~~~

-  Commit test files with ``test: ...`` or ``test(scope): ...`` prefix
-  Commit bug fixes with ``fix: ...`` or ``fix(scope): ...`` prefix
-  Commit breaking changes by adding ``BREAKING CHANGE:`` in the commit
   body (not the subject line)
-  Commit changes to ``package.json``, ``.gitignore`` and other meta
   files with ``chore(filenamewithoutext): ...``
-  Commit changes to README files or comments with ``docs: ...``
-  Cody style changes with ``style: standard``

**IMPORTANT**: By submitting a patch, you agree to license your work
under the same license as that used by the project.

Triagers
--------

There is a `defined process <TRIAGING.html>`__ to manage issues, because
this helps to speed up releases and minimizes user pain. Triaging is a
great way to contribute to Hoodie without having to write code. If you
are interested, please `leave a comment
here <https://github.com/hoodiehq/discussion/issues/50>`__ asking to
join the triaging team.

Maintainers
-----------

If you have commit access, please follow this process for merging
patches and cutting new releases.

Reviewing changes
~~~~~~~~~~~~~~~~~

1.  Check that a change is within the scope and philosophy of the
    component.
2.  Check that a change has any necessary tests.
3.  Check that a change has any necessary documentation.
4.  If there is anything you don’t like, leave a comment below the
    respective lines and submit a "Request changes" review. Repeat until
    everything has been addressed.
5.  If you are not sure about something, mention ``@hoodie/maintainers``
    or specific people for help in a comment.
6.  If there is only a tiny change left before you can merge it and you
    think it’s best to fix it yourself, you can directly commit to the
    author’s fork. Leave a comment about it so the author and others
    will know.
7.  Once everything looks good, add an "Approve" review. Don’t forget to
    say something nice 👏🐶💖✨
8.  If the commit messages follow `our
    conventions <@commit-message-conventions>`__

9.  If there is a breaking change, make sure that ``BREAKING CHANGE:``
    with *exactly* that spelling (incl. the ":") is in body of the
    according commit message. This is *very important*, better look
    twice :)
10. Make sure there are ``fix: ...`` or ``feat: ...`` commits depending
    on whether a bug was fixed or a feature was added. **Gotcha:** look
    for spaces before the prefixes of ``fix:`` and ``feat:``, these get
    ignored by semantic-release.
11. Use the "Rebase and merge" button to merge the pull request.
12. Done! You are awesome! Thanks so much for your help 🤗

13. If the commit messages *do not* follow our conventions

14. Use the "squash and merge" button to clean up the commits and merge
    at the same time: ✨🎩
15. Is there a breaking change? Describe it in the commit body. Start
    with *exactly* ``BREAKING CHANGE:`` followed by an empty line. For
    the commit subject:
16. Was a new feature added? Use ``feat: ...`` prefix in the commit
    subject
17. Was a bug fixed? Use ``fix: ...`` in the commit subject

Sometimes there might be a good reason to merge changes locally. The
process looks like this:

Reviewing and merging changes locally
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

::

    git checkout master # or the main branch configured on github
    git pull # get latest changes
    git checkout feature-branch # replace name with your branch
    git rebase master
    git checkout master
    git merge feature-branch # replace name with your branch
    git push

When merging PRs from forked repositories, we recommend you install the
`hub <https://github.com/github/hub>`__ command line tools.

This allows you to do:

::

    hub checkout link-to-pull-request

meaning that you will automatically check out the branch for the pull
request, without needing any other steps like setting git upstreams!
:sparkles:
