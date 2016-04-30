# Module Structure

This is the main test directory. We differentiate between two types of tests:

- [Unit test](unit) concern themselves with individual modules
- [Integration tests](integration) ensure correct behaviour of a fully running `hoodie`, most notably its HTTP API.

If you are adding new features to `hoodie` you should provide test cases for the new feature. Depending on the feature, it's either best to write unit tests or integration tests and sometimes even both. The more tests we have, the more confidently we can release future versions of `hoodie`.
