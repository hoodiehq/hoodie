# Module Structure

This is the main test directory. We differentiate between two types of tests:

- [Unit test](unit) concern themselves with individual modules on the Client and server-side.
  - When looking for info on client-tests, look at unit/client/client-test.js. In here you will find:
    - Testing the initialization of a client.
      - This function ensures that a client can be initialized and be able to communicate with a server.
    - Ensure that the whenever a client is being registerd, the next function is called.
      - Ensures that the server can register a new client by calling the next function.
    - Can build the target path from options.data.
      - Builds a path on the system to hold options that are to be used for the data in the server.
    - Builds target path from folder ".hoodie" by default.
      - Ensures that the client-side machin bilds a hidden .hoodie folder when first connecting.
  
- [Integration tests](integration) ensure correct behaviour of a fully running `hoodie`, most notably its HTTP API.
  - Integration tests for server-test.js
    - Instantiate instance of a server.
    - Ensure that the object passed in of options does not get modified, for specifying the Db URL.
    - Make sure that an error gets passed back to the callback.
    - Ensure that the application is at root with a valid server module.
    
If you are adding new features to `hoodie` you should provide test cases for the new feature. Depending on the feature, it's either best to write unit tests or integration tests and sometimes even both. The more tests we have, the more confidently we can release future versions of `hoodie`.
