# Contributing to Hoodie

Please take a moment to review this document in order to make the contribution
process easy and effective for everyone involved.

Following these guidelines helps to communicate that you respect the time of
the developers managing and developing this open source project. In return,
they should reciprocate that respect in addressing your issue, assessing
changes, and helping you finalize your pull requests.

As for everything else in the project, the contributions to Hoodie are governed
by our [Code of Conduct](http://hood.ie/code-of-conduct/).

## Using the issue tracker

First things first: **Do NOT report security vulnerablities in public issues!**
Please disclose responsibly by letting [the Hoodie
team](mailto:team@thehoodiefirm.com?subject=Security) know upfront. We will
assess the issue as soon as possible on a best-effort basis and will give you
an estimate for when we have a fix and release available for an eventual public
disclosure.

The issue tracker is the preferred channel for [bug reports](#bugs),
[features requests](#features) and [submitting pull
requests](#pull-requests), but please respect the following restrictions:

* Please **do not** use the issue tracker for personal support requests. Use
  the [Hoodie Chat](http://hood.ie/chat/).

* Please **do not** derail or troll issues. Keep the discussion on topic and
  respect the opinions of others.


## Bug reports

A bug is a _demonstrable problem_ that is caused by the code in the repository.
Good bug reports are extremely helpful - thank you!

Guidelines for bug reports:

1. **Use the GitHub issue search** &mdash; check if the issue has already been
   reported.

2. **Check if the issue has been fixed** &mdash; try to reproduce it using the
   latest `master` or `next` branch in the repository.

3. **Isolate the problem** &mdash; ideally create a reduced test case.

A good bug report shouldn't leave others needing to chase you up for more
information. Please try to be as detailed as possible in your report. What is
your environment? What steps will reproduce the issue? What OS experiences the
problem? What would you expect to be the outcome? All these details will help
people to fix any potential bugs.

Example:

> Short and descriptive example bug report title
>
> A summary of the issue and the browser/OS environment in which it occurs. If
> suitable, include the steps required to reproduce the bug.
>
> 1. This is the first step
> 2. This is the second step
> 3. Further steps, etc.
>
> `<url>` - a link to the reduced test case
>
> Any other information you want to share that is relevant to the issue being
> reported. This might include the lines of code that you have identified as
> causing the bug, and potential solutions (and your opinions on their
> merits).


## Feature requests

Feature requests are welcome. But take a moment to find out whether your idea
fits with the scope and aims of the project. It's up to *you* to make a strong
case to convince the project's developers of the merits of this feature. Please
provide as much detail and context as possible.


## Pull requests

Good pull requests - patches, improvements, new features - are a fantastic
help. They should remain focused in scope and avoid containing unrelated
commits.

**Please ask first** before embarking on any significant pull request (e.g.
implementing features, refactoring code), otherwise you risk spending a lot of
time working on something that the project's developers might not want to merge
into the project.

Please adhere to our [JavaScript Coding Style](CODING_STYLE.md) and any other
requirements (such as test coverage).

Adhering to the following this process is the best way to get your work
included in the project:

1. [Fork](http://help.github.com/fork-a-repo/) the project, clone your fork,
   and configure the remotes:

   ```bash
   # Clone your fork of the repo into the current directory
   git clone https://github.com/<your-username>/<repo-name>
   # Navigate to the newly cloned directory
   cd <repo-name>
   # Assign the original repo to a remote called "upstream"
   git remote add upstream https://github.com/hoodiehq/<repo-name>
   ```

2. If you cloned a while ago, get the latest changes from upstream:

   ```bash
   git checkout master
   git pull upstream master
   ```

3. Create a new topic branch (off the main project development branch) to
   contain your feature, change, or fix:

   ```bash
   git checkout -b <topic-branch-name>
   ```

4. Make sure to update, or add to the tests when appropriate. Patches and
   features will not be accepted without tests. Run `npm test` to check that
   all tests pass after you've made changes.

5. Commit your changes in logical chunks. Please adhere to these [git commit
   message guidelines](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/)
   or your code can't be merged into the main project. Use Git's
   [interactive rebase](https://help.github.com/articles/interactive-rebase)
   feature to tidy up your commits before making them public.

6. Locally merge (or rebase) the upstream development branch into your topic
   branch:

   ```bash
   git pull [--rebase] upstream master
   ```

7. Push your topic branch up to your fork:

   ```bash
   git push origin <topic-branch-name>
   ```

8. [Open a Pull Request](https://help.github.com/articles/using-pull-requests/)
    with a clear title and description.

9. If you are asked to amend your changes before they can be merged in, please
   use `git commit --amend` (or rebasing for multi-commit Pull Requests) and
   force push to your remote feature branch. You may also be asked to squash
   commits to follow our commit conventions, as they are used by
   [semantic-release](https://github.com/semantic-release/semantic-release) to
   automatically determine the new version and release to npm. In a nutshell:

   #### Commit Message Conventions

   - Commit test files with `test: ...` or `test(scope): ...` prefix
   - Commit bug fixes with `fix: ...` or `fix(scope): ...` prefix
   - Commit breaking changes by adding `BREAKING CHANGE: ` in the commit body
     (not the subject line)
   - Commit changes to `package.json`, `.gitignore` and other meta files with
     `chore(filenamewithoutext): ...`
   - Commit changes to README files or comments with `docs: ...`

   We follow [Angular’s Commit Message Conventions](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit).
   But don’t worry about it, we are happy to help :)


**IMPORTANT**: By submitting a patch, you agree to license your work under the
same license as that used by the project.

## Triagers

There is a [defined process](TRIAGING.md) to manage issues, because this helps
to speed up releases and minimizes user pain. Triaging is a great way to
contribute to Hoodie without having to write code. If you are interested,
please [leave a comment here](https://github.com/hoodiehq/discussion/issues/50)
asking to join the triaging team.

## Maintainers

If you have commit access, please follow this process for merging patches and cutting new releases.

### Reviewing changes

1. Check that a change is within the scope and philosophy of the component.
2. Check that a change has any necessary tests and a well formed, descriptive commit message.
3. Checkout the change and test it locally.
4. If the change is good, and authored by someone who cannot commit to
   `master`, please try to avoid using GitHub's merge button. Apply the change
   to `master` locally (feel free to amend any minor problems in the author's
   original commit if necessary).
5. If the change is good, and authored by another maintainer/collaborator, give
   them a "+1" comment and let them handle the merge.

The process for merging looks like this:

```
git checkout master # or the main branch configured on github
git pull # get latest changes
git checkout feature-branch # replace name with your branch
git rebase master
git checkout master
git merge feature-branch # replace name with your branch
git push
```

When merging PRs from forked repositories, we reccomend you install the
[hub](https://github.com/github/hub) command line tools.

This allows you to do:

```
hub checkout link-to-pull-request
```

meaning that you will automatically check out the branch for the pull request,
without needing any other steps like setting git upstreams! :sparkles:

### Submitting changes

1. All non-trivial changes should be put up for review using GitHub Pull
   Requests.
2. Your change should not be merged into `master` (or another feature branch),
   without at least one "+1" comment from another maintainer/collaborator
   on the project.
3. Try to avoid using GitHub's merge button. Locally rebase your change onto
   `master` and then push to GitHub.
4. Once a feature branch has been merged into its target branch, please delete
   the feature branch from the remote repository.
