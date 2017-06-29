Documentation Style Guide
=========================

This guide provides style advice for how to write documentation. Please take the time to read this before contributing a large change or update to documentation.

Style helps you and your reader
-------------------------------
Word choice and writing style are a personal choice and we understand documentation can be difficult to write. These recommendations have been designed to help you write clear and beautiful documents.

Testing
-------
The `contributing to docs guide <CONTRIBUTING_DOCS.html>`_ describes the process to follow when updating documentation. This process includes automatic testing. Testing provides you peace of mind that your contribution won't contain typos, broken links or other style whoopsies. Testing is not used to criticise your writing, we really love and appreciate any contributions. Please be patience through the testing and review process. Together we can keep Hoodie documentation awesome!

Style guidance
--------------

Please see the helpful `guide <https://docs.openstack.org/contributor-guide/writing-style/general-writing-guidelines.html>`_ provided by OpenStack documentation. This guide will further explain these key style tips:

- Use standard English
- Write in active voice
- Use the present simple tense
- Write in second person
- Use appropriate mood
- Keep sentences short
- Avoid ambiguous titles
- Be clear and concise
- Write objectively
- Describe the most common use case first
- Do not humanize inanimate objects
- Write positively
- Avoid prepositions at the end of sentences
- Do no overuse this, that, these, and it
- Do not split infinitives
- Avoid personification
- Eliminate needless politeness
- Use consistent terminology
- Use spelling and grammar checking tools


Automatic testing
------------------

The current tests we run on pull requests using Travis Continuous Integration (CI) service:

+----------------------------------------------------------------+------------+-----------+------------+
| Style guide                                                    | Tested     | Test type | Package    |
+================================================================+============+===========+============+
| Keep sentences short, concise and readable                     |     ✔      | Warning   |`rousseau`_ |
+----------------------------------------------------------------+------------+-----------+------------+
| Write in the `active`_ voice                                   |     ✔      | Warning   |`rousseau`_ |
+----------------------------------------------------------------+------------+-----------+------------+
| Avoid "Lexical illusion's" – cases where a word is repeated    |     ✔      | Warning   |`rousseau`_ |
+----------------------------------------------------------------+------------+-----------+------------+
| Check for 'So' at the beginning of sentences                   |     ✔      | Warning   |`rousseau`_ |
+----------------------------------------------------------------+------------+-----------+------------+
| Avoid adverbs that can weaken meaning: really, very,           |            |           |            |
| extremely, etc                                                 |     ✔      | Warning   |`rousseau`_ |
+----------------------------------------------------------------+------------+-----------+------------+
| Use the most simple expressions                                |     ✔      | Warning   |`rousseau`_ |
+----------------------------------------------------------------+------------+-----------+------------+
| Avoid using "weasel words": quite, several, mostly etc         |     ✔      | Warning   |`rousseau`_ |
+----------------------------------------------------------------+------------+-----------+------------+
| Leave no space between a sentence and its                      |            |           |            |
| ending punctuation                                             |     ✔      | Warning   |`rousseau`_ |
+----------------------------------------------------------------+------------+-----------+------------+
| Spell checker - we test for common misspelling but please      |            |           |            |
| check technical words                                          |     ✔      | Error     |`common`_   |
+----------------------------------------------------------------+------------+-----------+------------+
| Broken or dead links (excluding redirects)                     |     ✔      | Error     |`awesome`_  |
+----------------------------------------------------------------+------------+-----------+------------+

  .. _active: https://docs.openstack.org/contributor-guide/writing-style/general-writing-guidelines.html#write-in-active-voice
  .. _rousseau: https://github.com/GitbookIO/rousseau
  .. _common: https://github.com/io-monad/textlint-rule-common-misspellings
  .. _awesome: https://github.com/dkhamsing/awesome_bot

- Remember, follow the `Code of Conduct <http://hood.ie/code-of-conduct/>`__

Bonus style points
~~~~~~~~~~~~~~~~~~
- Be fun and friendly as long as it does not distract or confuse the reader
- Include videos or gifs to demostrated a feature
- You can use Humour but remember the reader is looking for an *answer* not a comedy sketch
- Cultural references and puns don't always translate - keep jokes light
- Remember English is not the first language for many readers - keep language simple where possible

.. _second: https://docs.openstack.org/contributor-guide/writing-style/general-writing-guidelines.html#write-in-second-person

Further reading
---------------
This guide is influenced by the `Open Stack <https://docs.openstack.org/contributor-guide/writing-style/general-writing-guidelines.html#use-standard-english>`_ style guide.
