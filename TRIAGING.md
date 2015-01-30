# Triage new issues/PRs on github

This document illustrates the steps the Hoodie community is taking to triage issues. The labels are used later on for [planning releases](#assigning-work). If you want to help by sorting issues please [leave a comment here](https://github.com/hoodiehq/discussion/issues/50) asking to join the triaging team.

## Triaging Process

This process based on the idea of minimizing user pain
[from this blog post](http://www.lostgarden.com/2008/05/improving-bug-triage-with-user-pain.html).

1. Open the list of [non triaged issues](https://github.com/organizations/hoodiehq/dashboard/issues/repos?direction=desc&milestone=none&page=1&sort=created&state=open)
    * Sort by submit date, with the newest issues first
    * You don't have to do issues in order; feel free to pick and choose issues as you please.
    * You can triage older issues as well
    * Triage to your heart's content
1. Assign yourself: Pick an issue that is not assigned to anyone and assign it to you

1. Understandable? - verify if the description of the request is clear.
    * If not, [close it][] according to the instructions below and go to the last step.
1. Duplicate?
    * If you've seen this issue before [close it][], and go to the last step.
    * Check if there are comments that link to a dupe. If so verify that this is indeed a dupe, [close it][], and go to the last step.
1. Bugs:
    * Label `Type: Bug`
    * Reproducible? - Steps to reproduce the bug are clear. If they are not, ask for a clarification. If there's no reply after a week, [close it][].
    * Reproducible on master?

1. Non bugs:
    * Label `Type: Feature`, `Type: Chore`, or `Type: Perf`
    * Belongs in core? – Often new features should be implemented as a plugin rather than an addition to the core.
      If this doesn't belong, [close it][], and go to the last step.
    * Label `needs: breaking change` - if needed
    * Label `needs: public api` - if the issue requires introduction of a new public API
1. Label `frequency: *` – How often does this issue come up? How many developers does this affect?
    * low - obscure issue affecting a handful of developers
    * moderate - impacts a common usage pattern
    * high - impacts most or all Hoodie apps
1. Label `severity: *` - How bad is the issue?
    * regression
    * memory leak
    * broken expected use - it's hard or impossible for a developer using Hoodie to accomplish something that Hoodie should be able to do
    * confusing - unexpected or inconsistent behavior; hard-to-debug
    * inconvenience - causes ugly/boilerplate code in apps
1. Label `starter` - These issues are good targets for PRs from the open source community. Apply to issues where the problem and solution are well defined in the comments, and it's not too complex.

1. Label `milestone: *` – Assign a milestone:
   * Backlog - triaged fixes and features, should be the default choice 
   * x.y.z - e.g. 0.3.0


1. Unassign yourself from the issue

## Closing an Issue or PR

We're grateful to anyone who takes the time to submit an issue, even if we ultimately decide not to act on it.
Be kind and respectful as you close issues. Be sure to follow the [code of conduct][].

1. Always thank the person who submitted it.
1. If it's a duplicate, link to the older or more descriptive issue that supersedes the one you are closing.
1. Let them know if there's some way for them to follow-up.
    * When the issue is unclear or reproducible, note that you'll reopen it if they can clarify or provide a better example. Mention [plunker] or [fiddle] for examples. Watch your notifications and follow-up if they do provide clarification. :)
    * If appropriate, suggest implementing a feature as a third-party module.

If in doubt, ask a core team member what to do.

**Example:**

> Thanks for submitting this issue!
> Unfortunately, we don't think this functionality belongs in core.
> The good news is that you could easily implement this as a plugin and publish it to npm with the `hoodie-plugin` keyword.


## Assigning Work

These criteria are then used to calculate a "user pain" score.
Work is assigned weekly to core team members starting with the highest pain, descending down to the lowest.

```
pain = severity × frequency
```

**severity:**

- regression (5)
- memory leak (4)
- broken expected use (3)
- confusing (2)
- inconvenience (1)

**frequency:**

- low (1)
- moderate (2)
- high (3)

**Note:** Regressions and memory leaks should almost always be set to `frequency: high`.

[close it]: #closing-an-issue-or-pr
[code of conduct]: http://hood.ie/code-of-conduct.html
[plunker]: http://plnkr.co/
[fiddle]: http://jsfiddle.net/
