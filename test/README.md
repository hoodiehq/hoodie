# `./test`

This is the main test directory.

All tests are being loaded by `intex.js`, which is the file that is run, when you run `npm test` in this repository.

We differentiate between two types of tests:

- Unit tests live in `unit/`.
- Integration tests live in `integration/`.

Unit tests concern themselves with individual modules within `hoodie-server`.

Integration tests ensure correct behaviour of a fully running `hoodie-server`, most notably its HTTP API.

When adding new features to `hoodie-server`, it is up to you decide whether your feature needs unit tests, integration tests or both. But it **should** have *some* kind of tests.
