# Module Structure

This is the main test directory. We differentiate between two types of tests:

- [Unit test](unit) concern themselves with individual modules
- [Integration tests](integration) ensure correct behaviour of a fully running `hoodie`, most notably its HTTP API.

When adding new features it is up to you decide whether your feature needs unit tests, integration tests or both. But it **should** have *some* kind of tests.
