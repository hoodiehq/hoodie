{ self, fetchurl, fetchgit ? null, lib }:

{
  by-spec."Base64"."~0.2.0" =
    self.by-version."Base64"."0.2.1";
  by-version."Base64"."0.2.1" = self.buildNodePackage {
    name = "Base64-0.2.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/Base64/-/Base64-0.2.1.tgz";
      name = "Base64-0.2.1.tgz";
      sha1 = "ba3a4230708e186705065e66babdd4c35cf60028";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."JSONStream"."~0.6.4" =
    self.by-version."JSONStream"."0.6.4";
  by-version."JSONStream"."0.6.4" = self.buildNodePackage {
    name = "JSONStream-0.6.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/JSONStream/-/JSONStream-0.6.4.tgz";
      name = "JSONStream-0.6.4.tgz";
      sha1 = "4b2c8063f8f512787b2375f7ee9db69208fa2dcb";
    };
    deps = {
      "jsonparse-0.0.5" = self.by-version."jsonparse"."0.0.5";
      "through-2.2.7" = self.by-version."through"."2.2.7";
    };
    peerDependencies = [];
  };
  by-spec."JSONStream"."~0.7.1" =
    self.by-version."JSONStream"."0.7.4";
  by-version."JSONStream"."0.7.4" = self.buildNodePackage {
    name = "JSONStream-0.7.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/JSONStream/-/JSONStream-0.7.4.tgz";
      name = "JSONStream-0.7.4.tgz";
      sha1 = "734290e41511eea7c2cfe151fbf9a563a97b9786";
    };
    deps = {
      "jsonparse-0.0.5" = self.by-version."jsonparse"."0.0.5";
      "through-2.3.6" = self.by-version."through"."2.3.6";
    };
    peerDependencies = [];
  };
  by-spec."JSONStream"."~0.8.3" =
    self.by-version."JSONStream"."0.8.4";
  by-version."JSONStream"."0.8.4" = self.buildNodePackage {
    name = "JSONStream-0.8.4";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/JSONStream/-/JSONStream-0.8.4.tgz";
      name = "JSONStream-0.8.4.tgz";
      sha1 = "91657dfe6ff857483066132b4618b62e8f4887bd";
    };
    deps = {
      "jsonparse-0.0.5" = self.by-version."jsonparse"."0.0.5";
      "through-2.3.6" = self.by-version."through"."2.3.6";
    };
    peerDependencies = [];
  };
  by-spec."abbrev"."1" =
    self.by-version."abbrev"."1.0.5";
  by-version."abbrev"."1.0.5" = self.buildNodePackage {
    name = "abbrev-1.0.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/abbrev/-/abbrev-1.0.5.tgz";
      name = "abbrev-1.0.5.tgz";
      sha1 = "5d8257bd9ebe435e698b2fa431afde4fe7b10b03";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."abbrev"."1.0.x" =
    self.by-version."abbrev"."1.0.5";
  by-spec."abbrev"."~1.0.5" =
    self.by-version."abbrev"."1.0.5";
  by-spec."accepts"."~1.1.0" =
    self.by-version."accepts"."1.1.4";
  by-version."accepts"."1.1.4" = self.buildNodePackage {
    name = "accepts-1.1.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/accepts/-/accepts-1.1.4.tgz";
      name = "accepts-1.1.4.tgz";
      sha1 = "d71c96f7d41d0feda2c38cd14e8a27c04158df4a";
    };
    deps = {
      "mime-types-2.0.8" = self.by-version."mime-types"."2.0.8";
      "negotiator-0.4.9" = self.by-version."negotiator"."0.4.9";
    };
    peerDependencies = [];
  };
  by-spec."accepts"."~1.1.2" =
    self.by-version."accepts"."1.1.4";
  by-spec."accepts"."~1.1.3" =
    self.by-version."accepts"."1.1.4";
  by-spec."acorn"."~0.9.0" =
    self.by-version."acorn"."0.9.0";
  by-version."acorn"."0.9.0" = self.buildNodePackage {
    name = "acorn-0.9.0";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/acorn/-/acorn-0.9.0.tgz";
      name = "acorn-0.9.0.tgz";
      sha1 = "67728e0acad6cc61dfb901c121837694db5b926b";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."active-x-obfuscator"."0.0.1" =
    self.by-version."active-x-obfuscator"."0.0.1";
  by-version."active-x-obfuscator"."0.0.1" = self.buildNodePackage {
    name = "active-x-obfuscator-0.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/active-x-obfuscator/-/active-x-obfuscator-0.0.1.tgz";
      name = "active-x-obfuscator-0.0.1.tgz";
      sha1 = "089b89b37145ff1d9ec74af6530be5526cae1f1a";
    };
    deps = {
      "zeparser-0.0.5" = self.by-version."zeparser"."0.0.5";
    };
    peerDependencies = [];
  };
  by-spec."adm-zip"."0.4.4" =
    self.by-version."adm-zip"."0.4.4";
  by-version."adm-zip"."0.4.4" = self.buildNodePackage {
    name = "adm-zip-0.4.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/adm-zip/-/adm-zip-0.4.4.tgz";
      name = "adm-zip-0.4.4.tgz";
      sha1 = "a61ed5ae6905c3aea58b3a657d25033091052736";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."adm-zip"."^0.4.3" =
    self.by-version."adm-zip"."0.4.4";
  by-spec."amdefine".">=0.0.4" =
    self.by-version."amdefine"."0.1.0";
  by-version."amdefine"."0.1.0" = self.buildNodePackage {
    name = "amdefine-0.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/amdefine/-/amdefine-0.1.0.tgz";
      name = "amdefine-0.1.0.tgz";
      sha1 = "3ca9735cf1dde0edf7a4bf6641709c8024f9b227";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."animals"."^0.0.3" =
    self.by-version."animals"."0.0.3";
  by-version."animals"."0.0.3" = self.buildNodePackage {
    name = "animals-0.0.3";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/animals/-/animals-0.0.3.tgz";
      name = "animals-0.0.3.tgz";
      sha1 = "f59982705ae07b803ad7230c37d1e7b2de99af8d";
    };
    deps = {
      "minimist-0.2.0" = self.by-version."minimist"."0.2.0";
      "unique-random-0.1.1" = self.by-version."unique-random"."0.1.1";
    };
    peerDependencies = [];
  };
  by-spec."ansi"."^0.3.0" =
    self.by-version."ansi"."0.3.0";
  by-version."ansi"."0.3.0" = self.buildNodePackage {
    name = "ansi-0.3.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/ansi/-/ansi-0.3.0.tgz";
      name = "ansi-0.3.0.tgz";
      sha1 = "74b2f1f187c8553c7f95015bcb76009fb43d38e0";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."ansi"."~0.3.0" =
    self.by-version."ansi"."0.3.0";
  by-spec."ansi-regex"."^0.2.0" =
    self.by-version."ansi-regex"."0.2.1";
  by-version."ansi-regex"."0.2.1" = self.buildNodePackage {
    name = "ansi-regex-0.2.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/ansi-regex/-/ansi-regex-0.2.1.tgz";
      name = "ansi-regex-0.2.1.tgz";
      sha1 = "0d8e946967a3d8143f93e24e298525fc1b2235f9";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."ansi-regex"."^0.2.1" =
    self.by-version."ansi-regex"."0.2.1";
  by-spec."ansi-regex"."^1.0.0" =
    self.by-version."ansi-regex"."1.1.0";
  by-version."ansi-regex"."1.1.0" = self.buildNodePackage {
    name = "ansi-regex-1.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/ansi-regex/-/ansi-regex-1.1.0.tgz";
      name = "ansi-regex-1.1.0.tgz";
      sha1 = "67792c5d6ad05c792d6cd6057ac8f5e69ebf4357";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."ansi-styles"."^1.1.0" =
    self.by-version."ansi-styles"."1.1.0";
  by-version."ansi-styles"."1.1.0" = self.buildNodePackage {
    name = "ansi-styles-1.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/ansi-styles/-/ansi-styles-1.1.0.tgz";
      name = "ansi-styles-1.1.0.tgz";
      sha1 = "eaecbf66cd706882760b2f4691582b8f55d7a7de";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."ansi-styles"."~1.0.0" =
    self.by-version."ansi-styles"."1.0.0";
  by-version."ansi-styles"."1.0.0" = self.buildNodePackage {
    name = "ansi-styles-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/ansi-styles/-/ansi-styles-1.0.0.tgz";
      name = "ansi-styles-1.0.0.tgz";
      sha1 = "cb102df1c56f5123eab8b67cd7b98027a0279178";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."ansicolors"."~0.3.2" =
    self.by-version."ansicolors"."0.3.2";
  by-version."ansicolors"."0.3.2" = self.buildNodePackage {
    name = "ansicolors-0.3.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/ansicolors/-/ansicolors-0.3.2.tgz";
      name = "ansicolors-0.3.2.tgz";
      sha1 = "665597de86a9ffe3aa9bfbe6cae5c6ea426b4979";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."ansistyles"."~0.1.3" =
    self.by-version."ansistyles"."0.1.3";
  by-version."ansistyles"."0.1.3" = self.buildNodePackage {
    name = "ansistyles-0.1.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/ansistyles/-/ansistyles-0.1.3.tgz";
      name = "ansistyles-0.1.3.tgz";
      sha1 = "5de60415bda071bb37127854c864f41b23254539";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."anymatch"."^1.1.0" =
    self.by-version."anymatch"."1.1.0";
  by-version."anymatch"."1.1.0" = self.buildNodePackage {
    name = "anymatch-1.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/anymatch/-/anymatch-1.1.0.tgz";
      name = "anymatch-1.1.0.tgz";
      sha1 = "ebc63275cee368a96b300f31623bf9f228d428e3";
    };
    deps = {
      "minimatch-1.0.0" = self.by-version."minimatch"."1.0.0";
    };
    peerDependencies = [];
  };
  by-spec."archy"."~1.0.0" =
    self.by-version."archy"."1.0.0";
  by-version."archy"."1.0.0" = self.buildNodePackage {
    name = "archy-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/archy/-/archy-1.0.0.tgz";
      name = "archy-1.0.0.tgz";
      sha1 = "f9c8c13757cc1dd7bc379ac77b2c62a5c2868c40";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."are-we-there-yet"."~1.0.0" =
    self.by-version."are-we-there-yet"."1.0.2";
  by-version."are-we-there-yet"."1.0.2" = self.buildNodePackage {
    name = "are-we-there-yet-1.0.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/are-we-there-yet/-/are-we-there-yet-1.0.2.tgz";
      name = "are-we-there-yet-1.0.2.tgz";
      sha1 = "b518f4a6ec85862b57ce82df495bbabc76cb5246";
    };
    deps = {
      "delegates-0.1.0" = self.by-version."delegates"."0.1.0";
    };
    peerDependencies = [];
  };
  by-spec."argparse"."~ 0.1.11" =
    self.by-version."argparse"."0.1.16";
  by-version."argparse"."0.1.16" = self.buildNodePackage {
    name = "argparse-0.1.16";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/argparse/-/argparse-0.1.16.tgz";
      name = "argparse-0.1.16.tgz";
      sha1 = "cfd01e0fbba3d6caed049fbd758d40f65196f57c";
    };
    deps = {
      "underscore-1.7.0" = self.by-version."underscore"."1.7.0";
      "underscore.string-2.4.0" = self.by-version."underscore.string"."2.4.0";
    };
    peerDependencies = [];
  };
  by-spec."array-differ"."^0.1.0" =
    self.by-version."array-differ"."0.1.0";
  by-version."array-differ"."0.1.0" = self.buildNodePackage {
    name = "array-differ-0.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/array-differ/-/array-differ-0.1.0.tgz";
      name = "array-differ-0.1.0.tgz";
      sha1 = "12e2c9b706bed47c8b483b57e487473fb0861f3a";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."array-union"."^0.1.0" =
    self.by-version."array-union"."0.1.0";
  by-version."array-union"."0.1.0" = self.buildNodePackage {
    name = "array-union-0.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/array-union/-/array-union-0.1.0.tgz";
      name = "array-union-0.1.0.tgz";
      sha1 = "ede98088330665e699e1ebf0227cbc6034e627db";
    };
    deps = {
      "array-uniq-0.1.1" = self.by-version."array-uniq"."0.1.1";
    };
    peerDependencies = [];
  };
  by-spec."array-uniq"."^0.1.0" =
    self.by-version."array-uniq"."0.1.1";
  by-version."array-uniq"."0.1.1" = self.buildNodePackage {
    name = "array-uniq-0.1.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/array-uniq/-/array-uniq-0.1.1.tgz";
      name = "array-uniq-0.1.1.tgz";
      sha1 = "5861f3ed4e4bb6175597a4e078e8aa78ebe958c7";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."asap"."^1.0.0" =
    self.by-version."asap"."1.0.0";
  by-version."asap"."1.0.0" = self.buildNodePackage {
    name = "asap-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/asap/-/asap-1.0.0.tgz";
      name = "asap-1.0.0.tgz";
      sha1 = "b2a45da5fdfa20b0496fc3768cc27c12fa916a7d";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."asn1"."0.1.11" =
    self.by-version."asn1"."0.1.11";
  by-version."asn1"."0.1.11" = self.buildNodePackage {
    name = "asn1-0.1.11";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/asn1/-/asn1-0.1.11.tgz";
      name = "asn1-0.1.11.tgz";
      sha1 = "559be18376d08a4ec4dbe80877d27818639b2df7";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."assert"."~1.1.0" =
    self.by-version."assert"."1.1.2";
  by-version."assert"."1.1.2" = self.buildNodePackage {
    name = "assert-1.1.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/assert/-/assert-1.1.2.tgz";
      name = "assert-1.1.2.tgz";
      sha1 = "adaa04c46bb58c6dd1f294da3eb26e6228eb6e44";
    };
    deps = {
      "util-0.10.3" = self.by-version."util"."0.10.3";
    };
    peerDependencies = [];
  };
  by-spec."assert-plus"."^0.1.5" =
    self.by-version."assert-plus"."0.1.5";
  by-version."assert-plus"."0.1.5" = self.buildNodePackage {
    name = "assert-plus-0.1.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/assert-plus/-/assert-plus-0.1.5.tgz";
      name = "assert-plus-0.1.5.tgz";
      sha1 = "ee74009413002d84cec7219c6ac811812e723160";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."assertion-error"."1.0.0" =
    self.by-version."assertion-error"."1.0.0";
  by-version."assertion-error"."1.0.0" = self.buildNodePackage {
    name = "assertion-error-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/assertion-error/-/assertion-error-1.0.0.tgz";
      name = "assertion-error-1.0.0.tgz";
      sha1 = "c7f85438fdd466bc7ca16ab90c81513797a5d23b";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."astw"."~1.1.0" =
    self.by-version."astw"."1.1.0";
  by-version."astw"."1.1.0" = self.buildNodePackage {
    name = "astw-1.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/astw/-/astw-1.1.0.tgz";
      name = "astw-1.1.0.tgz";
      sha1 = "f394778ab01c4ea467e64a614ed896ace0321a34";
    };
    deps = {
      "esprima-fb-3001.1.0-dev-harmony-fb" = self.by-version."esprima-fb"."3001.1.0-dev-harmony-fb";
    };
    peerDependencies = [];
  };
  by-spec."async"."0.2.x" =
    self.by-version."async"."0.2.10";
  by-version."async"."0.2.10" = self.buildNodePackage {
    name = "async-0.2.10";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/async/-/async-0.2.10.tgz";
      name = "async-0.2.10.tgz";
      sha1 = "b6bbe0b0674b9d719708ca38de8c237cb526c3d1";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."async"."0.9.x" =
    self.by-version."async"."0.9.0";
  by-version."async"."0.9.0" = self.buildNodePackage {
    name = "async-0.9.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/async/-/async-0.9.0.tgz";
      name = "async-0.9.0.tgz";
      sha1 = "ac3613b1da9bed1b47510bb4651b8931e47146c7";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."async"."^0.7" =
    self.by-version."async"."0.7.0";
  by-version."async"."0.7.0" = self.buildNodePackage {
    name = "async-0.7.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/async/-/async-0.7.0.tgz";
      name = "async-0.7.0.tgz";
      sha1 = "4429e0e62f5de0a54f37458c49f0b897eb52ada5";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."async"."^0.9.0" =
    self.by-version."async"."0.9.0";
  by-spec."async"."~0.1.22" =
    self.by-version."async"."0.1.22";
  by-version."async"."0.1.22" = self.buildNodePackage {
    name = "async-0.1.22";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/async/-/async-0.1.22.tgz";
      name = "async-0.1.22.tgz";
      sha1 = "0fc1aaa088a0e3ef0ebe2d8831bab0dcf8845061";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."async"."~0.2.0" =
    self.by-version."async"."0.2.10";
  by-spec."async"."~0.2.6" =
    self.by-version."async"."0.2.10";
  by-spec."async"."~0.2.9" =
    self.by-version."async"."0.2.10";
  by-spec."async"."~0.8.0" =
    self.by-version."async"."0.8.0";
  by-version."async"."0.8.0" = self.buildNodePackage {
    name = "async-0.8.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/async/-/async-0.8.0.tgz";
      name = "async-0.8.0.tgz";
      sha1 = "ee65ec77298c2ff1456bc4418a052d0f06435112";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."async"."~0.9.0" =
    self.by-version."async"."0.9.0";
  by-spec."async-each"."^0.1.5" =
    self.by-version."async-each"."0.1.6";
  by-version."async-each"."0.1.6" = self.buildNodePackage {
    name = "async-each-0.1.6";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/async-each/-/async-each-0.1.6.tgz";
      name = "async-each-0.1.6.tgz";
      sha1 = "b67e99edcddf96541e44af56290cd7d5c6e70439";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."async-some"."~1.0.1" =
    self.by-version."async-some"."1.0.1";
  by-version."async-some"."1.0.1" = self.buildNodePackage {
    name = "async-some-1.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/async-some/-/async-some-1.0.1.tgz";
      name = "async-some-1.0.1.tgz";
      sha1 = "8b54f08d46f0f9babc72ea9d646c245d23a4d9e5";
    };
    deps = {
      "dezalgo-1.0.1" = self.by-version."dezalgo"."1.0.1";
    };
    peerDependencies = [];
  };
  by-spec."aws-sign2"."~0.5.0" =
    self.by-version."aws-sign2"."0.5.0";
  by-version."aws-sign2"."0.5.0" = self.buildNodePackage {
    name = "aws-sign2-0.5.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/aws-sign2/-/aws-sign2-0.5.0.tgz";
      name = "aws-sign2-0.5.0.tgz";
      sha1 = "c57103f7a17fc037f02d7c2e64b602ea223f7d63";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."balanced-match"."^0.2.0" =
    self.by-version."balanced-match"."0.2.0";
  by-version."balanced-match"."0.2.0" = self.buildNodePackage {
    name = "balanced-match-0.2.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/balanced-match/-/balanced-match-0.2.0.tgz";
      name = "balanced-match-0.2.0.tgz";
      sha1 = "38f6730c03aab6d5edbb52bd934885e756d71674";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."base64-js"."0.0.7" =
    self.by-version."base64-js"."0.0.7";
  by-version."base64-js"."0.0.7" = self.buildNodePackage {
    name = "base64-js-0.0.7";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/base64-js/-/base64-js-0.0.7.tgz";
      name = "base64-js-0.0.7.tgz";
      sha1 = "54400dc91d696cec32a8a47902f971522fee8f48";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."base64-js"."~0.0.4" =
    self.by-version."base64-js"."0.0.8";
  by-version."base64-js"."0.0.8" = self.buildNodePackage {
    name = "base64-js-0.0.8";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/base64-js/-/base64-js-0.0.8.tgz";
      name = "base64-js-0.0.8.tgz";
      sha1 = "1101e9544f4a76b1bc3b26d452ca96d7a35e7978";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."base64-url"."1" =
    self.by-version."base64-url"."1.2.1";
  by-version."base64-url"."1.2.1" = self.buildNodePackage {
    name = "base64-url-1.2.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/base64-url/-/base64-url-1.2.1.tgz";
      name = "base64-url-1.2.1.tgz";
      sha1 = "199fd661702a0e7b7dcae6e0698bb089c52f6d78";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."base64-url"."1.2.0" =
    self.by-version."base64-url"."1.2.0";
  by-version."base64-url"."1.2.0" = self.buildNodePackage {
    name = "base64-url-1.2.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/base64-url/-/base64-url-1.2.0.tgz";
      name = "base64-url-1.2.0.tgz";
      sha1 = "5b10db3a40720a0d46d33d1954bc95c2c8b97917";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."base64id"."0.1.0" =
    self.by-version."base64id"."0.1.0";
  by-version."base64id"."0.1.0" = self.buildNodePackage {
    name = "base64id-0.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/base64id/-/base64id-0.1.0.tgz";
      name = "base64id-0.1.0.tgz";
      sha1 = "02ce0fdeee0cef4f40080e1e73e834f0b1bfce3f";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."basic-auth"."1.0.0" =
    self.by-version."basic-auth"."1.0.0";
  by-version."basic-auth"."1.0.0" = self.buildNodePackage {
    name = "basic-auth-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/basic-auth/-/basic-auth-1.0.0.tgz";
      name = "basic-auth-1.0.0.tgz";
      sha1 = "111b2d9ff8e4e6d136b8c84ea5e096cb87351637";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."basic-auth-connect"."1.0.0" =
    self.by-version."basic-auth-connect"."1.0.0";
  by-version."basic-auth-connect"."1.0.0" = self.buildNodePackage {
    name = "basic-auth-connect-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/basic-auth-connect/-/basic-auth-connect-1.0.0.tgz";
      name = "basic-auth-connect-1.0.0.tgz";
      sha1 = "fdb0b43962ca7b40456a7c2bb48fe173da2d2122";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."batch"."0.5.1" =
    self.by-version."batch"."0.5.1";
  by-version."batch"."0.5.1" = self.buildNodePackage {
    name = "batch-0.5.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/batch/-/batch-0.5.1.tgz";
      name = "batch-0.5.1.tgz";
      sha1 = "36a4bab594c050fd7b507bca0db30c2d92af4ff2";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."binary-extensions"."^1.0.0" =
    self.by-version."binary-extensions"."1.1.0";
  by-version."binary-extensions"."1.1.0" = self.buildNodePackage {
    name = "binary-extensions-1.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/binary-extensions/-/binary-extensions-1.1.0.tgz";
      name = "binary-extensions-1.1.0.tgz";
      sha1 = "74f42755e8d719b30440dac309fc02972fe23863";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."bl"."~0.9.0" =
    self.by-version."bl"."0.9.4";
  by-version."bl"."0.9.4" = self.buildNodePackage {
    name = "bl-0.9.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/bl/-/bl-0.9.4.tgz";
      name = "bl-0.9.4.tgz";
      sha1 = "4702ddf72fbe0ecd82787c00c113aea1935ad0e7";
    };
    deps = {
      "readable-stream-1.0.33" = self.by-version."readable-stream"."1.0.33";
    };
    peerDependencies = [];
  };
  by-spec."block-stream"."*" =
    self.by-version."block-stream"."0.0.7";
  by-version."block-stream"."0.0.7" = self.buildNodePackage {
    name = "block-stream-0.0.7";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/block-stream/-/block-stream-0.0.7.tgz";
      name = "block-stream-0.0.7.tgz";
      sha1 = "9088ab5ae1e861f4d81b176b4a8046080703deed";
    };
    deps = {
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
    };
    peerDependencies = [];
  };
  by-spec."block-stream"."0.0.7" =
    self.by-version."block-stream"."0.0.7";
  by-spec."bluebird"."^2.2.2" =
    self.by-version."bluebird"."2.9.6";
  by-version."bluebird"."2.9.6" = self.buildNodePackage {
    name = "bluebird-2.9.6";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/bluebird/-/bluebird-2.9.6.tgz";
      name = "bluebird-2.9.6.tgz";
      sha1 = "1fc3a6b1685267dc121b5ec89b32ce069d81ab7d";
    };
    deps = {
    };
    peerDependencies = [];
  };
  "bluebird" = self.by-version."bluebird"."2.9.6";
  by-spec."body-parser"."~1.8.4" =
    self.by-version."body-parser"."1.8.4";
  by-version."body-parser"."1.8.4" = self.buildNodePackage {
    name = "body-parser-1.8.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/body-parser/-/body-parser-1.8.4.tgz";
      name = "body-parser-1.8.4.tgz";
      sha1 = "d497e04bc13b3f9a8bd8c70bb0cdc16f2e028898";
    };
    deps = {
      "bytes-1.0.0" = self.by-version."bytes"."1.0.0";
      "depd-0.4.5" = self.by-version."depd"."0.4.5";
      "iconv-lite-0.4.4" = self.by-version."iconv-lite"."0.4.4";
      "media-typer-0.3.0" = self.by-version."media-typer"."0.3.0";
      "on-finished-2.1.0" = self.by-version."on-finished"."2.1.0";
      "qs-2.2.4" = self.by-version."qs"."2.2.4";
      "raw-body-1.3.0" = self.by-version."raw-body"."1.3.0";
      "type-is-1.5.6" = self.by-version."type-is"."1.5.6";
    };
    peerDependencies = [];
  };
  by-spec."boom"."0.4.x" =
    self.by-version."boom"."0.4.2";
  by-version."boom"."0.4.2" = self.buildNodePackage {
    name = "boom-0.4.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/boom/-/boom-0.4.2.tgz";
      name = "boom-0.4.2.tgz";
      sha1 = "7a636e9ded4efcefb19cef4947a3c67dfaee911b";
    };
    deps = {
      "hoek-0.9.1" = self.by-version."hoek"."0.9.1";
    };
    peerDependencies = [];
  };
  by-spec."boom"."2.x.x" =
    self.by-version."boom"."2.6.1";
  by-version."boom"."2.6.1" = self.buildNodePackage {
    name = "boom-2.6.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/boom/-/boom-2.6.1.tgz";
      name = "boom-2.6.1.tgz";
      sha1 = "4dc8ef9b6dfad9c43bbbfbe71fa4c21419f22753";
    };
    deps = {
      "hoek-2.11.0" = self.by-version."hoek"."2.11.0";
    };
    peerDependencies = [];
  };
  by-spec."brace-expansion"."^1.0.0" =
    self.by-version."brace-expansion"."1.1.0";
  by-version."brace-expansion"."1.1.0" = self.buildNodePackage {
    name = "brace-expansion-1.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.0.tgz";
      name = "brace-expansion-1.1.0.tgz";
      sha1 = "c9b7d03c03f37bc704be100e522b40db8f6cfcd9";
    };
    deps = {
      "balanced-match-0.2.0" = self.by-version."balanced-match"."0.2.0";
      "concat-map-0.0.1" = self.by-version."concat-map"."0.0.1";
    };
    peerDependencies = [];
  };
  by-spec."browser-pack"."~2.0.0" =
    self.by-version."browser-pack"."2.0.1";
  by-version."browser-pack"."2.0.1" = self.buildNodePackage {
    name = "browser-pack-2.0.1";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/browser-pack/-/browser-pack-2.0.1.tgz";
      name = "browser-pack-2.0.1.tgz";
      sha1 = "5d1c527f56c582677411c4db2a128648ff6bf150";
    };
    deps = {
      "JSONStream-0.6.4" = self.by-version."JSONStream"."0.6.4";
      "through-2.3.6" = self.by-version."through"."2.3.6";
      "combine-source-map-0.3.0" = self.by-version."combine-source-map"."0.3.0";
    };
    peerDependencies = [];
  };
  by-spec."browser-resolve"."^1.3.0" =
    self.by-version."browser-resolve"."1.6.0";
  by-version."browser-resolve"."1.6.0" = self.buildNodePackage {
    name = "browser-resolve-1.6.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/browser-resolve/-/browser-resolve-1.6.0.tgz";
      name = "browser-resolve-1.6.0.tgz";
      sha1 = "3b364916bf1ea32960449e0725a4a5732b2adbd0";
    };
    deps = {
      "resolve-1.0.0" = self.by-version."resolve"."1.0.0";
    };
    peerDependencies = [];
  };
  by-spec."browser-resolve"."~1.2.1" =
    self.by-version."browser-resolve"."1.2.4";
  by-version."browser-resolve"."1.2.4" = self.buildNodePackage {
    name = "browser-resolve-1.2.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/browser-resolve/-/browser-resolve-1.2.4.tgz";
      name = "browser-resolve-1.2.4.tgz";
      sha1 = "59ae7820a82955ecd32f5fb7c468ac21c4723806";
    };
    deps = {
      "resolve-0.6.3" = self.by-version."resolve"."0.6.3";
    };
    peerDependencies = [];
  };
  by-spec."browser-resolve"."~1.2.4" =
    self.by-version."browser-resolve"."1.2.4";
  by-spec."browserify"."4.x" =
    self.by-version."browserify"."4.2.3";
  by-version."browserify"."4.2.3" = self.buildNodePackage {
    name = "browserify-4.2.3";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/browserify/-/browserify-4.2.3.tgz";
      name = "browserify-4.2.3.tgz";
      sha1 = "0e0d8f98e6df6a664aa2c055120f3848246ee4d0";
    };
    deps = {
      "JSONStream-0.8.4" = self.by-version."JSONStream"."0.8.4";
      "assert-1.1.2" = self.by-version."assert"."1.1.2";
      "browser-pack-2.0.1" = self.by-version."browser-pack"."2.0.1";
      "browser-resolve-1.6.0" = self.by-version."browser-resolve"."1.6.0";
      "browserify-zlib-0.1.4" = self.by-version."browserify-zlib"."0.1.4";
      "buffer-2.8.2" = self.by-version."buffer"."2.8.2";
      "builtins-0.0.7" = self.by-version."builtins"."0.0.7";
      "commondir-0.0.1" = self.by-version."commondir"."0.0.1";
      "concat-stream-1.4.7" = self.by-version."concat-stream"."1.4.7";
      "console-browserify-1.1.0" = self.by-version."console-browserify"."1.1.0";
      "constants-browserify-0.0.1" = self.by-version."constants-browserify"."0.0.1";
      "crypto-browserify-2.1.10" = self.by-version."crypto-browserify"."2.1.10";
      "deep-equal-0.2.1" = self.by-version."deep-equal"."0.2.1";
      "defined-0.0.0" = self.by-version."defined"."0.0.0";
      "deps-sort-0.1.2" = self.by-version."deps-sort"."0.1.2";
      "derequire-0.8.0" = self.by-version."derequire"."0.8.0";
      "domain-browser-1.1.4" = self.by-version."domain-browser"."1.1.4";
      "duplexer-0.1.1" = self.by-version."duplexer"."0.1.1";
      "events-1.0.2" = self.by-version."events"."1.0.2";
      "glob-3.2.11" = self.by-version."glob"."3.2.11";
      "http-browserify-1.7.0" = self.by-version."http-browserify"."1.7.0";
      "https-browserify-0.0.0" = self.by-version."https-browserify"."0.0.0";
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
      "insert-module-globals-6.0.0" = self.by-version."insert-module-globals"."6.0.0";
      "module-deps-2.1.5" = self.by-version."module-deps"."2.1.5";
      "os-browserify-0.1.2" = self.by-version."os-browserify"."0.1.2";
      "parents-0.0.3" = self.by-version."parents"."0.0.3";
      "path-browserify-0.0.0" = self.by-version."path-browserify"."0.0.0";
      "punycode-1.2.4" = self.by-version."punycode"."1.2.4";
      "querystring-es3-0.2.1" = self.by-version."querystring-es3"."0.2.1";
      "readable-stream-1.1.13" = self.by-version."readable-stream"."1.1.13";
      "resolve-0.7.4" = self.by-version."resolve"."0.7.4";
      "shallow-copy-0.0.1" = self.by-version."shallow-copy"."0.0.1";
      "shell-quote-0.0.1" = self.by-version."shell-quote"."0.0.1";
      "stream-browserify-1.0.0" = self.by-version."stream-browserify"."1.0.0";
      "stream-combiner-0.0.4" = self.by-version."stream-combiner"."0.0.4";
      "string_decoder-0.0.1" = self.by-version."string_decoder"."0.0.1";
      "subarg-0.0.1" = self.by-version."subarg"."0.0.1";
      "syntax-error-1.1.2" = self.by-version."syntax-error"."1.1.2";
      "through2-1.1.1" = self.by-version."through2"."1.1.1";
      "timers-browserify-1.3.0" = self.by-version."timers-browserify"."1.3.0";
      "tty-browserify-0.0.0" = self.by-version."tty-browserify"."0.0.0";
      "umd-2.1.0" = self.by-version."umd"."2.1.0";
      "url-0.10.2" = self.by-version."url"."0.10.2";
      "util-0.10.3" = self.by-version."util"."0.10.3";
      "vm-browserify-0.0.4" = self.by-version."vm-browserify"."0.0.4";
      "xtend-3.0.0" = self.by-version."xtend"."3.0.0";
      "process-0.7.0" = self.by-version."process"."0.7.0";
    };
    peerDependencies = [];
  };
  by-spec."browserify".">=3.21.1 <4.0.0" =
    self.by-version."browserify"."3.46.1";
  by-version."browserify"."3.46.1" = self.buildNodePackage {
    name = "browserify-3.46.1";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/browserify/-/browserify-3.46.1.tgz";
      name = "browserify-3.46.1.tgz";
      sha1 = "2c2e4a7f2f408178e78c223b5b57b37c2185ad8e";
    };
    deps = {
      "JSONStream-0.7.4" = self.by-version."JSONStream"."0.7.4";
      "assert-1.1.2" = self.by-version."assert"."1.1.2";
      "browser-pack-2.0.1" = self.by-version."browser-pack"."2.0.1";
      "browser-resolve-1.2.4" = self.by-version."browser-resolve"."1.2.4";
      "browserify-zlib-0.1.4" = self.by-version."browserify-zlib"."0.1.4";
      "buffer-2.1.13" = self.by-version."buffer"."2.1.13";
      "builtins-0.0.7" = self.by-version."builtins"."0.0.7";
      "commondir-0.0.1" = self.by-version."commondir"."0.0.1";
      "concat-stream-1.4.7" = self.by-version."concat-stream"."1.4.7";
      "console-browserify-1.0.3" = self.by-version."console-browserify"."1.0.3";
      "constants-browserify-0.0.1" = self.by-version."constants-browserify"."0.0.1";
      "crypto-browserify-1.0.9" = self.by-version."crypto-browserify"."1.0.9";
      "deep-equal-0.1.2" = self.by-version."deep-equal"."0.1.2";
      "defined-0.0.0" = self.by-version."defined"."0.0.0";
      "deps-sort-0.1.2" = self.by-version."deps-sort"."0.1.2";
      "derequire-0.8.0" = self.by-version."derequire"."0.8.0";
      "domain-browser-1.1.4" = self.by-version."domain-browser"."1.1.4";
      "duplexer-0.1.1" = self.by-version."duplexer"."0.1.1";
      "events-1.0.2" = self.by-version."events"."1.0.2";
      "glob-3.2.11" = self.by-version."glob"."3.2.11";
      "http-browserify-1.3.2" = self.by-version."http-browserify"."1.3.2";
      "https-browserify-0.0.0" = self.by-version."https-browserify"."0.0.0";
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
      "insert-module-globals-6.0.0" = self.by-version."insert-module-globals"."6.0.0";
      "module-deps-2.0.6" = self.by-version."module-deps"."2.0.6";
      "os-browserify-0.1.2" = self.by-version."os-browserify"."0.1.2";
      "parents-0.0.3" = self.by-version."parents"."0.0.3";
      "path-browserify-0.0.0" = self.by-version."path-browserify"."0.0.0";
      "punycode-1.2.4" = self.by-version."punycode"."1.2.4";
      "querystring-es3-0.2.0" = self.by-version."querystring-es3"."0.2.0";
      "resolve-0.6.3" = self.by-version."resolve"."0.6.3";
      "shallow-copy-0.0.1" = self.by-version."shallow-copy"."0.0.1";
      "shell-quote-0.0.1" = self.by-version."shell-quote"."0.0.1";
      "stream-browserify-0.1.3" = self.by-version."stream-browserify"."0.1.3";
      "stream-combiner-0.0.4" = self.by-version."stream-combiner"."0.0.4";
      "string_decoder-0.0.1" = self.by-version."string_decoder"."0.0.1";
      "subarg-0.0.1" = self.by-version."subarg"."0.0.1";
      "syntax-error-1.1.2" = self.by-version."syntax-error"."1.1.2";
      "through2-0.4.2" = self.by-version."through2"."0.4.2";
      "timers-browserify-1.0.3" = self.by-version."timers-browserify"."1.0.3";
      "tty-browserify-0.0.0" = self.by-version."tty-browserify"."0.0.0";
      "umd-2.0.0" = self.by-version."umd"."2.0.0";
      "url-0.10.2" = self.by-version."url"."0.10.2";
      "util-0.10.3" = self.by-version."util"."0.10.3";
      "vm-browserify-0.0.4" = self.by-version."vm-browserify"."0.0.4";
      "xtend-3.0.0" = self.by-version."xtend"."3.0.0";
      "process-0.7.0" = self.by-version."process"."0.7.0";
    };
    peerDependencies = [];
  };
  by-spec."browserify"."^4.2.0" =
    self.by-version."browserify"."4.2.3";
  "browserify" = self.by-version."browserify"."4.2.3";
  by-spec."browserify"."^4.2.1" =
    self.by-version."browserify"."4.2.3";
  by-spec."browserify-zlib"."~0.1.2" =
    self.by-version."browserify-zlib"."0.1.4";
  by-version."browserify-zlib"."0.1.4" = self.buildNodePackage {
    name = "browserify-zlib-0.1.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/browserify-zlib/-/browserify-zlib-0.1.4.tgz";
      name = "browserify-zlib-0.1.4.tgz";
      sha1 = "bb35f8a519f600e0fa6b8485241c979d0141fb2d";
    };
    deps = {
      "pako-0.2.5" = self.by-version."pako"."0.2.5";
    };
    peerDependencies = [];
  };
  by-spec."buffer"."^2.3.0" =
    self.by-version."buffer"."2.8.2";
  by-version."buffer"."2.8.2" = self.buildNodePackage {
    name = "buffer-2.8.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/buffer/-/buffer-2.8.2.tgz";
      name = "buffer-2.8.2.tgz";
      sha1 = "d73c214c0334384dc29b04ee0ff5f5527c7974e7";
    };
    deps = {
      "base64-js-0.0.7" = self.by-version."base64-js"."0.0.7";
      "ieee754-1.1.4" = self.by-version."ieee754"."1.1.4";
      "is-array-1.0.1" = self.by-version."is-array"."1.0.1";
    };
    peerDependencies = [];
  };
  by-spec."buffer"."~2.1.4" =
    self.by-version."buffer"."2.1.13";
  by-version."buffer"."2.1.13" = self.buildNodePackage {
    name = "buffer-2.1.13";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/buffer/-/buffer-2.1.13.tgz";
      name = "buffer-2.1.13.tgz";
      sha1 = "c88838ebf79f30b8b4a707788470bea8a62c2355";
    };
    deps = {
      "base64-js-0.0.8" = self.by-version."base64-js"."0.0.8";
      "ieee754-1.1.4" = self.by-version."ieee754"."1.1.4";
    };
    peerDependencies = [];
  };
  by-spec."buffer"."~2.3.2" =
    self.by-version."buffer"."2.3.4";
  by-version."buffer"."2.3.4" = self.buildNodePackage {
    name = "buffer-2.3.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/buffer/-/buffer-2.3.4.tgz";
      name = "buffer-2.3.4.tgz";
      sha1 = "7e4af5a23c15e13fcbfd5c5a1ec974cb61668a4c";
    };
    deps = {
      "base64-js-0.0.8" = self.by-version."base64-js"."0.0.8";
      "ieee754-1.1.4" = self.by-version."ieee754"."1.1.4";
    };
    peerDependencies = [];
  };
  by-spec."builtins"."~0.0.3" =
    self.by-version."builtins"."0.0.7";
  by-version."builtins"."0.0.7" = self.buildNodePackage {
    name = "builtins-0.0.7";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/builtins/-/builtins-0.0.7.tgz";
      name = "builtins-0.0.7.tgz";
      sha1 = "355219cd6cf18dbe7c01cc7fd2dce765cfdc549a";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."bytes"."1" =
    self.by-version."bytes"."1.0.0";
  by-version."bytes"."1.0.0" = self.buildNodePackage {
    name = "bytes-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/bytes/-/bytes-1.0.0.tgz";
      name = "bytes-1.0.0.tgz";
      sha1 = "3569ede8ba34315fab99c3e92cb04c7220de1fa8";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."bytes"."1.0.0" =
    self.by-version."bytes"."1.0.0";
  by-spec."callsite"."~1.0.0" =
    self.by-version."callsite"."1.0.0";
  by-version."callsite"."1.0.0" = self.buildNodePackage {
    name = "callsite-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/callsite/-/callsite-1.0.0.tgz";
      name = "callsite-1.0.0.tgz";
      sha1 = "280398e5d664bd74038b6f0905153e6e8af1bc20";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."camelcase"."^1.0.1" =
    self.by-version."camelcase"."1.0.2";
  by-version."camelcase"."1.0.2" = self.buildNodePackage {
    name = "camelcase-1.0.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/camelcase/-/camelcase-1.0.2.tgz";
      name = "camelcase-1.0.2.tgz";
      sha1 = "7912eac1d496836782c976c2d73e874dc54f2eaf";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."camelcase-keys"."^1.0.0" =
    self.by-version."camelcase-keys"."1.0.0";
  by-version."camelcase-keys"."1.0.0" = self.buildNodePackage {
    name = "camelcase-keys-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/camelcase-keys/-/camelcase-keys-1.0.0.tgz";
      name = "camelcase-keys-1.0.0.tgz";
      sha1 = "bd1a11bf9b31a1ce493493a930de1a0baf4ad7ec";
    };
    deps = {
      "camelcase-1.0.2" = self.by-version."camelcase"."1.0.2";
      "map-obj-1.0.0" = self.by-version."map-obj"."1.0.0";
    };
    peerDependencies = [];
  };
  by-spec."caseless"."~0.6.0" =
    self.by-version."caseless"."0.6.0";
  by-version."caseless"."0.6.0" = self.buildNodePackage {
    name = "caseless-0.6.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/caseless/-/caseless-0.6.0.tgz";
      name = "caseless-0.6.0.tgz";
      sha1 = "8167c1ab8397fb5bb95f96d28e5a81c50f247ac4";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."caseless"."~0.9.0" =
    self.by-version."caseless"."0.9.0";
  by-version."caseless"."0.9.0" = self.buildNodePackage {
    name = "caseless-0.9.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/caseless/-/caseless-0.9.0.tgz";
      name = "caseless-0.9.0.tgz";
      sha1 = "b7b65ce6bf1413886539cfd533f0b30effa9cf88";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."chai"."1.9.1" =
    self.by-version."chai"."1.9.1";
  by-version."chai"."1.9.1" = self.buildNodePackage {
    name = "chai-1.9.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/chai/-/chai-1.9.1.tgz";
      name = "chai-1.9.1.tgz";
      sha1 = "3711bb6706e1568f34c0b36098bf8f19455c81ae";
    };
    deps = {
      "assertion-error-1.0.0" = self.by-version."assertion-error"."1.0.0";
      "deep-eql-0.1.3" = self.by-version."deep-eql"."0.1.3";
    };
    peerDependencies = [];
  };
  by-spec."chai".">= 1.7.0 < 2" =
    self.by-version."chai"."1.10.0";
  by-version."chai"."1.10.0" = self.buildNodePackage {
    name = "chai-1.10.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/chai/-/chai-1.10.0.tgz";
      name = "chai-1.10.0.tgz";
      sha1 = "e4031cc87654461a75943e5a35ab46eaf39c1eb9";
    };
    deps = {
      "assertion-error-1.0.0" = self.by-version."assertion-error"."1.0.0";
      "deep-eql-0.1.3" = self.by-version."deep-eql"."0.1.3";
    };
    peerDependencies = [];
  };
  by-spec."chai-as-promised"."^4.1.1" =
    self.by-version."chai-as-promised"."4.1.1";
  by-version."chai-as-promised"."4.1.1" = self.buildNodePackage {
    name = "chai-as-promised-4.1.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/chai-as-promised/-/chai-as-promised-4.1.1.tgz";
      name = "chai-as-promised-4.1.1.tgz";
      sha1 = "cc09bec0d30ee14c71c62ad8f9394fc4af4167fb";
    };
    deps = {
    };
    peerDependencies = [
      self.by-version."chai"."1.10.0"];
  };
  by-spec."chalk"."^0.5.0" =
    self.by-version."chalk"."0.5.1";
  by-version."chalk"."0.5.1" = self.buildNodePackage {
    name = "chalk-0.5.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/chalk/-/chalk-0.5.1.tgz";
      name = "chalk-0.5.1.tgz";
      sha1 = "663b3a648b68b55d04690d49167aa837858f2174";
    };
    deps = {
      "ansi-styles-1.1.0" = self.by-version."ansi-styles"."1.1.0";
      "escape-string-regexp-1.0.2" = self.by-version."escape-string-regexp"."1.0.2";
      "has-ansi-0.1.0" = self.by-version."has-ansi"."0.1.0";
      "strip-ansi-0.3.0" = self.by-version."strip-ansi"."0.3.0";
      "supports-color-0.2.0" = self.by-version."supports-color"."0.2.0";
    };
    peerDependencies = [];
  };
  by-spec."chalk"."^0.5.1" =
    self.by-version."chalk"."0.5.1";
  by-spec."chalk"."~0.4.0" =
    self.by-version."chalk"."0.4.0";
  by-version."chalk"."0.4.0" = self.buildNodePackage {
    name = "chalk-0.4.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/chalk/-/chalk-0.4.0.tgz";
      name = "chalk-0.4.0.tgz";
      sha1 = "5199a3ddcd0c1efe23bc08c1b027b06176e0c64f";
    };
    deps = {
      "has-color-0.1.7" = self.by-version."has-color"."0.1.7";
      "ansi-styles-1.0.0" = self.by-version."ansi-styles"."1.0.0";
      "strip-ansi-0.1.1" = self.by-version."strip-ansi"."0.1.1";
    };
    peerDependencies = [];
  };
  by-spec."char-spinner"."~1.0.1" =
    self.by-version."char-spinner"."1.0.1";
  by-version."char-spinner"."1.0.1" = self.buildNodePackage {
    name = "char-spinner-1.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/char-spinner/-/char-spinner-1.0.1.tgz";
      name = "char-spinner-1.0.1.tgz";
      sha1 = "e6ea67bd247e107112983b7ab0479ed362800081";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."charm"."0.2.0" =
    self.by-version."charm"."0.2.0";
  by-version."charm"."0.2.0" = self.buildNodePackage {
    name = "charm-0.2.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/charm/-/charm-0.2.0.tgz";
      name = "charm-0.2.0.tgz";
      sha1 = "bacd06d8717759362f7a662a1e967af7537fda8b";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."child-process-close"."~0.1.1" =
    self.by-version."child-process-close"."0.1.1";
  by-version."child-process-close"."0.1.1" = self.buildNodePackage {
    name = "child-process-close-0.1.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/child-process-close/-/child-process-close-0.1.1.tgz";
      name = "child-process-close-0.1.1.tgz";
      sha1 = "c153ede7a5eb65ac69e78a38973b1a286377f75f";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."chmodr"."~0.1.0" =
    self.by-version."chmodr"."0.1.0";
  by-version."chmodr"."0.1.0" = self.buildNodePackage {
    name = "chmodr-0.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/chmodr/-/chmodr-0.1.0.tgz";
      name = "chmodr-0.1.0.tgz";
      sha1 = "e09215a1d51542db2a2576969765bcf6125583eb";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."chokidar".">=0.8.2" =
    self.by-version."chokidar"."1.0.0-rc3";
  by-version."chokidar"."1.0.0-rc3" = self.buildNodePackage {
    name = "chokidar-1.0.0-rc3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/chokidar/-/chokidar-1.0.0-rc3.tgz";
      name = "chokidar-1.0.0-rc3.tgz";
      sha1 = "f95d5e60c7d66eb53136c8999c47e9d4f37118f5";
    };
    deps = {
      "anymatch-1.1.0" = self.by-version."anymatch"."1.1.0";
      "async-each-0.1.6" = self.by-version."async-each"."0.1.6";
      "glob-parent-1.0.0" = self.by-version."glob-parent"."1.0.0";
      "is-binary-path-1.0.0" = self.by-version."is-binary-path"."1.0.0";
      "readdirp-1.3.0" = self.by-version."readdirp"."1.3.0";
      #"fsevents-0.3.5" = self.by-version."fsevents"."0.3.5";
    };
    peerDependencies = [];
  };
  by-spec."chokidar"."^0.8.1" =
    self.by-version."chokidar"."0.8.4";
  by-version."chokidar"."0.8.4" = self.buildNodePackage {
    name = "chokidar-0.8.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/chokidar/-/chokidar-0.8.4.tgz";
      name = "chokidar-0.8.4.tgz";
      sha1 = "3b2b5066817086534ba81a092bdcf4be25b8bee0";
    };
    deps = {
      #"fsevents-0.2.1" = self.by-version."fsevents"."0.2.1";
      "recursive-readdir-0.0.2" = self.by-version."recursive-readdir"."0.0.2";
    };
    peerDependencies = [];
  };
  by-spec."chokidar"."~0.8" =
    self.by-version."chokidar"."0.8.4";
  by-spec."chownr"."0" =
    self.by-version."chownr"."0.0.1";
  by-version."chownr"."0.0.1" = self.buildNodePackage {
    name = "chownr-0.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/chownr/-/chownr-0.0.1.tgz";
      name = "chownr-0.0.1.tgz";
      sha1 = "51d18189d9092d5f8afd623f3288bfd1c6bf1a62";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."cli"."0.4.x" =
    self.by-version."cli"."0.4.5";
  by-version."cli"."0.4.5" = self.buildNodePackage {
    name = "cli-0.4.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/cli/-/cli-0.4.5.tgz";
      name = "cli-0.4.5.tgz";
      sha1 = "78f9485cd161b566e9a6c72d7170c4270e81db61";
    };
    deps = {
      "glob-4.3.5" = self.by-version."glob"."4.3.5";
    };
    peerDependencies = [];
  };
  by-spec."cli-color"."^0.3.2" =
    self.by-version."cli-color"."0.3.2";
  by-version."cli-color"."0.3.2" = self.buildNodePackage {
    name = "cli-color-0.3.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/cli-color/-/cli-color-0.3.2.tgz";
      name = "cli-color-0.3.2.tgz";
      sha1 = "75fa5f728c308cc4ac594b05e06cc5d80daccd86";
    };
    deps = {
      "d-0.1.1" = self.by-version."d"."0.1.1";
      "es5-ext-0.10.6" = self.by-version."es5-ext"."0.10.6";
      "memoizee-0.3.8" = self.by-version."memoizee"."0.3.8";
      "timers-ext-0.1.0" = self.by-version."timers-ext"."0.1.0";
    };
    peerDependencies = [];
  };
  by-spec."cli-color"."~0.3.2" =
    self.by-version."cli-color"."0.3.2";
  by-spec."clone"."~0.1.5" =
    self.by-version."clone"."0.1.19";
  by-version."clone"."0.1.19" = self.buildNodePackage {
    name = "clone-0.1.19";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/clone/-/clone-0.1.19.tgz";
      name = "clone-0.1.19.tgz";
      sha1 = "613fb68639b26a494ac53253e15b1a6bd88ada85";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."cmd-shim"."~2.0.1" =
    self.by-version."cmd-shim"."2.0.1";
  by-version."cmd-shim"."2.0.1" = self.buildNodePackage {
    name = "cmd-shim-2.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/cmd-shim/-/cmd-shim-2.0.1.tgz";
      name = "cmd-shim-2.0.1.tgz";
      sha1 = "4512a373d2391679aec51ad1d4733559e9b85d4a";
    };
    deps = {
      "graceful-fs-3.0.5" = self.by-version."graceful-fs"."3.0.5";
      "mkdirp-0.5.0" = self.by-version."mkdirp"."0.5.0";
    };
    peerDependencies = [];
  };
  by-spec."coffee-script"."~1.3.3" =
    self.by-version."coffee-script"."1.3.3";
  by-version."coffee-script"."1.3.3" = self.buildNodePackage {
    name = "coffee-script-1.3.3";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/coffee-script/-/coffee-script-1.3.3.tgz";
      name = "coffee-script-1.3.3.tgz";
      sha1 = "150d6b4cb522894369efed6a2101c20bc7f4a4f4";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."colors"."0.6.x" =
    self.by-version."colors"."0.6.2";
  by-version."colors"."0.6.2" = self.buildNodePackage {
    name = "colors-0.6.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/colors/-/colors-0.6.2.tgz";
      name = "colors-0.6.2.tgz";
      sha1 = "2423fe6678ac0c5dae8852e5d0e5be08c997abcc";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."colors"."0.x.x" =
    self.by-version."colors"."0.6.2";
  by-spec."colors"."^0.6.2" =
    self.by-version."colors"."0.6.2";
  by-spec."colors"."~0.6.2" =
    self.by-version."colors"."0.6.2";
  by-spec."columnify"."~1.4.1" =
    self.by-version."columnify"."1.4.1";
  by-version."columnify"."1.4.1" = self.buildNodePackage {
    name = "columnify-1.4.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/columnify/-/columnify-1.4.1.tgz";
      name = "columnify-1.4.1.tgz";
      sha1 = "30555796379865b016189c228cb0061764270ed0";
    };
    deps = {
      "strip-ansi-2.0.1" = self.by-version."strip-ansi"."2.0.1";
      "wcwidth-1.0.0" = self.by-version."wcwidth"."1.0.0";
    };
    peerDependencies = [];
  };
  by-spec."combine-source-map"."~0.3.0" =
    self.by-version."combine-source-map"."0.3.0";
  by-version."combine-source-map"."0.3.0" = self.buildNodePackage {
    name = "combine-source-map-0.3.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/combine-source-map/-/combine-source-map-0.3.0.tgz";
      name = "combine-source-map-0.3.0.tgz";
      sha1 = "d9e74f593d9cd43807312cb5d846d451efaa9eb7";
    };
    deps = {
      "inline-source-map-0.3.0" = self.by-version."inline-source-map"."0.3.0";
      "convert-source-map-0.3.5" = self.by-version."convert-source-map"."0.3.5";
      "source-map-0.1.43" = self.by-version."source-map"."0.1.43";
    };
    peerDependencies = [];
  };
  by-spec."combined-stream"."~0.0.4" =
    self.by-version."combined-stream"."0.0.7";
  by-version."combined-stream"."0.0.7" = self.buildNodePackage {
    name = "combined-stream-0.0.7";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/combined-stream/-/combined-stream-0.0.7.tgz";
      name = "combined-stream-0.0.7.tgz";
      sha1 = "0137e657baa5a7541c57ac37ac5fc07d73b4dc1f";
    };
    deps = {
      "delayed-stream-0.0.5" = self.by-version."delayed-stream"."0.0.5";
    };
    peerDependencies = [];
  };
  by-spec."combined-stream"."~0.0.5" =
    self.by-version."combined-stream"."0.0.7";
  by-spec."commander"."0.6.1" =
    self.by-version."commander"."0.6.1";
  by-version."commander"."0.6.1" = self.buildNodePackage {
    name = "commander-0.6.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/commander/-/commander-0.6.1.tgz";
      name = "commander-0.6.1.tgz";
      sha1 = "fa68a14f6a945d54dbbe50d8cdb3320e9e3b1a06";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."commander"."2.3.0" =
    self.by-version."commander"."2.3.0";
  by-version."commander"."2.3.0" = self.buildNodePackage {
    name = "commander-2.3.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/commander/-/commander-2.3.0.tgz";
      name = "commander-2.3.0.tgz";
      sha1 = "fd430e889832ec353b9acd1de217c11cb3eef873";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."commander"."^2.2.0" =
    self.by-version."commander"."2.6.0";
  by-version."commander"."2.6.0" = self.buildNodePackage {
    name = "commander-2.6.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/commander/-/commander-2.6.0.tgz";
      name = "commander-2.6.0.tgz";
      sha1 = "9df7e52fb2a0cb0fb89058ee80c3104225f37e1d";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."commander"."~2.1.0" =
    self.by-version."commander"."2.1.0";
  by-version."commander"."2.1.0" = self.buildNodePackage {
    name = "commander-2.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/commander/-/commander-2.1.0.tgz";
      name = "commander-2.1.0.tgz";
      sha1 = "d121bbae860d9992a3d517ba96f56588e47c6781";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."commondir"."0.0.1" =
    self.by-version."commondir"."0.0.1";
  by-version."commondir"."0.0.1" = self.buildNodePackage {
    name = "commondir-0.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/commondir/-/commondir-0.0.1.tgz";
      name = "commondir-0.0.1.tgz";
      sha1 = "89f00fdcd51b519c578733fec563e6a6da7f5be2";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."compressible"."~2.0.1" =
    self.by-version."compressible"."2.0.2";
  by-version."compressible"."2.0.2" = self.buildNodePackage {
    name = "compressible-2.0.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/compressible/-/compressible-2.0.2.tgz";
      name = "compressible-2.0.2.tgz";
      sha1 = "d0474a6ba6590a43d39c2ce9a6cfbb6479be76a5";
    };
    deps = {
      "mime-db-1.6.1" = self.by-version."mime-db"."1.6.1";
    };
    peerDependencies = [];
  };
  by-spec."compression"."~1.1.2" =
    self.by-version."compression"."1.1.2";
  by-version."compression"."1.1.2" = self.buildNodePackage {
    name = "compression-1.1.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/compression/-/compression-1.1.2.tgz";
      name = "compression-1.1.2.tgz";
      sha1 = "f93fb7fcdb3573ec4c7d5398984caae230e2a8d7";
    };
    deps = {
      "accepts-1.1.4" = self.by-version."accepts"."1.1.4";
      "bytes-1.0.0" = self.by-version."bytes"."1.0.0";
      "compressible-2.0.2" = self.by-version."compressible"."2.0.2";
      "debug-2.0.0" = self.by-version."debug"."2.0.0";
      "on-headers-1.0.0" = self.by-version."on-headers"."1.0.0";
      "vary-1.0.0" = self.by-version."vary"."1.0.0";
    };
    peerDependencies = [];
  };
  by-spec."concat-map"."0.0.1" =
    self.by-version."concat-map"."0.0.1";
  by-version."concat-map"."0.0.1" = self.buildNodePackage {
    name = "concat-map-0.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/concat-map/-/concat-map-0.0.1.tgz";
      name = "concat-map-0.0.1.tgz";
      sha1 = "d8a96bd77fd68df7793a73036a3ba0d5405d477b";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."concat-stream"."^1.4.6" =
    self.by-version."concat-stream"."1.4.7";
  by-version."concat-stream"."1.4.7" = self.buildNodePackage {
    name = "concat-stream-1.4.7";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/concat-stream/-/concat-stream-1.4.7.tgz";
      name = "concat-stream-1.4.7.tgz";
      sha1 = "0ceaa47b87a581d2a7a782b92b81d5020c3f9925";
    };
    deps = {
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
      "typedarray-0.0.6" = self.by-version."typedarray"."0.0.6";
      "readable-stream-1.1.13" = self.by-version."readable-stream"."1.1.13";
    };
    peerDependencies = [];
  };
  by-spec."concat-stream"."~1.4.1" =
    self.by-version."concat-stream"."1.4.7";
  by-spec."concat-stream"."~1.4.5" =
    self.by-version."concat-stream"."1.4.7";
  by-spec."config-chain"."~1.1.8" =
    self.by-version."config-chain"."1.1.8";
  by-version."config-chain"."1.1.8" = self.buildNodePackage {
    name = "config-chain-1.1.8";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/config-chain/-/config-chain-1.1.8.tgz";
      name = "config-chain-1.1.8.tgz";
      sha1 = "0943d0b7227213a20d4eaff4434f4a1c0a052cad";
    };
    deps = {
      "proto-list-1.2.3" = self.by-version."proto-list"."1.2.3";
      "ini-1.3.2" = self.by-version."ini"."1.3.2";
    };
    peerDependencies = [];
  };
  by-spec."configstore"."^0.3.1" =
    self.by-version."configstore"."0.3.2";
  by-version."configstore"."0.3.2" = self.buildNodePackage {
    name = "configstore-0.3.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/configstore/-/configstore-0.3.2.tgz";
      name = "configstore-0.3.2.tgz";
      sha1 = "25e4c16c3768abf75c5a65bc61761f495055b459";
    };
    deps = {
      "graceful-fs-3.0.5" = self.by-version."graceful-fs"."3.0.5";
      "js-yaml-3.2.6" = self.by-version."js-yaml"."3.2.6";
      "mkdirp-0.5.0" = self.by-version."mkdirp"."0.5.0";
      "object-assign-2.0.0" = self.by-version."object-assign"."2.0.0";
      "osenv-0.1.0" = self.by-version."osenv"."0.1.0";
      "user-home-1.1.1" = self.by-version."user-home"."1.1.1";
      "uuid-2.0.1" = self.by-version."uuid"."2.0.1";
      "xdg-basedir-1.0.1" = self.by-version."xdg-basedir"."1.0.1";
    };
    peerDependencies = [];
  };
  by-spec."connect"."~2.26.0" =
    self.by-version."connect"."2.26.6";
  by-version."connect"."2.26.6" = self.buildNodePackage {
    name = "connect-2.26.6";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/connect/-/connect-2.26.6.tgz";
      name = "connect-2.26.6.tgz";
      sha1 = "94f3eef3fdeeb405806ea46dc036ee0b2acae700";
    };
    deps = {
      "basic-auth-connect-1.0.0" = self.by-version."basic-auth-connect"."1.0.0";
      "body-parser-1.8.4" = self.by-version."body-parser"."1.8.4";
      "bytes-1.0.0" = self.by-version."bytes"."1.0.0";
      "cookie-0.1.2" = self.by-version."cookie"."0.1.2";
      "cookie-parser-1.3.3" = self.by-version."cookie-parser"."1.3.3";
      "cookie-signature-1.0.5" = self.by-version."cookie-signature"."1.0.5";
      "compression-1.1.2" = self.by-version."compression"."1.1.2";
      "connect-timeout-1.3.0" = self.by-version."connect-timeout"."1.3.0";
      "csurf-1.6.6" = self.by-version."csurf"."1.6.6";
      "debug-2.0.0" = self.by-version."debug"."2.0.0";
      "depd-0.4.5" = self.by-version."depd"."0.4.5";
      "errorhandler-1.2.4" = self.by-version."errorhandler"."1.2.4";
      "express-session-1.8.2" = self.by-version."express-session"."1.8.2";
      "finalhandler-0.2.0" = self.by-version."finalhandler"."0.2.0";
      "fresh-0.2.4" = self.by-version."fresh"."0.2.4";
      "media-typer-0.3.0" = self.by-version."media-typer"."0.3.0";
      "method-override-2.2.0" = self.by-version."method-override"."2.2.0";
      "morgan-1.3.2" = self.by-version."morgan"."1.3.2";
      "multiparty-3.3.2" = self.by-version."multiparty"."3.3.2";
      "on-headers-1.0.0" = self.by-version."on-headers"."1.0.0";
      "parseurl-1.3.0" = self.by-version."parseurl"."1.3.0";
      "qs-2.2.4" = self.by-version."qs"."2.2.4";
      "response-time-2.0.1" = self.by-version."response-time"."2.0.1";
      "serve-favicon-2.1.7" = self.by-version."serve-favicon"."2.1.7";
      "serve-index-1.2.1" = self.by-version."serve-index"."1.2.1";
      "serve-static-1.6.5" = self.by-version."serve-static"."1.6.5";
      "type-is-1.5.6" = self.by-version."type-is"."1.5.6";
      "vhost-3.0.0" = self.by-version."vhost"."3.0.0";
      "pause-0.0.1" = self.by-version."pause"."0.0.1";
    };
    peerDependencies = [];
  };
  by-spec."connect-timeout"."~1.3.0" =
    self.by-version."connect-timeout"."1.3.0";
  by-version."connect-timeout"."1.3.0" = self.buildNodePackage {
    name = "connect-timeout-1.3.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/connect-timeout/-/connect-timeout-1.3.0.tgz";
      name = "connect-timeout-1.3.0.tgz";
      sha1 = "d9d1d2df2900d490ed54190809f37e6b4508a1ec";
    };
    deps = {
      "debug-2.0.0" = self.by-version."debug"."2.0.0";
      "ms-0.6.2" = self.by-version."ms"."0.6.2";
      "on-headers-1.0.0" = self.by-version."on-headers"."1.0.0";
    };
    peerDependencies = [];
  };
  by-spec."console-browserify"."0.1.x" =
    self.by-version."console-browserify"."0.1.6";
  by-version."console-browserify"."0.1.6" = self.buildNodePackage {
    name = "console-browserify-0.1.6";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/console-browserify/-/console-browserify-0.1.6.tgz";
      name = "console-browserify-0.1.6.tgz";
      sha1 = "d128a3c0bb88350eb5626c6e7c71a6f0fd48983c";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."console-browserify"."^1.1.0" =
    self.by-version."console-browserify"."1.1.0";
  by-version."console-browserify"."1.1.0" = self.buildNodePackage {
    name = "console-browserify-1.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/console-browserify/-/console-browserify-1.1.0.tgz";
      name = "console-browserify-1.1.0.tgz";
      sha1 = "f0241c45730a9fc6323b206dbf38edc741d0bb10";
    };
    deps = {
      "date-now-0.1.4" = self.by-version."date-now"."0.1.4";
    };
    peerDependencies = [];
  };
  by-spec."console-browserify"."~1.0.1" =
    self.by-version."console-browserify"."1.0.3";
  by-version."console-browserify"."1.0.3" = self.buildNodePackage {
    name = "console-browserify-1.0.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/console-browserify/-/console-browserify-1.0.3.tgz";
      name = "console-browserify-1.0.3.tgz";
      sha1 = "d3898d2c3a93102f364197f8874b4f92b5286a8e";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."constants-browserify"."~0.0.1" =
    self.by-version."constants-browserify"."0.0.1";
  by-version."constants-browserify"."0.0.1" = self.buildNodePackage {
    name = "constants-browserify-0.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/constants-browserify/-/constants-browserify-0.0.1.tgz";
      name = "constants-browserify-0.0.1.tgz";
      sha1 = "92577db527ba6c4cf0a4568d84bc031f441e21f2";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."conventional-changelog"."0.0.11" =
    self.by-version."conventional-changelog"."0.0.11";
  by-version."conventional-changelog"."0.0.11" = self.buildNodePackage {
    name = "conventional-changelog-0.0.11";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/conventional-changelog/-/conventional-changelog-0.0.11.tgz";
      name = "conventional-changelog-0.0.11.tgz";
      sha1 = "8eac8d1297e91406a696833ea4df3fb15f6c7fff";
    };
    deps = {
      "lodash.assign-2.4.1" = self.by-version."lodash.assign"."2.4.1";
      "event-stream-3.1.7" = self.by-version."event-stream"."3.1.7";
    };
    peerDependencies = [];
  };
  by-spec."conventional-changelog"."0.0.6" =
    self.by-version."conventional-changelog"."0.0.6";
  by-version."conventional-changelog"."0.0.6" = self.buildNodePackage {
    name = "conventional-changelog-0.0.6";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/conventional-changelog/-/conventional-changelog-0.0.6.tgz";
      name = "conventional-changelog-0.0.6.tgz";
      sha1 = "c3f9cd48a6745d8534b2c9d1f819ef498b4d640d";
    };
    deps = {
      "lodash.assign-2.4.1" = self.by-version."lodash.assign"."2.4.1";
      "event-stream-3.1.7" = self.by-version."event-stream"."3.1.7";
    };
    peerDependencies = [];
  };
  by-spec."convert-source-map"."~0.3.0" =
    self.by-version."convert-source-map"."0.3.5";
  by-version."convert-source-map"."0.3.5" = self.buildNodePackage {
    name = "convert-source-map-0.3.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/convert-source-map/-/convert-source-map-0.3.5.tgz";
      name = "convert-source-map-0.3.5.tgz";
      sha1 = "f1d802950af7dd2631a1febe0596550c86ab3190";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."convert-source-map"."~0.3.3" =
    self.by-version."convert-source-map"."0.3.5";
  by-spec."cookie"."0.1.2" =
    self.by-version."cookie"."0.1.2";
  by-version."cookie"."0.1.2" = self.buildNodePackage {
    name = "cookie-0.1.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/cookie/-/cookie-0.1.2.tgz";
      name = "cookie-0.1.2.tgz";
      sha1 = "72fec3d24e48a3432073d90c12642005061004b1";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."cookie-parser"."~1.3.3" =
    self.by-version."cookie-parser"."1.3.3";
  by-version."cookie-parser"."1.3.3" = self.buildNodePackage {
    name = "cookie-parser-1.3.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/cookie-parser/-/cookie-parser-1.3.3.tgz";
      name = "cookie-parser-1.3.3.tgz";
      sha1 = "7e3a2c745f4b460d5a340e578a0baa5d7725fe37";
    };
    deps = {
      "cookie-0.1.2" = self.by-version."cookie"."0.1.2";
      "cookie-signature-1.0.5" = self.by-version."cookie-signature"."1.0.5";
    };
    peerDependencies = [];
  };
  by-spec."cookie-signature"."1.0.5" =
    self.by-version."cookie-signature"."1.0.5";
  by-version."cookie-signature"."1.0.5" = self.buildNodePackage {
    name = "cookie-signature-1.0.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/cookie-signature/-/cookie-signature-1.0.5.tgz";
      name = "cookie-signature-1.0.5.tgz";
      sha1 = "a122e3f1503eca0f5355795b0711bb2368d450f9";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."core-util-is"."~1.0.0" =
    self.by-version."core-util-is"."1.0.1";
  by-version."core-util-is"."1.0.1" = self.buildNodePackage {
    name = "core-util-is-1.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/core-util-is/-/core-util-is-1.0.1.tgz";
      name = "core-util-is-1.0.1.tgz";
      sha1 = "6b07085aef9a3ccac6ee53bf9d3df0c1521a5538";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."crc"."3.0.0" =
    self.by-version."crc"."3.0.0";
  by-version."crc"."3.0.0" = self.buildNodePackage {
    name = "crc-3.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/crc/-/crc-3.0.0.tgz";
      name = "crc-3.0.0.tgz";
      sha1 = "d11e97ec44a844e5eb15a74fa2c7875d0aac4b22";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."crc"."3.2.1" =
    self.by-version."crc"."3.2.1";
  by-version."crc"."3.2.1" = self.buildNodePackage {
    name = "crc-3.2.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/crc/-/crc-3.2.1.tgz";
      name = "crc-3.2.1.tgz";
      sha1 = "5d9c8fb77a245cd5eca291e5d2d005334bab0082";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."cryptiles"."0.2.x" =
    self.by-version."cryptiles"."0.2.2";
  by-version."cryptiles"."0.2.2" = self.buildNodePackage {
    name = "cryptiles-0.2.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/cryptiles/-/cryptiles-0.2.2.tgz";
      name = "cryptiles-0.2.2.tgz";
      sha1 = "ed91ff1f17ad13d3748288594f8a48a0d26f325c";
    };
    deps = {
      "boom-0.4.2" = self.by-version."boom"."0.4.2";
    };
    peerDependencies = [];
  };
  by-spec."cryptiles"."2.x.x" =
    self.by-version."cryptiles"."2.0.4";
  by-version."cryptiles"."2.0.4" = self.buildNodePackage {
    name = "cryptiles-2.0.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/cryptiles/-/cryptiles-2.0.4.tgz";
      name = "cryptiles-2.0.4.tgz";
      sha1 = "09ea1775b9e1c7de7e60a99d42ab6f08ce1a1285";
    };
    deps = {
      "boom-2.6.1" = self.by-version."boom"."2.6.1";
    };
    peerDependencies = [];
  };
  by-spec."crypto-browserify"."^2.1.8" =
    self.by-version."crypto-browserify"."2.1.10";
  by-version."crypto-browserify"."2.1.10" = self.buildNodePackage {
    name = "crypto-browserify-2.1.10";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/crypto-browserify/-/crypto-browserify-2.1.10.tgz";
      name = "crypto-browserify-2.1.10.tgz";
      sha1 = "4f2ca6311843cf087cdf008e43a4f3686ef6e6bb";
    };
    deps = {
      "ripemd160-0.2.0" = self.by-version."ripemd160"."0.2.0";
      "sha.js-2.1.6" = self.by-version."sha.js"."2.1.6";
    };
    peerDependencies = [];
  };
  by-spec."crypto-browserify"."~1.0.9" =
    self.by-version."crypto-browserify"."1.0.9";
  by-version."crypto-browserify"."1.0.9" = self.buildNodePackage {
    name = "crypto-browserify-1.0.9";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/crypto-browserify/-/crypto-browserify-1.0.9.tgz";
      name = "crypto-browserify-1.0.9.tgz";
      sha1 = "cc5449685dfb85eb11c9828acc7cb87ab5bbfcc0";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."csrf"."~2.0.5" =
    self.by-version."csrf"."2.0.5";
  by-version."csrf"."2.0.5" = self.buildNodePackage {
    name = "csrf-2.0.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/csrf/-/csrf-2.0.5.tgz";
      name = "csrf-2.0.5.tgz";
      sha1 = "ffac90cf55269036d447008b47d2ef33929c0225";
    };
    deps = {
      "base64-url-1.2.0" = self.by-version."base64-url"."1.2.0";
      "rndm-1.1.0" = self.by-version."rndm"."1.1.0";
      "scmp-1.0.0" = self.by-version."scmp"."1.0.0";
      "uid-safe-1.0.3" = self.by-version."uid-safe"."1.0.3";
    };
    peerDependencies = [];
  };
  by-spec."csurf"."~1.6.2" =
    self.by-version."csurf"."1.6.6";
  by-version."csurf"."1.6.6" = self.buildNodePackage {
    name = "csurf-1.6.6";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/csurf/-/csurf-1.6.6.tgz";
      name = "csurf-1.6.6.tgz";
      sha1 = "fc4b1aa293f65da87731c049350d01b25bda3ece";
    };
    deps = {
      "cookie-0.1.2" = self.by-version."cookie"."0.1.2";
      "cookie-signature-1.0.5" = self.by-version."cookie-signature"."1.0.5";
      "csrf-2.0.5" = self.by-version."csrf"."2.0.5";
      "http-errors-1.2.8" = self.by-version."http-errors"."1.2.8";
    };
    peerDependencies = [];
  };
  by-spec."ctype"."0.5.3" =
    self.by-version."ctype"."0.5.3";
  by-version."ctype"."0.5.3" = self.buildNodePackage {
    name = "ctype-0.5.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/ctype/-/ctype-0.5.3.tgz";
      name = "ctype-0.5.3.tgz";
      sha1 = "82c18c2461f74114ef16c135224ad0b9144ca12f";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."cycle"."1.0.x" =
    self.by-version."cycle"."1.0.3";
  by-version."cycle"."1.0.3" = self.buildNodePackage {
    name = "cycle-1.0.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/cycle/-/cycle-1.0.3.tgz";
      name = "cycle-1.0.3.tgz";
      sha1 = "21e80b2be8580f98b468f379430662b046c34ad2";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."d"."~0.1.1" =
    self.by-version."d"."0.1.1";
  by-version."d"."0.1.1" = self.buildNodePackage {
    name = "d-0.1.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/d/-/d-0.1.1.tgz";
      name = "d-0.1.1.tgz";
      sha1 = "da184c535d18d8ee7ba2aa229b914009fae11309";
    };
    deps = {
      "es5-ext-0.10.6" = self.by-version."es5-ext"."0.10.6";
    };
    peerDependencies = [];
  };
  by-spec."date-now"."^0.1.4" =
    self.by-version."date-now"."0.1.4";
  by-version."date-now"."0.1.4" = self.buildNodePackage {
    name = "date-now-0.1.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/date-now/-/date-now-0.1.4.tgz";
      name = "date-now-0.1.4.tgz";
      sha1 = "eaf439fd4d4848ad74e5cc7dbef200672b9e345b";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."dateformat"."1.0.2-1.2.3" =
    self.by-version."dateformat"."1.0.2-1.2.3";
  by-version."dateformat"."1.0.2-1.2.3" = self.buildNodePackage {
    name = "dateformat-1.0.2-1.2.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/dateformat/-/dateformat-1.0.2-1.2.3.tgz";
      name = "dateformat-1.0.2-1.2.3.tgz";
      sha1 = "b0220c02de98617433b72851cf47de3df2cdbee9";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."debug"."2.0.0" =
    self.by-version."debug"."2.0.0";
  by-version."debug"."2.0.0" = self.buildNodePackage {
    name = "debug-2.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/debug/-/debug-2.0.0.tgz";
      name = "debug-2.0.0.tgz";
      sha1 = "89bd9df6732b51256bc6705342bba02ed12131ef";
    };
    deps = {
      "ms-0.6.2" = self.by-version."ms"."0.6.2";
    };
    peerDependencies = [];
  };
  by-spec."debug"."~0.7.0" =
    self.by-version."debug"."0.7.4";
  by-version."debug"."0.7.4" = self.buildNodePackage {
    name = "debug-0.7.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/debug/-/debug-0.7.4.tgz";
      name = "debug-0.7.4.tgz";
      sha1 = "06e1ea8082c2cb14e39806e22e2f6f757f92af39";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."debug"."~2.0.0" =
    self.by-version."debug"."2.0.0";
  by-spec."debuglog"."^1.0.1" =
    self.by-version."debuglog"."1.0.1";
  by-version."debuglog"."1.0.1" = self.buildNodePackage {
    name = "debuglog-1.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/debuglog/-/debuglog-1.0.1.tgz";
      name = "debuglog-1.0.1.tgz";
      sha1 = "aa24ffb9ac3df9a2351837cfb2d279360cd78492";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."decompress"."0.2.3" =
    self.by-version."decompress"."0.2.3";
  by-version."decompress"."0.2.3" = self.buildNodePackage {
    name = "decompress-0.2.3";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/decompress/-/decompress-0.2.3.tgz";
      name = "decompress-0.2.3.tgz";
      sha1 = "ad471a0fc51b7193b72f60c9e040ce1a7a4b9fcc";
    };
    deps = {
      "adm-zip-0.4.4" = self.by-version."adm-zip"."0.4.4";
      "extname-0.1.5" = self.by-version."extname"."0.1.5";
      "get-stdin-0.1.0" = self.by-version."get-stdin"."0.1.0";
      "map-key-0.1.5" = self.by-version."map-key"."0.1.5";
      "mkdirp-0.3.5" = self.by-version."mkdirp"."0.3.5";
      "nopt-2.2.1" = self.by-version."nopt"."2.2.1";
      "rimraf-2.2.8" = self.by-version."rimraf"."2.2.8";
      "stream-combiner-0.0.4" = self.by-version."stream-combiner"."0.0.4";
      "tar-0.1.20" = self.by-version."tar"."0.1.20";
      "tempfile-0.1.3" = self.by-version."tempfile"."0.1.3";
    };
    peerDependencies = [];
  };
  by-spec."deep-eql"."0.1.3" =
    self.by-version."deep-eql"."0.1.3";
  by-version."deep-eql"."0.1.3" = self.buildNodePackage {
    name = "deep-eql-0.1.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/deep-eql/-/deep-eql-0.1.3.tgz";
      name = "deep-eql-0.1.3.tgz";
      sha1 = "ef558acab8de25206cd713906d74e56930eb69f2";
    };
    deps = {
      "type-detect-0.1.1" = self.by-version."type-detect"."0.1.1";
    };
    peerDependencies = [];
  };
  by-spec."deep-equal"."*" =
    self.by-version."deep-equal"."0.2.1";
  by-version."deep-equal"."0.2.1" = self.buildNodePackage {
    name = "deep-equal-0.2.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/deep-equal/-/deep-equal-0.2.1.tgz";
      name = "deep-equal-0.2.1.tgz";
      sha1 = "fad7a793224cbf0c3c7786f92ef780e4fc8cc878";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."deep-equal"."~0.1.0" =
    self.by-version."deep-equal"."0.1.2";
  by-version."deep-equal"."0.1.2" = self.buildNodePackage {
    name = "deep-equal-0.1.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/deep-equal/-/deep-equal-0.1.2.tgz";
      name = "deep-equal-0.1.2.tgz";
      sha1 = "b246c2b80a570a47c11be1d9bd1070ec878b87ce";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."deep-equal"."~0.2.1" =
    self.by-version."deep-equal"."0.2.1";
  by-spec."deep-extend"."~0.2.5" =
    self.by-version."deep-extend"."0.2.11";
  by-version."deep-extend"."0.2.11" = self.buildNodePackage {
    name = "deep-extend-0.2.11";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/deep-extend/-/deep-extend-0.2.11.tgz";
      name = "deep-extend-0.2.11.tgz";
      sha1 = "7a16ba69729132340506170494bc83f7076fe08f";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."defaults"."^1.0.0" =
    self.by-version."defaults"."1.0.0";
  by-version."defaults"."1.0.0" = self.buildNodePackage {
    name = "defaults-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/defaults/-/defaults-1.0.0.tgz";
      name = "defaults-1.0.0.tgz";
      sha1 = "3ae25f44416c6c01f9809a25fcdd285912d2a6b1";
    };
    deps = {
      "clone-0.1.19" = self.by-version."clone"."0.1.19";
    };
    peerDependencies = [];
  };
  by-spec."defined"."~0.0.0" =
    self.by-version."defined"."0.0.0";
  by-version."defined"."0.0.0" = self.buildNodePackage {
    name = "defined-0.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/defined/-/defined-0.0.0.tgz";
      name = "defined-0.0.0.tgz";
      sha1 = "f35eea7d705e933baf13b2f03b3f83d921403b3e";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."delayed-stream"."0.0.5" =
    self.by-version."delayed-stream"."0.0.5";
  by-version."delayed-stream"."0.0.5" = self.buildNodePackage {
    name = "delayed-stream-0.0.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/delayed-stream/-/delayed-stream-0.0.5.tgz";
      name = "delayed-stream-0.0.5.tgz";
      sha1 = "d4b1f43a93e8296dfe02694f4680bc37a313c73f";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."delegates"."^0.1.0" =
    self.by-version."delegates"."0.1.0";
  by-version."delegates"."0.1.0" = self.buildNodePackage {
    name = "delegates-0.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/delegates/-/delegates-0.1.0.tgz";
      name = "delegates-0.1.0.tgz";
      sha1 = "b4b57be11a1653517a04b27f0949bdc327dfe390";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."depd"."0.4.5" =
    self.by-version."depd"."0.4.5";
  by-version."depd"."0.4.5" = self.buildNodePackage {
    name = "depd-0.4.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/depd/-/depd-0.4.5.tgz";
      name = "depd-0.4.5.tgz";
      sha1 = "1a664b53388b4a6573e8ae67b5f767c693ca97f1";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."deps-sort"."~0.1.1" =
    self.by-version."deps-sort"."0.1.2";
  by-version."deps-sort"."0.1.2" = self.buildNodePackage {
    name = "deps-sort-0.1.2";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/deps-sort/-/deps-sort-0.1.2.tgz";
      name = "deps-sort-0.1.2.tgz";
      sha1 = "daa2fb614a17c9637d801e2f55339ae370f3611a";
    };
    deps = {
      "through-2.3.6" = self.by-version."through"."2.3.6";
      "JSONStream-0.6.4" = self.by-version."JSONStream"."0.6.4";
      "minimist-0.0.10" = self.by-version."minimist"."0.0.10";
    };
    peerDependencies = [];
  };
  by-spec."derequire"."~0.8.0" =
    self.by-version."derequire"."0.8.0";
  by-version."derequire"."0.8.0" = self.buildNodePackage {
    name = "derequire-0.8.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/derequire/-/derequire-0.8.0.tgz";
      name = "derequire-0.8.0.tgz";
      sha1 = "c1f7f1da2cede44adede047378f03f444e9c4c0d";
    };
    deps = {
      "estraverse-1.5.1" = self.by-version."estraverse"."1.5.1";
      "esrefactor-0.1.0" = self.by-version."esrefactor"."0.1.0";
      "esprima-fb-3001.1.0-dev-harmony-fb" = self.by-version."esprima-fb"."3001.1.0-dev-harmony-fb";
    };
    peerDependencies = [];
  };
  by-spec."destroy"."1.0.3" =
    self.by-version."destroy"."1.0.3";
  by-version."destroy"."1.0.3" = self.buildNodePackage {
    name = "destroy-1.0.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/destroy/-/destroy-1.0.3.tgz";
      name = "destroy-1.0.3.tgz";
      sha1 = "b433b4724e71fd8551d9885174851c5fc377e2c9";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."detective"."~3.1.0" =
    self.by-version."detective"."3.1.0";
  by-version."detective"."3.1.0" = self.buildNodePackage {
    name = "detective-3.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/detective/-/detective-3.1.0.tgz";
      name = "detective-3.1.0.tgz";
      sha1 = "77782444ab752b88ca1be2e9d0a0395f1da25eed";
    };
    deps = {
      "escodegen-1.1.0" = self.by-version."escodegen"."1.1.0";
      "esprima-fb-3001.1.0-dev-harmony-fb" = self.by-version."esprima-fb"."3001.1.0-dev-harmony-fb";
    };
    peerDependencies = [];
  };
  by-spec."dezalgo"."^1.0.0" =
    self.by-version."dezalgo"."1.0.1";
  by-version."dezalgo"."1.0.1" = self.buildNodePackage {
    name = "dezalgo-1.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/dezalgo/-/dezalgo-1.0.1.tgz";
      name = "dezalgo-1.0.1.tgz";
      sha1 = "12bde135060807900d5a7aebb607c2abb7c76937";
    };
    deps = {
      "asap-1.0.0" = self.by-version."asap"."1.0.0";
      "wrappy-1.0.1" = self.by-version."wrappy"."1.0.1";
    };
    peerDependencies = [];
  };
  by-spec."dezalgo"."^1.0.1" =
    self.by-version."dezalgo"."1.0.1";
  by-spec."dezalgo"."~1.0.1" =
    self.by-version."dezalgo"."1.0.1";
  by-spec."di"."~0.0.1" =
    self.by-version."di"."0.0.1";
  by-version."di"."0.0.1" = self.buildNodePackage {
    name = "di-0.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/di/-/di-0.0.1.tgz";
      name = "di-0.0.1.tgz";
      sha1 = "806649326ceaa7caa3306d75d985ea2748ba913c";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."diff"."1.0.8" =
    self.by-version."diff"."1.0.8";
  by-version."diff"."1.0.8" = self.buildNodePackage {
    name = "diff-1.0.8";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/diff/-/diff-1.0.8.tgz";
      name = "diff-1.0.8.tgz";
      sha1 = "343276308ec991b7bc82267ed55bc1411f971666";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."diff"."1.1.0" =
    self.by-version."diff"."1.1.0";
  by-version."diff"."1.1.0" = self.buildNodePackage {
    name = "diff-1.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/diff/-/diff-1.1.0.tgz";
      name = "diff-1.1.0.tgz";
      sha1 = "798a49381aa464151e9b4f0e6ff2b09a8a1ad23f";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."digdug"."1.2.1" =
    self.by-version."digdug"."1.2.1";
  by-version."digdug"."1.2.1" = self.buildNodePackage {
    name = "digdug-1.2.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/digdug/-/digdug-1.2.1.tgz";
      name = "digdug-1.2.1.tgz";
      sha1 = "9f8d050bd772e40d56ececf8a49a29a38bf8d808";
    };
    deps = {
      "dojo-2.0.0-alpha4" = self.by-version."dojo"."2.0.0-alpha4";
      "decompress-0.2.3" = self.by-version."decompress"."0.2.3";
    };
    peerDependencies = [];
  };
  by-spec."dojo"."2.0.0-alpha4" =
    self.by-version."dojo"."2.0.0-alpha4";
  by-version."dojo"."2.0.0-alpha4" = self.buildNodePackage {
    name = "dojo-2.0.0-alpha4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/dojo/-/dojo-2.0.0-alpha4.tgz";
      name = "dojo-2.0.0-alpha4.tgz";
      sha1 = "3944d18d9f694bf84e641aad4c7d4f3437cb0459";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."dojo"."https://github.com/csnover/dojo2-core/archive/ebfa11ba3972944218623a4bd9d124cb8108d70c.tar.gz" =
    self.by-version."dojo"."2.0.0-dev";
  by-version."dojo"."2.0.0-dev" = self.buildNodePackage {
    name = "dojo-2.0.0-dev";
    bin = false;
    src = fetchurl {
      url = "https://github.com/csnover/dojo2-core/archive/ebfa11ba3972944218623a4bd9d124cb8108d70c.tar.gz";
      name = "dojo-2.0.0-dev.tgz";
      sha256 = "5cf27b6f99902d15ecd8ba1e14fdb95288e3a4bebf99e9a595cbd856faaaea87";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."domain-browser"."~1.1.0" =
    self.by-version."domain-browser"."1.1.4";
  by-version."domain-browser"."1.1.4" = self.buildNodePackage {
    name = "domain-browser-1.1.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/domain-browser/-/domain-browser-1.1.4.tgz";
      name = "domain-browser-1.1.4.tgz";
      sha1 = "90b42769333e909ce3f13bf3e1023ba4a6d6b723";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."domelementtype"."1" =
    self.by-version."domelementtype"."1.1.3";
  by-version."domelementtype"."1.1.3" = self.buildNodePackage {
    name = "domelementtype-1.1.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/domelementtype/-/domelementtype-1.1.3.tgz";
      name = "domelementtype-1.1.3.tgz";
      sha1 = "bd28773e2642881aec51544924299c5cd822185b";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."domhandler"."2.1" =
    self.by-version."domhandler"."2.1.0";
  by-version."domhandler"."2.1.0" = self.buildNodePackage {
    name = "domhandler-2.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/domhandler/-/domhandler-2.1.0.tgz";
      name = "domhandler-2.1.0.tgz";
      sha1 = "d2646f5e57f6c3bab11cf6cb05d3c0acf7412594";
    };
    deps = {
      "domelementtype-1.1.3" = self.by-version."domelementtype"."1.1.3";
    };
    peerDependencies = [];
  };
  by-spec."domutils"."1.1" =
    self.by-version."domutils"."1.1.6";
  by-version."domutils"."1.1.6" = self.buildNodePackage {
    name = "domutils-1.1.6";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/domutils/-/domutils-1.1.6.tgz";
      name = "domutils-1.1.6.tgz";
      sha1 = "bddc3de099b9a2efacc51c623f28f416ecc57485";
    };
    deps = {
      "domelementtype-1.1.3" = self.by-version."domelementtype"."1.1.3";
    };
    peerDependencies = [];
  };
  by-spec."duplexer"."~0.1.1" =
    self.by-version."duplexer"."0.1.1";
  by-version."duplexer"."0.1.1" = self.buildNodePackage {
    name = "duplexer-0.1.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/duplexer/-/duplexer-0.1.1.tgz";
      name = "duplexer-0.1.1.tgz";
      sha1 = "ace6ff808c1ce66b57d1ebf97977acb02334cfc1";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."duplexer2"."0.0.2" =
    self.by-version."duplexer2"."0.0.2";
  by-version."duplexer2"."0.0.2" = self.buildNodePackage {
    name = "duplexer2-0.0.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/duplexer2/-/duplexer2-0.0.2.tgz";
      name = "duplexer2-0.0.2.tgz";
      sha1 = "c614dcf67e2fb14995a91711e5a617e8a60a31db";
    };
    deps = {
      "readable-stream-1.1.13" = self.by-version."readable-stream"."1.1.13";
    };
    peerDependencies = [];
  };
  by-spec."editor"."~0.1.0" =
    self.by-version."editor"."0.1.0";
  by-version."editor"."0.1.0" = self.buildNodePackage {
    name = "editor-0.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/editor/-/editor-0.1.0.tgz";
      name = "editor-0.1.0.tgz";
      sha1 = "542f4662c6a8c88e862fc11945e204e51981b9a1";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."ee-first"."1.0.5" =
    self.by-version."ee-first"."1.0.5";
  by-version."ee-first"."1.0.5" = self.buildNodePackage {
    name = "ee-first-1.0.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/ee-first/-/ee-first-1.0.5.tgz";
      name = "ee-first-1.0.5.tgz";
      sha1 = "8c9b212898d8cd9f1a9436650ce7be202c9e9ff0";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."errorhandler"."~1.2.2" =
    self.by-version."errorhandler"."1.2.4";
  by-version."errorhandler"."1.2.4" = self.buildNodePackage {
    name = "errorhandler-1.2.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/errorhandler/-/errorhandler-1.2.4.tgz";
      name = "errorhandler-1.2.4.tgz";
      sha1 = "4726630d6c6c2c11a7cd589b7376f7336473d6aa";
    };
    deps = {
      "accepts-1.1.4" = self.by-version."accepts"."1.1.4";
      "escape-html-1.0.1" = self.by-version."escape-html"."1.0.1";
    };
    peerDependencies = [];
  };
  by-spec."es5-ext"."~0.10.2" =
    self.by-version."es5-ext"."0.10.6";
  by-version."es5-ext"."0.10.6" = self.buildNodePackage {
    name = "es5-ext-0.10.6";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/es5-ext/-/es5-ext-0.10.6.tgz";
      name = "es5-ext-0.10.6.tgz";
      sha1 = "e27d5750401a11c08259e3b9b5d3bdd3281df00a";
    };
    deps = {
      "es6-iterator-0.1.3" = self.by-version."es6-iterator"."0.1.3";
      "es6-symbol-2.0.1" = self.by-version."es6-symbol"."2.0.1";
    };
    peerDependencies = [];
  };
  by-spec."es5-ext"."~0.10.4" =
    self.by-version."es5-ext"."0.10.6";
  by-spec."es5-ext"."~0.10.5" =
    self.by-version."es5-ext"."0.10.6";
  by-spec."es6-iterator"."~0.1.1" =
    self.by-version."es6-iterator"."0.1.3";
  by-version."es6-iterator"."0.1.3" = self.buildNodePackage {
    name = "es6-iterator-0.1.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/es6-iterator/-/es6-iterator-0.1.3.tgz";
      name = "es6-iterator-0.1.3.tgz";
      sha1 = "d6f58b8c4fc413c249b4baa19768f8e4d7c8944e";
    };
    deps = {
      "d-0.1.1" = self.by-version."d"."0.1.1";
      "es5-ext-0.10.6" = self.by-version."es5-ext"."0.10.6";
      "es6-symbol-2.0.1" = self.by-version."es6-symbol"."2.0.1";
    };
    peerDependencies = [];
  };
  by-spec."es6-iterator"."~0.1.3" =
    self.by-version."es6-iterator"."0.1.3";
  by-spec."es6-symbol"."0.1.x" =
    self.by-version."es6-symbol"."0.1.1";
  by-version."es6-symbol"."0.1.1" = self.buildNodePackage {
    name = "es6-symbol-0.1.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/es6-symbol/-/es6-symbol-0.1.1.tgz";
      name = "es6-symbol-0.1.1.tgz";
      sha1 = "9cf7fab2edaff1b1da8fe8e68bfe3f5aca6ca218";
    };
    deps = {
      "d-0.1.1" = self.by-version."d"."0.1.1";
      "es5-ext-0.10.6" = self.by-version."es5-ext"."0.10.6";
    };
    peerDependencies = [];
  };
  by-spec."es6-symbol"."~2.0.1" =
    self.by-version."es6-symbol"."2.0.1";
  by-version."es6-symbol"."2.0.1" = self.buildNodePackage {
    name = "es6-symbol-2.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/es6-symbol/-/es6-symbol-2.0.1.tgz";
      name = "es6-symbol-2.0.1.tgz";
      sha1 = "761b5c67cfd4f1d18afb234f691d678682cb3bf3";
    };
    deps = {
      "d-0.1.1" = self.by-version."d"."0.1.1";
      "es5-ext-0.10.6" = self.by-version."es5-ext"."0.10.6";
    };
    peerDependencies = [];
  };
  by-spec."es6-weak-map"."~0.1.2" =
    self.by-version."es6-weak-map"."0.1.2";
  by-version."es6-weak-map"."0.1.2" = self.buildNodePackage {
    name = "es6-weak-map-0.1.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/es6-weak-map/-/es6-weak-map-0.1.2.tgz";
      name = "es6-weak-map-0.1.2.tgz";
      sha1 = "bc5b5fab73f68f6f77a6b39c481fce3d7856d385";
    };
    deps = {
      "d-0.1.1" = self.by-version."d"."0.1.1";
      "es5-ext-0.10.6" = self.by-version."es5-ext"."0.10.6";
      "es6-iterator-0.1.3" = self.by-version."es6-iterator"."0.1.3";
      "es6-symbol-0.1.1" = self.by-version."es6-symbol"."0.1.1";
    };
    peerDependencies = [];
  };
  by-spec."escape-html"."1.0.1" =
    self.by-version."escape-html"."1.0.1";
  by-version."escape-html"."1.0.1" = self.buildNodePackage {
    name = "escape-html-1.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/escape-html/-/escape-html-1.0.1.tgz";
      name = "escape-html-1.0.1.tgz";
      sha1 = "181a286ead397a39a92857cfb1d43052e356bff0";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."escape-string-regexp"."1.0.2" =
    self.by-version."escape-string-regexp"."1.0.2";
  by-version."escape-string-regexp"."1.0.2" = self.buildNodePackage {
    name = "escape-string-regexp-1.0.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-1.0.2.tgz";
      name = "escape-string-regexp-1.0.2.tgz";
      sha1 = "4dbc2fe674e71949caf3fb2695ce7f2dc1d9a8d1";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."escape-string-regexp"."^1.0.0" =
    self.by-version."escape-string-regexp"."1.0.2";
  by-spec."escodegen"."1.3.x" =
    self.by-version."escodegen"."1.3.3";
  by-version."escodegen"."1.3.3" = self.buildNodePackage {
    name = "escodegen-1.3.3";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/escodegen/-/escodegen-1.3.3.tgz";
      name = "escodegen-1.3.3.tgz";
      sha1 = "f024016f5a88e046fd12005055e939802e6c5f23";
    };
    deps = {
      "esutils-1.0.0" = self.by-version."esutils"."1.0.0";
      "estraverse-1.5.1" = self.by-version."estraverse"."1.5.1";
      "esprima-1.1.1" = self.by-version."esprima"."1.1.1";
      "source-map-0.1.43" = self.by-version."source-map"."0.1.43";
    };
    peerDependencies = [];
  };
  by-spec."escodegen"."~1.1.0" =
    self.by-version."escodegen"."1.1.0";
  by-version."escodegen"."1.1.0" = self.buildNodePackage {
    name = "escodegen-1.1.0";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/escodegen/-/escodegen-1.1.0.tgz";
      name = "escodegen-1.1.0.tgz";
      sha1 = "c663923f6e20aad48d0c0fa49f31c6d4f49360cf";
    };
    deps = {
      "esprima-1.0.4" = self.by-version."esprima"."1.0.4";
      "estraverse-1.5.1" = self.by-version."estraverse"."1.5.1";
      "esutils-1.0.0" = self.by-version."esutils"."1.0.0";
      "source-map-0.1.43" = self.by-version."source-map"."0.1.43";
    };
    peerDependencies = [];
  };
  by-spec."escope"."~0.0.13" =
    self.by-version."escope"."0.0.16";
  by-version."escope"."0.0.16" = self.buildNodePackage {
    name = "escope-0.0.16";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/escope/-/escope-0.0.16.tgz";
      name = "escope-0.0.16.tgz";
      sha1 = "418c7a0afca721dafe659193fd986283e746538f";
    };
    deps = {
      "estraverse-1.9.1" = self.by-version."estraverse"."1.9.1";
    };
    peerDependencies = [];
  };
  by-spec."esprima"."1.2.x" =
    self.by-version."esprima"."1.2.4";
  by-version."esprima"."1.2.4" = self.buildNodePackage {
    name = "esprima-1.2.4";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/esprima/-/esprima-1.2.4.tgz";
      name = "esprima-1.2.4.tgz";
      sha1 = "835a0cfc8a628a7117da654bfaced8408a91dba7";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."esprima"."~ 1.0.2" =
    self.by-version."esprima"."1.0.4";
  by-version."esprima"."1.0.4" = self.buildNodePackage {
    name = "esprima-1.0.4";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/esprima/-/esprima-1.0.4.tgz";
      name = "esprima-1.0.4.tgz";
      sha1 = "9f557e08fc3b4d26ece9dd34f8fbf476b62585ad";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."esprima"."~1.0.2" =
    self.by-version."esprima"."1.0.4";
  by-spec."esprima"."~1.0.4" =
    self.by-version."esprima"."1.0.4";
  by-spec."esprima"."~1.1.1" =
    self.by-version."esprima"."1.1.1";
  by-version."esprima"."1.1.1" = self.buildNodePackage {
    name = "esprima-1.1.1";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/esprima/-/esprima-1.1.1.tgz";
      name = "esprima-1.1.1.tgz";
      sha1 = "5b6f1547f4d102e670e140c509be6771d6aeb549";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."esprima-fb"."3001.1.0-dev-harmony-fb" =
    self.by-version."esprima-fb"."3001.1.0-dev-harmony-fb";
  by-version."esprima-fb"."3001.1.0-dev-harmony-fb" = self.buildNodePackage {
    name = "esprima-fb-3001.1.0-dev-harmony-fb";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/esprima-fb/-/esprima-fb-3001.0001.0000-dev-harmony-fb.tgz";
      name = "esprima-fb-3001.1.0-dev-harmony-fb.tgz";
      sha1 = "b77d37abcd38ea0b77426bb8bc2922ce6b426411";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."esprima-fb"."^3001.1.0-dev-harmony-fb" =
    self.by-version."esprima-fb"."3001.1.0-dev-harmony-fb";
  by-spec."esrefactor"."~0.1.0" =
    self.by-version."esrefactor"."0.1.0";
  by-version."esrefactor"."0.1.0" = self.buildNodePackage {
    name = "esrefactor-0.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/esrefactor/-/esrefactor-0.1.0.tgz";
      name = "esrefactor-0.1.0.tgz";
      sha1 = "d142795a282339ab81e936b5b7a21b11bf197b13";
    };
    deps = {
      "esprima-1.0.4" = self.by-version."esprima"."1.0.4";
      "estraverse-0.0.4" = self.by-version."estraverse"."0.0.4";
      "escope-0.0.16" = self.by-version."escope"."0.0.16";
    };
    peerDependencies = [];
  };
  by-spec."estraverse".">= 0.0.2" =
    self.by-version."estraverse"."1.9.1";
  by-version."estraverse"."1.9.1" = self.buildNodePackage {
    name = "estraverse-1.9.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/estraverse/-/estraverse-1.9.1.tgz";
      name = "estraverse-1.9.1.tgz";
      sha1 = "553a74829ef763ea6153807f86b90ccde5e32231";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."estraverse"."~0.0.4" =
    self.by-version."estraverse"."0.0.4";
  by-version."estraverse"."0.0.4" = self.buildNodePackage {
    name = "estraverse-0.0.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/estraverse/-/estraverse-0.0.4.tgz";
      name = "estraverse-0.0.4.tgz";
      sha1 = "01a0932dfee574684a598af5a67c3bf9b6428db2";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."estraverse"."~1.5.0" =
    self.by-version."estraverse"."1.5.1";
  by-version."estraverse"."1.5.1" = self.buildNodePackage {
    name = "estraverse-1.5.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/estraverse/-/estraverse-1.5.1.tgz";
      name = "estraverse-1.5.1.tgz";
      sha1 = "867a3e8e58a9f84618afb6c2ddbcd916b7cbaf71";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."esutils"."~1.0.0" =
    self.by-version."esutils"."1.0.0";
  by-version."esutils"."1.0.0" = self.buildNodePackage {
    name = "esutils-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/esutils/-/esutils-1.0.0.tgz";
      name = "esutils-1.0.0.tgz";
      sha1 = "8151d358e20c8acc7fb745e7472c0025fe496570";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."etag"."~1.4.0" =
    self.by-version."etag"."1.4.0";
  by-version."etag"."1.4.0" = self.buildNodePackage {
    name = "etag-1.4.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/etag/-/etag-1.4.0.tgz";
      name = "etag-1.4.0.tgz";
      sha1 = "3050991615857707c04119d075ba2088e0701225";
    };
    deps = {
      "crc-3.0.0" = self.by-version."crc"."3.0.0";
    };
    peerDependencies = [];
  };
  by-spec."etag"."~1.5.0" =
    self.by-version."etag"."1.5.1";
  by-version."etag"."1.5.1" = self.buildNodePackage {
    name = "etag-1.5.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/etag/-/etag-1.5.1.tgz";
      name = "etag-1.5.1.tgz";
      sha1 = "54c50de04ee42695562925ac566588291be7e9ea";
    };
    deps = {
      "crc-3.2.1" = self.by-version."crc"."3.2.1";
    };
    peerDependencies = [];
  };
  by-spec."event-emitter"."~0.3.1" =
    self.by-version."event-emitter"."0.3.3";
  by-version."event-emitter"."0.3.3" = self.buildNodePackage {
    name = "event-emitter-0.3.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/event-emitter/-/event-emitter-0.3.3.tgz";
      name = "event-emitter-0.3.3.tgz";
      sha1 = "df8e806541c68ab8ff20a79a1841b91abaa1bee4";
    };
    deps = {
      "es5-ext-0.10.6" = self.by-version."es5-ext"."0.10.6";
      "d-0.1.1" = self.by-version."d"."0.1.1";
    };
    peerDependencies = [];
  };
  by-spec."event-stream"."~3.1.0" =
    self.by-version."event-stream"."3.1.7";
  by-version."event-stream"."3.1.7" = self.buildNodePackage {
    name = "event-stream-3.1.7";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/event-stream/-/event-stream-3.1.7.tgz";
      name = "event-stream-3.1.7.tgz";
      sha1 = "b4c540012d0fe1498420f3d8946008db6393c37a";
    };
    deps = {
      "through-2.3.6" = self.by-version."through"."2.3.6";
      "duplexer-0.1.1" = self.by-version."duplexer"."0.1.1";
      "from-0.1.3" = self.by-version."from"."0.1.3";
      "map-stream-0.1.0" = self.by-version."map-stream"."0.1.0";
      "pause-stream-0.0.11" = self.by-version."pause-stream"."0.0.11";
      "split-0.2.10" = self.by-version."split"."0.2.10";
      "stream-combiner-0.0.4" = self.by-version."stream-combiner"."0.0.4";
    };
    peerDependencies = [];
  };
  by-spec."eventemitter2"."~0.4.13" =
    self.by-version."eventemitter2"."0.4.14";
  by-version."eventemitter2"."0.4.14" = self.buildNodePackage {
    name = "eventemitter2-0.4.14";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/eventemitter2/-/eventemitter2-0.4.14.tgz";
      name = "eventemitter2-0.4.14.tgz";
      sha1 = "8f61b75cde012b2e9eb284d4545583b5643b61ab";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."events"."~1.0.0" =
    self.by-version."events"."1.0.2";
  by-version."events"."1.0.2" = self.buildNodePackage {
    name = "events-1.0.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/events/-/events-1.0.2.tgz";
      name = "events-1.0.2.tgz";
      sha1 = "75849dcfe93d10fb057c30055afdbd51d06a8e24";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."exit"."0.1.x" =
    self.by-version."exit"."0.1.2";
  by-version."exit"."0.1.2" = self.buildNodePackage {
    name = "exit-0.1.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/exit/-/exit-0.1.2.tgz";
      name = "exit-0.1.2.tgz";
      sha1 = "0632638f8d877cc82107d30a0fff1a17cba1cd0c";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."exit"."~0.1.1" =
    self.by-version."exit"."0.1.2";
  by-spec."expect.js"."~0.2.0" =
    self.by-version."expect.js"."0.2.0";
  by-version."expect.js"."0.2.0" = self.buildNodePackage {
    name = "expect.js-0.2.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/expect.js/-/expect.js-0.2.0.tgz";
      name = "expect.js-0.2.0.tgz";
      sha1 = "1028533d2c1c363f74a6796ff57ec0520ded2be1";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."express-session"."~1.8.2" =
    self.by-version."express-session"."1.8.2";
  by-version."express-session"."1.8.2" = self.buildNodePackage {
    name = "express-session-1.8.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/express-session/-/express-session-1.8.2.tgz";
      name = "express-session-1.8.2.tgz";
      sha1 = "c4011e728a2349b3c18f117a5409908985e83483";
    };
    deps = {
      "cookie-0.1.2" = self.by-version."cookie"."0.1.2";
      "cookie-signature-1.0.5" = self.by-version."cookie-signature"."1.0.5";
      "crc-3.0.0" = self.by-version."crc"."3.0.0";
      "debug-2.0.0" = self.by-version."debug"."2.0.0";
      "depd-0.4.5" = self.by-version."depd"."0.4.5";
      "on-headers-1.0.0" = self.by-version."on-headers"."1.0.0";
      "parseurl-1.3.0" = self.by-version."parseurl"."1.3.0";
      "uid-safe-1.0.1" = self.by-version."uid-safe"."1.0.1";
      "utils-merge-1.0.0" = self.by-version."utils-merge"."1.0.0";
    };
    peerDependencies = [];
  };
  by-spec."ext-list"."^0.2.0" =
    self.by-version."ext-list"."0.2.0";
  by-version."ext-list"."0.2.0" = self.buildNodePackage {
    name = "ext-list-0.2.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/ext-list/-/ext-list-0.2.0.tgz";
      name = "ext-list-0.2.0.tgz";
      sha1 = "3614d5f299f4a592a89629e7de825f1774d19abd";
    };
    deps = {
      "got-0.2.0" = self.by-version."got"."0.2.0";
    };
    peerDependencies = [];
  };
  by-spec."extend"."^1.3.0" =
    self.by-version."extend"."1.3.0";
  by-version."extend"."1.3.0" = self.buildNodePackage {
    name = "extend-1.3.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/extend/-/extend-1.3.0.tgz";
      name = "extend-1.3.0.tgz";
      sha1 = "d1516fb0ff5624d2ebf9123ea1dac5a1994004f8";
    };
    deps = {
    };
    peerDependencies = [];
  };
  "extend" = self.by-version."extend"."1.3.0";
  by-spec."extname"."^0.1.1" =
    self.by-version."extname"."0.1.5";
  by-version."extname"."0.1.5" = self.buildNodePackage {
    name = "extname-0.1.5";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/extname/-/extname-0.1.5.tgz";
      name = "extname-0.1.5.tgz";
      sha1 = "3cbb388d0dac6086c53133cdfa108074d8a7552e";
    };
    deps = {
      "ext-list-0.2.0" = self.by-version."ext-list"."0.2.0";
      "map-key-0.1.5" = self.by-version."map-key"."0.1.5";
      "underscore.string-2.3.3" = self.by-version."underscore.string"."2.3.3";
    };
    peerDependencies = [];
  };
  by-spec."eyes"."0.1.x" =
    self.by-version."eyes"."0.1.8";
  by-version."eyes"."0.1.8" = self.buildNodePackage {
    name = "eyes-0.1.8";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/eyes/-/eyes-0.1.8.tgz";
      name = "eyes-0.1.8.tgz";
      sha1 = "62cf120234c683785d902348a800ef3e0cc20bc0";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."faye-websocket"."~0.4.3" =
    self.by-version."faye-websocket"."0.4.4";
  by-version."faye-websocket"."0.4.4" = self.buildNodePackage {
    name = "faye-websocket-0.4.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/faye-websocket/-/faye-websocket-0.4.4.tgz";
      name = "faye-websocket-0.4.4.tgz";
      sha1 = "c14c5b3bf14d7417ffbfd990c0a7495cd9f337bc";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."fileset"."0.1.x" =
    self.by-version."fileset"."0.1.5";
  by-version."fileset"."0.1.5" = self.buildNodePackage {
    name = "fileset-0.1.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/fileset/-/fileset-0.1.5.tgz";
      name = "fileset-0.1.5.tgz";
      sha1 = "acc423bfaf92843385c66bf75822264d11b7bd94";
    };
    deps = {
      "minimatch-0.4.0" = self.by-version."minimatch"."0.4.0";
      "glob-3.2.11" = self.by-version."glob"."3.2.11";
    };
    peerDependencies = [];
  };
  by-spec."finalhandler"."0.2.0" =
    self.by-version."finalhandler"."0.2.0";
  by-version."finalhandler"."0.2.0" = self.buildNodePackage {
    name = "finalhandler-0.2.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/finalhandler/-/finalhandler-0.2.0.tgz";
      name = "finalhandler-0.2.0.tgz";
      sha1 = "794082424b17f6a4b2a0eda39f9db6948ee4be8d";
    };
    deps = {
      "debug-2.0.0" = self.by-version."debug"."2.0.0";
      "escape-html-1.0.1" = self.by-version."escape-html"."1.0.1";
    };
    peerDependencies = [];
  };
  by-spec."findup-sync"."^0.1.2" =
    self.by-version."findup-sync"."0.1.3";
  by-version."findup-sync"."0.1.3" = self.buildNodePackage {
    name = "findup-sync-0.1.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/findup-sync/-/findup-sync-0.1.3.tgz";
      name = "findup-sync-0.1.3.tgz";
      sha1 = "7f3e7a97b82392c653bf06589bd85190e93c3683";
    };
    deps = {
      "glob-3.2.11" = self.by-version."glob"."3.2.11";
      "lodash-2.4.1" = self.by-version."lodash"."2.4.1";
    };
    peerDependencies = [];
  };
  by-spec."findup-sync"."~0.1.2" =
    self.by-version."findup-sync"."0.1.3";
  by-spec."fixture-stdout"."^0.2.1" =
    self.by-version."fixture-stdout"."0.2.1";
  by-version."fixture-stdout"."0.2.1" = self.buildNodePackage {
    name = "fixture-stdout-0.2.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/fixture-stdout/-/fixture-stdout-0.2.1.tgz";
      name = "fixture-stdout-0.2.1.tgz";
      sha1 = "0b7966535ab87cf03f8dcbefabdac3effe195a24";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."forever-agent"."~0.5.0" =
    self.by-version."forever-agent"."0.5.2";
  by-version."forever-agent"."0.5.2" = self.buildNodePackage {
    name = "forever-agent-0.5.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/forever-agent/-/forever-agent-0.5.2.tgz";
      name = "forever-agent-0.5.2.tgz";
      sha1 = "6d0e09c4921f94a27f63d3b49c5feff1ea4c5130";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."form-data"."~0.1.0" =
    self.by-version."form-data"."0.1.4";
  by-version."form-data"."0.1.4" = self.buildNodePackage {
    name = "form-data-0.1.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/form-data/-/form-data-0.1.4.tgz";
      name = "form-data-0.1.4.tgz";
      sha1 = "91abd788aba9702b1aabfa8bc01031a2ac9e3b12";
    };
    deps = {
      "combined-stream-0.0.7" = self.by-version."combined-stream"."0.0.7";
      "mime-1.2.11" = self.by-version."mime"."1.2.11";
      "async-0.9.0" = self.by-version."async"."0.9.0";
    };
    peerDependencies = [];
  };
  by-spec."form-data"."~0.2.0" =
    self.by-version."form-data"."0.2.0";
  by-version."form-data"."0.2.0" = self.buildNodePackage {
    name = "form-data-0.2.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/form-data/-/form-data-0.2.0.tgz";
      name = "form-data-0.2.0.tgz";
      sha1 = "26f8bc26da6440e299cbdcfb69035c4f77a6e466";
    };
    deps = {
      "async-0.9.0" = self.by-version."async"."0.9.0";
      "combined-stream-0.0.7" = self.by-version."combined-stream"."0.0.7";
      "mime-types-2.0.8" = self.by-version."mime-types"."2.0.8";
    };
    peerDependencies = [];
  };
  by-spec."formatio"."~1.0" =
    self.by-version."formatio"."1.0.2";
  by-version."formatio"."1.0.2" = self.buildNodePackage {
    name = "formatio-1.0.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/formatio/-/formatio-1.0.2.tgz";
      name = "formatio-1.0.2.tgz";
      sha1 = "e7991ca144ff7d8cff07bb9ac86a9b79c6ba47ef";
    };
    deps = {
      "samsam-1.1.2" = self.by-version."samsam"."1.1.2";
    };
    peerDependencies = [];
  };
  by-spec."fresh"."0.2.4" =
    self.by-version."fresh"."0.2.4";
  by-version."fresh"."0.2.4" = self.buildNodePackage {
    name = "fresh-0.2.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/fresh/-/fresh-0.2.4.tgz";
      name = "fresh-0.2.4.tgz";
      sha1 = "3582499206c9723714190edd74b4604feb4a614c";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."from"."~0" =
    self.by-version."from"."0.1.3";
  by-version."from"."0.1.3" = self.buildNodePackage {
    name = "from-0.1.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/from/-/from-0.1.3.tgz";
      name = "from-0.1.3.tgz";
      sha1 = "ef63ac2062ac32acf7862e0d40b44b896f22f3bc";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."fs-extra"."~0.16.0" =
    self.by-version."fs-extra"."0.16.3";
  by-version."fs-extra"."0.16.3" = self.buildNodePackage {
    name = "fs-extra-0.16.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/fs-extra/-/fs-extra-0.16.3.tgz";
      name = "fs-extra-0.16.3.tgz";
      sha1 = "4a5663cc51582546625a1bce04f09a1f5ceec35b";
    };
    deps = {
      "graceful-fs-3.0.5" = self.by-version."graceful-fs"."3.0.5";
      "jsonfile-2.0.0" = self.by-version."jsonfile"."2.0.0";
      "rimraf-2.2.8" = self.by-version."rimraf"."2.2.8";
    };
    peerDependencies = [];
  };
  by-spec."fs-vacuum"."~1.2.5" =
    self.by-version."fs-vacuum"."1.2.5";
  by-version."fs-vacuum"."1.2.5" = self.buildNodePackage {
    name = "fs-vacuum-1.2.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/fs-vacuum/-/fs-vacuum-1.2.5.tgz";
      name = "fs-vacuum-1.2.5.tgz";
      sha1 = "a5cbaa844b4b3a7cff139f3cc90e7f7007e5fbb8";
    };
    deps = {
      "graceful-fs-3.0.5" = self.by-version."graceful-fs"."3.0.5";
      "path-is-inside-1.0.1" = self.by-version."path-is-inside"."1.0.1";
      "rimraf-2.2.8" = self.by-version."rimraf"."2.2.8";
    };
    peerDependencies = [];
  };
  by-spec."fs-write-stream-atomic"."~1.0.2" =
    self.by-version."fs-write-stream-atomic"."1.0.2";
  by-version."fs-write-stream-atomic"."1.0.2" = self.buildNodePackage {
    name = "fs-write-stream-atomic-1.0.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/fs-write-stream-atomic/-/fs-write-stream-atomic-1.0.2.tgz";
      name = "fs-write-stream-atomic-1.0.2.tgz";
      sha1 = "fe0c6cec75256072b2fef8180d97e309fe3f5efb";
    };
    deps = {
      "graceful-fs-3.0.5" = self.by-version."graceful-fs"."3.0.5";
    };
    peerDependencies = [];
  };
  by-spec."fsevents"."^0.3.1" =
    self.by-version."fsevents"."0.3.5";
  by-version."fsevents"."0.3.5" = self.buildNodePackage {
    name = "fsevents-0.3.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/fsevents/-/fsevents-0.3.5.tgz";
      name = "fsevents-0.3.5.tgz";
      sha1 = "d0938147614066c0e1297647b3b8ab5a4baf4688";
    };
    deps = {
      "nan-1.5.3" = self.by-version."nan"."1.5.3";
    };
    peerDependencies = [];
  };
  by-spec."fsevents"."pipobscure/fsevents#7dcdf9fa3f8956610fd6f69f72c67bace2de7138" =
    self.by-version."fsevents"."0.2.1";
  by-version."fsevents"."0.2.1" = self.buildNodePackage {
    name = "fsevents-0.2.1";
    bin = false;
    src = fetchgit {
      url = "git://github.com/pipobscure/fsevents.git";
      rev = "7dcdf9fa3f8956610fd6f69f72c67bace2de7138";
      sha256 = "cc89ed7e31ee7e387326c4f9a3668306bdb98ff9cbaff9d7f29e258e56584bfb";
    };
    deps = {
      "nan-0.8.0" = self.by-version."nan"."0.8.0";
    };
    peerDependencies = [];
  };
  by-spec."fstream"."^1.0.0" =
    self.by-version."fstream"."1.0.4";
  by-version."fstream"."1.0.4" = self.buildNodePackage {
    name = "fstream-1.0.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/fstream/-/fstream-1.0.4.tgz";
      name = "fstream-1.0.4.tgz";
      sha1 = "6c52298473fd6351fd22fc4bf9254fcfebe80f2b";
    };
    deps = {
      "graceful-fs-3.0.5" = self.by-version."graceful-fs"."3.0.5";
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
      "mkdirp-0.5.0" = self.by-version."mkdirp"."0.5.0";
      "rimraf-2.2.8" = self.by-version."rimraf"."2.2.8";
    };
    peerDependencies = [];
  };
  by-spec."fstream"."^1.0.2" =
    self.by-version."fstream"."1.0.4";
  by-spec."fstream"."~0.1.28" =
    self.by-version."fstream"."0.1.31";
  by-version."fstream"."0.1.31" = self.buildNodePackage {
    name = "fstream-0.1.31";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/fstream/-/fstream-0.1.31.tgz";
      name = "fstream-0.1.31.tgz";
      sha1 = "7337f058fbbbbefa8c9f561a28cab0849202c988";
    };
    deps = {
      "graceful-fs-3.0.5" = self.by-version."graceful-fs"."3.0.5";
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
      "mkdirp-0.5.0" = self.by-version."mkdirp"."0.5.0";
      "rimraf-2.2.8" = self.by-version."rimraf"."2.2.8";
    };
    peerDependencies = [];
  };
  by-spec."fstream"."~1.0.4" =
    self.by-version."fstream"."1.0.4";
  by-spec."fstream-ignore"."^1.0.0" =
    self.by-version."fstream-ignore"."1.0.2";
  by-version."fstream-ignore"."1.0.2" = self.buildNodePackage {
    name = "fstream-ignore-1.0.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/fstream-ignore/-/fstream-ignore-1.0.2.tgz";
      name = "fstream-ignore-1.0.2.tgz";
      sha1 = "18c891db01b782a74a7bff936a0f24997741c7ab";
    };
    deps = {
      "fstream-1.0.4" = self.by-version."fstream"."1.0.4";
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
      "minimatch-2.0.1" = self.by-version."minimatch"."2.0.1";
    };
    peerDependencies = [];
  };
  by-spec."fstream-npm"."~1.0.1" =
    self.by-version."fstream-npm"."1.0.1";
  by-version."fstream-npm"."1.0.1" = self.buildNodePackage {
    name = "fstream-npm-1.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/fstream-npm/-/fstream-npm-1.0.1.tgz";
      name = "fstream-npm-1.0.1.tgz";
      sha1 = "1e35c77f0fa24f5d6367e6d447ae7d6ddb482db2";
    };
    deps = {
      "fstream-ignore-1.0.2" = self.by-version."fstream-ignore"."1.0.2";
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
    };
    peerDependencies = [];
  };
  by-spec."gauge"."~1.1.0" =
    self.by-version."gauge"."1.1.0";
  by-version."gauge"."1.1.0" = self.buildNodePackage {
    name = "gauge-1.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/gauge/-/gauge-1.1.0.tgz";
      name = "gauge-1.1.0.tgz";
      sha1 = "4f1c13cb6232469f65de92357b34f8ff53c5ca41";
    };
    deps = {
      "ansi-0.3.0" = self.by-version."ansi"."0.3.0";
      "has-unicode-1.0.0" = self.by-version."has-unicode"."1.0.0";
      "lodash.pad-3.0.0" = self.by-version."lodash.pad"."3.0.0";
      "lodash.padleft-3.0.0" = self.by-version."lodash.padleft"."3.0.0";
      "lodash.padright-3.0.0" = self.by-version."lodash.padright"."3.0.0";
    };
    peerDependencies = [];
  };
  by-spec."gaze"."~0.5.1" =
    self.by-version."gaze"."0.5.1";
  by-version."gaze"."0.5.1" = self.buildNodePackage {
    name = "gaze-0.5.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/gaze/-/gaze-0.5.1.tgz";
      name = "gaze-0.5.1.tgz";
      sha1 = "22e731078ef3e49d1c4ab1115ac091192051824c";
    };
    deps = {
      "globule-0.1.0" = self.by-version."globule"."0.1.0";
    };
    peerDependencies = [];
  };
  by-spec."get-stdin"."^0.1.0" =
    self.by-version."get-stdin"."0.1.0";
  by-version."get-stdin"."0.1.0" = self.buildNodePackage {
    name = "get-stdin-0.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/get-stdin/-/get-stdin-0.1.0.tgz";
      name = "get-stdin-0.1.0.tgz";
      sha1 = "5998af24aafc802d15c82c685657eeb8b10d4a91";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."get-stdin"."^3.0.0" =
    self.by-version."get-stdin"."3.0.2";
  by-version."get-stdin"."3.0.2" = self.buildNodePackage {
    name = "get-stdin-3.0.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/get-stdin/-/get-stdin-3.0.2.tgz";
      name = "get-stdin-3.0.2.tgz";
      sha1 = "c1ced24b9039b38ded85bdf161e57713b6dd4abe";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."getobject"."~0.1.0" =
    self.by-version."getobject"."0.1.0";
  by-version."getobject"."0.1.0" = self.buildNodePackage {
    name = "getobject-0.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/getobject/-/getobject-0.1.0.tgz";
      name = "getobject-0.1.0.tgz";
      sha1 = "047a449789fa160d018f5486ed91320b6ec7885c";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."github"."^0.2.1" =
    self.by-version."github"."0.2.3";
  by-version."github"."0.2.3" = self.buildNodePackage {
    name = "github-0.2.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/github/-/github-0.2.3.tgz";
      name = "github-0.2.3.tgz";
      sha1 = "c97cca970a03f0a5376e43f6763091f60f9ea94c";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."github-url-from-git"."^1.3.0" =
    self.by-version."github-url-from-git"."1.4.0";
  by-version."github-url-from-git"."1.4.0" = self.buildNodePackage {
    name = "github-url-from-git-1.4.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/github-url-from-git/-/github-url-from-git-1.4.0.tgz";
      name = "github-url-from-git-1.4.0.tgz";
      sha1 = "285e6b520819001bde128674704379e4ff03e0de";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."github-url-from-git"."~1.4.0" =
    self.by-version."github-url-from-git"."1.4.0";
  by-spec."github-url-from-username-repo"."^1.0.0" =
    self.by-version."github-url-from-username-repo"."1.0.2";
  by-version."github-url-from-username-repo"."1.0.2" = self.buildNodePackage {
    name = "github-url-from-username-repo-1.0.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/github-url-from-username-repo/-/github-url-from-username-repo-1.0.2.tgz";
      name = "github-url-from-username-repo-1.0.2.tgz";
      sha1 = "7dd79330d2abe69c10c2cef79714c97215791dfa";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."github-url-from-username-repo"."~1.0.0" =
    self.by-version."github-url-from-username-repo"."1.0.2";
  by-spec."github-url-from-username-repo"."~1.0.2" =
    self.by-version."github-url-from-username-repo"."1.0.2";
  by-spec."glob"."3 || 4" =
    self.by-version."glob"."4.3.5";
  by-version."glob"."4.3.5" = self.buildNodePackage {
    name = "glob-4.3.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/glob/-/glob-4.3.5.tgz";
      name = "glob-4.3.5.tgz";
      sha1 = "80fbb08ca540f238acce5d11d1e9bc41e75173d3";
    };
    deps = {
      "inflight-1.0.4" = self.by-version."inflight"."1.0.4";
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
      "minimatch-2.0.1" = self.by-version."minimatch"."2.0.1";
      "once-1.3.1" = self.by-version."once"."1.3.1";
    };
    peerDependencies = [];
  };
  by-spec."glob"."3.2.3" =
    self.by-version."glob"."3.2.3";
  by-version."glob"."3.2.3" = self.buildNodePackage {
    name = "glob-3.2.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/glob/-/glob-3.2.3.tgz";
      name = "glob-3.2.3.tgz";
      sha1 = "e313eeb249c7affaa5c475286b0e115b59839467";
    };
    deps = {
      "minimatch-0.2.14" = self.by-version."minimatch"."0.2.14";
      "graceful-fs-2.0.3" = self.by-version."graceful-fs"."2.0.3";
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
    };
    peerDependencies = [];
  };
  by-spec."glob"."3.x" =
    self.by-version."glob"."3.2.11";
  by-version."glob"."3.2.11" = self.buildNodePackage {
    name = "glob-3.2.11";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/glob/-/glob-3.2.11.tgz";
      name = "glob-3.2.11.tgz";
      sha1 = "4a973f635b9190f715d10987d5c00fd2815ebe3d";
    };
    deps = {
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
      "minimatch-0.3.0" = self.by-version."minimatch"."0.3.0";
    };
    peerDependencies = [];
  };
  by-spec."glob".">= 3.1.4" =
    self.by-version."glob"."4.3.5";
  by-spec."glob"."^3.2" =
    self.by-version."glob"."3.2.11";
  by-spec."glob"."^4.0.2" =
    self.by-version."glob"."4.3.5";
  by-spec."glob"."^4.0.5" =
    self.by-version."glob"."4.3.5";
  by-spec."glob"."^4.3.4" =
    self.by-version."glob"."4.3.5";
  by-spec."glob"."~3.1.21" =
    self.by-version."glob"."3.1.21";
  by-version."glob"."3.1.21" = self.buildNodePackage {
    name = "glob-3.1.21";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/glob/-/glob-3.1.21.tgz";
      name = "glob-3.1.21.tgz";
      sha1 = "d29e0a055dea5138f4d07ed40e8982e83c2066cd";
    };
    deps = {
      "minimatch-0.2.14" = self.by-version."minimatch"."0.2.14";
      "graceful-fs-1.2.3" = self.by-version."graceful-fs"."1.2.3";
      "inherits-1.0.0" = self.by-version."inherits"."1.0.0";
    };
    peerDependencies = [];
  };
  by-spec."glob"."~3.2" =
    self.by-version."glob"."3.2.11";
  by-spec."glob"."~3.2.7" =
    self.by-version."glob"."3.2.11";
  by-spec."glob"."~3.2.8" =
    self.by-version."glob"."3.2.11";
  by-spec."glob"."~3.2.9" =
    self.by-version."glob"."3.2.11";
  by-spec."glob"."~4.3.5" =
    self.by-version."glob"."4.3.5";
  by-spec."glob-parent"."^1.0.0" =
    self.by-version."glob-parent"."1.0.0";
  by-version."glob-parent"."1.0.0" = self.buildNodePackage {
    name = "glob-parent-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/glob-parent/-/glob-parent-1.0.0.tgz";
      name = "glob-parent-1.0.0.tgz";
      sha1 = "3344e0e0534fbdd478a7c1f1480f2d8851650a21";
    };
    deps = {
      "is-glob-0.3.0" = self.by-version."is-glob"."0.3.0";
    };
    peerDependencies = [];
  };
  by-spec."globule"."~0.1.0" =
    self.by-version."globule"."0.1.0";
  by-version."globule"."0.1.0" = self.buildNodePackage {
    name = "globule-0.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/globule/-/globule-0.1.0.tgz";
      name = "globule-0.1.0.tgz";
      sha1 = "d9c8edde1da79d125a151b79533b978676346ae5";
    };
    deps = {
      "lodash-1.0.1" = self.by-version."lodash"."1.0.1";
      "glob-3.1.21" = self.by-version."glob"."3.1.21";
      "minimatch-0.2.14" = self.by-version."minimatch"."0.2.14";
    };
    peerDependencies = [];
  };
  by-spec."got"."^0.2.0" =
    self.by-version."got"."0.2.0";
  by-version."got"."0.2.0" = self.buildNodePackage {
    name = "got-0.2.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/got/-/got-0.2.0.tgz";
      name = "got-0.2.0.tgz";
      sha1 = "d00c248b29fdccaea940df9ca0995ebff31b51a5";
    };
    deps = {
      "object-assign-0.3.1" = self.by-version."object-assign"."0.3.1";
    };
    peerDependencies = [];
  };
  by-spec."got"."^1.0.1" =
    self.by-version."got"."1.2.2";
  by-version."got"."1.2.2" = self.buildNodePackage {
    name = "got-1.2.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/got/-/got-1.2.2.tgz";
      name = "got-1.2.2.tgz";
      sha1 = "d9430ba32f6a30218243884418767340aafc0400";
    };
    deps = {
      "object-assign-1.0.0" = self.by-version."object-assign"."1.0.0";
    };
    peerDependencies = [];
  };
  by-spec."graceful-fs"."2 || 3" =
    self.by-version."graceful-fs"."3.0.5";
  by-version."graceful-fs"."3.0.5" = self.buildNodePackage {
    name = "graceful-fs-3.0.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/graceful-fs/-/graceful-fs-3.0.5.tgz";
      name = "graceful-fs-3.0.5.tgz";
      sha1 = "4a880474bdeb716fe3278cf29792dec38dfac418";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."graceful-fs"."3" =
    self.by-version."graceful-fs"."3.0.5";
  by-spec."graceful-fs".">3.0.1 <4.0.0-0" =
    self.by-version."graceful-fs"."3.0.5";
  by-spec."graceful-fs"."^3.0.0" =
    self.by-version."graceful-fs"."3.0.5";
  by-spec."graceful-fs"."^3.0.1" =
    self.by-version."graceful-fs"."3.0.5";
  by-spec."graceful-fs"."^3.0.2" =
    self.by-version."graceful-fs"."3.0.5";
  "graceful-fs" = self.by-version."graceful-fs"."3.0.5";
  by-spec."graceful-fs"."^3.0.4" =
    self.by-version."graceful-fs"."3.0.5";
  by-spec."graceful-fs"."^3.0.5" =
    self.by-version."graceful-fs"."3.0.5";
  by-spec."graceful-fs"."~1.2.0" =
    self.by-version."graceful-fs"."1.2.3";
  by-version."graceful-fs"."1.2.3" = self.buildNodePackage {
    name = "graceful-fs-1.2.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/graceful-fs/-/graceful-fs-1.2.3.tgz";
      name = "graceful-fs-1.2.3.tgz";
      sha1 = "15a4806a57547cb2d2dbf27f42e89a8c3451b364";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."graceful-fs"."~2.0.0" =
    self.by-version."graceful-fs"."2.0.3";
  by-version."graceful-fs"."2.0.3" = self.buildNodePackage {
    name = "graceful-fs-2.0.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/graceful-fs/-/graceful-fs-2.0.3.tgz";
      name = "graceful-fs-2.0.3.tgz";
      sha1 = "7cd2cdb228a4a3f36e95efa6cc142de7d1a136d0";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."graceful-fs"."~2.0.1" =
    self.by-version."graceful-fs"."2.0.3";
  by-spec."graceful-fs"."~3.0.2" =
    self.by-version."graceful-fs"."3.0.5";
  by-spec."graceful-fs"."~3.0.5" =
    self.by-version."graceful-fs"."3.0.5";
  by-spec."growl"."1.8.1" =
    self.by-version."growl"."1.8.1";
  by-version."growl"."1.8.1" = self.buildNodePackage {
    name = "growl-1.8.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/growl/-/growl-1.8.1.tgz";
      name = "growl-1.8.1.tgz";
      sha1 = "4b2dec8d907e93db336624dcec0183502f8c9428";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."grunt"."0.4.x" =
    self.by-version."grunt"."0.4.5";
  by-version."grunt"."0.4.5" = self.buildNodePackage {
    name = "grunt-0.4.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/grunt/-/grunt-0.4.5.tgz";
      name = "grunt-0.4.5.tgz";
      sha1 = "56937cd5194324adff6d207631832a9d6ba4e7f0";
    };
    deps = {
      "async-0.1.22" = self.by-version."async"."0.1.22";
      "coffee-script-1.3.3" = self.by-version."coffee-script"."1.3.3";
      "colors-0.6.2" = self.by-version."colors"."0.6.2";
      "dateformat-1.0.2-1.2.3" = self.by-version."dateformat"."1.0.2-1.2.3";
      "eventemitter2-0.4.14" = self.by-version."eventemitter2"."0.4.14";
      "findup-sync-0.1.3" = self.by-version."findup-sync"."0.1.3";
      "glob-3.1.21" = self.by-version."glob"."3.1.21";
      "hooker-0.2.3" = self.by-version."hooker"."0.2.3";
      "iconv-lite-0.2.11" = self.by-version."iconv-lite"."0.2.11";
      "minimatch-0.2.14" = self.by-version."minimatch"."0.2.14";
      "nopt-1.0.10" = self.by-version."nopt"."1.0.10";
      "rimraf-2.2.8" = self.by-version."rimraf"."2.2.8";
      "lodash-0.9.2" = self.by-version."lodash"."0.9.2";
      "underscore.string-2.2.1" = self.by-version."underscore.string"."2.2.1";
      "which-1.0.8" = self.by-version."which"."1.0.8";
      "js-yaml-2.0.5" = self.by-version."js-yaml"."2.0.5";
      "exit-0.1.2" = self.by-version."exit"."0.1.2";
      "getobject-0.1.0" = self.by-version."getobject"."0.1.0";
      "grunt-legacy-util-0.2.0" = self.by-version."grunt-legacy-util"."0.2.0";
      "grunt-legacy-log-0.1.1" = self.by-version."grunt-legacy-log"."0.1.1";
    };
    peerDependencies = [];
  };
  by-spec."grunt".">=0.4.0" =
    self.by-version."grunt"."0.4.5";
  by-spec."grunt".">=0.4.0-0 >=0.4.5-0 <0.5.0-0" =
    self.by-version."grunt"."0.4.5";
  by-spec."grunt".">=0.4.4-0 >=0.4.0-0 <0.5.0-0" =
    self.by-version."grunt"."0.4.5";
  by-spec."grunt"."^0.4.5" =
    self.by-version."grunt"."0.4.5";
  "grunt" = self.by-version."grunt"."0.4.5";
  by-spec."grunt"."~0.4.0" =
    self.by-version."grunt"."0.4.5";
  by-spec."grunt"."~0.4.4" =
    self.by-version."grunt"."0.4.5";
  by-spec."grunt-browserify"."^2.1.3" =
    self.by-version."grunt-browserify"."2.1.4";
  by-version."grunt-browserify"."2.1.4" = self.buildNodePackage {
    name = "grunt-browserify-2.1.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/grunt-browserify/-/grunt-browserify-2.1.4.tgz";
      name = "grunt-browserify-2.1.4.tgz";
      sha1 = "8cc91b775764e1b9b30779d2e09443065fa2122b";
    };
    deps = {
      "lodash-2.4.1" = self.by-version."lodash"."2.4.1";
      "async-0.7.0" = self.by-version."async"."0.7.0";
      "watchify-0.10.2" = self.by-version."watchify"."0.10.2";
      "resolve-0.6.3" = self.by-version."resolve"."0.6.3";
      "glob-3.2.11" = self.by-version."glob"."3.2.11";
      "browserify-4.2.3" = self.by-version."browserify"."4.2.3";
    };
    peerDependencies = [
      self.by-version."grunt"."0.4.5"];
  };
  "grunt-browserify" = self.by-version."grunt-browserify"."2.1.4";
  by-spec."grunt-bump"."^0.0.15" =
    self.by-version."grunt-bump"."0.0.15";
  by-version."grunt-bump"."0.0.15" = self.buildNodePackage {
    name = "grunt-bump-0.0.15";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/grunt-bump/-/grunt-bump-0.0.15.tgz";
      name = "grunt-bump-0.0.15.tgz";
      sha1 = "2ecf17c3b9df9182cfaad307e20cfd510d52996d";
    };
    deps = {
      "semver-2.3.2" = self.by-version."semver"."2.3.2";
    };
    peerDependencies = [
      self.by-version."grunt"."0.4.5"];
  };
  by-spec."grunt-contrib-jshint"."^0.9.2" =
    self.by-version."grunt-contrib-jshint"."0.9.2";
  by-version."grunt-contrib-jshint"."0.9.2" = self.buildNodePackage {
    name = "grunt-contrib-jshint-0.9.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/grunt-contrib-jshint/-/grunt-contrib-jshint-0.9.2.tgz";
      name = "grunt-contrib-jshint-0.9.2.tgz";
      sha1 = "d6301597bcc3611e95f5f35ff582a7b3d73d20fb";
    };
    deps = {
      "jshint-2.4.4" = self.by-version."jshint"."2.4.4";
      "hooker-0.2.3" = self.by-version."hooker"."0.2.3";
    };
    peerDependencies = [
      self.by-version."grunt"."0.4.5"];
  };
  "grunt-contrib-jshint" = self.by-version."grunt-contrib-jshint"."0.9.2";
  by-spec."grunt-contrib-watch"."^0.6.1" =
    self.by-version."grunt-contrib-watch"."0.6.1";
  by-version."grunt-contrib-watch"."0.6.1" = self.buildNodePackage {
    name = "grunt-contrib-watch-0.6.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/grunt-contrib-watch/-/grunt-contrib-watch-0.6.1.tgz";
      name = "grunt-contrib-watch-0.6.1.tgz";
      sha1 = "64fdcba25a635f5b4da1b6ce6f90da0aeb6e3f15";
    };
    deps = {
      "gaze-0.5.1" = self.by-version."gaze"."0.5.1";
      "tiny-lr-fork-0.0.5" = self.by-version."tiny-lr-fork"."0.0.5";
      "lodash-2.4.1" = self.by-version."lodash"."2.4.1";
      "async-0.2.10" = self.by-version."async"."0.2.10";
    };
    peerDependencies = [
      self.by-version."grunt"."0.4.5"];
  };
  "grunt-contrib-watch" = self.by-version."grunt-contrib-watch"."0.6.1";
  by-spec."grunt-conventional-changelog"."^1.1.0" =
    self.by-version."grunt-conventional-changelog"."1.1.0";
  by-version."grunt-conventional-changelog"."1.1.0" = self.buildNodePackage {
    name = "grunt-conventional-changelog-1.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/grunt-conventional-changelog/-/grunt-conventional-changelog-1.1.0.tgz";
      name = "grunt-conventional-changelog-1.1.0.tgz";
      sha1 = "8bc3d85840c449ede45168af3914487f4754dcee";
    };
    deps = {
      "conventional-changelog-0.0.6" = self.by-version."conventional-changelog"."0.0.6";
    };
    peerDependencies = [];
  };
  by-spec."grunt-hoodie"."^0.5.4" =
    self.by-version."grunt-hoodie"."0.5.4";
  by-version."grunt-hoodie"."0.5.4" = self.buildNodePackage {
    name = "grunt-hoodie-0.5.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/grunt-hoodie/-/grunt-hoodie-0.5.4.tgz";
      name = "grunt-hoodie-0.5.4.tgz";
      sha1 = "098687c86bf1ec0e3891f11c8f9e67bf91c967fa";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."grunt-karma"."^0.8.3" =
    self.by-version."grunt-karma"."0.8.3";
  by-version."grunt-karma"."0.8.3" = self.buildNodePackage {
    name = "grunt-karma-0.8.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/grunt-karma/-/grunt-karma-0.8.3.tgz";
      name = "grunt-karma-0.8.3.tgz";
      sha1 = "e9ecf718153af1914aa53602a37f85de04310e7f";
    };
    deps = {
      "lodash-2.4.1" = self.by-version."lodash"."2.4.1";
    };
    peerDependencies = [
      self.by-version."grunt"."0.4.5"
      self.by-version."karma"."0.12.31"];
  };
  "grunt-karma" = self.by-version."grunt-karma"."0.8.3";
  by-spec."grunt-legacy-log"."~0.1.0" =
    self.by-version."grunt-legacy-log"."0.1.1";
  by-version."grunt-legacy-log"."0.1.1" = self.buildNodePackage {
    name = "grunt-legacy-log-0.1.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/grunt-legacy-log/-/grunt-legacy-log-0.1.1.tgz";
      name = "grunt-legacy-log-0.1.1.tgz";
      sha1 = "d41f1a6abc9b0b1256a2b5ff02f4c3298dfcd57a";
    };
    deps = {
      "hooker-0.2.3" = self.by-version."hooker"."0.2.3";
      "lodash-2.4.1" = self.by-version."lodash"."2.4.1";
      "underscore.string-2.3.3" = self.by-version."underscore.string"."2.3.3";
      "colors-0.6.2" = self.by-version."colors"."0.6.2";
    };
    peerDependencies = [];
  };
  by-spec."grunt-legacy-util"."~0.2.0" =
    self.by-version."grunt-legacy-util"."0.2.0";
  by-version."grunt-legacy-util"."0.2.0" = self.buildNodePackage {
    name = "grunt-legacy-util-0.2.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/grunt-legacy-util/-/grunt-legacy-util-0.2.0.tgz";
      name = "grunt-legacy-util-0.2.0.tgz";
      sha1 = "93324884dbf7e37a9ff7c026dff451d94a9e554b";
    };
    deps = {
      "hooker-0.2.3" = self.by-version."hooker"."0.2.3";
      "async-0.1.22" = self.by-version."async"."0.1.22";
      "lodash-0.9.2" = self.by-version."lodash"."0.9.2";
      "exit-0.1.2" = self.by-version."exit"."0.1.2";
      "underscore.string-2.2.1" = self.by-version."underscore.string"."2.2.1";
      "getobject-0.1.0" = self.by-version."getobject"."0.1.0";
      "which-1.0.8" = self.by-version."which"."1.0.8";
    };
    peerDependencies = [];
  };
  by-spec."grunt-release-hoodie"."^2.8.0" =
    self.by-version."grunt-release-hoodie"."2.9.0";
  by-version."grunt-release-hoodie"."2.9.0" = self.buildNodePackage {
    name = "grunt-release-hoodie-2.9.0";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/grunt-release-hoodie/-/grunt-release-hoodie-2.9.0.tgz";
      name = "grunt-release-hoodie-2.9.0.tgz";
      sha1 = "8d2a8a454934b3616aee5c8ebf29e4e98ac90a2b";
    };
    deps = {
      "animals-0.0.3" = self.by-version."animals"."0.0.3";
      "extend-1.3.0" = self.by-version."extend"."1.3.0";
      "grunt-semantic-release-0.2.1" = self.by-version."grunt-semantic-release"."0.2.1";
      "grunt-shell-0.7.0" = self.by-version."grunt-shell"."0.7.0";
      "grunt-subgrunt-0.4.4" = self.by-version."grunt-subgrunt"."0.4.4";
      "hoodie-integration-test-1.0.0" = self.by-version."hoodie-integration-test"."1.0.0";
      "ncp-0.6.0" = self.by-version."ncp"."0.6.0";
      "shelljs-0.3.0" = self.by-version."shelljs"."0.3.0";
      "superb-1.1.2" = self.by-version."superb"."1.1.2";
      "grunt-0.4.5" = self.by-version."grunt"."0.4.5";
    };
    peerDependencies = [];
  };
  by-spec."grunt-release-hoodie"."^2.8.1" =
    self.by-version."grunt-release-hoodie"."2.9.0";
  "grunt-release-hoodie" = self.by-version."grunt-release-hoodie"."2.9.0";
  by-spec."grunt-semantic-release"."^0.2.0" =
    self.by-version."grunt-semantic-release"."0.2.1";
  by-version."grunt-semantic-release"."0.2.1" = self.buildNodePackage {
    name = "grunt-semantic-release-0.2.1";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/grunt-semantic-release/-/grunt-semantic-release-0.2.1.tgz";
      name = "grunt-semantic-release-0.2.1.tgz";
      sha1 = "3a8d4eac4e10e107daf05f5b93ce47a27603c4f8";
    };
    deps = {
      "async-0.9.0" = self.by-version."async"."0.9.0";
      "conventional-changelog-0.0.11" = self.by-version."conventional-changelog"."0.0.11";
      "extend-1.3.0" = self.by-version."extend"."1.3.0";
      "github-0.2.3" = self.by-version."github"."0.2.3";
      "grunt-bump-0.0.15" = self.by-version."grunt-bump"."0.0.15";
      "grunt-conventional-changelog-1.1.0" = self.by-version."grunt-conventional-changelog"."1.1.0";
      "inquirer-0.5.1" = self.by-version."inquirer"."0.5.1";
      "js-yaml-3.2.6" = self.by-version."js-yaml"."3.2.6";
      "ncp-0.6.0" = self.by-version."ncp"."0.6.0";
      "npm-which-1.0.2" = self.by-version."npm-which"."1.0.2";
      "semver-regex-0.1.1" = self.by-version."semver-regex"."0.1.1";
      "grunt-0.4.5" = self.by-version."grunt"."0.4.5";
    };
    peerDependencies = [];
  };
  by-spec."grunt-shell"."^0.7.0" =
    self.by-version."grunt-shell"."0.7.0";
  by-version."grunt-shell"."0.7.0" = self.buildNodePackage {
    name = "grunt-shell-0.7.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/grunt-shell/-/grunt-shell-0.7.0.tgz";
      name = "grunt-shell-0.7.0.tgz";
      sha1 = "2b71e54ee5e56537d34ec06bf997c06ce5b4d34b";
    };
    deps = {
      "chalk-0.4.0" = self.by-version."chalk"."0.4.0";
    };
    peerDependencies = [
      self.by-version."grunt"."0.4.5"];
  };
  by-spec."grunt-subgrunt"."^0.4.0" =
    self.by-version."grunt-subgrunt"."0.4.4";
  by-version."grunt-subgrunt"."0.4.4" = self.buildNodePackage {
    name = "grunt-subgrunt-0.4.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/grunt-subgrunt/-/grunt-subgrunt-0.4.4.tgz";
      name = "grunt-subgrunt-0.4.4.tgz";
      sha1 = "c6cb2f33d219f0be70c28650a10c2f978c3125d0";
    };
    deps = {
      "async-0.9.0" = self.by-version."async"."0.9.0";
      "glob-4.3.5" = self.by-version."glob"."4.3.5";
    };
    peerDependencies = [
      self.by-version."grunt"."0.4.5"];
  };
  by-spec."handlebars"."1.3.x" =
    self.by-version."handlebars"."1.3.0";
  by-version."handlebars"."1.3.0" = self.buildNodePackage {
    name = "handlebars-1.3.0";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/handlebars/-/handlebars-1.3.0.tgz";
      name = "handlebars-1.3.0.tgz";
      sha1 = "9e9b130a93e389491322d975cf3ec1818c37ce34";
    };
    deps = {
      "optimist-0.3.7" = self.by-version."optimist"."0.3.7";
      "uglify-js-2.3.6" = self.by-version."uglify-js"."2.3.6";
    };
    peerDependencies = [];
  };
  by-spec."has-ansi"."^0.1.0" =
    self.by-version."has-ansi"."0.1.0";
  by-version."has-ansi"."0.1.0" = self.buildNodePackage {
    name = "has-ansi-0.1.0";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/has-ansi/-/has-ansi-0.1.0.tgz";
      name = "has-ansi-0.1.0.tgz";
      sha1 = "84f265aae8c0e6a88a12d7022894b7568894c62e";
    };
    deps = {
      "ansi-regex-0.2.1" = self.by-version."ansi-regex"."0.2.1";
    };
    peerDependencies = [];
  };
  by-spec."has-color"."~0.1.0" =
    self.by-version."has-color"."0.1.7";
  by-version."has-color"."0.1.7" = self.buildNodePackage {
    name = "has-color-0.1.7";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/has-color/-/has-color-0.1.7.tgz";
      name = "has-color-0.1.7.tgz";
      sha1 = "67144a5260c34fc3cca677d041daf52fe7b78b2f";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."has-unicode"."^1.0.0" =
    self.by-version."has-unicode"."1.0.0";
  by-version."has-unicode"."1.0.0" = self.buildNodePackage {
    name = "has-unicode-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/has-unicode/-/has-unicode-1.0.0.tgz";
      name = "has-unicode-1.0.0.tgz";
      sha1 = "bac5c44e064c2ffc3b8fcbd8c71afe08f9afc8cc";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."hawk"."1.1.1" =
    self.by-version."hawk"."1.1.1";
  by-version."hawk"."1.1.1" = self.buildNodePackage {
    name = "hawk-1.1.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/hawk/-/hawk-1.1.1.tgz";
      name = "hawk-1.1.1.tgz";
      sha1 = "87cd491f9b46e4e2aeaca335416766885d2d1ed9";
    };
    deps = {
      "hoek-0.9.1" = self.by-version."hoek"."0.9.1";
      "boom-0.4.2" = self.by-version."boom"."0.4.2";
      "cryptiles-0.2.2" = self.by-version."cryptiles"."0.2.2";
      "sntp-0.2.4" = self.by-version."sntp"."0.2.4";
    };
    peerDependencies = [];
  };
  by-spec."hawk"."~2.3.0" =
    self.by-version."hawk"."2.3.1";
  by-version."hawk"."2.3.1" = self.buildNodePackage {
    name = "hawk-2.3.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/hawk/-/hawk-2.3.1.tgz";
      name = "hawk-2.3.1.tgz";
      sha1 = "1e731ce39447fa1d0f6d707f7bceebec0fd1ec1f";
    };
    deps = {
      "hoek-2.11.0" = self.by-version."hoek"."2.11.0";
      "boom-2.6.1" = self.by-version."boom"."2.6.1";
      "cryptiles-2.0.4" = self.by-version."cryptiles"."2.0.4";
      "sntp-1.0.9" = self.by-version."sntp"."1.0.9";
    };
    peerDependencies = [];
  };
  by-spec."hoek"."0.9.x" =
    self.by-version."hoek"."0.9.1";
  by-version."hoek"."0.9.1" = self.buildNodePackage {
    name = "hoek-0.9.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/hoek/-/hoek-0.9.1.tgz";
      name = "hoek-0.9.1.tgz";
      sha1 = "3d322462badf07716ea7eb85baf88079cddce505";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."hoek"."2.x.x" =
    self.by-version."hoek"."2.11.0";
  by-version."hoek"."2.11.0" = self.buildNodePackage {
    name = "hoek-2.11.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/hoek/-/hoek-2.11.0.tgz";
      name = "hoek-2.11.0.tgz";
      sha1 = "e588ec66a6b405b0e7140308720e1e1cd4f035b7";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."hoodie-cli"."*" =
    self.by-version."hoodie-cli"."0.6.3";
  by-version."hoodie-cli"."0.6.3" = self.buildNodePackage {
    name = "hoodie-cli-0.6.3";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/hoodie-cli/-/hoodie-cli-0.6.3.tgz";
      name = "hoodie-cli-0.6.3.tgz";
      sha1 = "d8d5bdafe5e10ecc02aaace276d40f3e79acd5bd";
    };
    deps = {
      "async-0.9.0" = self.by-version."async"."0.9.0";
      "cli-color-0.3.2" = self.by-version."cli-color"."0.3.2";
      "colors-0.6.2" = self.by-version."colors"."0.6.2";
      "fixture-stdout-0.2.1" = self.by-version."fixture-stdout"."0.2.1";
      "graceful-fs-3.0.5" = self.by-version."graceful-fs"."3.0.5";
      "ini-1.3.2" = self.by-version."ini"."1.3.2";
      "insight-0.4.3" = self.by-version."insight"."0.4.3";
      "npm-2.5.1" = self.by-version."npm"."2.5.1";
      "open-0.0.5" = self.by-version."open"."0.0.5";
      "optimist-0.6.1" = self.by-version."optimist"."0.6.1";
      "prompt-0.2.14" = self.by-version."prompt"."0.2.14";
      "rimraf-2.2.8" = self.by-version."rimraf"."2.2.8";
      "semver-2.3.2" = self.by-version."semver"."2.3.2";
      "shelljs-0.3.0" = self.by-version."shelljs"."0.3.0";
      "underscore-1.7.0" = self.by-version."underscore"."1.7.0";
      "update-notifier-0.2.2" = self.by-version."update-notifier"."0.2.2";
    };
    peerDependencies = [];
  };
  by-spec."hoodie-integration-test"."^1.0.0" =
    self.by-version."hoodie-integration-test"."1.0.0";
  by-version."hoodie-integration-test"."1.0.0" = self.buildNodePackage {
    name = "hoodie-integration-test-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/hoodie-integration-test/-/hoodie-integration-test-1.0.0.tgz";
      name = "hoodie-integration-test-1.0.0.tgz";
      sha1 = "cc950baa420219ee8030bd30557be4a5938c4d3d";
    };
    deps = {
      "chai-as-promised-4.1.1" = self.by-version."chai-as-promised"."4.1.1";
      "glob-4.3.5" = self.by-version."glob"."4.3.5";
      "grunt-0.4.5" = self.by-version."grunt"."0.4.5";
      "grunt-hoodie-0.5.4" = self.by-version."grunt-hoodie"."0.5.4";
      "grunt-release-hoodie-2.9.0" = self.by-version."grunt-release-hoodie"."2.9.0";
      "grunt-shell-0.7.0" = self.by-version."grunt-shell"."0.7.0";
      "hoodie-cli-0.6.3" = self.by-version."hoodie-cli"."0.6.3";
      "intern-2.2.2" = self.by-version."intern"."2.2.2";
      "load-grunt-tasks-0.6.0" = self.by-version."load-grunt-tasks"."0.6.0";
      "shelljs-0.3.0" = self.by-version."shelljs"."0.3.0";
      "chai-1.10.0" = self.by-version."chai"."1.10.0";
    };
    peerDependencies = [];
  };
  by-spec."hooker"."~0.2.3" =
    self.by-version."hooker"."0.2.3";
  by-version."hooker"."0.2.3" = self.buildNodePackage {
    name = "hooker-0.2.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/hooker/-/hooker-0.2.3.tgz";
      name = "hooker-0.2.3.tgz";
      sha1 = "b834f723cc4a242aa65963459df6d984c5d3d959";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."hosted-git-info"."^1.5.3" =
    self.by-version."hosted-git-info"."1.5.3";
  by-version."hosted-git-info"."1.5.3" = self.buildNodePackage {
    name = "hosted-git-info-1.5.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/hosted-git-info/-/hosted-git-info-1.5.3.tgz";
      name = "hosted-git-info-1.5.3.tgz";
      sha1 = "1f46e25e9c0e207852fb7a4b94422ed5f09a03f5";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."htmlparser2"."3.3.x" =
    self.by-version."htmlparser2"."3.3.0";
  by-version."htmlparser2"."3.3.0" = self.buildNodePackage {
    name = "htmlparser2-3.3.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/htmlparser2/-/htmlparser2-3.3.0.tgz";
      name = "htmlparser2-3.3.0.tgz";
      sha1 = "cc70d05a59f6542e43f0e685c982e14c924a9efe";
    };
    deps = {
      "domhandler-2.1.0" = self.by-version."domhandler"."2.1.0";
      "domutils-1.1.6" = self.by-version."domutils"."1.1.6";
      "domelementtype-1.1.3" = self.by-version."domelementtype"."1.1.3";
      "readable-stream-1.0.33" = self.by-version."readable-stream"."1.0.33";
    };
    peerDependencies = [];
  };
  by-spec."http-browserify"."^1.4.0" =
    self.by-version."http-browserify"."1.7.0";
  by-version."http-browserify"."1.7.0" = self.buildNodePackage {
    name = "http-browserify-1.7.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/http-browserify/-/http-browserify-1.7.0.tgz";
      name = "http-browserify-1.7.0.tgz";
      sha1 = "33795ade72df88acfbfd36773cefeda764735b20";
    };
    deps = {
      "Base64-0.2.1" = self.by-version."Base64"."0.2.1";
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
    };
    peerDependencies = [];
  };
  by-spec."http-browserify"."~1.3.1" =
    self.by-version."http-browserify"."1.3.2";
  by-version."http-browserify"."1.3.2" = self.buildNodePackage {
    name = "http-browserify-1.3.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/http-browserify/-/http-browserify-1.3.2.tgz";
      name = "http-browserify-1.3.2.tgz";
      sha1 = "b562c34479349a690d7a6597df495aefa8c604f5";
    };
    deps = {
      "Base64-0.2.1" = self.by-version."Base64"."0.2.1";
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
    };
    peerDependencies = [];
  };
  by-spec."http-errors"."~1.2.8" =
    self.by-version."http-errors"."1.2.8";
  by-version."http-errors"."1.2.8" = self.buildNodePackage {
    name = "http-errors-1.2.8";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/http-errors/-/http-errors-1.2.8.tgz";
      name = "http-errors-1.2.8.tgz";
      sha1 = "8ee5fe0b51982221d796c0c4712d76f72097a4d0";
    };
    deps = {
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
      "statuses-1.2.1" = self.by-version."statuses"."1.2.1";
    };
    peerDependencies = [];
  };
  by-spec."http-proxy"."~0.10" =
    self.by-version."http-proxy"."0.10.4";
  by-version."http-proxy"."0.10.4" = self.buildNodePackage {
    name = "http-proxy-0.10.4";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/http-proxy/-/http-proxy-0.10.4.tgz";
      name = "http-proxy-0.10.4.tgz";
      sha1 = "14ba0ceaa2197f89fa30dea9e7b09e19cd93c22f";
    };
    deps = {
      "colors-0.6.2" = self.by-version."colors"."0.6.2";
      "optimist-0.6.1" = self.by-version."optimist"."0.6.1";
      "pkginfo-0.3.0" = self.by-version."pkginfo"."0.3.0";
      "utile-0.2.1" = self.by-version."utile"."0.2.1";
    };
    peerDependencies = [];
  };
  by-spec."http-signature"."~0.10.0" =
    self.by-version."http-signature"."0.10.1";
  by-version."http-signature"."0.10.1" = self.buildNodePackage {
    name = "http-signature-0.10.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/http-signature/-/http-signature-0.10.1.tgz";
      name = "http-signature-0.10.1.tgz";
      sha1 = "4fbdac132559aa8323121e540779c0a012b27e66";
    };
    deps = {
      "assert-plus-0.1.5" = self.by-version."assert-plus"."0.1.5";
      "asn1-0.1.11" = self.by-version."asn1"."0.1.11";
      "ctype-0.5.3" = self.by-version."ctype"."0.5.3";
    };
    peerDependencies = [];
  };
  by-spec."https-browserify"."~0.0.0" =
    self.by-version."https-browserify"."0.0.0";
  by-version."https-browserify"."0.0.0" = self.buildNodePackage {
    name = "https-browserify-0.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/https-browserify/-/https-browserify-0.0.0.tgz";
      name = "https-browserify-0.0.0.tgz";
      sha1 = "b3ffdfe734b2a3d4a9efd58e8654c91fce86eafd";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."i"."0.3.x" =
    self.by-version."i"."0.3.2";
  by-version."i"."0.3.2" = self.buildNodePackage {
    name = "i-0.3.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/i/-/i-0.3.2.tgz";
      name = "i-0.3.2.tgz";
      sha1 = "b2e2d6ef47900bd924e281231ff4c5cc798d9ea8";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."iconv-lite"."0.4.4" =
    self.by-version."iconv-lite"."0.4.4";
  by-version."iconv-lite"."0.4.4" = self.buildNodePackage {
    name = "iconv-lite-0.4.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/iconv-lite/-/iconv-lite-0.4.4.tgz";
      name = "iconv-lite-0.4.4.tgz";
      sha1 = "e95f2e41db0735fc21652f7827a5ee32e63c83a8";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."iconv-lite"."~0.2.11" =
    self.by-version."iconv-lite"."0.2.11";
  by-version."iconv-lite"."0.2.11" = self.buildNodePackage {
    name = "iconv-lite-0.2.11";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/iconv-lite/-/iconv-lite-0.2.11.tgz";
      name = "iconv-lite-0.2.11.tgz";
      sha1 = "1ce60a3a57864a292d1321ff4609ca4bb965adc8";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."ieee754"."^1.1.4" =
    self.by-version."ieee754"."1.1.4";
  by-version."ieee754"."1.1.4" = self.buildNodePackage {
    name = "ieee754-1.1.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/ieee754/-/ieee754-1.1.4.tgz";
      name = "ieee754-1.1.4.tgz";
      sha1 = "e3ec65200d4ad531d359aabdb6d3ec812699a30b";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."ieee754"."~1.1.1" =
    self.by-version."ieee754"."1.1.4";
  by-spec."immediate"."^3.0.0" =
    self.by-version."immediate"."3.0.3";
  by-version."immediate"."3.0.3" = self.buildNodePackage {
    name = "immediate-3.0.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/immediate/-/immediate-3.0.3.tgz";
      name = "immediate-3.0.3.tgz";
      sha1 = "328c4f8ff9ac8b974576170ef3f9bd4af4e432e5";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."indent-string"."^1.1.0" =
    self.by-version."indent-string"."1.2.0";
  by-version."indent-string"."1.2.0" = self.buildNodePackage {
    name = "indent-string-1.2.0";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/indent-string/-/indent-string-1.2.0.tgz";
      name = "indent-string-1.2.0.tgz";
      sha1 = "4d747797d66745bd54c6a289f5ce19f51750a4b9";
    };
    deps = {
      "get-stdin-3.0.2" = self.by-version."get-stdin"."3.0.2";
      "minimist-1.1.0" = self.by-version."minimist"."1.1.0";
      "repeating-1.1.1" = self.by-version."repeating"."1.1.1";
    };
    peerDependencies = [];
  };
  by-spec."indexof"."0.0.1" =
    self.by-version."indexof"."0.0.1";
  by-version."indexof"."0.0.1" = self.buildNodePackage {
    name = "indexof-0.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/indexof/-/indexof-0.0.1.tgz";
      name = "indexof-0.0.1.tgz";
      sha1 = "82dc336d232b9062179d05ab3293a66059fd435d";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."inflight"."^1.0.4" =
    self.by-version."inflight"."1.0.4";
  by-version."inflight"."1.0.4" = self.buildNodePackage {
    name = "inflight-1.0.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/inflight/-/inflight-1.0.4.tgz";
      name = "inflight-1.0.4.tgz";
      sha1 = "6cbb4521ebd51ce0ec0a936bfd7657ef7e9b172a";
    };
    deps = {
      "once-1.3.1" = self.by-version."once"."1.3.1";
      "wrappy-1.0.1" = self.by-version."wrappy"."1.0.1";
    };
    peerDependencies = [];
  };
  by-spec."inflight"."~1.0.4" =
    self.by-version."inflight"."1.0.4";
  by-spec."inherits"."1" =
    self.by-version."inherits"."1.0.0";
  by-version."inherits"."1.0.0" = self.buildNodePackage {
    name = "inherits-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/inherits/-/inherits-1.0.0.tgz";
      name = "inherits-1.0.0.tgz";
      sha1 = "38e1975285bf1f7ba9c84da102bb12771322ac48";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."inherits"."2" =
    self.by-version."inherits"."2.0.1";
  by-version."inherits"."2.0.1" = self.buildNodePackage {
    name = "inherits-2.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/inherits/-/inherits-2.0.1.tgz";
      name = "inherits-2.0.1.tgz";
      sha1 = "b17d08d326b4423e568eff719f91b0b1cbdf69f1";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."inherits"."2.0.1" =
    self.by-version."inherits"."2.0.1";
  by-spec."inherits"."^2.0.1" =
    self.by-version."inherits"."2.0.1";
  "inherits" = self.by-version."inherits"."2.0.1";
  by-spec."inherits"."~2.0.0" =
    self.by-version."inherits"."2.0.1";
  by-spec."inherits"."~2.0.1" =
    self.by-version."inherits"."2.0.1";
  by-spec."ini"."1" =
    self.by-version."ini"."1.3.2";
  by-version."ini"."1.3.2" = self.buildNodePackage {
    name = "ini-1.3.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/ini/-/ini-1.3.2.tgz";
      name = "ini-1.3.2.tgz";
      sha1 = "9ebf4a44daf9d89acd07aab9f89a083d887f6dec";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."ini"."^1.2.0" =
    self.by-version."ini"."1.3.2";
  by-spec."ini"."^1.2.1" =
    self.by-version."ini"."1.3.2";
  by-spec."ini"."~1.3.0" =
    self.by-version."ini"."1.3.2";
  by-spec."ini"."~1.3.2" =
    self.by-version."ini"."1.3.2";
  by-spec."init-package-json"."~1.2.0" =
    self.by-version."init-package-json"."1.2.0";
  by-version."init-package-json"."1.2.0" = self.buildNodePackage {
    name = "init-package-json-1.2.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/init-package-json/-/init-package-json-1.2.0.tgz";
      name = "init-package-json-1.2.0.tgz";
      sha1 = "b9f027514403b3b3f582c148592ab75214003348";
    };
    deps = {
      "glob-4.3.5" = self.by-version."glob"."4.3.5";
      "promzard-0.2.2" = self.by-version."promzard"."0.2.2";
      "read-1.0.5" = self.by-version."read"."1.0.5";
      "read-package-json-1.2.7" = self.by-version."read-package-json"."1.2.7";
      "semver-4.2.0" = self.by-version."semver"."4.2.0";
    };
    peerDependencies = [];
  };
  by-spec."inline-source-map"."~0.3.0" =
    self.by-version."inline-source-map"."0.3.0";
  by-version."inline-source-map"."0.3.0" = self.buildNodePackage {
    name = "inline-source-map-0.3.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/inline-source-map/-/inline-source-map-0.3.0.tgz";
      name = "inline-source-map-0.3.0.tgz";
      sha1 = "ad2acca97d82fcb9d0a56221ee72e8043116424a";
    };
    deps = {
      "source-map-0.1.43" = self.by-version."source-map"."0.1.43";
    };
    peerDependencies = [];
  };
  by-spec."inquirer"."^0.5.1" =
    self.by-version."inquirer"."0.5.1";
  by-version."inquirer"."0.5.1" = self.buildNodePackage {
    name = "inquirer-0.5.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/inquirer/-/inquirer-0.5.1.tgz";
      name = "inquirer-0.5.1.tgz";
      sha1 = "e9f2cd1ee172c7a32e054b78a03d4ddb0d7707f1";
    };
    deps = {
      "async-0.8.0" = self.by-version."async"."0.8.0";
      "cli-color-0.3.2" = self.by-version."cli-color"."0.3.2";
      "lodash-2.4.1" = self.by-version."lodash"."2.4.1";
      "mute-stream-0.0.4" = self.by-version."mute-stream"."0.0.4";
      "readline2-0.1.1" = self.by-version."readline2"."0.1.1";
      "through-2.3.6" = self.by-version."through"."2.3.6";
      "chalk-0.4.0" = self.by-version."chalk"."0.4.0";
    };
    peerDependencies = [];
  };
  by-spec."inquirer"."^0.6.0" =
    self.by-version."inquirer"."0.6.0";
  by-version."inquirer"."0.6.0" = self.buildNodePackage {
    name = "inquirer-0.6.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/inquirer/-/inquirer-0.6.0.tgz";
      name = "inquirer-0.6.0.tgz";
      sha1 = "614d7bb3e48f9e6a8028e94a0c38f23ef29823d3";
    };
    deps = {
      "chalk-0.5.1" = self.by-version."chalk"."0.5.1";
      "cli-color-0.3.2" = self.by-version."cli-color"."0.3.2";
      "lodash-2.4.1" = self.by-version."lodash"."2.4.1";
      "mute-stream-0.0.4" = self.by-version."mute-stream"."0.0.4";
      "readline2-0.1.1" = self.by-version."readline2"."0.1.1";
      "rx-2.3.25" = self.by-version."rx"."2.3.25";
      "through-2.3.6" = self.by-version."through"."2.3.6";
    };
    peerDependencies = [];
  };
  by-spec."insert-module-globals"."~6.0.0" =
    self.by-version."insert-module-globals"."6.0.0";
  by-version."insert-module-globals"."6.0.0" = self.buildNodePackage {
    name = "insert-module-globals-6.0.0";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/insert-module-globals/-/insert-module-globals-6.0.0.tgz";
      name = "insert-module-globals-6.0.0.tgz";
      sha1 = "ee8aeb9dee16819e33aa14588a558824af0c15dc";
    };
    deps = {
      "JSONStream-0.7.4" = self.by-version."JSONStream"."0.7.4";
      "concat-stream-1.4.7" = self.by-version."concat-stream"."1.4.7";
      "lexical-scope-1.1.0" = self.by-version."lexical-scope"."1.1.0";
      "process-0.6.0" = self.by-version."process"."0.6.0";
      "through-2.3.6" = self.by-version."through"."2.3.6";
      "xtend-3.0.0" = self.by-version."xtend"."3.0.0";
    };
    peerDependencies = [];
  };
  by-spec."insight"."^0.4.1" =
    self.by-version."insight"."0.4.3";
  by-version."insight"."0.4.3" = self.buildNodePackage {
    name = "insight-0.4.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/insight/-/insight-0.4.3.tgz";
      name = "insight-0.4.3.tgz";
      sha1 = "76d653c5c0d8048b03cdba6385a6948f74614af0";
    };
    deps = {
      "async-0.9.0" = self.by-version."async"."0.9.0";
      "chalk-0.5.1" = self.by-version."chalk"."0.5.1";
      "configstore-0.3.2" = self.by-version."configstore"."0.3.2";
      "inquirer-0.6.0" = self.by-version."inquirer"."0.6.0";
      "lodash.debounce-2.4.1" = self.by-version."lodash.debounce"."2.4.1";
      "object-assign-1.0.0" = self.by-version."object-assign"."1.0.0";
      "os-name-1.0.3" = self.by-version."os-name"."1.0.3";
      "request-2.53.0" = self.by-version."request"."2.53.0";
      "tough-cookie-0.12.1" = self.by-version."tough-cookie"."0.12.1";
    };
    peerDependencies = [];
  };
  by-spec."intern"."^2.0.1" =
    self.by-version."intern"."2.2.2";
  by-version."intern"."2.2.2" = self.buildNodePackage {
    name = "intern-2.2.2";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/intern/-/intern-2.2.2.tgz";
      name = "intern-2.2.2.tgz";
      sha1 = "2f6e8fa9fa9795d8292191c6bdad1e2f163f7bf7";
    };
    deps = {
      "istanbul-0.2.16" = self.by-version."istanbul"."0.2.16";
      "source-map-0.1.33" = self.by-version."source-map"."0.1.33";
      "dojo-2.0.0-dev" = self.by-version."dojo"."2.0.0-dev";
      "chai-1.9.1" = self.by-version."chai"."1.9.1";
      "leadfoot-1.2.1" = self.by-version."leadfoot"."1.2.1";
      "digdug-1.2.1" = self.by-version."digdug"."1.2.1";
      "charm-0.2.0" = self.by-version."charm"."0.2.0";
      "diff-1.1.0" = self.by-version."diff"."1.1.0";
    };
    peerDependencies = [];
  };
  by-spec."is-array"."^1.0.1" =
    self.by-version."is-array"."1.0.1";
  by-version."is-array"."1.0.1" = self.buildNodePackage {
    name = "is-array-1.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/is-array/-/is-array-1.0.1.tgz";
      name = "is-array-1.0.1.tgz";
      sha1 = "e9850cc2cc860c3bc0977e84ccf0dd464584279a";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."is-binary-path"."^1.0.0" =
    self.by-version."is-binary-path"."1.0.0";
  by-version."is-binary-path"."1.0.0" = self.buildNodePackage {
    name = "is-binary-path-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/is-binary-path/-/is-binary-path-1.0.0.tgz";
      name = "is-binary-path-1.0.0.tgz";
      sha1 = "51a9ab34cc239e8e97d1cb1c874faf25d79d54e5";
    };
    deps = {
      "binary-extensions-1.1.0" = self.by-version."binary-extensions"."1.1.0";
    };
    peerDependencies = [];
  };
  by-spec."is-finite"."^1.0.0" =
    self.by-version."is-finite"."1.0.0";
  by-version."is-finite"."1.0.0" = self.buildNodePackage {
    name = "is-finite-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/is-finite/-/is-finite-1.0.0.tgz";
      name = "is-finite-1.0.0.tgz";
      sha1 = "2b1dbad1162cdca6a4dc89f12b2f3dae12393282";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."is-glob"."^0.3.0" =
    self.by-version."is-glob"."0.3.0";
  by-version."is-glob"."0.3.0" = self.buildNodePackage {
    name = "is-glob-0.3.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/is-glob/-/is-glob-0.3.0.tgz";
      name = "is-glob-0.3.0.tgz";
      sha1 = "36f358abccfb33836406c44075b121a58736a382";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."is-npm"."^1.0.0" =
    self.by-version."is-npm"."1.0.0";
  by-version."is-npm"."1.0.0" = self.buildNodePackage {
    name = "is-npm-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/is-npm/-/is-npm-1.0.0.tgz";
      name = "is-npm-1.0.0.tgz";
      sha1 = "f2fb63a65e4905b406c86072765a1a4dc793b9f4";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."isarray"."0.0.1" =
    self.by-version."isarray"."0.0.1";
  by-version."isarray"."0.0.1" = self.buildNodePackage {
    name = "isarray-0.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/isarray/-/isarray-0.0.1.tgz";
      name = "isarray-0.0.1.tgz";
      sha1 = "8a18acfca9a8f4177e09abfc6038939b05d1eedf";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."isstream"."0.1.x" =
    self.by-version."isstream"."0.1.1";
  by-version."isstream"."0.1.1" = self.buildNodePackage {
    name = "isstream-0.1.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/isstream/-/isstream-0.1.1.tgz";
      name = "isstream-0.1.1.tgz";
      sha1 = "48332c5999893996ba253c81c7bd6e7ae0905c4f";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."isstream"."~0.1.1" =
    self.by-version."isstream"."0.1.1";
  by-spec."istanbul"."0.2.16" =
    self.by-version."istanbul"."0.2.16";
  by-version."istanbul"."0.2.16" = self.buildNodePackage {
    name = "istanbul-0.2.16";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/istanbul/-/istanbul-0.2.16.tgz";
      name = "istanbul-0.2.16.tgz";
      sha1 = "870545a0d4f4b4ce161039e9e805a98c2c700bd9";
    };
    deps = {
      "esprima-1.2.4" = self.by-version."esprima"."1.2.4";
      "escodegen-1.3.3" = self.by-version."escodegen"."1.3.3";
      "handlebars-1.3.0" = self.by-version."handlebars"."1.3.0";
      "mkdirp-0.5.0" = self.by-version."mkdirp"."0.5.0";
      "nopt-3.0.1" = self.by-version."nopt"."3.0.1";
      "fileset-0.1.5" = self.by-version."fileset"."0.1.5";
      "which-1.0.8" = self.by-version."which"."1.0.8";
      "async-0.9.0" = self.by-version."async"."0.9.0";
      "abbrev-1.0.5" = self.by-version."abbrev"."1.0.5";
      "wordwrap-0.0.2" = self.by-version."wordwrap"."0.0.2";
      "resolve-0.7.4" = self.by-version."resolve"."0.7.4";
      "js-yaml-3.2.6" = self.by-version."js-yaml"."3.2.6";
    };
    peerDependencies = [];
  };
  by-spec."jade"."0.26.3" =
    self.by-version."jade"."0.26.3";
  by-version."jade"."0.26.3" = self.buildNodePackage {
    name = "jade-0.26.3";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/jade/-/jade-0.26.3.tgz";
      name = "jade-0.26.3.tgz";
      sha1 = "8f10d7977d8d79f2f6ff862a81b0513ccb25686c";
    };
    deps = {
      "commander-0.6.1" = self.by-version."commander"."0.6.1";
      "mkdirp-0.3.0" = self.by-version."mkdirp"."0.3.0";
    };
    peerDependencies = [];
  };
  by-spec."jqevents"."~0.1.1" =
    self.by-version."jqevents"."0.1.1";
  by-version."jqevents"."0.1.1" = self.buildNodePackage {
    name = "jqevents-0.1.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/jqevents/-/jqevents-0.1.1.tgz";
      name = "jqevents-0.1.1.tgz";
      sha1 = "215e5887402de2fee9365c95f9dd8de8e7631ca9";
    };
    deps = {
    };
    peerDependencies = [];
  };
  "jqevents" = self.by-version."jqevents"."0.1.1";
  by-spec."js-yaml"."3.x" =
    self.by-version."js-yaml"."3.2.6";
  by-version."js-yaml"."3.2.6" = self.buildNodePackage {
    name = "js-yaml-3.2.6";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/js-yaml/-/js-yaml-3.2.6.tgz";
      name = "js-yaml-3.2.6.tgz";
      sha1 = "dde1ffbe2726e3fff97efb65fd02dbd6647b8309";
    };
    deps = {
      "argparse-0.1.16" = self.by-version."argparse"."0.1.16";
      "esprima-1.0.4" = self.by-version."esprima"."1.0.4";
    };
    peerDependencies = [];
  };
  by-spec."js-yaml"."^3.1.0" =
    self.by-version."js-yaml"."3.2.6";
  by-spec."js-yaml"."~2.0.5" =
    self.by-version."js-yaml"."2.0.5";
  by-version."js-yaml"."2.0.5" = self.buildNodePackage {
    name = "js-yaml-2.0.5";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/js-yaml/-/js-yaml-2.0.5.tgz";
      name = "js-yaml-2.0.5.tgz";
      sha1 = "a25ae6509999e97df278c6719da11bd0687743a8";
    };
    deps = {
      "argparse-0.1.16" = self.by-version."argparse"."0.1.16";
      "esprima-1.0.4" = self.by-version."esprima"."1.0.4";
    };
    peerDependencies = [];
  };
  by-spec."jshint"."~2.4.0" =
    self.by-version."jshint"."2.4.4";
  by-version."jshint"."2.4.4" = self.buildNodePackage {
    name = "jshint-2.4.4";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/jshint/-/jshint-2.4.4.tgz";
      name = "jshint-2.4.4.tgz";
      sha1 = "4162238314c649f987752651e8e064e30a68706e";
    };
    deps = {
      "shelljs-0.1.4" = self.by-version."shelljs"."0.1.4";
      "underscore-1.4.4" = self.by-version."underscore"."1.4.4";
      "cli-0.4.5" = self.by-version."cli"."0.4.5";
      "minimatch-0.4.0" = self.by-version."minimatch"."0.4.0";
      "htmlparser2-3.3.0" = self.by-version."htmlparser2"."3.3.0";
      "console-browserify-0.1.6" = self.by-version."console-browserify"."0.1.6";
      "exit-0.1.2" = self.by-version."exit"."0.1.2";
    };
    peerDependencies = [];
  };
  by-spec."json-stringify-safe"."~5.0.0" =
    self.by-version."json-stringify-safe"."5.0.0";
  by-version."json-stringify-safe"."5.0.0" = self.buildNodePackage {
    name = "json-stringify-safe-5.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/json-stringify-safe/-/json-stringify-safe-5.0.0.tgz";
      name = "json-stringify-safe-5.0.0.tgz";
      sha1 = "4c1f228b5050837eba9d21f50c2e6e320624566e";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."jsonfile"."^2.0.0" =
    self.by-version."jsonfile"."2.0.0";
  by-version."jsonfile"."2.0.0" = self.buildNodePackage {
    name = "jsonfile-2.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/jsonfile/-/jsonfile-2.0.0.tgz";
      name = "jsonfile-2.0.0.tgz";
      sha1 = "c3944f350bd3c078b392e0aa1633b44662fcf06b";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."jsonparse"."0.0.5" =
    self.by-version."jsonparse"."0.0.5";
  by-version."jsonparse"."0.0.5" = self.buildNodePackage {
    name = "jsonparse-0.0.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/jsonparse/-/jsonparse-0.0.5.tgz";
      name = "jsonparse-0.0.5.tgz";
      sha1 = "330542ad3f0a654665b778f3eb2d9a9fa507ac64";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."karma".">=0.12.8" =
    self.by-version."karma"."0.12.31";
  by-version."karma"."0.12.31" = self.buildNodePackage {
    name = "karma-0.12.31";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/karma/-/karma-0.12.31.tgz";
      name = "karma-0.12.31.tgz";
      sha1 = "806aa7c2acb13a39edb9374a7a477e643a5e94c9";
    };
    deps = {
      "di-0.0.1" = self.by-version."di"."0.0.1";
      "socket.io-0.9.16" = self.by-version."socket.io"."0.9.16";
      "chokidar-1.0.0-rc3" = self.by-version."chokidar"."1.0.0-rc3";
      "glob-3.2.11" = self.by-version."glob"."3.2.11";
      "minimatch-0.2.14" = self.by-version."minimatch"."0.2.14";
      "http-proxy-0.10.4" = self.by-version."http-proxy"."0.10.4";
      "optimist-0.6.1" = self.by-version."optimist"."0.6.1";
      "rimraf-2.2.8" = self.by-version."rimraf"."2.2.8";
      "q-0.9.7" = self.by-version."q"."0.9.7";
      "colors-0.6.2" = self.by-version."colors"."0.6.2";
      "lodash-2.4.1" = self.by-version."lodash"."2.4.1";
      "mime-1.2.11" = self.by-version."mime"."1.2.11";
      "log4js-0.6.22" = self.by-version."log4js"."0.6.22";
      "useragent-2.0.10" = self.by-version."useragent"."2.0.10";
      "graceful-fs-2.0.3" = self.by-version."graceful-fs"."2.0.3";
      "connect-2.26.6" = self.by-version."connect"."2.26.6";
      "source-map-0.1.43" = self.by-version."source-map"."0.1.43";
    };
    peerDependencies = [];
  };
  by-spec."karma".">=0.9" =
    self.by-version."karma"."0.12.31";
  by-spec."karma".">=0.9.3" =
    self.by-version."karma"."0.12.31";
  by-spec."karma"."^0.12.19" =
    self.by-version."karma"."0.12.31";
  "karma" = self.by-version."karma"."0.12.31";
  by-spec."karma"."~0.12.0" =
    self.by-version."karma"."0.12.31";
  by-spec."karma-browserifast"."^0.6.1" =
    self.by-version."karma-browserifast"."0.6.1";
  by-version."karma-browserifast"."0.6.1" = self.buildNodePackage {
    name = "karma-browserifast-0.6.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/karma-browserifast/-/karma-browserifast-0.6.1.tgz";
      name = "karma-browserifast-0.6.1.tgz";
      sha1 = "87480a9412899cf3a56f164644a4b48dc216e326";
    };
    deps = {
      "watchify-0.6.4" = self.by-version."watchify"."0.6.4";
      "glob-3.2.11" = self.by-version."glob"."3.2.11";
      "chokidar-0.8.4" = self.by-version."chokidar"."0.8.4";
      "convert-source-map-0.3.5" = self.by-version."convert-source-map"."0.3.5";
    };
    peerDependencies = [
      self.by-version."karma"."0.12.31"];
  };
  "karma-browserifast" = self.by-version."karma-browserifast"."0.6.1";
  by-spec."karma-chrome-launcher"."^0.1.4" =
    self.by-version."karma-chrome-launcher"."0.1.7";
  by-version."karma-chrome-launcher"."0.1.7" = self.buildNodePackage {
    name = "karma-chrome-launcher-0.1.7";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/karma-chrome-launcher/-/karma-chrome-launcher-0.1.7.tgz";
      name = "karma-chrome-launcher-0.1.7.tgz";
      sha1 = "c248cc01d5ae17dafdb16319d0badf637dfb6e59";
    };
    deps = {
    };
    peerDependencies = [
      self.by-version."karma"."0.12.31"];
  };
  "karma-chrome-launcher" = self.by-version."karma-chrome-launcher"."0.1.7";
  by-spec."karma-firefox-launcher"."^0.1.3" =
    self.by-version."karma-firefox-launcher"."0.1.4";
  by-version."karma-firefox-launcher"."0.1.4" = self.buildNodePackage {
    name = "karma-firefox-launcher-0.1.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/karma-firefox-launcher/-/karma-firefox-launcher-0.1.4.tgz";
      name = "karma-firefox-launcher-0.1.4.tgz";
      sha1 = "5d4abb4abba0e45e83fd94b1f6ff84ec46929c6b";
    };
    deps = {
    };
    peerDependencies = [
      self.by-version."karma"."0.12.31"];
  };
  "karma-firefox-launcher" = self.by-version."karma-firefox-launcher"."0.1.4";
  by-spec."karma-mocha"."^0.1.4" =
    self.by-version."karma-mocha"."0.1.10";
  by-version."karma-mocha"."0.1.10" = self.buildNodePackage {
    name = "karma-mocha-0.1.10";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/karma-mocha/-/karma-mocha-0.1.10.tgz";
      name = "karma-mocha-0.1.10.tgz";
      sha1 = "29ed51d4b121af1373444ec555b20a905bf42b92";
    };
    deps = {
    };
    peerDependencies = [
      self.by-version."karma"."0.12.31"
      self.by-version."mocha"."2.1.0"];
  };
  "karma-mocha" = self.by-version."karma-mocha"."0.1.10";
  by-spec."karma-phantomjs-launcher"."^0.1.4" =
    self.by-version."karma-phantomjs-launcher"."0.1.4";
  by-version."karma-phantomjs-launcher"."0.1.4" = self.buildNodePackage {
    name = "karma-phantomjs-launcher-0.1.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/karma-phantomjs-launcher/-/karma-phantomjs-launcher-0.1.4.tgz";
      name = "karma-phantomjs-launcher-0.1.4.tgz";
      sha1 = "4ef96e4322ff63ae5d918e51c25b213723238f30";
    };
    deps = {
      "phantomjs-1.9.15" = self.by-version."phantomjs"."1.9.15";
    };
    peerDependencies = [
      self.by-version."karma"."0.12.31"];
  };
  "karma-phantomjs-launcher" = self.by-version."karma-phantomjs-launcher"."0.1.4";
  by-spec."karma-script-launcher"."^0.1.0" =
    self.by-version."karma-script-launcher"."0.1.0";
  by-version."karma-script-launcher"."0.1.0" = self.buildNodePackage {
    name = "karma-script-launcher-0.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/karma-script-launcher/-/karma-script-launcher-0.1.0.tgz";
      name = "karma-script-launcher-0.1.0.tgz";
      sha1 = "b643e7c2faead1a52cdb2eeaadcf7a245f0d772a";
    };
    deps = {
    };
    peerDependencies = [
      self.by-version."karma"."0.12.31"];
  };
  "karma-script-launcher" = self.by-version."karma-script-launcher"."0.1.0";
  by-spec."karma-sinon-expect"."^0.1.4" =
    self.by-version."karma-sinon-expect"."0.1.4";
  by-version."karma-sinon-expect"."0.1.4" = self.buildNodePackage {
    name = "karma-sinon-expect-0.1.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/karma-sinon-expect/-/karma-sinon-expect-0.1.4.tgz";
      name = "karma-sinon-expect-0.1.4.tgz";
      sha1 = "704f8ddc2013a24a097837bb71b5306e74055c39";
    };
    deps = {
      "expect.js-0.2.0" = self.by-version."expect.js"."0.2.0";
      "sinon-1.8.2" = self.by-version."sinon"."1.8.2";
    };
    peerDependencies = [];
  };
  "karma-sinon-expect" = self.by-version."karma-sinon-expect"."0.1.4";
  by-spec."kew"."0.4.0" =
    self.by-version."kew"."0.4.0";
  by-version."kew"."0.4.0" = self.buildNodePackage {
    name = "kew-0.4.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/kew/-/kew-0.4.0.tgz";
      name = "kew-0.4.0.tgz";
      sha1 = "da97484f1b06502146f3c60cec05ac6012cd993f";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."latest-version"."^1.0.0" =
    self.by-version."latest-version"."1.0.0";
  by-version."latest-version"."1.0.0" = self.buildNodePackage {
    name = "latest-version-1.0.0";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/latest-version/-/latest-version-1.0.0.tgz";
      name = "latest-version-1.0.0.tgz";
      sha1 = "84f40e5c90745c7e4f7811624d6152c381d931d9";
    };
    deps = {
      "package-json-1.0.1" = self.by-version."package-json"."1.0.1";
    };
    peerDependencies = [];
  };
  by-spec."leadfoot"."1.2.1" =
    self.by-version."leadfoot"."1.2.1";
  by-version."leadfoot"."1.2.1" = self.buildNodePackage {
    name = "leadfoot-1.2.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/leadfoot/-/leadfoot-1.2.1.tgz";
      name = "leadfoot-1.2.1.tgz";
      sha1 = "1d4f5478d9488b658328f3e9fc1ed8ae7176c98b";
    };
    deps = {
      "dojo-2.0.0-alpha4" = self.by-version."dojo"."2.0.0-alpha4";
    };
    peerDependencies = [];
  };
  by-spec."lexical-scope"."~1.1.0" =
    self.by-version."lexical-scope"."1.1.0";
  by-version."lexical-scope"."1.1.0" = self.buildNodePackage {
    name = "lexical-scope-1.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lexical-scope/-/lexical-scope-1.1.0.tgz";
      name = "lexical-scope-1.1.0.tgz";
      sha1 = "899f36c4ec9c5af19736361aae290a6ef2af0800";
    };
    deps = {
      "astw-1.1.0" = self.by-version."astw"."1.1.0";
    };
    peerDependencies = [];
  };
  by-spec."lie"."^2.6.0" =
    self.by-version."lie"."2.8.1";
  by-version."lie"."2.8.1" = self.buildNodePackage {
    name = "lie-2.8.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lie/-/lie-2.8.1.tgz";
      name = "lie-2.8.1.tgz";
      sha1 = "bb8d58f888a9e8e12df8803406c30c9e706f12ce";
    };
    deps = {
      "immediate-3.0.3" = self.by-version."immediate"."3.0.3";
    };
    peerDependencies = [];
  };
  "lie" = self.by-version."lie"."2.8.1";
  by-spec."load-grunt-tasks"."^0.6.0" =
    self.by-version."load-grunt-tasks"."0.6.0";
  by-version."load-grunt-tasks"."0.6.0" = self.buildNodePackage {
    name = "load-grunt-tasks-0.6.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/load-grunt-tasks/-/load-grunt-tasks-0.6.0.tgz";
      name = "load-grunt-tasks-0.6.0.tgz";
      sha1 = "043c04ad69ecc85e02a82258fdf25b7a79e0db6c";
    };
    deps = {
      "findup-sync-0.1.3" = self.by-version."findup-sync"."0.1.3";
      "multimatch-0.3.0" = self.by-version."multimatch"."0.3.0";
    };
    peerDependencies = [];
  };
  "load-grunt-tasks" = self.by-version."load-grunt-tasks"."0.6.0";
  by-spec."lockfile"."~1.0.0" =
    self.by-version."lockfile"."1.0.0";
  by-version."lockfile"."1.0.0" = self.buildNodePackage {
    name = "lockfile-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lockfile/-/lockfile-1.0.0.tgz";
      name = "lockfile-1.0.0.tgz";
      sha1 = "b3a7609dda6012060083bacb0ab0ecbca58e9203";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."lodash"."^2.4" =
    self.by-version."lodash"."2.4.1";
  by-version."lodash"."2.4.1" = self.buildNodePackage {
    name = "lodash-2.4.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash/-/lodash-2.4.1.tgz";
      name = "lodash-2.4.1.tgz";
      sha1 = "5b7723034dda4d262e5a46fb2c58d7cc22f71420";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."lodash"."^2.4.1" =
    self.by-version."lodash"."2.4.1";
  by-spec."lodash"."~0.9.2" =
    self.by-version."lodash"."0.9.2";
  by-version."lodash"."0.9.2" = self.buildNodePackage {
    name = "lodash-0.9.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash/-/lodash-0.9.2.tgz";
      name = "lodash-0.9.2.tgz";
      sha1 = "8f3499c5245d346d682e5b0d3b40767e09f1a92c";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."lodash"."~1.0.1" =
    self.by-version."lodash"."1.0.1";
  by-version."lodash"."1.0.1" = self.buildNodePackage {
    name = "lodash-1.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash/-/lodash-1.0.1.tgz";
      name = "lodash-1.0.1.tgz";
      sha1 = "57945732498d92310e5bd4b1ff4f273a79e6c9fc";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."lodash"."~2.4.1" =
    self.by-version."lodash"."2.4.1";
  by-spec."lodash._basebind"."~2.4.1" =
    self.by-version."lodash._basebind"."2.4.1";
  by-version."lodash._basebind"."2.4.1" = self.buildNodePackage {
    name = "lodash._basebind-2.4.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash._basebind/-/lodash._basebind-2.4.1.tgz";
      name = "lodash._basebind-2.4.1.tgz";
      sha1 = "e940b9ebdd27c327e0a8dab1b55916c5341e9575";
    };
    deps = {
      "lodash._basecreate-2.4.1" = self.by-version."lodash._basecreate"."2.4.1";
      "lodash.isobject-2.4.1" = self.by-version."lodash.isobject"."2.4.1";
      "lodash._setbinddata-2.4.1" = self.by-version."lodash._setbinddata"."2.4.1";
      "lodash._slice-2.4.1" = self.by-version."lodash._slice"."2.4.1";
    };
    peerDependencies = [];
  };
  by-spec."lodash._basecreate"."~2.4.1" =
    self.by-version."lodash._basecreate"."2.4.1";
  by-version."lodash._basecreate"."2.4.1" = self.buildNodePackage {
    name = "lodash._basecreate-2.4.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash._basecreate/-/lodash._basecreate-2.4.1.tgz";
      name = "lodash._basecreate-2.4.1.tgz";
      sha1 = "f8e6f5b578a9e34e541179b56b8eeebf4a287e08";
    };
    deps = {
      "lodash._isnative-2.4.1" = self.by-version."lodash._isnative"."2.4.1";
      "lodash.isobject-2.4.1" = self.by-version."lodash.isobject"."2.4.1";
      "lodash.noop-2.4.1" = self.by-version."lodash.noop"."2.4.1";
    };
    peerDependencies = [];
  };
  by-spec."lodash._basecreatecallback"."~2.4.1" =
    self.by-version."lodash._basecreatecallback"."2.4.1";
  by-version."lodash._basecreatecallback"."2.4.1" = self.buildNodePackage {
    name = "lodash._basecreatecallback-2.4.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash._basecreatecallback/-/lodash._basecreatecallback-2.4.1.tgz";
      name = "lodash._basecreatecallback-2.4.1.tgz";
      sha1 = "7d0b267649cb29e7a139d0103b7c11fae84e4851";
    };
    deps = {
      "lodash.bind-2.4.1" = self.by-version."lodash.bind"."2.4.1";
      "lodash.identity-2.4.1" = self.by-version."lodash.identity"."2.4.1";
      "lodash._setbinddata-2.4.1" = self.by-version."lodash._setbinddata"."2.4.1";
      "lodash.support-2.4.1" = self.by-version."lodash.support"."2.4.1";
    };
    peerDependencies = [];
  };
  by-spec."lodash._basecreatewrapper"."~2.4.1" =
    self.by-version."lodash._basecreatewrapper"."2.4.1";
  by-version."lodash._basecreatewrapper"."2.4.1" = self.buildNodePackage {
    name = "lodash._basecreatewrapper-2.4.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash._basecreatewrapper/-/lodash._basecreatewrapper-2.4.1.tgz";
      name = "lodash._basecreatewrapper-2.4.1.tgz";
      sha1 = "4d31f2e7de7e134fbf2803762b8150b32519666f";
    };
    deps = {
      "lodash._basecreate-2.4.1" = self.by-version."lodash._basecreate"."2.4.1";
      "lodash.isobject-2.4.1" = self.by-version."lodash.isobject"."2.4.1";
      "lodash._setbinddata-2.4.1" = self.by-version."lodash._setbinddata"."2.4.1";
      "lodash._slice-2.4.1" = self.by-version."lodash._slice"."2.4.1";
    };
    peerDependencies = [];
  };
  by-spec."lodash._basetostring"."^3.0.0" =
    self.by-version."lodash._basetostring"."3.0.0";
  by-version."lodash._basetostring"."3.0.0" = self.buildNodePackage {
    name = "lodash._basetostring-3.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash._basetostring/-/lodash._basetostring-3.0.0.tgz";
      name = "lodash._basetostring-3.0.0.tgz";
      sha1 = "75a9a4aaaa2b2a8761111ff5431e7d83c1daf0e2";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."lodash._createpad"."^3.0.0" =
    self.by-version."lodash._createpad"."3.0.1";
  by-version."lodash._createpad"."3.0.1" = self.buildNodePackage {
    name = "lodash._createpad-3.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash._createpad/-/lodash._createpad-3.0.1.tgz";
      name = "lodash._createpad-3.0.1.tgz";
      sha1 = "90c6bdbc84c48edfa026896e31856b1a0ec50842";
    };
    deps = {
      "lodash.repeat-3.0.0" = self.by-version."lodash.repeat"."3.0.0";
    };
    peerDependencies = [];
  };
  by-spec."lodash._createwrapper"."~2.4.1" =
    self.by-version."lodash._createwrapper"."2.4.1";
  by-version."lodash._createwrapper"."2.4.1" = self.buildNodePackage {
    name = "lodash._createwrapper-2.4.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash._createwrapper/-/lodash._createwrapper-2.4.1.tgz";
      name = "lodash._createwrapper-2.4.1.tgz";
      sha1 = "51d6957973da4ed556e37290d8c1a18c53de1607";
    };
    deps = {
      "lodash._basebind-2.4.1" = self.by-version."lodash._basebind"."2.4.1";
      "lodash._basecreatewrapper-2.4.1" = self.by-version."lodash._basecreatewrapper"."2.4.1";
      "lodash.isfunction-2.4.1" = self.by-version."lodash.isfunction"."2.4.1";
      "lodash._slice-2.4.1" = self.by-version."lodash._slice"."2.4.1";
    };
    peerDependencies = [];
  };
  by-spec."lodash._isnative"."~2.4.1" =
    self.by-version."lodash._isnative"."2.4.1";
  by-version."lodash._isnative"."2.4.1" = self.buildNodePackage {
    name = "lodash._isnative-2.4.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash._isnative/-/lodash._isnative-2.4.1.tgz";
      name = "lodash._isnative-2.4.1.tgz";
      sha1 = "3ea6404b784a7be836c7b57580e1cdf79b14832c";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."lodash._objecttypes"."~2.4.1" =
    self.by-version."lodash._objecttypes"."2.4.1";
  by-version."lodash._objecttypes"."2.4.1" = self.buildNodePackage {
    name = "lodash._objecttypes-2.4.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash._objecttypes/-/lodash._objecttypes-2.4.1.tgz";
      name = "lodash._objecttypes-2.4.1.tgz";
      sha1 = "7c0b7f69d98a1f76529f890b0cdb1b4dfec11c11";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."lodash._setbinddata"."~2.4.1" =
    self.by-version."lodash._setbinddata"."2.4.1";
  by-version."lodash._setbinddata"."2.4.1" = self.buildNodePackage {
    name = "lodash._setbinddata-2.4.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash._setbinddata/-/lodash._setbinddata-2.4.1.tgz";
      name = "lodash._setbinddata-2.4.1.tgz";
      sha1 = "f7c200cd1b92ef236b399eecf73c648d17aa94d2";
    };
    deps = {
      "lodash._isnative-2.4.1" = self.by-version."lodash._isnative"."2.4.1";
      "lodash.noop-2.4.1" = self.by-version."lodash.noop"."2.4.1";
    };
    peerDependencies = [];
  };
  by-spec."lodash._shimkeys"."~2.4.1" =
    self.by-version."lodash._shimkeys"."2.4.1";
  by-version."lodash._shimkeys"."2.4.1" = self.buildNodePackage {
    name = "lodash._shimkeys-2.4.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash._shimkeys/-/lodash._shimkeys-2.4.1.tgz";
      name = "lodash._shimkeys-2.4.1.tgz";
      sha1 = "6e9cc9666ff081f0b5a6c978b83e242e6949d203";
    };
    deps = {
      "lodash._objecttypes-2.4.1" = self.by-version."lodash._objecttypes"."2.4.1";
    };
    peerDependencies = [];
  };
  by-spec."lodash._slice"."~2.4.1" =
    self.by-version."lodash._slice"."2.4.1";
  by-version."lodash._slice"."2.4.1" = self.buildNodePackage {
    name = "lodash._slice-2.4.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash._slice/-/lodash._slice-2.4.1.tgz";
      name = "lodash._slice-2.4.1.tgz";
      sha1 = "745cf41a53597b18f688898544405efa2b06d90f";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."lodash.assign"."~2.4.1" =
    self.by-version."lodash.assign"."2.4.1";
  by-version."lodash.assign"."2.4.1" = self.buildNodePackage {
    name = "lodash.assign-2.4.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash.assign/-/lodash.assign-2.4.1.tgz";
      name = "lodash.assign-2.4.1.tgz";
      sha1 = "84c39596dd71181a97b0652913a7c9675e49b1aa";
    };
    deps = {
      "lodash._basecreatecallback-2.4.1" = self.by-version."lodash._basecreatecallback"."2.4.1";
      "lodash.keys-2.4.1" = self.by-version."lodash.keys"."2.4.1";
      "lodash._objecttypes-2.4.1" = self.by-version."lodash._objecttypes"."2.4.1";
    };
    peerDependencies = [];
  };
  by-spec."lodash.bind"."~2.4.1" =
    self.by-version."lodash.bind"."2.4.1";
  by-version."lodash.bind"."2.4.1" = self.buildNodePackage {
    name = "lodash.bind-2.4.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash.bind/-/lodash.bind-2.4.1.tgz";
      name = "lodash.bind-2.4.1.tgz";
      sha1 = "5d19fa005c8c4d236faf4742c7b7a1fcabe29267";
    };
    deps = {
      "lodash._createwrapper-2.4.1" = self.by-version."lodash._createwrapper"."2.4.1";
      "lodash._slice-2.4.1" = self.by-version."lodash._slice"."2.4.1";
    };
    peerDependencies = [];
  };
  by-spec."lodash.debounce"."^2.4.1" =
    self.by-version."lodash.debounce"."2.4.1";
  by-version."lodash.debounce"."2.4.1" = self.buildNodePackage {
    name = "lodash.debounce-2.4.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash.debounce/-/lodash.debounce-2.4.1.tgz";
      name = "lodash.debounce-2.4.1.tgz";
      sha1 = "d8cead246ec4b926e8b85678fc396bfeba8cc6fc";
    };
    deps = {
      "lodash.isfunction-2.4.1" = self.by-version."lodash.isfunction"."2.4.1";
      "lodash.isobject-2.4.1" = self.by-version."lodash.isobject"."2.4.1";
      "lodash.now-2.4.1" = self.by-version."lodash.now"."2.4.1";
    };
    peerDependencies = [];
  };
  by-spec."lodash.identity"."~2.4.1" =
    self.by-version."lodash.identity"."2.4.1";
  by-version."lodash.identity"."2.4.1" = self.buildNodePackage {
    name = "lodash.identity-2.4.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash.identity/-/lodash.identity-2.4.1.tgz";
      name = "lodash.identity-2.4.1.tgz";
      sha1 = "6694cffa65fef931f7c31ce86c74597cf560f4f1";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."lodash.isfunction"."~2.4.1" =
    self.by-version."lodash.isfunction"."2.4.1";
  by-version."lodash.isfunction"."2.4.1" = self.buildNodePackage {
    name = "lodash.isfunction-2.4.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash.isfunction/-/lodash.isfunction-2.4.1.tgz";
      name = "lodash.isfunction-2.4.1.tgz";
      sha1 = "2cfd575c73e498ab57e319b77fa02adef13a94d1";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."lodash.isobject"."~2.4.1" =
    self.by-version."lodash.isobject"."2.4.1";
  by-version."lodash.isobject"."2.4.1" = self.buildNodePackage {
    name = "lodash.isobject-2.4.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash.isobject/-/lodash.isobject-2.4.1.tgz";
      name = "lodash.isobject-2.4.1.tgz";
      sha1 = "5a2e47fe69953f1ee631a7eba1fe64d2d06558f5";
    };
    deps = {
      "lodash._objecttypes-2.4.1" = self.by-version."lodash._objecttypes"."2.4.1";
    };
    peerDependencies = [];
  };
  by-spec."lodash.keys"."~2.4.1" =
    self.by-version."lodash.keys"."2.4.1";
  by-version."lodash.keys"."2.4.1" = self.buildNodePackage {
    name = "lodash.keys-2.4.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash.keys/-/lodash.keys-2.4.1.tgz";
      name = "lodash.keys-2.4.1.tgz";
      sha1 = "48dea46df8ff7632b10d706b8acb26591e2b3727";
    };
    deps = {
      "lodash._isnative-2.4.1" = self.by-version."lodash._isnative"."2.4.1";
      "lodash.isobject-2.4.1" = self.by-version."lodash.isobject"."2.4.1";
      "lodash._shimkeys-2.4.1" = self.by-version."lodash._shimkeys"."2.4.1";
    };
    peerDependencies = [];
  };
  by-spec."lodash.noop"."~2.4.1" =
    self.by-version."lodash.noop"."2.4.1";
  by-version."lodash.noop"."2.4.1" = self.buildNodePackage {
    name = "lodash.noop-2.4.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash.noop/-/lodash.noop-2.4.1.tgz";
      name = "lodash.noop-2.4.1.tgz";
      sha1 = "4fb54f816652e5ae10e8f72f717a388c7326538a";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."lodash.now"."~2.4.1" =
    self.by-version."lodash.now"."2.4.1";
  by-version."lodash.now"."2.4.1" = self.buildNodePackage {
    name = "lodash.now-2.4.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash.now/-/lodash.now-2.4.1.tgz";
      name = "lodash.now-2.4.1.tgz";
      sha1 = "6872156500525185faf96785bb7fe7fe15b562c6";
    };
    deps = {
      "lodash._isnative-2.4.1" = self.by-version."lodash._isnative"."2.4.1";
    };
    peerDependencies = [];
  };
  by-spec."lodash.pad"."^3.0.0" =
    self.by-version."lodash.pad"."3.0.0";
  by-version."lodash.pad"."3.0.0" = self.buildNodePackage {
    name = "lodash.pad-3.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash.pad/-/lodash.pad-3.0.0.tgz";
      name = "lodash.pad-3.0.0.tgz";
      sha1 = "1824e4756a3504b3af7b7a5b9d1f7501b43b2c25";
    };
    deps = {
      "lodash._basetostring-3.0.0" = self.by-version."lodash._basetostring"."3.0.0";
      "lodash._createpad-3.0.1" = self.by-version."lodash._createpad"."3.0.1";
    };
    peerDependencies = [];
  };
  by-spec."lodash.padleft"."^3.0.0" =
    self.by-version."lodash.padleft"."3.0.0";
  by-version."lodash.padleft"."3.0.0" = self.buildNodePackage {
    name = "lodash.padleft-3.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash.padleft/-/lodash.padleft-3.0.0.tgz";
      name = "lodash.padleft-3.0.0.tgz";
      sha1 = "448ac9e28ceb15d0ce9ae8e59dc9311ad17b4390";
    };
    deps = {
      "lodash._basetostring-3.0.0" = self.by-version."lodash._basetostring"."3.0.0";
      "lodash._createpad-3.0.1" = self.by-version."lodash._createpad"."3.0.1";
    };
    peerDependencies = [];
  };
  by-spec."lodash.padright"."^3.0.0" =
    self.by-version."lodash.padright"."3.0.0";
  by-version."lodash.padright"."3.0.0" = self.buildNodePackage {
    name = "lodash.padright-3.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash.padright/-/lodash.padright-3.0.0.tgz";
      name = "lodash.padright-3.0.0.tgz";
      sha1 = "caf2c8222c36d448fe0407b028630e6c5d1b06c6";
    };
    deps = {
      "lodash._basetostring-3.0.0" = self.by-version."lodash._basetostring"."3.0.0";
      "lodash._createpad-3.0.1" = self.by-version."lodash._createpad"."3.0.1";
    };
    peerDependencies = [];
  };
  by-spec."lodash.repeat"."^3.0.0" =
    self.by-version."lodash.repeat"."3.0.0";
  by-version."lodash.repeat"."3.0.0" = self.buildNodePackage {
    name = "lodash.repeat-3.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash.repeat/-/lodash.repeat-3.0.0.tgz";
      name = "lodash.repeat-3.0.0.tgz";
      sha1 = "c340f4136c99dc5b2e397b3fd50cffbd172a94b0";
    };
    deps = {
      "lodash._basetostring-3.0.0" = self.by-version."lodash._basetostring"."3.0.0";
    };
    peerDependencies = [];
  };
  by-spec."lodash.support"."~2.4.1" =
    self.by-version."lodash.support"."2.4.1";
  by-version."lodash.support"."2.4.1" = self.buildNodePackage {
    name = "lodash.support-2.4.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lodash.support/-/lodash.support-2.4.1.tgz";
      name = "lodash.support-2.4.1.tgz";
      sha1 = "320e0b67031673c28d7a2bb5d9e0331a45240515";
    };
    deps = {
      "lodash._isnative-2.4.1" = self.by-version."lodash._isnative"."2.4.1";
    };
    peerDependencies = [];
  };
  by-spec."log4js"."~0.6.3" =
    self.by-version."log4js"."0.6.22";
  by-version."log4js"."0.6.22" = self.buildNodePackage {
    name = "log4js-0.6.22";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/log4js/-/log4js-0.6.22.tgz";
      name = "log4js-0.6.22.tgz";
      sha1 = "dd0ed7c961eec19eaf47dad9f39fee2b7dc71a4c";
    };
    deps = {
      "async-0.2.10" = self.by-version."async"."0.2.10";
      "readable-stream-1.0.33" = self.by-version."readable-stream"."1.0.33";
      "semver-1.1.4" = self.by-version."semver"."1.1.4";
    };
    peerDependencies = [];
  };
  by-spec."lru-cache"."2" =
    self.by-version."lru-cache"."2.5.0";
  by-version."lru-cache"."2.5.0" = self.buildNodePackage {
    name = "lru-cache-2.5.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lru-cache/-/lru-cache-2.5.0.tgz";
      name = "lru-cache-2.5.0.tgz";
      sha1 = "d82388ae9c960becbea0c73bb9eb79b6c6ce9aeb";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."lru-cache"."2.2.x" =
    self.by-version."lru-cache"."2.2.4";
  by-version."lru-cache"."2.2.4" = self.buildNodePackage {
    name = "lru-cache-2.2.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lru-cache/-/lru-cache-2.2.4.tgz";
      name = "lru-cache-2.2.4.tgz";
      sha1 = "6c658619becf14031d0d0b594b16042ce4dc063d";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."lru-cache"."~2.5.0" =
    self.by-version."lru-cache"."2.5.0";
  by-spec."lru-queue"."0.1" =
    self.by-version."lru-queue"."0.1.0";
  by-version."lru-queue"."0.1.0" = self.buildNodePackage {
    name = "lru-queue-0.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/lru-queue/-/lru-queue-0.1.0.tgz";
      name = "lru-queue-0.1.0.tgz";
      sha1 = "2738bd9f0d3cf4f84490c5736c48699ac632cda3";
    };
    deps = {
      "es5-ext-0.10.6" = self.by-version."es5-ext"."0.10.6";
    };
    peerDependencies = [];
  };
  by-spec."map-key"."^0.1.1" =
    self.by-version."map-key"."0.1.5";
  by-version."map-key"."0.1.5" = self.buildNodePackage {
    name = "map-key-0.1.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/map-key/-/map-key-0.1.5.tgz";
      name = "map-key-0.1.5.tgz";
      sha1 = "8afb134f2a321a4de29befcb5aaba3348b37bdfc";
    };
    deps = {
      "lodash-2.4.1" = self.by-version."lodash"."2.4.1";
      "underscore.string-2.4.0" = self.by-version."underscore.string"."2.4.0";
    };
    peerDependencies = [];
  };
  by-spec."map-obj"."^1.0.0" =
    self.by-version."map-obj"."1.0.0";
  by-version."map-obj"."1.0.0" = self.buildNodePackage {
    name = "map-obj-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/map-obj/-/map-obj-1.0.0.tgz";
      name = "map-obj-1.0.0.tgz";
      sha1 = "bcbdf6756758763c182daf79e18094a2f1c85766";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."map-stream"."~0.1.0" =
    self.by-version."map-stream"."0.1.0";
  by-version."map-stream"."0.1.0" = self.buildNodePackage {
    name = "map-stream-0.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/map-stream/-/map-stream-0.1.0.tgz";
      name = "map-stream-0.1.0.tgz";
      sha1 = "e56aa94c4c8055a16404a0674b78f215f7c8e194";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."media-typer"."0.3.0" =
    self.by-version."media-typer"."0.3.0";
  by-version."media-typer"."0.3.0" = self.buildNodePackage {
    name = "media-typer-0.3.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/media-typer/-/media-typer-0.3.0.tgz";
      name = "media-typer-0.3.0.tgz";
      sha1 = "8710d7af0aa626f8fffa1ce00168545263255748";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."memoizee"."0.3.x" =
    self.by-version."memoizee"."0.3.8";
  by-version."memoizee"."0.3.8" = self.buildNodePackage {
    name = "memoizee-0.3.8";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/memoizee/-/memoizee-0.3.8.tgz";
      name = "memoizee-0.3.8.tgz";
      sha1 = "b5faf419f02fafe3c2cc1cf5d3907c210fc7efdc";
    };
    deps = {
      "d-0.1.1" = self.by-version."d"."0.1.1";
      "es5-ext-0.10.6" = self.by-version."es5-ext"."0.10.6";
      "es6-weak-map-0.1.2" = self.by-version."es6-weak-map"."0.1.2";
      "event-emitter-0.3.3" = self.by-version."event-emitter"."0.3.3";
      "lru-queue-0.1.0" = self.by-version."lru-queue"."0.1.0";
      "next-tick-0.2.2" = self.by-version."next-tick"."0.2.2";
      "timers-ext-0.1.0" = self.by-version."timers-ext"."0.1.0";
    };
    peerDependencies = [];
  };
  by-spec."meow"."^2.0.0" =
    self.by-version."meow"."2.1.0";
  by-version."meow"."2.1.0" = self.buildNodePackage {
    name = "meow-2.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/meow/-/meow-2.1.0.tgz";
      name = "meow-2.1.0.tgz";
      sha1 = "3a63f77977c150c16fd84484d0cef677c4182799";
    };
    deps = {
      "camelcase-keys-1.0.0" = self.by-version."camelcase-keys"."1.0.0";
      "indent-string-1.2.0" = self.by-version."indent-string"."1.2.0";
      "minimist-1.1.0" = self.by-version."minimist"."1.1.0";
      "object-assign-2.0.0" = self.by-version."object-assign"."2.0.0";
    };
    peerDependencies = [];
  };
  by-spec."meow"."^2.1.0" =
    self.by-version."meow"."2.1.0";
  by-spec."method-override"."~2.2.0" =
    self.by-version."method-override"."2.2.0";
  by-version."method-override"."2.2.0" = self.buildNodePackage {
    name = "method-override-2.2.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/method-override/-/method-override-2.2.0.tgz";
      name = "method-override-2.2.0.tgz";
      sha1 = "177e852b6add3b4f9177033a9446b01e7801a0c0";
    };
    deps = {
      "debug-2.0.0" = self.by-version."debug"."2.0.0";
      "methods-1.1.0" = self.by-version."methods"."1.1.0";
      "parseurl-1.3.0" = self.by-version."parseurl"."1.3.0";
      "vary-1.0.0" = self.by-version."vary"."1.0.0";
    };
    peerDependencies = [];
  };
  by-spec."methods"."1.1.0" =
    self.by-version."methods"."1.1.0";
  by-version."methods"."1.1.0" = self.buildNodePackage {
    name = "methods-1.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/methods/-/methods-1.1.0.tgz";
      name = "methods-1.1.0.tgz";
      sha1 = "5dca4ee12df52ff3b056145986a8f01cbc86436f";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."mime"."1.2.11" =
    self.by-version."mime"."1.2.11";
  by-version."mime"."1.2.11" = self.buildNodePackage {
    name = "mime-1.2.11";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/mime/-/mime-1.2.11.tgz";
      name = "mime-1.2.11.tgz";
      sha1 = "58203eed86e3a5ef17aed2b7d9ebd47f0a60dd10";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."mime"."~1.2.11" =
    self.by-version."mime"."1.2.11";
  by-spec."mime-db".">= 1.1.2 < 2" =
    self.by-version."mime-db"."1.6.1";
  by-version."mime-db"."1.6.1" = self.buildNodePackage {
    name = "mime-db-1.6.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/mime-db/-/mime-db-1.6.1.tgz";
      name = "mime-db-1.6.1.tgz";
      sha1 = "6e85cd87c961d130d6ebd37efdfc2c0e06fdfcd3";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."mime-db"."~1.6.0" =
    self.by-version."mime-db"."1.6.1";
  by-spec."mime-types"."~1.0.1" =
    self.by-version."mime-types"."1.0.2";
  by-version."mime-types"."1.0.2" = self.buildNodePackage {
    name = "mime-types-1.0.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/mime-types/-/mime-types-1.0.2.tgz";
      name = "mime-types-1.0.2.tgz";
      sha1 = "995ae1392ab8affcbfcb2641dd054e943c0d5dce";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."mime-types"."~2.0.1" =
    self.by-version."mime-types"."2.0.8";
  by-version."mime-types"."2.0.8" = self.buildNodePackage {
    name = "mime-types-2.0.8";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/mime-types/-/mime-types-2.0.8.tgz";
      name = "mime-types-2.0.8.tgz";
      sha1 = "5612bf6b9ec8a1285a81184fa4237fbfdbb89a7e";
    };
    deps = {
      "mime-db-1.6.1" = self.by-version."mime-db"."1.6.1";
    };
    peerDependencies = [];
  };
  by-spec."mime-types"."~2.0.3" =
    self.by-version."mime-types"."2.0.8";
  by-spec."mime-types"."~2.0.4" =
    self.by-version."mime-types"."2.0.8";
  by-spec."mime-types"."~2.0.8" =
    self.by-version."mime-types"."2.0.8";
  by-spec."minimatch"."0.3" =
    self.by-version."minimatch"."0.3.0";
  by-version."minimatch"."0.3.0" = self.buildNodePackage {
    name = "minimatch-0.3.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/minimatch/-/minimatch-0.3.0.tgz";
      name = "minimatch-0.3.0.tgz";
      sha1 = "275d8edaac4f1bb3326472089e7949c8394699dd";
    };
    deps = {
      "lru-cache-2.5.0" = self.by-version."lru-cache"."2.5.0";
      "sigmund-1.0.0" = self.by-version."sigmund"."1.0.0";
    };
    peerDependencies = [];
  };
  by-spec."minimatch"."0.x" =
    self.by-version."minimatch"."0.4.0";
  by-version."minimatch"."0.4.0" = self.buildNodePackage {
    name = "minimatch-0.4.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/minimatch/-/minimatch-0.4.0.tgz";
      name = "minimatch-0.4.0.tgz";
      sha1 = "bd2c7d060d2c8c8fd7cde7f1f2ed2d5b270fdb1b";
    };
    deps = {
      "lru-cache-2.5.0" = self.by-version."lru-cache"."2.5.0";
      "sigmund-1.0.0" = self.by-version."sigmund"."1.0.0";
    };
    peerDependencies = [];
  };
  by-spec."minimatch"."0.x.x" =
    self.by-version."minimatch"."0.4.0";
  by-spec."minimatch"."1" =
    self.by-version."minimatch"."1.0.0";
  by-version."minimatch"."1.0.0" = self.buildNodePackage {
    name = "minimatch-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/minimatch/-/minimatch-1.0.0.tgz";
      name = "minimatch-1.0.0.tgz";
      sha1 = "e0dd2120b49e1b724ce8d714c520822a9438576d";
    };
    deps = {
      "lru-cache-2.5.0" = self.by-version."lru-cache"."2.5.0";
      "sigmund-1.0.0" = self.by-version."sigmund"."1.0.0";
    };
    peerDependencies = [];
  };
  by-spec."minimatch"."^0.3.0" =
    self.by-version."minimatch"."0.3.0";
  by-spec."minimatch"."^2.0.1" =
    self.by-version."minimatch"."2.0.1";
  by-version."minimatch"."2.0.1" = self.buildNodePackage {
    name = "minimatch-2.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/minimatch/-/minimatch-2.0.1.tgz";
      name = "minimatch-2.0.1.tgz";
      sha1 = "6c3760b45f66ed1cd5803143ee8d372488f02c37";
    };
    deps = {
      "brace-expansion-1.1.0" = self.by-version."brace-expansion"."1.1.0";
    };
    peerDependencies = [];
  };
  by-spec."minimatch"."~0.2" =
    self.by-version."minimatch"."0.2.14";
  by-version."minimatch"."0.2.14" = self.buildNodePackage {
    name = "minimatch-0.2.14";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/minimatch/-/minimatch-0.2.14.tgz";
      name = "minimatch-0.2.14.tgz";
      sha1 = "c74e780574f63c6f9a090e90efbe6ef53a6a756a";
    };
    deps = {
      "lru-cache-2.5.0" = self.by-version."lru-cache"."2.5.0";
      "sigmund-1.0.0" = self.by-version."sigmund"."1.0.0";
    };
    peerDependencies = [];
  };
  by-spec."minimatch"."~0.2.11" =
    self.by-version."minimatch"."0.2.14";
  by-spec."minimatch"."~0.2.12" =
    self.by-version."minimatch"."0.2.14";
  by-spec."minimatch"."~1.0.0" =
    self.by-version."minimatch"."1.0.0";
  by-spec."minimatch"."~2.0.1" =
    self.by-version."minimatch"."2.0.1";
  by-spec."minimist"."0.0.8" =
    self.by-version."minimist"."0.0.8";
  by-version."minimist"."0.0.8" = self.buildNodePackage {
    name = "minimist-0.0.8";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/minimist/-/minimist-0.0.8.tgz";
      name = "minimist-0.0.8.tgz";
      sha1 = "857fcabfc3397d2625b8228262e86aa7a011b05d";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."minimist"."^0.2.0" =
    self.by-version."minimist"."0.2.0";
  by-version."minimist"."0.2.0" = self.buildNodePackage {
    name = "minimist-0.2.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/minimist/-/minimist-0.2.0.tgz";
      name = "minimist-0.2.0.tgz";
      sha1 = "4dffe525dae2b864c66c2e23c6271d7afdecefce";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."minimist"."^1.1.0" =
    self.by-version."minimist"."1.1.0";
  by-version."minimist"."1.1.0" = self.buildNodePackage {
    name = "minimist-1.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/minimist/-/minimist-1.1.0.tgz";
      name = "minimist-1.1.0.tgz";
      sha1 = "cdf225e8898f840a258ded44fc91776770afdc93";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."minimist"."~0.0.1" =
    self.by-version."minimist"."0.0.10";
  by-version."minimist"."0.0.10" = self.buildNodePackage {
    name = "minimist-0.0.10";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/minimist/-/minimist-0.0.10.tgz";
      name = "minimist-0.0.10.tgz";
      sha1 = "de3f98543dbf96082be48ad1a0c7cda836301dcf";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."minimist"."~0.0.7" =
    self.by-version."minimist"."0.0.10";
  by-spec."minimist"."~0.0.9" =
    self.by-version."minimist"."0.0.10";
  by-spec."mkdirp"."0.3.0" =
    self.by-version."mkdirp"."0.3.0";
  by-version."mkdirp"."0.3.0" = self.buildNodePackage {
    name = "mkdirp-0.3.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/mkdirp/-/mkdirp-0.3.0.tgz";
      name = "mkdirp-0.3.0.tgz";
      sha1 = "1bbf5ab1ba827af23575143490426455f481fe1e";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."mkdirp"."0.5" =
    self.by-version."mkdirp"."0.5.0";
  by-version."mkdirp"."0.5.0" = self.buildNodePackage {
    name = "mkdirp-0.5.0";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/mkdirp/-/mkdirp-0.5.0.tgz";
      name = "mkdirp-0.5.0.tgz";
      sha1 = "1d73076a6df986cd9344e15e71fcc05a4c9abf12";
    };
    deps = {
      "minimist-0.0.8" = self.by-version."minimist"."0.0.8";
    };
    peerDependencies = [];
  };
  by-spec."mkdirp"."0.5.0" =
    self.by-version."mkdirp"."0.5.0";
  by-spec."mkdirp"."0.5.x" =
    self.by-version."mkdirp"."0.5.0";
  by-spec."mkdirp"."0.x.x" =
    self.by-version."mkdirp"."0.5.0";
  by-spec."mkdirp".">=0.5 0" =
    self.by-version."mkdirp"."0.5.0";
  by-spec."mkdirp"."^0.3.5" =
    self.by-version."mkdirp"."0.3.5";
  by-version."mkdirp"."0.3.5" = self.buildNodePackage {
    name = "mkdirp-0.3.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/mkdirp/-/mkdirp-0.3.5.tgz";
      name = "mkdirp-0.3.5.tgz";
      sha1 = "de3e5f8961c88c787ee1368df849ac4413eca8d7";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."mkdirp"."^0.5.0" =
    self.by-version."mkdirp"."0.5.0";
  by-spec."mkdirp"."~0.5.0" =
    self.by-version."mkdirp"."0.5.0";
  by-spec."mocha"."*" =
    self.by-version."mocha"."2.1.0";
  by-version."mocha"."2.1.0" = self.buildNodePackage {
    name = "mocha-2.1.0";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/mocha/-/mocha-2.1.0.tgz";
      name = "mocha-2.1.0.tgz";
      sha1 = "77752fe592fb9092756827af46cd3eae1b83671c";
    };
    deps = {
      "commander-2.3.0" = self.by-version."commander"."2.3.0";
      "debug-2.0.0" = self.by-version."debug"."2.0.0";
      "diff-1.0.8" = self.by-version."diff"."1.0.8";
      "escape-string-regexp-1.0.2" = self.by-version."escape-string-regexp"."1.0.2";
      "glob-3.2.3" = self.by-version."glob"."3.2.3";
      "growl-1.8.1" = self.by-version."growl"."1.8.1";
      "jade-0.26.3" = self.by-version."jade"."0.26.3";
      "mkdirp-0.5.0" = self.by-version."mkdirp"."0.5.0";
    };
    peerDependencies = [];
  };
  by-spec."module-deps"."~2.0.0" =
    self.by-version."module-deps"."2.0.6";
  by-version."module-deps"."2.0.6" = self.buildNodePackage {
    name = "module-deps-2.0.6";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/module-deps/-/module-deps-2.0.6.tgz";
      name = "module-deps-2.0.6.tgz";
      sha1 = "b999321c73ac33580f00712c0f3075fdca42563f";
    };
    deps = {
      "JSONStream-0.7.4" = self.by-version."JSONStream"."0.7.4";
      "browser-resolve-1.2.4" = self.by-version."browser-resolve"."1.2.4";
      "concat-stream-1.4.7" = self.by-version."concat-stream"."1.4.7";
      "detective-3.1.0" = self.by-version."detective"."3.1.0";
      "duplexer2-0.0.2" = self.by-version."duplexer2"."0.0.2";
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
      "minimist-0.0.10" = self.by-version."minimist"."0.0.10";
      "parents-0.0.2" = self.by-version."parents"."0.0.2";
      "resolve-0.6.3" = self.by-version."resolve"."0.6.3";
      "stream-combiner-0.1.0" = self.by-version."stream-combiner"."0.1.0";
      "through2-0.4.2" = self.by-version."through2"."0.4.2";
      "readable-stream-1.1.13" = self.by-version."readable-stream"."1.1.13";
    };
    peerDependencies = [];
  };
  by-spec."module-deps"."~2.1.1" =
    self.by-version."module-deps"."2.1.5";
  by-version."module-deps"."2.1.5" = self.buildNodePackage {
    name = "module-deps-2.1.5";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/module-deps/-/module-deps-2.1.5.tgz";
      name = "module-deps-2.1.5.tgz";
      sha1 = "375a9bc804ccd64cebb3c62ee643755f0b3ccf29";
    };
    deps = {
      "JSONStream-0.7.4" = self.by-version."JSONStream"."0.7.4";
      "browser-resolve-1.2.4" = self.by-version."browser-resolve"."1.2.4";
      "concat-stream-1.4.7" = self.by-version."concat-stream"."1.4.7";
      "detective-3.1.0" = self.by-version."detective"."3.1.0";
      "duplexer2-0.0.2" = self.by-version."duplexer2"."0.0.2";
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
      "minimist-0.0.10" = self.by-version."minimist"."0.0.10";
      "parents-0.0.2" = self.by-version."parents"."0.0.2";
      "resolve-0.6.3" = self.by-version."resolve"."0.6.3";
      "stream-combiner-0.1.0" = self.by-version."stream-combiner"."0.1.0";
      "through2-0.4.2" = self.by-version."through2"."0.4.2";
      "readable-stream-1.1.13" = self.by-version."readable-stream"."1.1.13";
      "subarg-0.0.1" = self.by-version."subarg"."0.0.1";
    };
    peerDependencies = [];
  };
  by-spec."morgan"."~1.3.2" =
    self.by-version."morgan"."1.3.2";
  by-version."morgan"."1.3.2" = self.buildNodePackage {
    name = "morgan-1.3.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/morgan/-/morgan-1.3.2.tgz";
      name = "morgan-1.3.2.tgz";
      sha1 = "ac41aa15221ee4e5f2ac843896b6918139a18efd";
    };
    deps = {
      "basic-auth-1.0.0" = self.by-version."basic-auth"."1.0.0";
      "depd-0.4.5" = self.by-version."depd"."0.4.5";
      "on-finished-2.1.0" = self.by-version."on-finished"."2.1.0";
    };
    peerDependencies = [];
  };
  by-spec."ms"."0.6.2" =
    self.by-version."ms"."0.6.2";
  by-version."ms"."0.6.2" = self.buildNodePackage {
    name = "ms-0.6.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/ms/-/ms-0.6.2.tgz";
      name = "ms-0.6.2.tgz";
      sha1 = "d89c2124c6fdc1353d65a8b77bf1aac4b193708c";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."multimatch"."^0.3.0" =
    self.by-version."multimatch"."0.3.0";
  by-version."multimatch"."0.3.0" = self.buildNodePackage {
    name = "multimatch-0.3.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/multimatch/-/multimatch-0.3.0.tgz";
      name = "multimatch-0.3.0.tgz";
      sha1 = "603dbc3fe3281d338094a1e1b93a8b5f2be038da";
    };
    deps = {
      "array-differ-0.1.0" = self.by-version."array-differ"."0.1.0";
      "array-union-0.1.0" = self.by-version."array-union"."0.1.0";
      "minimatch-0.3.0" = self.by-version."minimatch"."0.3.0";
    };
    peerDependencies = [];
  };
  by-spec."multiparty"."3.3.2" =
    self.by-version."multiparty"."3.3.2";
  by-version."multiparty"."3.3.2" = self.buildNodePackage {
    name = "multiparty-3.3.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/multiparty/-/multiparty-3.3.2.tgz";
      name = "multiparty-3.3.2.tgz";
      sha1 = "35de6804dc19643e5249f3d3e3bdc6c8ce301d3f";
    };
    deps = {
      "readable-stream-1.1.13" = self.by-version."readable-stream"."1.1.13";
      "stream-counter-0.2.0" = self.by-version."stream-counter"."0.2.0";
    };
    peerDependencies = [];
  };
  by-spec."mute-stream"."0.0.4" =
    self.by-version."mute-stream"."0.0.4";
  by-version."mute-stream"."0.0.4" = self.buildNodePackage {
    name = "mute-stream-0.0.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/mute-stream/-/mute-stream-0.0.4.tgz";
      name = "mute-stream-0.0.4.tgz";
      sha1 = "a9219960a6d5d5d046597aee51252c6655f7177e";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."mute-stream"."~0.0.4" =
    self.by-version."mute-stream"."0.0.4";
  by-spec."mz"."1" =
    self.by-version."mz"."1.2.1";
  by-version."mz"."1.2.1" = self.buildNodePackage {
    name = "mz-1.2.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/mz/-/mz-1.2.1.tgz";
      name = "mz-1.2.1.tgz";
      sha1 = "a758a8012cb43b59e209596a0e124cfff87c6923";
    };
    deps = {
      "native-or-bluebird-1.1.2" = self.by-version."native-or-bluebird"."1.1.2";
      "thenify-3.1.0" = self.by-version."thenify"."3.1.0";
      "thenify-all-1.6.0" = self.by-version."thenify-all"."1.6.0";
    };
    peerDependencies = [];
  };
  by-spec."nan"."~0.8.0" =
    self.by-version."nan"."0.8.0";
  by-version."nan"."0.8.0" = self.buildNodePackage {
    name = "nan-0.8.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/nan/-/nan-0.8.0.tgz";
      name = "nan-0.8.0.tgz";
      sha1 = "022a8fa5e9fe8420964ac1fb3dc94e17f449f5fd";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."nan"."~1.0.0" =
    self.by-version."nan"."1.0.0";
  by-version."nan"."1.0.0" = self.buildNodePackage {
    name = "nan-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/nan/-/nan-1.0.0.tgz";
      name = "nan-1.0.0.tgz";
      sha1 = "ae24f8850818d662fcab5acf7f3b95bfaa2ccf38";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."nan"."~1.5.0" =
    self.by-version."nan"."1.5.3";
  by-version."nan"."1.5.3" = self.buildNodePackage {
    name = "nan-1.5.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/nan/-/nan-1.5.3.tgz";
      name = "nan-1.5.3.tgz";
      sha1 = "4cd0ecc133b7b0700a492a646add427ae8a318eb";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."native-or-bluebird"."1" =
    self.by-version."native-or-bluebird"."1.1.2";
  by-version."native-or-bluebird"."1.1.2" = self.buildNodePackage {
    name = "native-or-bluebird-1.1.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/native-or-bluebird/-/native-or-bluebird-1.1.2.tgz";
      name = "native-or-bluebird-1.1.2.tgz";
      sha1 = "3921e110232d1eb790f3dac61bb370531c7d356e";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."native-or-bluebird"."~1.1.2" =
    self.by-version."native-or-bluebird"."1.1.2";
  by-spec."ncp"."0.4.x" =
    self.by-version."ncp"."0.4.2";
  by-version."ncp"."0.4.2" = self.buildNodePackage {
    name = "ncp-0.4.2";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/ncp/-/ncp-0.4.2.tgz";
      name = "ncp-0.4.2.tgz";
      sha1 = "abcc6cbd3ec2ed2a729ff6e7c1fa8f01784a8574";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."ncp"."^0.6.0" =
    self.by-version."ncp"."0.6.0";
  by-version."ncp"."0.6.0" = self.buildNodePackage {
    name = "ncp-0.6.0";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/ncp/-/ncp-0.6.0.tgz";
      name = "ncp-0.6.0.tgz";
      sha1 = "df8ce021e262be21b52feb3d3e5cfaab12491f0d";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."negotiator"."0.4.9" =
    self.by-version."negotiator"."0.4.9";
  by-version."negotiator"."0.4.9" = self.buildNodePackage {
    name = "negotiator-0.4.9";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/negotiator/-/negotiator-0.4.9.tgz";
      name = "negotiator-0.4.9.tgz";
      sha1 = "92e46b6db53c7e421ed64a2bc94f08be7630df3f";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."next-tick"."~0.2.2" =
    self.by-version."next-tick"."0.2.2";
  by-version."next-tick"."0.2.2" = self.buildNodePackage {
    name = "next-tick-0.2.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/next-tick/-/next-tick-0.2.2.tgz";
      name = "next-tick-0.2.2.tgz";
      sha1 = "75da4a927ee5887e39065880065b7336413b310d";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."node-gyp"."~1.0.2" =
    self.by-version."node-gyp"."1.0.2";
  by-version."node-gyp"."1.0.2" = self.buildNodePackage {
    name = "node-gyp-1.0.2";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/node-gyp/-/node-gyp-1.0.2.tgz";
      name = "node-gyp-1.0.2.tgz";
      sha1 = "b0bb6d2d762271408dd904853e7aa3000ed2eb57";
    };
    deps = {
      "fstream-1.0.4" = self.by-version."fstream"."1.0.4";
      "glob-4.3.5" = self.by-version."glob"."4.3.5";
      "graceful-fs-3.0.5" = self.by-version."graceful-fs"."3.0.5";
      "minimatch-1.0.0" = self.by-version."minimatch"."1.0.0";
      "mkdirp-0.5.0" = self.by-version."mkdirp"."0.5.0";
      "nopt-3.0.1" = self.by-version."nopt"."3.0.1";
      "npmlog-0.1.1" = self.by-version."npmlog"."0.1.1";
      "osenv-0.1.0" = self.by-version."osenv"."0.1.0";
      "request-2.53.0" = self.by-version."request"."2.53.0";
      "rimraf-2.2.8" = self.by-version."rimraf"."2.2.8";
      "semver-4.2.0" = self.by-version."semver"."4.2.0";
      "tar-1.0.3" = self.by-version."tar"."1.0.3";
      "which-1.0.8" = self.by-version."which"."1.0.8";
    };
    peerDependencies = [];
  };
  by-spec."node-uuid"."~1.4.0" =
    self.by-version."node-uuid"."1.4.2";
  by-version."node-uuid"."1.4.2" = self.buildNodePackage {
    name = "node-uuid-1.4.2";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/node-uuid/-/node-uuid-1.4.2.tgz";
      name = "node-uuid-1.4.2.tgz";
      sha1 = "907db3d11b7b6a2cf4f905fb7199f14ae7379ba0";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."nopt"."2 || 3" =
    self.by-version."nopt"."3.0.1";
  by-version."nopt"."3.0.1" = self.buildNodePackage {
    name = "nopt-3.0.1";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/nopt/-/nopt-3.0.1.tgz";
      name = "nopt-3.0.1.tgz";
      sha1 = "bce5c42446a3291f47622a370abbf158fbbacbfd";
    };
    deps = {
      "abbrev-1.0.5" = self.by-version."abbrev"."1.0.5";
    };
    peerDependencies = [];
  };
  by-spec."nopt"."3.x" =
    self.by-version."nopt"."3.0.1";
  by-spec."nopt"."^2.2.0" =
    self.by-version."nopt"."2.2.1";
  by-version."nopt"."2.2.1" = self.buildNodePackage {
    name = "nopt-2.2.1";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/nopt/-/nopt-2.2.1.tgz";
      name = "nopt-2.2.1.tgz";
      sha1 = "2aa09b7d1768487b3b89a9c5aa52335bff0baea7";
    };
    deps = {
      "abbrev-1.0.5" = self.by-version."abbrev"."1.0.5";
    };
    peerDependencies = [];
  };
  by-spec."nopt"."~1.0.10" =
    self.by-version."nopt"."1.0.10";
  by-version."nopt"."1.0.10" = self.buildNodePackage {
    name = "nopt-1.0.10";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/nopt/-/nopt-1.0.10.tgz";
      name = "nopt-1.0.10.tgz";
      sha1 = "6ddd21bd2a31417b92727dd585f8a6f37608ebee";
    };
    deps = {
      "abbrev-1.0.5" = self.by-version."abbrev"."1.0.5";
    };
    peerDependencies = [];
  };
  by-spec."nopt"."~2.0.0" =
    self.by-version."nopt"."2.0.0";
  by-version."nopt"."2.0.0" = self.buildNodePackage {
    name = "nopt-2.0.0";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/nopt/-/nopt-2.0.0.tgz";
      name = "nopt-2.0.0.tgz";
      sha1 = "ca7416f20a5e3f9c3b86180f96295fa3d0b52e0d";
    };
    deps = {
      "abbrev-1.0.5" = self.by-version."abbrev"."1.0.5";
    };
    peerDependencies = [];
  };
  by-spec."nopt"."~3.0.1" =
    self.by-version."nopt"."3.0.1";
  by-spec."noptify"."~0.0.3" =
    self.by-version."noptify"."0.0.3";
  by-version."noptify"."0.0.3" = self.buildNodePackage {
    name = "noptify-0.0.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/noptify/-/noptify-0.0.3.tgz";
      name = "noptify-0.0.3.tgz";
      sha1 = "58f654a73d9753df0c51d9686dc92104a67f4bbb";
    };
    deps = {
      "nopt-2.0.0" = self.by-version."nopt"."2.0.0";
    };
    peerDependencies = [];
  };
  by-spec."normalize-git-url"."~1.0.0" =
    self.by-version."normalize-git-url"."1.0.0";
  by-version."normalize-git-url"."1.0.0" = self.buildNodePackage {
    name = "normalize-git-url-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/normalize-git-url/-/normalize-git-url-1.0.0.tgz";
      name = "normalize-git-url-1.0.0.tgz";
      sha1 = "80e59471f0616b579893973e3f1b3684bedbad48";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."normalize-package-data"."^1.0.0" =
    self.by-version."normalize-package-data"."1.0.3";
  by-version."normalize-package-data"."1.0.3" = self.buildNodePackage {
    name = "normalize-package-data-1.0.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/normalize-package-data/-/normalize-package-data-1.0.3.tgz";
      name = "normalize-package-data-1.0.3.tgz";
      sha1 = "8be955b8907af975f1a4584ea8bb9b41492312f5";
    };
    deps = {
      "github-url-from-git-1.4.0" = self.by-version."github-url-from-git"."1.4.0";
      "github-url-from-username-repo-1.0.2" = self.by-version."github-url-from-username-repo"."1.0.2";
      "semver-4.2.0" = self.by-version."semver"."4.2.0";
    };
    peerDependencies = [];
  };
  by-spec."normalize-package-data"."~1.0.1" =
    self.by-version."normalize-package-data"."1.0.3";
  by-spec."normalize-package-data"."~1.0.3" =
    self.by-version."normalize-package-data"."1.0.3";
  by-spec."npm"."^2.1.4" =
    self.by-version."npm"."2.5.1";
  by-version."npm"."2.5.1" = self.buildNodePackage {
    name = "npm-2.5.1";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/npm/-/npm-2.5.1.tgz";
      name = "npm-2.5.1.tgz";
      sha1 = "23e4b0fdd1ffced7d835780e692a9e5a0125bb02";
    };
    deps = {
      "abbrev-1.0.5" = self.by-version."abbrev"."1.0.5";
      "ansi-0.3.0" = self.by-version."ansi"."0.3.0";
      "ansicolors-0.3.2" = self.by-version."ansicolors"."0.3.2";
      "ansistyles-0.1.3" = self.by-version."ansistyles"."0.1.3";
      "archy-1.0.0" = self.by-version."archy"."1.0.0";
      "async-some-1.0.1" = self.by-version."async-some"."1.0.1";
      "block-stream-0.0.7" = self.by-version."block-stream"."0.0.7";
      "char-spinner-1.0.1" = self.by-version."char-spinner"."1.0.1";
      "child-process-close-0.1.1" = self.by-version."child-process-close"."0.1.1";
      "chmodr-0.1.0" = self.by-version."chmodr"."0.1.0";
      "chownr-0.0.1" = self.by-version."chownr"."0.0.1";
      "cmd-shim-2.0.1" = self.by-version."cmd-shim"."2.0.1";
      "columnify-1.4.1" = self.by-version."columnify"."1.4.1";
      "config-chain-1.1.8" = self.by-version."config-chain"."1.1.8";
      "dezalgo-1.0.1" = self.by-version."dezalgo"."1.0.1";
      "editor-0.1.0" = self.by-version."editor"."0.1.0";
      "fs-vacuum-1.2.5" = self.by-version."fs-vacuum"."1.2.5";
      "fs-write-stream-atomic-1.0.2" = self.by-version."fs-write-stream-atomic"."1.0.2";
      "fstream-1.0.4" = self.by-version."fstream"."1.0.4";
      "fstream-npm-1.0.1" = self.by-version."fstream-npm"."1.0.1";
      "github-url-from-git-1.4.0" = self.by-version."github-url-from-git"."1.4.0";
      "github-url-from-username-repo-1.0.2" = self.by-version."github-url-from-username-repo"."1.0.2";
      "glob-4.3.5" = self.by-version."glob"."4.3.5";
      "graceful-fs-3.0.5" = self.by-version."graceful-fs"."3.0.5";
      "inflight-1.0.4" = self.by-version."inflight"."1.0.4";
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
      "ini-1.3.2" = self.by-version."ini"."1.3.2";
      "init-package-json-1.2.0" = self.by-version."init-package-json"."1.2.0";
      "lockfile-1.0.0" = self.by-version."lockfile"."1.0.0";
      "lru-cache-2.5.0" = self.by-version."lru-cache"."2.5.0";
      "minimatch-2.0.1" = self.by-version."minimatch"."2.0.1";
      "mkdirp-0.5.0" = self.by-version."mkdirp"."0.5.0";
      "node-gyp-1.0.2" = self.by-version."node-gyp"."1.0.2";
      "nopt-3.0.1" = self.by-version."nopt"."3.0.1";
      "normalize-git-url-1.0.0" = self.by-version."normalize-git-url"."1.0.0";
      "normalize-package-data-1.0.3" = self.by-version."normalize-package-data"."1.0.3";
      "npm-cache-filename-1.0.1" = self.by-version."npm-cache-filename"."1.0.1";
      "npm-install-checks-1.0.5" = self.by-version."npm-install-checks"."1.0.5";
      "npm-package-arg-2.1.3" = self.by-version."npm-package-arg"."2.1.3";
      "npm-registry-client-6.0.7" = self.by-version."npm-registry-client"."6.0.7";
      "npm-user-validate-0.1.1" = self.by-version."npm-user-validate"."0.1.1";
      "npmlog-0.1.1" = self.by-version."npmlog"."0.1.1";
      "once-1.3.1" = self.by-version."once"."1.3.1";
      "opener-1.4.0" = self.by-version."opener"."1.4.0";
      "osenv-0.1.0" = self.by-version."osenv"."0.1.0";
      "path-is-inside-1.0.1" = self.by-version."path-is-inside"."1.0.1";
      "read-1.0.5" = self.by-version."read"."1.0.5";
      "read-installed-3.1.5" = self.by-version."read-installed"."3.1.5";
      "read-package-json-1.2.7" = self.by-version."read-package-json"."1.2.7";
      "readable-stream-1.0.33" = self.by-version."readable-stream"."1.0.33";
      "realize-package-specifier-1.3.0" = self.by-version."realize-package-specifier"."1.3.0";
      "request-2.53.0" = self.by-version."request"."2.53.0";
      "retry-0.6.1" = self.by-version."retry"."0.6.1";
      "rimraf-2.2.8" = self.by-version."rimraf"."2.2.8";
      "semver-4.2.0" = self.by-version."semver"."4.2.0";
      "sha-1.3.0" = self.by-version."sha"."1.3.0";
      "slide-1.1.6" = self.by-version."slide"."1.1.6";
      "sorted-object-1.0.0" = self.by-version."sorted-object"."1.0.0";
      "tar-1.0.3" = self.by-version."tar"."1.0.3";
      "text-table-0.2.0" = self.by-version."text-table"."0.2.0";
      "uid-number-0.0.6" = self.by-version."uid-number"."0.0.6";
      "umask-1.1.0" = self.by-version."umask"."1.1.0";
      "which-1.0.8" = self.by-version."which"."1.0.8";
      "wrappy-1.0.1" = self.by-version."wrappy"."1.0.1";
      "write-file-atomic-1.1.0" = self.by-version."write-file-atomic"."1.1.0";
    };
    peerDependencies = [];
  };
  by-spec."npm-cache-filename"."~1.0.1" =
    self.by-version."npm-cache-filename"."1.0.1";
  by-version."npm-cache-filename"."1.0.1" = self.buildNodePackage {
    name = "npm-cache-filename-1.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/npm-cache-filename/-/npm-cache-filename-1.0.1.tgz";
      name = "npm-cache-filename-1.0.1.tgz";
      sha1 = "9b640f0c1a5ba1145659685372a9ff71f70c4323";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."npm-install-checks"."~1.0.5" =
    self.by-version."npm-install-checks"."1.0.5";
  by-version."npm-install-checks"."1.0.5" = self.buildNodePackage {
    name = "npm-install-checks-1.0.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/npm-install-checks/-/npm-install-checks-1.0.5.tgz";
      name = "npm-install-checks-1.0.5.tgz";
      sha1 = "a1b5beabfd60e0535b14f763157c410cb6bdae56";
    };
    deps = {
      "npmlog-1.1.0" = self.by-version."npmlog"."1.1.0";
      "semver-4.2.0" = self.by-version."semver"."4.2.0";
    };
    peerDependencies = [];
  };
  by-spec."npm-package-arg"."^2.1.3" =
    self.by-version."npm-package-arg"."2.1.3";
  by-version."npm-package-arg"."2.1.3" = self.buildNodePackage {
    name = "npm-package-arg-2.1.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/npm-package-arg/-/npm-package-arg-2.1.3.tgz";
      name = "npm-package-arg-2.1.3.tgz";
      sha1 = "dfba34bd82dd327c10cb43a65c8db6ef0b812bf7";
    };
    deps = {
      "semver-4.2.0" = self.by-version."semver"."4.2.0";
    };
    peerDependencies = [];
  };
  by-spec."npm-package-arg"."^3.0.0" =
    self.by-version."npm-package-arg"."3.1.0";
  by-version."npm-package-arg"."3.1.0" = self.buildNodePackage {
    name = "npm-package-arg-3.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/npm-package-arg/-/npm-package-arg-3.1.0.tgz";
      name = "npm-package-arg-3.1.0.tgz";
      sha1 = "8ce9d8ad83ae9fcc433783ca813e4e91f885703e";
    };
    deps = {
      "hosted-git-info-1.5.3" = self.by-version."hosted-git-info"."1.5.3";
      "semver-4.2.0" = self.by-version."semver"."4.2.0";
    };
    peerDependencies = [];
  };
  by-spec."npm-package-arg"."~2.1.3" =
    self.by-version."npm-package-arg"."2.1.3";
  by-spec."npm-path"."^1.0.0" =
    self.by-version."npm-path"."1.0.1";
  by-version."npm-path"."1.0.1" = self.buildNodePackage {
    name = "npm-path-1.0.1";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/npm-path/-/npm-path-1.0.1.tgz";
      name = "npm-path-1.0.1.tgz";
      sha1 = "15d750efc9d8808194c721481dfa210fbde415c5";
    };
    deps = {
      "which-1.0.8" = self.by-version."which"."1.0.8";
    };
    peerDependencies = [];
  };
  by-spec."npm-registry-client"."~6.0.7" =
    self.by-version."npm-registry-client"."6.0.7";
  by-version."npm-registry-client"."6.0.7" = self.buildNodePackage {
    name = "npm-registry-client-6.0.7";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/npm-registry-client/-/npm-registry-client-6.0.7.tgz";
      name = "npm-registry-client-6.0.7.tgz";
      sha1 = "c9f36f727f0b72f47a9ed11a539829770565e0fb";
    };
    deps = {
      "chownr-0.0.1" = self.by-version."chownr"."0.0.1";
      "concat-stream-1.4.7" = self.by-version."concat-stream"."1.4.7";
      "graceful-fs-3.0.5" = self.by-version."graceful-fs"."3.0.5";
      "mkdirp-0.5.0" = self.by-version."mkdirp"."0.5.0";
      "normalize-package-data-1.0.3" = self.by-version."normalize-package-data"."1.0.3";
      "npm-package-arg-3.1.0" = self.by-version."npm-package-arg"."3.1.0";
      "once-1.3.1" = self.by-version."once"."1.3.1";
      "request-2.53.0" = self.by-version."request"."2.53.0";
      "retry-0.6.1" = self.by-version."retry"."0.6.1";
      "rimraf-2.2.8" = self.by-version."rimraf"."2.2.8";
      "semver-4.2.0" = self.by-version."semver"."4.2.0";
      "slide-1.1.6" = self.by-version."slide"."1.1.6";
      "npmlog-1.1.0" = self.by-version."npmlog"."1.1.0";
    };
    peerDependencies = [];
  };
  by-spec."npm-user-validate"."~0.1.1" =
    self.by-version."npm-user-validate"."0.1.1";
  by-version."npm-user-validate"."0.1.1" = self.buildNodePackage {
    name = "npm-user-validate-0.1.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/npm-user-validate/-/npm-user-validate-0.1.1.tgz";
      name = "npm-user-validate-0.1.1.tgz";
      sha1 = "ea7774636c3c8fe6d01e174bd9f2ee0e22eeed57";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."npm-which"."^1.0.1" =
    self.by-version."npm-which"."1.0.2";
  by-version."npm-which"."1.0.2" = self.buildNodePackage {
    name = "npm-which-1.0.2";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/npm-which/-/npm-which-1.0.2.tgz";
      name = "npm-which-1.0.2.tgz";
      sha1 = "132d209b7f73abfafd4f3f555fd1066d8d8ec202";
    };
    deps = {
      "commander-2.6.0" = self.by-version."commander"."2.6.0";
      "npm-path-1.0.1" = self.by-version."npm-path"."1.0.1";
      "which-1.0.8" = self.by-version."which"."1.0.8";
    };
    peerDependencies = [];
  };
  by-spec."npmconf"."2.0.9" =
    self.by-version."npmconf"."2.0.9";
  by-version."npmconf"."2.0.9" = self.buildNodePackage {
    name = "npmconf-2.0.9";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/npmconf/-/npmconf-2.0.9.tgz";
      name = "npmconf-2.0.9.tgz";
      sha1 = "5c87e5fb308104eceeca781e3d9115d216351ef2";
    };
    deps = {
      "config-chain-1.1.8" = self.by-version."config-chain"."1.1.8";
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
      "ini-1.3.2" = self.by-version."ini"."1.3.2";
      "mkdirp-0.5.0" = self.by-version."mkdirp"."0.5.0";
      "nopt-3.0.1" = self.by-version."nopt"."3.0.1";
      "once-1.3.1" = self.by-version."once"."1.3.1";
      "osenv-0.1.0" = self.by-version."osenv"."0.1.0";
      "semver-4.2.0" = self.by-version."semver"."4.2.0";
      "uid-number-0.0.5" = self.by-version."uid-number"."0.0.5";
    };
    peerDependencies = [];
  };
  by-spec."npmlog"."*" =
    self.by-version."npmlog"."1.1.0";
  by-version."npmlog"."1.1.0" = self.buildNodePackage {
    name = "npmlog-1.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/npmlog/-/npmlog-1.1.0.tgz";
      name = "npmlog-1.1.0.tgz";
      sha1 = "8744168148df1ce3f3387c0bc38154883b4af5f4";
    };
    deps = {
      "ansi-0.3.0" = self.by-version."ansi"."0.3.0";
      "are-we-there-yet-1.0.2" = self.by-version."are-we-there-yet"."1.0.2";
      "gauge-1.1.0" = self.by-version."gauge"."1.1.0";
    };
    peerDependencies = [];
  };
  by-spec."npmlog"."0" =
    self.by-version."npmlog"."0.1.1";
  by-version."npmlog"."0.1.1" = self.buildNodePackage {
    name = "npmlog-0.1.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/npmlog/-/npmlog-0.1.1.tgz";
      name = "npmlog-0.1.1.tgz";
      sha1 = "8b9b9e4405d7ec48c31c2346965aadc7abaecaa5";
    };
    deps = {
      "ansi-0.3.0" = self.by-version."ansi"."0.3.0";
    };
    peerDependencies = [];
  };
  by-spec."npmlog"."0.1 || 1" =
    self.by-version."npmlog"."1.1.0";
  by-spec."npmlog"."~0.1.1" =
    self.by-version."npmlog"."0.1.1";
  by-spec."oauth-sign"."~0.4.0" =
    self.by-version."oauth-sign"."0.4.0";
  by-version."oauth-sign"."0.4.0" = self.buildNodePackage {
    name = "oauth-sign-0.4.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/oauth-sign/-/oauth-sign-0.4.0.tgz";
      name = "oauth-sign-0.4.0.tgz";
      sha1 = "f22956f31ea7151a821e5f2fb32c113cad8b9f69";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."oauth-sign"."~0.6.0" =
    self.by-version."oauth-sign"."0.6.0";
  by-version."oauth-sign"."0.6.0" = self.buildNodePackage {
    name = "oauth-sign-0.6.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/oauth-sign/-/oauth-sign-0.6.0.tgz";
      name = "oauth-sign-0.6.0.tgz";
      sha1 = "7dbeae44f6ca454e1f168451d630746735813ce3";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."object-assign"."^0.3.0" =
    self.by-version."object-assign"."0.3.1";
  by-version."object-assign"."0.3.1" = self.buildNodePackage {
    name = "object-assign-0.3.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/object-assign/-/object-assign-0.3.1.tgz";
      name = "object-assign-0.3.1.tgz";
      sha1 = "060e2a2a27d7c0d77ec77b78f11aa47fd88008d2";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."object-assign"."^1.0.0" =
    self.by-version."object-assign"."1.0.0";
  by-version."object-assign"."1.0.0" = self.buildNodePackage {
    name = "object-assign-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/object-assign/-/object-assign-1.0.0.tgz";
      name = "object-assign-1.0.0.tgz";
      sha1 = "e65dc8766d3b47b4b8307465c8311da030b070a6";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."object-assign"."^2.0.0" =
    self.by-version."object-assign"."2.0.0";
  by-version."object-assign"."2.0.0" = self.buildNodePackage {
    name = "object-assign-2.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/object-assign/-/object-assign-2.0.0.tgz";
      name = "object-assign-2.0.0.tgz";
      sha1 = "f8309b09083b01261ece3ef7373f2b57b8dd7042";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."object-keys"."~0.4.0" =
    self.by-version."object-keys"."0.4.0";
  by-version."object-keys"."0.4.0" = self.buildNodePackage {
    name = "object-keys-0.4.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/object-keys/-/object-keys-0.4.0.tgz";
      name = "object-keys-0.4.0.tgz";
      sha1 = "28a6aae7428dd2c3a92f3d95f21335dd204e0336";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."on-finished"."2.1.0" =
    self.by-version."on-finished"."2.1.0";
  by-version."on-finished"."2.1.0" = self.buildNodePackage {
    name = "on-finished-2.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/on-finished/-/on-finished-2.1.0.tgz";
      name = "on-finished-2.1.0.tgz";
      sha1 = "0c539f09291e8ffadde0c8a25850fb2cedc7022d";
    };
    deps = {
      "ee-first-1.0.5" = self.by-version."ee-first"."1.0.5";
    };
    peerDependencies = [];
  };
  by-spec."on-headers"."~1.0.0" =
    self.by-version."on-headers"."1.0.0";
  by-version."on-headers"."1.0.0" = self.buildNodePackage {
    name = "on-headers-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/on-headers/-/on-headers-1.0.0.tgz";
      name = "on-headers-1.0.0.tgz";
      sha1 = "2c75b5da4375513d0161c6052e7fcbe4953fca5d";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."once"."^1.3.0" =
    self.by-version."once"."1.3.1";
  by-version."once"."1.3.1" = self.buildNodePackage {
    name = "once-1.3.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/once/-/once-1.3.1.tgz";
      name = "once-1.3.1.tgz";
      sha1 = "f3f3e4da5b7d27b5c732969ee3e67e729457b31f";
    };
    deps = {
      "wrappy-1.0.1" = self.by-version."wrappy"."1.0.1";
    };
    peerDependencies = [];
  };
  by-spec."once"."~1.3.0" =
    self.by-version."once"."1.3.1";
  by-spec."once"."~1.3.1" =
    self.by-version."once"."1.3.1";
  by-spec."open"."0.0.5" =
    self.by-version."open"."0.0.5";
  by-version."open"."0.0.5" = self.buildNodePackage {
    name = "open-0.0.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/open/-/open-0.0.5.tgz";
      name = "open-0.0.5.tgz";
      sha1 = "42c3e18ec95466b6bf0dc42f3a2945c3f0cad8fc";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."opener"."~1.4.0" =
    self.by-version."opener"."1.4.0";
  by-version."opener"."1.4.0" = self.buildNodePackage {
    name = "opener-1.4.0";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/opener/-/opener-1.4.0.tgz";
      name = "opener-1.4.0.tgz";
      sha1 = "d11f86eeeb076883735c9d509f538fe82d10b941";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."optimist"."0.6.x" =
    self.by-version."optimist"."0.6.1";
  by-version."optimist"."0.6.1" = self.buildNodePackage {
    name = "optimist-0.6.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/optimist/-/optimist-0.6.1.tgz";
      name = "optimist-0.6.1.tgz";
      sha1 = "da3ea74686fa21a19a111c326e90eb15a0196686";
    };
    deps = {
      "wordwrap-0.0.2" = self.by-version."wordwrap"."0.0.2";
      "minimist-0.0.10" = self.by-version."minimist"."0.0.10";
    };
    peerDependencies = [];
  };
  by-spec."optimist"."^0.6.1" =
    self.by-version."optimist"."0.6.1";
  by-spec."optimist"."~0.3" =
    self.by-version."optimist"."0.3.7";
  by-version."optimist"."0.3.7" = self.buildNodePackage {
    name = "optimist-0.3.7";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/optimist/-/optimist-0.3.7.tgz";
      name = "optimist-0.3.7.tgz";
      sha1 = "c90941ad59e4273328923074d2cf2e7cbc6ec0d9";
    };
    deps = {
      "wordwrap-0.0.2" = self.by-version."wordwrap"."0.0.2";
    };
    peerDependencies = [];
  };
  by-spec."optimist"."~0.3.5" =
    self.by-version."optimist"."0.3.7";
  by-spec."optimist"."~0.5.0" =
    self.by-version."optimist"."0.5.2";
  by-version."optimist"."0.5.2" = self.buildNodePackage {
    name = "optimist-0.5.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/optimist/-/optimist-0.5.2.tgz";
      name = "optimist-0.5.2.tgz";
      sha1 = "85c8c1454b3315e4a78947e857b1df033450bfbc";
    };
    deps = {
      "wordwrap-0.0.2" = self.by-version."wordwrap"."0.0.2";
    };
    peerDependencies = [];
  };
  by-spec."optimist"."~0.6.0" =
    self.by-version."optimist"."0.6.1";
  by-spec."options".">=0.0.5" =
    self.by-version."options"."0.0.6";
  by-version."options"."0.0.6" = self.buildNodePackage {
    name = "options-0.0.6";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/options/-/options-0.0.6.tgz";
      name = "options-0.0.6.tgz";
      sha1 = "ec22d312806bb53e731773e7cdaefcf1c643128f";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."os-browserify"."~0.1.1" =
    self.by-version."os-browserify"."0.1.2";
  by-version."os-browserify"."0.1.2" = self.buildNodePackage {
    name = "os-browserify-0.1.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/os-browserify/-/os-browserify-0.1.2.tgz";
      name = "os-browserify-0.1.2.tgz";
      sha1 = "49ca0293e0b19590a5f5de10c7f265a617d8fe54";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."os-name"."^1.0.0" =
    self.by-version."os-name"."1.0.3";
  by-version."os-name"."1.0.3" = self.buildNodePackage {
    name = "os-name-1.0.3";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/os-name/-/os-name-1.0.3.tgz";
      name = "os-name-1.0.3.tgz";
      sha1 = "1b379f64835af7c5a7f498b357cb95215c159edf";
    };
    deps = {
      "osx-release-1.0.0" = self.by-version."osx-release"."1.0.0";
      "win-release-1.0.0" = self.by-version."win-release"."1.0.0";
    };
    peerDependencies = [];
  };
  by-spec."osenv"."0" =
    self.by-version."osenv"."0.1.0";
  by-version."osenv"."0.1.0" = self.buildNodePackage {
    name = "osenv-0.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/osenv/-/osenv-0.1.0.tgz";
      name = "osenv-0.1.0.tgz";
      sha1 = "61668121eec584955030b9f470b1d2309504bfcb";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."osenv"."^0.1.0" =
    self.by-version."osenv"."0.1.0";
  by-spec."osenv"."~0.1.0" =
    self.by-version."osenv"."0.1.0";
  by-spec."osx-release"."^1.0.0" =
    self.by-version."osx-release"."1.0.0";
  by-version."osx-release"."1.0.0" = self.buildNodePackage {
    name = "osx-release-1.0.0";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/osx-release/-/osx-release-1.0.0.tgz";
      name = "osx-release-1.0.0.tgz";
      sha1 = "02bee80f3b898aaa88922d2f86e178605974beac";
    };
    deps = {
      "minimist-1.1.0" = self.by-version."minimist"."1.1.0";
    };
    peerDependencies = [];
  };
  by-spec."package-json"."^1.0.0" =
    self.by-version."package-json"."1.0.1";
  by-version."package-json"."1.0.1" = self.buildNodePackage {
    name = "package-json-1.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/package-json/-/package-json-1.0.1.tgz";
      name = "package-json-1.0.1.tgz";
      sha1 = "89cc831317c4d17922413d5318b23c904e5cf43e";
    };
    deps = {
      "got-1.2.2" = self.by-version."got"."1.2.2";
      "registry-url-2.1.0" = self.by-version."registry-url"."2.1.0";
    };
    peerDependencies = [];
  };
  by-spec."pako"."~0.2.0" =
    self.by-version."pako"."0.2.5";
  by-version."pako"."0.2.5" = self.buildNodePackage {
    name = "pako-0.2.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/pako/-/pako-0.2.5.tgz";
      name = "pako-0.2.5.tgz";
      sha1 = "36df19467a3879152e9adcc44784f07d0a80c525";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."parents"."0.0.2" =
    self.by-version."parents"."0.0.2";
  by-version."parents"."0.0.2" = self.buildNodePackage {
    name = "parents-0.0.2";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/parents/-/parents-0.0.2.tgz";
      name = "parents-0.0.2.tgz";
      sha1 = "67147826e497d40759aaf5ba4c99659b6034d302";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."parents"."~0.0.1" =
    self.by-version."parents"."0.0.3";
  by-version."parents"."0.0.3" = self.buildNodePackage {
    name = "parents-0.0.3";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/parents/-/parents-0.0.3.tgz";
      name = "parents-0.0.3.tgz";
      sha1 = "fa212f024d9fa6318dbb6b4ce676c8be493b9c43";
    };
    deps = {
      "path-platform-0.0.1" = self.by-version."path-platform"."0.0.1";
    };
    peerDependencies = [];
  };
  by-spec."parseurl"."~1.3.0" =
    self.by-version."parseurl"."1.3.0";
  by-version."parseurl"."1.3.0" = self.buildNodePackage {
    name = "parseurl-1.3.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/parseurl/-/parseurl-1.3.0.tgz";
      name = "parseurl-1.3.0.tgz";
      sha1 = "b58046db4223e145afa76009e61bac87cc2281b3";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."path-browserify"."~0.0.0" =
    self.by-version."path-browserify"."0.0.0";
  by-version."path-browserify"."0.0.0" = self.buildNodePackage {
    name = "path-browserify-0.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/path-browserify/-/path-browserify-0.0.0.tgz";
      name = "path-browserify-0.0.0.tgz";
      sha1 = "a0b870729aae214005b7d5032ec2cbbb0fb4451a";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."path-is-inside"."^1.0.1" =
    self.by-version."path-is-inside"."1.0.1";
  by-version."path-is-inside"."1.0.1" = self.buildNodePackage {
    name = "path-is-inside-1.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/path-is-inside/-/path-is-inside-1.0.1.tgz";
      name = "path-is-inside-1.0.1.tgz";
      sha1 = "98d8f1d030bf04bd7aeee4a1ba5485d40318fd89";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."path-is-inside"."~1.0.0" =
    self.by-version."path-is-inside"."1.0.1";
  by-spec."path-platform"."^0.0.1" =
    self.by-version."path-platform"."0.0.1";
  by-version."path-platform"."0.0.1" = self.buildNodePackage {
    name = "path-platform-0.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/path-platform/-/path-platform-0.0.1.tgz";
      name = "path-platform-0.0.1.tgz";
      sha1 = "b5585d7c3c463d89aa0060d86611cf1afd617e2a";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."pause"."0.0.1" =
    self.by-version."pause"."0.0.1";
  by-version."pause"."0.0.1" = self.buildNodePackage {
    name = "pause-0.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/pause/-/pause-0.0.1.tgz";
      name = "pause-0.0.1.tgz";
      sha1 = "1d408b3fdb76923b9543d96fb4c9dfd535d9cb5d";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."pause-stream"."0.0.11" =
    self.by-version."pause-stream"."0.0.11";
  by-version."pause-stream"."0.0.11" = self.buildNodePackage {
    name = "pause-stream-0.0.11";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/pause-stream/-/pause-stream-0.0.11.tgz";
      name = "pause-stream-0.0.11.tgz";
      sha1 = "fe5a34b0cbce12b5aa6a2b403ee2e73b602f1445";
    };
    deps = {
      "through-2.3.6" = self.by-version."through"."2.3.6";
    };
    peerDependencies = [];
  };
  by-spec."phantomjs"."~1.9" =
    self.by-version."phantomjs"."1.9.15";
  by-version."phantomjs"."1.9.15" = self.buildNodePackage {
    name = "phantomjs-1.9.15";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/phantomjs/-/phantomjs-1.9.15.tgz";
      name = "phantomjs-1.9.15.tgz";
      sha1 = "10032c8b36bd3541ecef953e764d5d177c33f72f";
    };
    deps = {
      "adm-zip-0.4.4" = self.by-version."adm-zip"."0.4.4";
      "fs-extra-0.16.3" = self.by-version."fs-extra"."0.16.3";
      "kew-0.4.0" = self.by-version."kew"."0.4.0";
      "npmconf-2.0.9" = self.by-version."npmconf"."2.0.9";
      "progress-1.1.8" = self.by-version."progress"."1.1.8";
      "request-2.42.0" = self.by-version."request"."2.42.0";
      "request-progress-0.3.1" = self.by-version."request-progress"."0.3.1";
      "which-1.0.8" = self.by-version."which"."1.0.8";
    };
    peerDependencies = [];
  };
  by-spec."pkginfo"."0.3.x" =
    self.by-version."pkginfo"."0.3.0";
  by-version."pkginfo"."0.3.0" = self.buildNodePackage {
    name = "pkginfo-0.3.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/pkginfo/-/pkginfo-0.3.0.tgz";
      name = "pkginfo-0.3.0.tgz";
      sha1 = "726411401039fe9b009eea86614295d5f3a54276";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."pkginfo"."0.x.x" =
    self.by-version."pkginfo"."0.3.0";
  by-spec."policyfile"."0.0.4" =
    self.by-version."policyfile"."0.0.4";
  by-version."policyfile"."0.0.4" = self.buildNodePackage {
    name = "policyfile-0.0.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/policyfile/-/policyfile-0.0.4.tgz";
      name = "policyfile-0.0.4.tgz";
      sha1 = "d6b82ead98ae79ebe228e2daf5903311ec982e4d";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."process"."^0.7.0" =
    self.by-version."process"."0.7.0";
  by-version."process"."0.7.0" = self.buildNodePackage {
    name = "process-0.7.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/process/-/process-0.7.0.tgz";
      name = "process-0.7.0.tgz";
      sha1 = "c52208161a34adf3812344ae85d3e6150469389d";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."process"."~0.10.0" =
    self.by-version."process"."0.10.0";
  by-version."process"."0.10.0" = self.buildNodePackage {
    name = "process-0.10.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/process/-/process-0.10.0.tgz";
      name = "process-0.10.0.tgz";
      sha1 = "99b375aaab5c0d3bbb59f774edc69df574da8dd4";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."process"."~0.5.1" =
    self.by-version."process"."0.5.2";
  by-version."process"."0.5.2" = self.buildNodePackage {
    name = "process-0.5.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/process/-/process-0.5.2.tgz";
      name = "process-0.5.2.tgz";
      sha1 = "1638d8a8e34c2f440a91db95ab9aeb677fc185cf";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."process"."~0.6.0" =
    self.by-version."process"."0.6.0";
  by-version."process"."0.6.0" = self.buildNodePackage {
    name = "process-0.6.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/process/-/process-0.6.0.tgz";
      name = "process-0.6.0.tgz";
      sha1 = "7dd9be80ffaaedd4cb628f1827f1cbab6dc0918f";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."progress"."1.1.8" =
    self.by-version."progress"."1.1.8";
  by-version."progress"."1.1.8" = self.buildNodePackage {
    name = "progress-1.1.8";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/progress/-/progress-1.1.8.tgz";
      name = "progress-1.1.8.tgz";
      sha1 = "e260c78f6161cdd9b0e56cc3e0a85de17c7a57be";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."prompt"."^0.2.13" =
    self.by-version."prompt"."0.2.14";
  by-version."prompt"."0.2.14" = self.buildNodePackage {
    name = "prompt-0.2.14";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/prompt/-/prompt-0.2.14.tgz";
      name = "prompt-0.2.14.tgz";
      sha1 = "57754f64f543fd7b0845707c818ece618f05ffdc";
    };
    deps = {
      "pkginfo-0.3.0" = self.by-version."pkginfo"."0.3.0";
      "read-1.0.5" = self.by-version."read"."1.0.5";
      "revalidator-0.1.8" = self.by-version."revalidator"."0.1.8";
      "utile-0.2.1" = self.by-version."utile"."0.2.1";
      "winston-0.8.3" = self.by-version."winston"."0.8.3";
    };
    peerDependencies = [];
  };
  by-spec."promzard"."~0.2.0" =
    self.by-version."promzard"."0.2.2";
  by-version."promzard"."0.2.2" = self.buildNodePackage {
    name = "promzard-0.2.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/promzard/-/promzard-0.2.2.tgz";
      name = "promzard-0.2.2.tgz";
      sha1 = "918b9f2b29458cb001781a8856502e4a79b016e0";
    };
    deps = {
      "read-1.0.5" = self.by-version."read"."1.0.5";
    };
    peerDependencies = [];
  };
  by-spec."proto-list"."~1.2.1" =
    self.by-version."proto-list"."1.2.3";
  by-version."proto-list"."1.2.3" = self.buildNodePackage {
    name = "proto-list-1.2.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/proto-list/-/proto-list-1.2.3.tgz";
      name = "proto-list-1.2.3.tgz";
      sha1 = "6235554a1bca1f0d15e3ca12ca7329d5def42bd9";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."punycode"."1.3.2" =
    self.by-version."punycode"."1.3.2";
  by-version."punycode"."1.3.2" = self.buildNodePackage {
    name = "punycode-1.3.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/punycode/-/punycode-1.3.2.tgz";
      name = "punycode-1.3.2.tgz";
      sha1 = "9653a036fb7c1ee42342f2325cceefea3926c48d";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."punycode".">=0.2.0" =
    self.by-version."punycode"."1.3.2";
  by-spec."punycode"."~1.2.3" =
    self.by-version."punycode"."1.2.4";
  by-version."punycode"."1.2.4" = self.buildNodePackage {
    name = "punycode-1.2.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/punycode/-/punycode-1.2.4.tgz";
      name = "punycode-1.2.4.tgz";
      sha1 = "54008ac972aec74175def9cba6df7fa9d3918740";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."q"."~0.9.7" =
    self.by-version."q"."0.9.7";
  by-version."q"."0.9.7" = self.buildNodePackage {
    name = "q-0.9.7";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/q/-/q-0.9.7.tgz";
      name = "q-0.9.7.tgz";
      sha1 = "4de2e6cb3b29088c9e4cbc03bf9d42fb96ce2f75";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."qs"."2.2.4" =
    self.by-version."qs"."2.2.4";
  by-version."qs"."2.2.4" = self.buildNodePackage {
    name = "qs-2.2.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/qs/-/qs-2.2.4.tgz";
      name = "qs-2.2.4.tgz";
      sha1 = "2e9fbcd34b540e3421c924ecd01e90aa975319c8";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."qs"."~0.5.2" =
    self.by-version."qs"."0.5.6";
  by-version."qs"."0.5.6" = self.buildNodePackage {
    name = "qs-0.5.6";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/qs/-/qs-0.5.6.tgz";
      name = "qs-0.5.6.tgz";
      sha1 = "31b1ad058567651c526921506b9a8793911a0384";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."qs"."~1.2.0" =
    self.by-version."qs"."1.2.2";
  by-version."qs"."1.2.2" = self.buildNodePackage {
    name = "qs-1.2.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/qs/-/qs-1.2.2.tgz";
      name = "qs-1.2.2.tgz";
      sha1 = "19b57ff24dc2a99ce1f8bdf6afcda59f8ef61f88";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."qs"."~2.3.1" =
    self.by-version."qs"."2.3.3";
  by-version."qs"."2.3.3" = self.buildNodePackage {
    name = "qs-2.3.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/qs/-/qs-2.3.3.tgz";
      name = "qs-2.3.3.tgz";
      sha1 = "e9e85adbe75da0bbe4c8e0476a086290f863b404";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."querystring-es3"."0.2.0" =
    self.by-version."querystring-es3"."0.2.0";
  by-version."querystring-es3"."0.2.0" = self.buildNodePackage {
    name = "querystring-es3-0.2.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/querystring-es3/-/querystring-es3-0.2.0.tgz";
      name = "querystring-es3-0.2.0.tgz";
      sha1 = "c365a08a69c443accfeb3a9deab35e3f0abaa476";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."querystring-es3"."~0.2.0" =
    self.by-version."querystring-es3"."0.2.1";
  by-version."querystring-es3"."0.2.1" = self.buildNodePackage {
    name = "querystring-es3-0.2.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/querystring-es3/-/querystring-es3-0.2.1.tgz";
      name = "querystring-es3-0.2.1.tgz";
      sha1 = "9ec61f79049875707d69414596fd907a4d711e73";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."range-parser"."~1.0.2" =
    self.by-version."range-parser"."1.0.2";
  by-version."range-parser"."1.0.2" = self.buildNodePackage {
    name = "range-parser-1.0.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/range-parser/-/range-parser-1.0.2.tgz";
      name = "range-parser-1.0.2.tgz";
      sha1 = "06a12a42e5131ba8e457cd892044867f2344e549";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."raw-body"."1.3.0" =
    self.by-version."raw-body"."1.3.0";
  by-version."raw-body"."1.3.0" = self.buildNodePackage {
    name = "raw-body-1.3.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/raw-body/-/raw-body-1.3.0.tgz";
      name = "raw-body-1.3.0.tgz";
      sha1 = "978230a156a5548f42eef14de22d0f4f610083d1";
    };
    deps = {
      "bytes-1.0.0" = self.by-version."bytes"."1.0.0";
      "iconv-lite-0.4.4" = self.by-version."iconv-lite"."0.4.4";
    };
    peerDependencies = [];
  };
  by-spec."rc"."^0.5.1" =
    self.by-version."rc"."0.5.5";
  by-version."rc"."0.5.5" = self.buildNodePackage {
    name = "rc-0.5.5";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/rc/-/rc-0.5.5.tgz";
      name = "rc-0.5.5.tgz";
      sha1 = "541cc3300f464b6dfe6432d756f0f2dd3e9eb199";
    };
    deps = {
      "minimist-0.0.10" = self.by-version."minimist"."0.0.10";
      "deep-extend-0.2.11" = self.by-version."deep-extend"."0.2.11";
      "strip-json-comments-0.1.3" = self.by-version."strip-json-comments"."0.1.3";
      "ini-1.3.2" = self.by-version."ini"."1.3.2";
    };
    peerDependencies = [];
  };
  by-spec."read"."1" =
    self.by-version."read"."1.0.5";
  by-version."read"."1.0.5" = self.buildNodePackage {
    name = "read-1.0.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/read/-/read-1.0.5.tgz";
      name = "read-1.0.5.tgz";
      sha1 = "007a3d169478aa710a491727e453effb92e76203";
    };
    deps = {
      "mute-stream-0.0.4" = self.by-version."mute-stream"."0.0.4";
    };
    peerDependencies = [];
  };
  by-spec."read"."1.0.x" =
    self.by-version."read"."1.0.5";
  by-spec."read"."~1.0.1" =
    self.by-version."read"."1.0.5";
  by-spec."read"."~1.0.4" =
    self.by-version."read"."1.0.5";
  by-spec."read-installed"."~3.1.5" =
    self.by-version."read-installed"."3.1.5";
  by-version."read-installed"."3.1.5" = self.buildNodePackage {
    name = "read-installed-3.1.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/read-installed/-/read-installed-3.1.5.tgz";
      name = "read-installed-3.1.5.tgz";
      sha1 = "4ae36081afd3e2204dc2e279807aaa52c30c8c0c";
    };
    deps = {
      "debuglog-1.0.1" = self.by-version."debuglog"."1.0.1";
      "read-package-json-1.2.7" = self.by-version."read-package-json"."1.2.7";
      "readdir-scoped-modules-1.0.1" = self.by-version."readdir-scoped-modules"."1.0.1";
      "semver-4.2.0" = self.by-version."semver"."4.2.0";
      "slide-1.1.6" = self.by-version."slide"."1.1.6";
      "util-extend-1.0.1" = self.by-version."util-extend"."1.0.1";
      "graceful-fs-3.0.5" = self.by-version."graceful-fs"."3.0.5";
    };
    peerDependencies = [];
  };
  by-spec."read-package-json"."1" =
    self.by-version."read-package-json"."1.2.7";
  by-version."read-package-json"."1.2.7" = self.buildNodePackage {
    name = "read-package-json-1.2.7";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/read-package-json/-/read-package-json-1.2.7.tgz";
      name = "read-package-json-1.2.7.tgz";
      sha1 = "f0b440c461a218f4dbf48b094e80fc65c5248502";
    };
    deps = {
      "github-url-from-git-1.4.0" = self.by-version."github-url-from-git"."1.4.0";
      "github-url-from-username-repo-1.0.2" = self.by-version."github-url-from-username-repo"."1.0.2";
      "glob-4.3.5" = self.by-version."glob"."4.3.5";
      "lru-cache-2.5.0" = self.by-version."lru-cache"."2.5.0";
      "normalize-package-data-1.0.3" = self.by-version."normalize-package-data"."1.0.3";
      "graceful-fs-3.0.5" = self.by-version."graceful-fs"."3.0.5";
    };
    peerDependencies = [];
  };
  by-spec."read-package-json"."~1.2.7" =
    self.by-version."read-package-json"."1.2.7";
  by-spec."readable-stream"."1.0" =
    self.by-version."readable-stream"."1.0.33";
  by-version."readable-stream"."1.0.33" = self.buildNodePackage {
    name = "readable-stream-1.0.33";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/readable-stream/-/readable-stream-1.0.33.tgz";
      name = "readable-stream-1.0.33.tgz";
      sha1 = "3a360dd66c1b1d7fd4705389860eda1d0f61126c";
    };
    deps = {
      "core-util-is-1.0.1" = self.by-version."core-util-is"."1.0.1";
      "isarray-0.0.1" = self.by-version."isarray"."0.0.1";
      "string_decoder-0.10.31" = self.by-version."string_decoder"."0.10.31";
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
    };
    peerDependencies = [];
  };
  by-spec."readable-stream".">=1.1.13-1 <1.2.0-0" =
    self.by-version."readable-stream"."1.1.13";
  by-version."readable-stream"."1.1.13" = self.buildNodePackage {
    name = "readable-stream-1.1.13";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/readable-stream/-/readable-stream-1.1.13.tgz";
      name = "readable-stream-1.1.13.tgz";
      sha1 = "f6eef764f514c89e2b9e23146a75ba106756d23e";
    };
    deps = {
      "core-util-is-1.0.1" = self.by-version."core-util-is"."1.0.1";
      "isarray-0.0.1" = self.by-version."isarray"."0.0.1";
      "string_decoder-0.10.31" = self.by-version."string_decoder"."0.10.31";
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
    };
    peerDependencies = [];
  };
  by-spec."readable-stream"."^1.0.27-1" =
    self.by-version."readable-stream"."1.1.13";
  by-spec."readable-stream"."~1.0.17" =
    self.by-version."readable-stream"."1.0.33";
  by-spec."readable-stream"."~1.0.2" =
    self.by-version."readable-stream"."1.0.33";
  by-spec."readable-stream"."~1.0.26" =
    self.by-version."readable-stream"."1.0.33";
  by-spec."readable-stream"."~1.0.26-2" =
    self.by-version."readable-stream"."1.0.33";
  by-spec."readable-stream"."~1.0.33" =
    self.by-version."readable-stream"."1.0.33";
  by-spec."readable-stream"."~1.1" =
    self.by-version."readable-stream"."1.1.13";
  by-spec."readable-stream"."~1.1.8" =
    self.by-version."readable-stream"."1.1.13";
  by-spec."readable-stream"."~1.1.9" =
    self.by-version."readable-stream"."1.1.13";
  by-spec."readdir-scoped-modules"."^1.0.0" =
    self.by-version."readdir-scoped-modules"."1.0.1";
  by-version."readdir-scoped-modules"."1.0.1" = self.buildNodePackage {
    name = "readdir-scoped-modules-1.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/readdir-scoped-modules/-/readdir-scoped-modules-1.0.1.tgz";
      name = "readdir-scoped-modules-1.0.1.tgz";
      sha1 = "5c2a77f3e08250a8fddf53fa58cdc17900b808b9";
    };
    deps = {
      "debuglog-1.0.1" = self.by-version."debuglog"."1.0.1";
      "dezalgo-1.0.1" = self.by-version."dezalgo"."1.0.1";
      "graceful-fs-3.0.5" = self.by-version."graceful-fs"."3.0.5";
      "once-1.3.1" = self.by-version."once"."1.3.1";
    };
    peerDependencies = [];
  };
  by-spec."readdirp"."^1.3.0" =
    self.by-version."readdirp"."1.3.0";
  by-version."readdirp"."1.3.0" = self.buildNodePackage {
    name = "readdirp-1.3.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/readdirp/-/readdirp-1.3.0.tgz";
      name = "readdirp-1.3.0.tgz";
      sha1 = "eaf1a9b463be9a8190fc9ae163aa1ac934aa340b";
    };
    deps = {
      "graceful-fs-2.0.3" = self.by-version."graceful-fs"."2.0.3";
      "minimatch-0.2.14" = self.by-version."minimatch"."0.2.14";
      "readable-stream-1.0.33" = self.by-version."readable-stream"."1.0.33";
    };
    peerDependencies = [];
  };
  by-spec."readline2"."~0.1.0" =
    self.by-version."readline2"."0.1.1";
  by-version."readline2"."0.1.1" = self.buildNodePackage {
    name = "readline2-0.1.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/readline2/-/readline2-0.1.1.tgz";
      name = "readline2-0.1.1.tgz";
      sha1 = "99443ba6e83b830ef3051bfd7dc241a82728d568";
    };
    deps = {
      "mute-stream-0.0.4" = self.by-version."mute-stream"."0.0.4";
      "strip-ansi-2.0.1" = self.by-version."strip-ansi"."2.0.1";
    };
    peerDependencies = [];
  };
  by-spec."realize-package-specifier"."~1.3.0" =
    self.by-version."realize-package-specifier"."1.3.0";
  by-version."realize-package-specifier"."1.3.0" = self.buildNodePackage {
    name = "realize-package-specifier-1.3.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/realize-package-specifier/-/realize-package-specifier-1.3.0.tgz";
      name = "realize-package-specifier-1.3.0.tgz";
      sha1 = "23374a84e6a9188483f346cc939eb58eec85efa5";
    };
    deps = {
      "dezalgo-1.0.1" = self.by-version."dezalgo"."1.0.1";
      "npm-package-arg-2.1.3" = self.by-version."npm-package-arg"."2.1.3";
    };
    peerDependencies = [];
  };
  by-spec."recursive-readdir"."0.0.2" =
    self.by-version."recursive-readdir"."0.0.2";
  by-version."recursive-readdir"."0.0.2" = self.buildNodePackage {
    name = "recursive-readdir-0.0.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/recursive-readdir/-/recursive-readdir-0.0.2.tgz";
      name = "recursive-readdir-0.0.2.tgz";
      sha1 = "0bc47dc4838e646dccfba0507b5e57ffbff35f7c";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."redis"."0.7.3" =
    self.by-version."redis"."0.7.3";
  by-version."redis"."0.7.3" = self.buildNodePackage {
    name = "redis-0.7.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/redis/-/redis-0.7.3.tgz";
      name = "redis-0.7.3.tgz";
      sha1 = "ee57b7a44d25ec1594e44365d8165fa7d1d4811a";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."registry-url"."^2.0.0" =
    self.by-version."registry-url"."2.1.0";
  by-version."registry-url"."2.1.0" = self.buildNodePackage {
    name = "registry-url-2.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/registry-url/-/registry-url-2.1.0.tgz";
      name = "registry-url-2.1.0.tgz";
      sha1 = "f9624c877b43946af540849ba772ed704d606f7a";
    };
    deps = {
      "rc-0.5.5" = self.by-version."rc"."0.5.5";
    };
    peerDependencies = [];
  };
  by-spec."repeating"."^1.1.0" =
    self.by-version."repeating"."1.1.1";
  by-version."repeating"."1.1.1" = self.buildNodePackage {
    name = "repeating-1.1.1";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/repeating/-/repeating-1.1.1.tgz";
      name = "repeating-1.1.1.tgz";
      sha1 = "2dfe71fb0baf78249e8ec6a537ec3dd63f48bb22";
    };
    deps = {
      "is-finite-1.0.0" = self.by-version."is-finite"."1.0.0";
      "meow-2.1.0" = self.by-version."meow"."2.1.0";
    };
    peerDependencies = [];
  };
  by-spec."request"."2" =
    self.by-version."request"."2.53.0";
  by-version."request"."2.53.0" = self.buildNodePackage {
    name = "request-2.53.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/request/-/request-2.53.0.tgz";
      name = "request-2.53.0.tgz";
      sha1 = "180a3ae92b7b639802e4f9545dd8fcdeb71d760c";
    };
    deps = {
      "bl-0.9.4" = self.by-version."bl"."0.9.4";
      "caseless-0.9.0" = self.by-version."caseless"."0.9.0";
      "forever-agent-0.5.2" = self.by-version."forever-agent"."0.5.2";
      "form-data-0.2.0" = self.by-version."form-data"."0.2.0";
      "json-stringify-safe-5.0.0" = self.by-version."json-stringify-safe"."5.0.0";
      "mime-types-2.0.8" = self.by-version."mime-types"."2.0.8";
      "node-uuid-1.4.2" = self.by-version."node-uuid"."1.4.2";
      "qs-2.3.3" = self.by-version."qs"."2.3.3";
      "tunnel-agent-0.4.0" = self.by-version."tunnel-agent"."0.4.0";
      "tough-cookie-0.12.1" = self.by-version."tough-cookie"."0.12.1";
      "http-signature-0.10.1" = self.by-version."http-signature"."0.10.1";
      "oauth-sign-0.6.0" = self.by-version."oauth-sign"."0.6.0";
      "hawk-2.3.1" = self.by-version."hawk"."2.3.1";
      "aws-sign2-0.5.0" = self.by-version."aws-sign2"."0.5.0";
      "stringstream-0.0.4" = self.by-version."stringstream"."0.0.4";
      "combined-stream-0.0.7" = self.by-version."combined-stream"."0.0.7";
      "isstream-0.1.1" = self.by-version."isstream"."0.1.1";
    };
    peerDependencies = [];
  };
  by-spec."request"."2.42.0" =
    self.by-version."request"."2.42.0";
  by-version."request"."2.42.0" = self.buildNodePackage {
    name = "request-2.42.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/request/-/request-2.42.0.tgz";
      name = "request-2.42.0.tgz";
      sha1 = "572bd0148938564040ac7ab148b96423a063304a";
    };
    deps = {
      "bl-0.9.4" = self.by-version."bl"."0.9.4";
      "caseless-0.6.0" = self.by-version."caseless"."0.6.0";
      "forever-agent-0.5.2" = self.by-version."forever-agent"."0.5.2";
      "qs-1.2.2" = self.by-version."qs"."1.2.2";
      "json-stringify-safe-5.0.0" = self.by-version."json-stringify-safe"."5.0.0";
      "mime-types-1.0.2" = self.by-version."mime-types"."1.0.2";
      "node-uuid-1.4.2" = self.by-version."node-uuid"."1.4.2";
      "tunnel-agent-0.4.0" = self.by-version."tunnel-agent"."0.4.0";
      "tough-cookie-0.12.1" = self.by-version."tough-cookie"."0.12.1";
      "form-data-0.1.4" = self.by-version."form-data"."0.1.4";
      "http-signature-0.10.1" = self.by-version."http-signature"."0.10.1";
      "oauth-sign-0.4.0" = self.by-version."oauth-sign"."0.4.0";
      "hawk-1.1.1" = self.by-version."hawk"."1.1.1";
      "aws-sign2-0.5.0" = self.by-version."aws-sign2"."0.5.0";
      "stringstream-0.0.4" = self.by-version."stringstream"."0.0.4";
    };
    peerDependencies = [];
  };
  by-spec."request"."^2.40.0" =
    self.by-version."request"."2.53.0";
  by-spec."request"."^2.47.0" =
    self.by-version."request"."2.53.0";
  by-spec."request"."~2.53.0" =
    self.by-version."request"."2.53.0";
  by-spec."request-progress"."0.3.1" =
    self.by-version."request-progress"."0.3.1";
  by-version."request-progress"."0.3.1" = self.buildNodePackage {
    name = "request-progress-0.3.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/request-progress/-/request-progress-0.3.1.tgz";
      name = "request-progress-0.3.1.tgz";
      sha1 = "0721c105d8a96ac6b2ce8b2c89ae2d5ecfcf6b3a";
    };
    deps = {
      "throttleit-0.0.2" = self.by-version."throttleit"."0.0.2";
    };
    peerDependencies = [];
  };
  by-spec."resolve"."0.6.3" =
    self.by-version."resolve"."0.6.3";
  by-version."resolve"."0.6.3" = self.buildNodePackage {
    name = "resolve-0.6.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/resolve/-/resolve-0.6.3.tgz";
      name = "resolve-0.6.3.tgz";
      sha1 = "dd957982e7e736debdf53b58a4dd91754575dd46";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."resolve"."0.7.x" =
    self.by-version."resolve"."0.7.4";
  by-version."resolve"."0.7.4" = self.buildNodePackage {
    name = "resolve-0.7.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/resolve/-/resolve-0.7.4.tgz";
      name = "resolve-0.7.4.tgz";
      sha1 = "395a9ef9e873fbfe12bd14408bd91bb936003d69";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."resolve"."1.0.0" =
    self.by-version."resolve"."1.0.0";
  by-version."resolve"."1.0.0" = self.buildNodePackage {
    name = "resolve-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/resolve/-/resolve-1.0.0.tgz";
      name = "resolve-1.0.0.tgz";
      sha1 = "2a6e3b314dcd57c6519e8e2282af8687e8de61c6";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."resolve"."^0.6" =
    self.by-version."resolve"."0.6.3";
  by-spec."resolve"."~0.3.0" =
    self.by-version."resolve"."0.3.1";
  by-version."resolve"."0.3.1" = self.buildNodePackage {
    name = "resolve-0.3.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/resolve/-/resolve-0.3.1.tgz";
      name = "resolve-0.3.1.tgz";
      sha1 = "34c63447c664c70598d1c9b126fc43b2a24310a4";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."resolve"."~0.6.1" =
    self.by-version."resolve"."0.6.3";
  by-spec."resolve"."~0.6.3" =
    self.by-version."resolve"."0.6.3";
  by-spec."resolve"."~0.7.1" =
    self.by-version."resolve"."0.7.4";
  by-spec."response-time"."~2.0.1" =
    self.by-version."response-time"."2.0.1";
  by-version."response-time"."2.0.1" = self.buildNodePackage {
    name = "response-time-2.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/response-time/-/response-time-2.0.1.tgz";
      name = "response-time-2.0.1.tgz";
      sha1 = "c6d2cbadeac4cb251b21016fe182640c02aff343";
    };
    deps = {
      "on-headers-1.0.0" = self.by-version."on-headers"."1.0.0";
    };
    peerDependencies = [];
  };
  by-spec."retry"."^0.6.1" =
    self.by-version."retry"."0.6.1";
  by-version."retry"."0.6.1" = self.buildNodePackage {
    name = "retry-0.6.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/retry/-/retry-0.6.1.tgz";
      name = "retry-0.6.1.tgz";
      sha1 = "fdc90eed943fde11b893554b8cc63d0e899ba918";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."retry"."~0.6.1" =
    self.by-version."retry"."0.6.1";
  by-spec."revalidator"."0.1.x" =
    self.by-version."revalidator"."0.1.8";
  by-version."revalidator"."0.1.8" = self.buildNodePackage {
    name = "revalidator-0.1.8";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/revalidator/-/revalidator-0.1.8.tgz";
      name = "revalidator-0.1.8.tgz";
      sha1 = "fece61bfa0c1b52a206bd6b18198184bdd523a3b";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."rfile"."~1.0" =
    self.by-version."rfile"."1.0.0";
  by-version."rfile"."1.0.0" = self.buildNodePackage {
    name = "rfile-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/rfile/-/rfile-1.0.0.tgz";
      name = "rfile-1.0.0.tgz";
      sha1 = "59708cf90ca1e74c54c3cfc5c36fdb9810435261";
    };
    deps = {
      "callsite-1.0.0" = self.by-version."callsite"."1.0.0";
      "resolve-0.3.1" = self.by-version."resolve"."0.3.1";
    };
    peerDependencies = [];
  };
  by-spec."rfile"."~1.0.0" =
    self.by-version."rfile"."1.0.0";
  by-spec."rimraf"."2" =
    self.by-version."rimraf"."2.2.8";
  by-version."rimraf"."2.2.8" = self.buildNodePackage {
    name = "rimraf-2.2.8";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/rimraf/-/rimraf-2.2.8.tgz";
      name = "rimraf-2.2.8.tgz";
      sha1 = "e439be2aaee327321952730f99a8929e4fc50582";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."rimraf"."2.x.x" =
    self.by-version."rimraf"."2.2.8";
  by-spec."rimraf"."^2.2.2" =
    self.by-version."rimraf"."2.2.8";
  by-spec."rimraf"."^2.2.8" =
    self.by-version."rimraf"."2.2.8";
  by-spec."rimraf"."~2.2.5" =
    self.by-version."rimraf"."2.2.8";
  by-spec."rimraf"."~2.2.8" =
    self.by-version."rimraf"."2.2.8";
  by-spec."ripemd160"."0.2.0" =
    self.by-version."ripemd160"."0.2.0";
  by-version."ripemd160"."0.2.0" = self.buildNodePackage {
    name = "ripemd160-0.2.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/ripemd160/-/ripemd160-0.2.0.tgz";
      name = "ripemd160-0.2.0.tgz";
      sha1 = "2bf198bde167cacfa51c0a928e84b68bbe171fce";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."rndm"."~1.1.0" =
    self.by-version."rndm"."1.1.0";
  by-version."rndm"."1.1.0" = self.buildNodePackage {
    name = "rndm-1.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/rndm/-/rndm-1.1.0.tgz";
      name = "rndm-1.1.0.tgz";
      sha1 = "01d1a8f1fb9b471181925b627b9049bf33074574";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."ruglify"."~1.0.0" =
    self.by-version."ruglify"."1.0.0";
  by-version."ruglify"."1.0.0" = self.buildNodePackage {
    name = "ruglify-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/ruglify/-/ruglify-1.0.0.tgz";
      name = "ruglify-1.0.0.tgz";
      sha1 = "dc8930e2a9544a274301cc9972574c0d0986b675";
    };
    deps = {
      "rfile-1.0.0" = self.by-version."rfile"."1.0.0";
      "uglify-js-2.2.5" = self.by-version."uglify-js"."2.2.5";
    };
    peerDependencies = [];
  };
  by-spec."rx"."^2.2.27" =
    self.by-version."rx"."2.3.25";
  by-version."rx"."2.3.25" = self.buildNodePackage {
    name = "rx-2.3.25";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/rx/-/rx-2.3.25.tgz";
      name = "rx-2.3.25.tgz";
      sha1 = "2f7c0550532777b41fa692bb790a7886eaff9731";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."samsam"."~1.1" =
    self.by-version."samsam"."1.1.2";
  by-version."samsam"."1.1.2" = self.buildNodePackage {
    name = "samsam-1.1.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/samsam/-/samsam-1.1.2.tgz";
      name = "samsam-1.1.2.tgz";
      sha1 = "bec11fdc83a9fda063401210e40176c3024d1567";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."scmp"."1.0.0" =
    self.by-version."scmp"."1.0.0";
  by-version."scmp"."1.0.0" = self.buildNodePackage {
    name = "scmp-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/scmp/-/scmp-1.0.0.tgz";
      name = "scmp-1.0.0.tgz";
      sha1 = "a0b272c3fc7292f77115646f00618b0262514e04";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."semver"."2 >=2.2.1 || 3.x || 4" =
    self.by-version."semver"."4.2.0";
  by-version."semver"."4.2.0" = self.buildNodePackage {
    name = "semver-4.2.0";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/semver/-/semver-4.2.0.tgz";
      name = "semver-4.2.0.tgz";
      sha1 = "a571fd4adbe974fe32bd9cb4c5e249606f498423";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."semver"."2 || 3 || 4" =
    self.by-version."semver"."4.2.0";
  by-spec."semver"."2.x || 3.x || 4" =
    self.by-version."semver"."4.2.0";
  by-spec."semver"."4" =
    self.by-version."semver"."4.2.0";
  by-spec."semver"."^2.3.0 || 3.x || 4" =
    self.by-version."semver"."4.2.0";
  by-spec."semver"."^2.3.2" =
    self.by-version."semver"."2.3.2";
  by-version."semver"."2.3.2" = self.buildNodePackage {
    name = "semver-2.3.2";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/semver/-/semver-2.3.2.tgz";
      name = "semver-2.3.2.tgz";
      sha1 = "b9848f25d6cf36333073ec9ef8856d42f1233e52";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."semver"."^4.0.0" =
    self.by-version."semver"."4.2.0";
  by-spec."semver"."~1.1.4" =
    self.by-version."semver"."1.1.4";
  by-version."semver"."1.1.4" = self.buildNodePackage {
    name = "semver-1.1.4";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/semver/-/semver-1.1.4.tgz";
      name = "semver-1.1.4.tgz";
      sha1 = "2e5a4e72bab03472cc97f72753b4508912ef5540";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."semver"."~2.3.0" =
    self.by-version."semver"."2.3.2";
  by-spec."semver"."~4.2.0" =
    self.by-version."semver"."4.2.0";
  by-spec."semver-diff"."^2.0.0" =
    self.by-version."semver-diff"."2.0.0";
  by-version."semver-diff"."2.0.0" = self.buildNodePackage {
    name = "semver-diff-2.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/semver-diff/-/semver-diff-2.0.0.tgz";
      name = "semver-diff-2.0.0.tgz";
      sha1 = "d43024f91aa7843937dc1379002766809f7480d2";
    };
    deps = {
      "semver-4.2.0" = self.by-version."semver"."4.2.0";
    };
    peerDependencies = [];
  };
  by-spec."semver-regex"."^0.1.1" =
    self.by-version."semver-regex"."0.1.1";
  by-version."semver-regex"."0.1.1" = self.buildNodePackage {
    name = "semver-regex-0.1.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/semver-regex/-/semver-regex-0.1.1.tgz";
      name = "semver-regex-0.1.1.tgz";
      sha1 = "a9d6717eba5871107ff8f4d81f5278d4ad4a29f9";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."send"."0.9.3" =
    self.by-version."send"."0.9.3";
  by-version."send"."0.9.3" = self.buildNodePackage {
    name = "send-0.9.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/send/-/send-0.9.3.tgz";
      name = "send-0.9.3.tgz";
      sha1 = "b43a7414cd089b7fbec9b755246f7c37b7b85cc0";
    };
    deps = {
      "debug-2.0.0" = self.by-version."debug"."2.0.0";
      "depd-0.4.5" = self.by-version."depd"."0.4.5";
      "destroy-1.0.3" = self.by-version."destroy"."1.0.3";
      "escape-html-1.0.1" = self.by-version."escape-html"."1.0.1";
      "etag-1.4.0" = self.by-version."etag"."1.4.0";
      "fresh-0.2.4" = self.by-version."fresh"."0.2.4";
      "mime-1.2.11" = self.by-version."mime"."1.2.11";
      "ms-0.6.2" = self.by-version."ms"."0.6.2";
      "on-finished-2.1.0" = self.by-version."on-finished"."2.1.0";
      "range-parser-1.0.2" = self.by-version."range-parser"."1.0.2";
    };
    peerDependencies = [];
  };
  by-spec."serve-favicon"."~2.1.5" =
    self.by-version."serve-favicon"."2.1.7";
  by-version."serve-favicon"."2.1.7" = self.buildNodePackage {
    name = "serve-favicon-2.1.7";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/serve-favicon/-/serve-favicon-2.1.7.tgz";
      name = "serve-favicon-2.1.7.tgz";
      sha1 = "7b911c0ea4c0f9a2ad686daa5222766f7bc7db79";
    };
    deps = {
      "etag-1.5.1" = self.by-version."etag"."1.5.1";
      "fresh-0.2.4" = self.by-version."fresh"."0.2.4";
      "ms-0.6.2" = self.by-version."ms"."0.6.2";
    };
    peerDependencies = [];
  };
  by-spec."serve-index"."~1.2.1" =
    self.by-version."serve-index"."1.2.1";
  by-version."serve-index"."1.2.1" = self.buildNodePackage {
    name = "serve-index-1.2.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/serve-index/-/serve-index-1.2.1.tgz";
      name = "serve-index-1.2.1.tgz";
      sha1 = "854daef00ac9ff2f5bfda1c019b78fb0ed6d2e6f";
    };
    deps = {
      "accepts-1.1.4" = self.by-version."accepts"."1.1.4";
      "batch-0.5.1" = self.by-version."batch"."0.5.1";
      "debug-2.0.0" = self.by-version."debug"."2.0.0";
      "parseurl-1.3.0" = self.by-version."parseurl"."1.3.0";
    };
    peerDependencies = [];
  };
  by-spec."serve-static"."~1.6.4" =
    self.by-version."serve-static"."1.6.5";
  by-version."serve-static"."1.6.5" = self.buildNodePackage {
    name = "serve-static-1.6.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/serve-static/-/serve-static-1.6.5.tgz";
      name = "serve-static-1.6.5.tgz";
      sha1 = "aca17e0deac4a87729f6078781b7d27f63aa3d9c";
    };
    deps = {
      "escape-html-1.0.1" = self.by-version."escape-html"."1.0.1";
      "parseurl-1.3.0" = self.by-version."parseurl"."1.3.0";
      "send-0.9.3" = self.by-version."send"."0.9.3";
      "utils-merge-1.0.0" = self.by-version."utils-merge"."1.0.0";
    };
    peerDependencies = [];
  };
  by-spec."sha"."~1.3.0" =
    self.by-version."sha"."1.3.0";
  by-version."sha"."1.3.0" = self.buildNodePackage {
    name = "sha-1.3.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/sha/-/sha-1.3.0.tgz";
      name = "sha-1.3.0.tgz";
      sha1 = "79f4787045d0ede7327d702c25c443460dbc6764";
    };
    deps = {
      "graceful-fs-3.0.5" = self.by-version."graceful-fs"."3.0.5";
      "readable-stream-1.1.13" = self.by-version."readable-stream"."1.1.13";
    };
    peerDependencies = [];
  };
  by-spec."sha.js"."2.1.6" =
    self.by-version."sha.js"."2.1.6";
  by-version."sha.js"."2.1.6" = self.buildNodePackage {
    name = "sha.js-2.1.6";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/sha.js/-/sha.js-2.1.6.tgz";
      name = "sha.js-2.1.6.tgz";
      sha1 = "20e6eb81f3e66f081ddf84dd8f0464bea6c02fd4";
    };
    deps = {
      "buffer-2.3.4" = self.by-version."buffer"."2.3.4";
    };
    peerDependencies = [];
  };
  by-spec."shallow-copy"."0.0.1" =
    self.by-version."shallow-copy"."0.0.1";
  by-version."shallow-copy"."0.0.1" = self.buildNodePackage {
    name = "shallow-copy-0.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/shallow-copy/-/shallow-copy-0.0.1.tgz";
      name = "shallow-copy-0.0.1.tgz";
      sha1 = "415f42702d73d810330292cc5ee86eae1a11a170";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."shell-quote"."~0.0.1" =
    self.by-version."shell-quote"."0.0.1";
  by-version."shell-quote"."0.0.1" = self.buildNodePackage {
    name = "shell-quote-0.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/shell-quote/-/shell-quote-0.0.1.tgz";
      name = "shell-quote-0.0.1.tgz";
      sha1 = "1a41196f3c0333c482323593d6886ecf153dd986";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."shelljs"."0.1.x" =
    self.by-version."shelljs"."0.1.4";
  by-version."shelljs"."0.1.4" = self.buildNodePackage {
    name = "shelljs-0.1.4";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/shelljs/-/shelljs-0.1.4.tgz";
      name = "shelljs-0.1.4.tgz";
      sha1 = "dfbbe78d56c3c0168d2fb79e10ecd1dbcb07ec0e";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."shelljs"."^0.3.0" =
    self.by-version."shelljs"."0.3.0";
  by-version."shelljs"."0.3.0" = self.buildNodePackage {
    name = "shelljs-0.3.0";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/shelljs/-/shelljs-0.3.0.tgz";
      name = "shelljs-0.3.0.tgz";
      sha1 = "3596e6307a781544f591f37da618360f31db57b1";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."sigmund"."~1.0.0" =
    self.by-version."sigmund"."1.0.0";
  by-version."sigmund"."1.0.0" = self.buildNodePackage {
    name = "sigmund-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/sigmund/-/sigmund-1.0.0.tgz";
      name = "sigmund-1.0.0.tgz";
      sha1 = "66a2b3a749ae8b5fb89efd4fcc01dc94fbe02296";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."sinon"."~1.8.x" =
    self.by-version."sinon"."1.8.2";
  by-version."sinon"."1.8.2" = self.buildNodePackage {
    name = "sinon-1.8.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/sinon/-/sinon-1.8.2.tgz";
      name = "sinon-1.8.2.tgz";
      sha1 = "ed3382994f518f998979fa1358a8972786e27d6d";
    };
    deps = {
      "formatio-1.0.2" = self.by-version."formatio"."1.0.2";
    };
    peerDependencies = [];
  };
  by-spec."slide"."^1.1.3" =
    self.by-version."slide"."1.1.6";
  by-version."slide"."1.1.6" = self.buildNodePackage {
    name = "slide-1.1.6";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/slide/-/slide-1.1.6.tgz";
      name = "slide-1.1.6.tgz";
      sha1 = "56eb027d65b4d2dce6cb2e2d32c4d4afc9e1d707";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."slide"."^1.1.5" =
    self.by-version."slide"."1.1.6";
  by-spec."slide"."~1.1.3" =
    self.by-version."slide"."1.1.6";
  by-spec."slide"."~1.1.6" =
    self.by-version."slide"."1.1.6";
  by-spec."sntp"."0.2.x" =
    self.by-version."sntp"."0.2.4";
  by-version."sntp"."0.2.4" = self.buildNodePackage {
    name = "sntp-0.2.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/sntp/-/sntp-0.2.4.tgz";
      name = "sntp-0.2.4.tgz";
      sha1 = "fb885f18b0f3aad189f824862536bceeec750900";
    };
    deps = {
      "hoek-0.9.1" = self.by-version."hoek"."0.9.1";
    };
    peerDependencies = [];
  };
  by-spec."sntp"."1.x.x" =
    self.by-version."sntp"."1.0.9";
  by-version."sntp"."1.0.9" = self.buildNodePackage {
    name = "sntp-1.0.9";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/sntp/-/sntp-1.0.9.tgz";
      name = "sntp-1.0.9.tgz";
      sha1 = "6541184cc90aeea6c6e7b35e2659082443c66198";
    };
    deps = {
      "hoek-2.11.0" = self.by-version."hoek"."2.11.0";
    };
    peerDependencies = [];
  };
  by-spec."socket.io"."0.9.16" =
    self.by-version."socket.io"."0.9.16";
  by-version."socket.io"."0.9.16" = self.buildNodePackage {
    name = "socket.io-0.9.16";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/socket.io/-/socket.io-0.9.16.tgz";
      name = "socket.io-0.9.16.tgz";
      sha1 = "3bab0444e49b55fbbc157424dbd41aa375a51a76";
    };
    deps = {
      "socket.io-client-0.9.16" = self.by-version."socket.io-client"."0.9.16";
      "policyfile-0.0.4" = self.by-version."policyfile"."0.0.4";
      "base64id-0.1.0" = self.by-version."base64id"."0.1.0";
      "redis-0.7.3" = self.by-version."redis"."0.7.3";
    };
    peerDependencies = [];
  };
  by-spec."socket.io-client"."0.9.16" =
    self.by-version."socket.io-client"."0.9.16";
  by-version."socket.io-client"."0.9.16" = self.buildNodePackage {
    name = "socket.io-client-0.9.16";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/socket.io-client/-/socket.io-client-0.9.16.tgz";
      name = "socket.io-client-0.9.16.tgz";
      sha1 = "4da7515c5e773041d1b423970415bcc430f35fc6";
    };
    deps = {
      "uglify-js-1.2.5" = self.by-version."uglify-js"."1.2.5";
      "ws-0.4.32" = self.by-version."ws"."0.4.32";
      "xmlhttprequest-1.4.2" = self.by-version."xmlhttprequest"."1.4.2";
      "active-x-obfuscator-0.0.1" = self.by-version."active-x-obfuscator"."0.0.1";
    };
    peerDependencies = [];
  };
  by-spec."sorted-object"."~1.0.0" =
    self.by-version."sorted-object"."1.0.0";
  by-version."sorted-object"."1.0.0" = self.buildNodePackage {
    name = "sorted-object-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/sorted-object/-/sorted-object-1.0.0.tgz";
      name = "sorted-object-1.0.0.tgz";
      sha1 = "5d1f4f9c1fb2cd48965967304e212eb44cfb6d05";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."source-map"."0.1.33" =
    self.by-version."source-map"."0.1.33";
  by-version."source-map"."0.1.33" = self.buildNodePackage {
    name = "source-map-0.1.33";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/source-map/-/source-map-0.1.33.tgz";
      name = "source-map-0.1.33.tgz";
      sha1 = "c659297a73af18c073b0aa2e7cc91e316b5c570c";
    };
    deps = {
      "amdefine-0.1.0" = self.by-version."amdefine"."0.1.0";
    };
    peerDependencies = [];
  };
  by-spec."source-map"."0.1.34" =
    self.by-version."source-map"."0.1.34";
  by-version."source-map"."0.1.34" = self.buildNodePackage {
    name = "source-map-0.1.34";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/source-map/-/source-map-0.1.34.tgz";
      name = "source-map-0.1.34.tgz";
      sha1 = "a7cfe89aec7b1682c3b198d0acfb47d7d090566b";
    };
    deps = {
      "amdefine-0.1.0" = self.by-version."amdefine"."0.1.0";
    };
    peerDependencies = [];
  };
  by-spec."source-map"."~0.1.30" =
    self.by-version."source-map"."0.1.43";
  by-version."source-map"."0.1.43" = self.buildNodePackage {
    name = "source-map-0.1.43";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/source-map/-/source-map-0.1.43.tgz";
      name = "source-map-0.1.43.tgz";
      sha1 = "c24bc146ca517c1471f5dacbe2571b2b7f9e3346";
    };
    deps = {
      "amdefine-0.1.0" = self.by-version."amdefine"."0.1.0";
    };
    peerDependencies = [];
  };
  by-spec."source-map"."~0.1.31" =
    self.by-version."source-map"."0.1.43";
  by-spec."source-map"."~0.1.33" =
    self.by-version."source-map"."0.1.43";
  by-spec."source-map"."~0.1.7" =
    self.by-version."source-map"."0.1.43";
  by-spec."split"."0.2" =
    self.by-version."split"."0.2.10";
  by-version."split"."0.2.10" = self.buildNodePackage {
    name = "split-0.2.10";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/split/-/split-0.2.10.tgz";
      name = "split-0.2.10.tgz";
      sha1 = "67097c601d697ce1368f418f06cd201cf0521a57";
    };
    deps = {
      "through-2.3.6" = self.by-version."through"."2.3.6";
    };
    peerDependencies = [];
  };
  by-spec."stack-trace"."0.0.x" =
    self.by-version."stack-trace"."0.0.9";
  by-version."stack-trace"."0.0.9" = self.buildNodePackage {
    name = "stack-trace-0.0.9";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/stack-trace/-/stack-trace-0.0.9.tgz";
      name = "stack-trace-0.0.9.tgz";
      sha1 = "a8f6eaeca90674c333e7c43953f275b451510695";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."statuses"."1" =
    self.by-version."statuses"."1.2.1";
  by-version."statuses"."1.2.1" = self.buildNodePackage {
    name = "statuses-1.2.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/statuses/-/statuses-1.2.1.tgz";
      name = "statuses-1.2.1.tgz";
      sha1 = "dded45cc18256d51ed40aec142489d5c61026d28";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."stream-browserify"."^1.0.0" =
    self.by-version."stream-browserify"."1.0.0";
  by-version."stream-browserify"."1.0.0" = self.buildNodePackage {
    name = "stream-browserify-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/stream-browserify/-/stream-browserify-1.0.0.tgz";
      name = "stream-browserify-1.0.0.tgz";
      sha1 = "bf9b4abfb42b274d751479e44e0ff2656b6f1193";
    };
    deps = {
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
      "readable-stream-1.1.13" = self.by-version."readable-stream"."1.1.13";
    };
    peerDependencies = [];
  };
  by-spec."stream-browserify"."~0.1.0" =
    self.by-version."stream-browserify"."0.1.3";
  by-version."stream-browserify"."0.1.3" = self.buildNodePackage {
    name = "stream-browserify-0.1.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/stream-browserify/-/stream-browserify-0.1.3.tgz";
      name = "stream-browserify-0.1.3.tgz";
      sha1 = "95cf1b369772e27adaf46352265152689c6c4be9";
    };
    deps = {
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
      "process-0.5.2" = self.by-version."process"."0.5.2";
    };
    peerDependencies = [];
  };
  by-spec."stream-combiner"."^0.0.4" =
    self.by-version."stream-combiner"."0.0.4";
  by-version."stream-combiner"."0.0.4" = self.buildNodePackage {
    name = "stream-combiner-0.0.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/stream-combiner/-/stream-combiner-0.0.4.tgz";
      name = "stream-combiner-0.0.4.tgz";
      sha1 = "4d5e433c185261dde623ca3f44c586bcf5c4ad14";
    };
    deps = {
      "duplexer-0.1.1" = self.by-version."duplexer"."0.1.1";
    };
    peerDependencies = [];
  };
  by-spec."stream-combiner"."~0.0.2" =
    self.by-version."stream-combiner"."0.0.4";
  by-spec."stream-combiner"."~0.0.4" =
    self.by-version."stream-combiner"."0.0.4";
  by-spec."stream-combiner"."~0.1.0" =
    self.by-version."stream-combiner"."0.1.0";
  by-version."stream-combiner"."0.1.0" = self.buildNodePackage {
    name = "stream-combiner-0.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/stream-combiner/-/stream-combiner-0.1.0.tgz";
      name = "stream-combiner-0.1.0.tgz";
      sha1 = "0dc389a3c203f8f4d56368f95dde52eb9269b5be";
    };
    deps = {
      "duplexer-0.1.1" = self.by-version."duplexer"."0.1.1";
      "through-2.3.6" = self.by-version."through"."2.3.6";
    };
    peerDependencies = [];
  };
  by-spec."stream-counter"."~0.2.0" =
    self.by-version."stream-counter"."0.2.0";
  by-version."stream-counter"."0.2.0" = self.buildNodePackage {
    name = "stream-counter-0.2.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/stream-counter/-/stream-counter-0.2.0.tgz";
      name = "stream-counter-0.2.0.tgz";
      sha1 = "ded266556319c8b0e222812b9cf3b26fa7d947de";
    };
    deps = {
      "readable-stream-1.1.13" = self.by-version."readable-stream"."1.1.13";
    };
    peerDependencies = [];
  };
  by-spec."string-length"."^1.0.0" =
    self.by-version."string-length"."1.0.0";
  by-version."string-length"."1.0.0" = self.buildNodePackage {
    name = "string-length-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/string-length/-/string-length-1.0.0.tgz";
      name = "string-length-1.0.0.tgz";
      sha1 = "5f0564b174feb299595a763da71513266370d3a9";
    };
    deps = {
      "strip-ansi-2.0.1" = self.by-version."strip-ansi"."2.0.1";
    };
    peerDependencies = [];
  };
  by-spec."string_decoder"."~0.0.0" =
    self.by-version."string_decoder"."0.0.1";
  by-version."string_decoder"."0.0.1" = self.buildNodePackage {
    name = "string_decoder-0.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/string_decoder/-/string_decoder-0.0.1.tgz";
      name = "string_decoder-0.0.1.tgz";
      sha1 = "f5472d0a8d1650ec823752d24e6fd627b39bf141";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."string_decoder"."~0.10.x" =
    self.by-version."string_decoder"."0.10.31";
  by-version."string_decoder"."0.10.31" = self.buildNodePackage {
    name = "string_decoder-0.10.31";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/string_decoder/-/string_decoder-0.10.31.tgz";
      name = "string_decoder-0.10.31.tgz";
      sha1 = "62e203bc41766c6c28c9fc84301dab1c5310fa94";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."stringstream"."~0.0.4" =
    self.by-version."stringstream"."0.0.4";
  by-version."stringstream"."0.0.4" = self.buildNodePackage {
    name = "stringstream-0.0.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/stringstream/-/stringstream-0.0.4.tgz";
      name = "stringstream-0.0.4.tgz";
      sha1 = "0f0e3423f942960b5692ac324a57dd093bc41a92";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."strip-ansi"."^0.3.0" =
    self.by-version."strip-ansi"."0.3.0";
  by-version."strip-ansi"."0.3.0" = self.buildNodePackage {
    name = "strip-ansi-0.3.0";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/strip-ansi/-/strip-ansi-0.3.0.tgz";
      name = "strip-ansi-0.3.0.tgz";
      sha1 = "25f48ea22ca79187f3174a4db8759347bb126220";
    };
    deps = {
      "ansi-regex-0.2.1" = self.by-version."ansi-regex"."0.2.1";
    };
    peerDependencies = [];
  };
  by-spec."strip-ansi"."^2.0.0" =
    self.by-version."strip-ansi"."2.0.1";
  by-version."strip-ansi"."2.0.1" = self.buildNodePackage {
    name = "strip-ansi-2.0.1";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/strip-ansi/-/strip-ansi-2.0.1.tgz";
      name = "strip-ansi-2.0.1.tgz";
      sha1 = "df62c1aa94ed2f114e1d0f21fd1d50482b79a60e";
    };
    deps = {
      "ansi-regex-1.1.0" = self.by-version."ansi-regex"."1.1.0";
    };
    peerDependencies = [];
  };
  by-spec."strip-ansi"."^2.0.1" =
    self.by-version."strip-ansi"."2.0.1";
  by-spec."strip-ansi"."~0.1.0" =
    self.by-version."strip-ansi"."0.1.1";
  by-version."strip-ansi"."0.1.1" = self.buildNodePackage {
    name = "strip-ansi-0.1.1";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/strip-ansi/-/strip-ansi-0.1.1.tgz";
      name = "strip-ansi-0.1.1.tgz";
      sha1 = "39e8a98d044d150660abe4a6808acf70bb7bc991";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."strip-json-comments"."0.1.x" =
    self.by-version."strip-json-comments"."0.1.3";
  by-version."strip-json-comments"."0.1.3" = self.buildNodePackage {
    name = "strip-json-comments-0.1.3";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/strip-json-comments/-/strip-json-comments-0.1.3.tgz";
      name = "strip-json-comments-0.1.3.tgz";
      sha1 = "164c64e370a8a3cc00c9e01b539e569823f0ee54";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."subarg"."0.0.1" =
    self.by-version."subarg"."0.0.1";
  by-version."subarg"."0.0.1" = self.buildNodePackage {
    name = "subarg-0.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/subarg/-/subarg-0.0.1.tgz";
      name = "subarg-0.0.1.tgz";
      sha1 = "3d56b07dacfbc45bbb63f7672b43b63e46368e3a";
    };
    deps = {
      "minimist-0.0.10" = self.by-version."minimist"."0.0.10";
    };
    peerDependencies = [];
  };
  by-spec."superb"."^1.0.2" =
    self.by-version."superb"."1.1.2";
  by-version."superb"."1.1.2" = self.buildNodePackage {
    name = "superb-1.1.2";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/superb/-/superb-1.1.2.tgz";
      name = "superb-1.1.2.tgz";
      sha1 = "3236bbecafe7e96afa0a9efda5422611154d25ef";
    };
    deps = {
      "meow-2.1.0" = self.by-version."meow"."2.1.0";
      "unique-random-array-1.0.0" = self.by-version."unique-random-array"."1.0.0";
    };
    peerDependencies = [];
  };
  by-spec."supports-color"."^0.2.0" =
    self.by-version."supports-color"."0.2.0";
  by-version."supports-color"."0.2.0" = self.buildNodePackage {
    name = "supports-color-0.2.0";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/supports-color/-/supports-color-0.2.0.tgz";
      name = "supports-color-0.2.0.tgz";
      sha1 = "d92de2694eb3f67323973d7ae3d8b55b4c22190a";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."syntax-error"."^1.1.1" =
    self.by-version."syntax-error"."1.1.2";
  by-version."syntax-error"."1.1.2" = self.buildNodePackage {
    name = "syntax-error-1.1.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/syntax-error/-/syntax-error-1.1.2.tgz";
      name = "syntax-error-1.1.2.tgz";
      sha1 = "660f025b170b7eb944efc2a889d451312bcef451";
    };
    deps = {
      "acorn-0.9.0" = self.by-version."acorn"."0.9.0";
    };
    peerDependencies = [];
  };
  by-spec."syntax-error"."~1.1.0" =
    self.by-version."syntax-error"."1.1.2";
  by-spec."tar"."^0.1.18" =
    self.by-version."tar"."0.1.20";
  by-version."tar"."0.1.20" = self.buildNodePackage {
    name = "tar-0.1.20";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/tar/-/tar-0.1.20.tgz";
      name = "tar-0.1.20.tgz";
      sha1 = "42940bae5b5f22c74483699126f9f3f27449cb13";
    };
    deps = {
      "block-stream-0.0.7" = self.by-version."block-stream"."0.0.7";
      "fstream-0.1.31" = self.by-version."fstream"."0.1.31";
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
    };
    peerDependencies = [];
  };
  by-spec."tar"."^1.0.0" =
    self.by-version."tar"."1.0.3";
  by-version."tar"."1.0.3" = self.buildNodePackage {
    name = "tar-1.0.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/tar/-/tar-1.0.3.tgz";
      name = "tar-1.0.3.tgz";
      sha1 = "15bcdab244fa4add44e4244a0176edb8aa9a2b44";
    };
    deps = {
      "block-stream-0.0.7" = self.by-version."block-stream"."0.0.7";
      "fstream-1.0.4" = self.by-version."fstream"."1.0.4";
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
    };
    peerDependencies = [];
  };
  by-spec."tar"."~1.0.3" =
    self.by-version."tar"."1.0.3";
  by-spec."tempfile"."^0.1.2" =
    self.by-version."tempfile"."0.1.3";
  by-version."tempfile"."0.1.3" = self.buildNodePackage {
    name = "tempfile-0.1.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/tempfile/-/tempfile-0.1.3.tgz";
      name = "tempfile-0.1.3.tgz";
      sha1 = "7d6b710047339d39f847327a056dadf183103010";
    };
    deps = {
      "uuid-1.4.2" = self.by-version."uuid"."1.4.2";
    };
    peerDependencies = [];
  };
  by-spec."text-table"."~0.2.0" =
    self.by-version."text-table"."0.2.0";
  by-version."text-table"."0.2.0" = self.buildNodePackage {
    name = "text-table-0.2.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/text-table/-/text-table-0.2.0.tgz";
      name = "text-table-0.2.0.tgz";
      sha1 = "7f5ee823ae805207c00af2df4a84ec3fcfa570b4";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."thenify"."3" =
    self.by-version."thenify"."3.1.0";
  by-version."thenify"."3.1.0" = self.buildNodePackage {
    name = "thenify-3.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/thenify/-/thenify-3.1.0.tgz";
      name = "thenify-3.1.0.tgz";
      sha1 = "c27cbbc62b7c287edf1a1a3d5cc8426d8aed49f0";
    };
    deps = {
      "native-or-bluebird-1.1.2" = self.by-version."native-or-bluebird"."1.1.2";
    };
    peerDependencies = [];
  };
  by-spec."thenify".">= 3.1.0 < 4" =
    self.by-version."thenify"."3.1.0";
  by-spec."thenify-all"."1" =
    self.by-version."thenify-all"."1.6.0";
  by-version."thenify-all"."1.6.0" = self.buildNodePackage {
    name = "thenify-all-1.6.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/thenify-all/-/thenify-all-1.6.0.tgz";
      name = "thenify-all-1.6.0.tgz";
      sha1 = "1a1918d402d8fc3f98fbf234db0bcc8cc10e9726";
    };
    deps = {
      "thenify-3.1.0" = self.by-version."thenify"."3.1.0";
    };
    peerDependencies = [];
  };
  by-spec."throttleit"."~0.0.2" =
    self.by-version."throttleit"."0.0.2";
  by-version."throttleit"."0.0.2" = self.buildNodePackage {
    name = "throttleit-0.0.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/throttleit/-/throttleit-0.0.2.tgz";
      name = "throttleit-0.0.2.tgz";
      sha1 = "cfedf88e60c00dd9697b61fdd2a8343a9b680eaf";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."through"."2" =
    self.by-version."through"."2.3.6";
  by-version."through"."2.3.6" = self.buildNodePackage {
    name = "through-2.3.6";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/through/-/through-2.3.6.tgz";
      name = "through-2.3.6.tgz";
      sha1 = "26681c0f524671021d4e29df7c36bce2d0ecf2e8";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."through".">=2.2.7 <3" =
    self.by-version."through"."2.3.6";
  by-spec."through"."~2.2.7" =
    self.by-version."through"."2.2.7";
  by-version."through"."2.2.7" = self.buildNodePackage {
    name = "through-2.2.7";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/through/-/through-2.2.7.tgz";
      name = "through-2.2.7.tgz";
      sha1 = "6e8e21200191d4eb6a99f6f010df46aa1c6eb2bd";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."through"."~2.3" =
    self.by-version."through"."2.3.6";
  by-spec."through"."~2.3.1" =
    self.by-version."through"."2.3.6";
  by-spec."through"."~2.3.4" =
    self.by-version."through"."2.3.6";
  by-spec."through2"."^1.0.0" =
    self.by-version."through2"."1.1.1";
  by-version."through2"."1.1.1" = self.buildNodePackage {
    name = "through2-1.1.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/through2/-/through2-1.1.1.tgz";
      name = "through2-1.1.1.tgz";
      sha1 = "0847cbc4449f3405574dbdccd9bb841b83ac3545";
    };
    deps = {
      "readable-stream-1.1.13" = self.by-version."readable-stream"."1.1.13";
      "xtend-4.0.0" = self.by-version."xtend"."4.0.0";
    };
    peerDependencies = [];
  };
  by-spec."through2"."~0.4.1" =
    self.by-version."through2"."0.4.2";
  by-version."through2"."0.4.2" = self.buildNodePackage {
    name = "through2-0.4.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/through2/-/through2-0.4.2.tgz";
      name = "through2-0.4.2.tgz";
      sha1 = "dbf5866031151ec8352bb6c4db64a2292a840b9b";
    };
    deps = {
      "readable-stream-1.0.33" = self.by-version."readable-stream"."1.0.33";
      "xtend-2.1.2" = self.by-version."xtend"."2.1.2";
    };
    peerDependencies = [];
  };
  by-spec."timers-browserify"."^1.0.1" =
    self.by-version."timers-browserify"."1.3.0";
  by-version."timers-browserify"."1.3.0" = self.buildNodePackage {
    name = "timers-browserify-1.3.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/timers-browserify/-/timers-browserify-1.3.0.tgz";
      name = "timers-browserify-1.3.0.tgz";
      sha1 = "c518e6ba39f19619e6ae464e447b1511e172e96f";
    };
    deps = {
      "process-0.10.0" = self.by-version."process"."0.10.0";
    };
    peerDependencies = [];
  };
  by-spec."timers-browserify"."~1.0.1" =
    self.by-version."timers-browserify"."1.0.3";
  by-version."timers-browserify"."1.0.3" = self.buildNodePackage {
    name = "timers-browserify-1.0.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/timers-browserify/-/timers-browserify-1.0.3.tgz";
      name = "timers-browserify-1.0.3.tgz";
      sha1 = "ffba70c9c12eed916fd67318e629ac6f32295551";
    };
    deps = {
      "process-0.5.2" = self.by-version."process"."0.5.2";
    };
    peerDependencies = [];
  };
  by-spec."timers-ext"."0.1" =
    self.by-version."timers-ext"."0.1.0";
  by-version."timers-ext"."0.1.0" = self.buildNodePackage {
    name = "timers-ext-0.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/timers-ext/-/timers-ext-0.1.0.tgz";
      name = "timers-ext-0.1.0.tgz";
      sha1 = "00345a2ca93089d1251322054389d263e27b77e2";
    };
    deps = {
      "es5-ext-0.10.6" = self.by-version."es5-ext"."0.10.6";
      "next-tick-0.2.2" = self.by-version."next-tick"."0.2.2";
    };
    peerDependencies = [];
  };
  by-spec."timers-ext"."0.1.x" =
    self.by-version."timers-ext"."0.1.0";
  by-spec."tiny-lr-fork"."0.0.5" =
    self.by-version."tiny-lr-fork"."0.0.5";
  by-version."tiny-lr-fork"."0.0.5" = self.buildNodePackage {
    name = "tiny-lr-fork-0.0.5";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/tiny-lr-fork/-/tiny-lr-fork-0.0.5.tgz";
      name = "tiny-lr-fork-0.0.5.tgz";
      sha1 = "1e99e1e2a8469b736ab97d97eefa98c71f76ed0a";
    };
    deps = {
      "qs-0.5.6" = self.by-version."qs"."0.5.6";
      "faye-websocket-0.4.4" = self.by-version."faye-websocket"."0.4.4";
      "noptify-0.0.3" = self.by-version."noptify"."0.0.3";
      "debug-0.7.4" = self.by-version."debug"."0.7.4";
    };
    peerDependencies = [];
  };
  by-spec."tinycolor"."0.x" =
    self.by-version."tinycolor"."0.0.1";
  by-version."tinycolor"."0.0.1" = self.buildNodePackage {
    name = "tinycolor-0.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/tinycolor/-/tinycolor-0.0.1.tgz";
      name = "tinycolor-0.0.1.tgz";
      sha1 = "320b5a52d83abb5978d81a3e887d4aefb15a6164";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."tough-cookie".">=0.12.0" =
    self.by-version."tough-cookie"."0.12.1";
  by-version."tough-cookie"."0.12.1" = self.buildNodePackage {
    name = "tough-cookie-0.12.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/tough-cookie/-/tough-cookie-0.12.1.tgz";
      name = "tough-cookie-0.12.1.tgz";
      sha1 = "8220c7e21abd5b13d96804254bd5a81ebf2c7d62";
    };
    deps = {
      "punycode-1.3.2" = self.by-version."punycode"."1.3.2";
    };
    peerDependencies = [];
  };
  by-spec."tough-cookie"."^0.12.1" =
    self.by-version."tough-cookie"."0.12.1";
  by-spec."tty-browserify"."~0.0.0" =
    self.by-version."tty-browserify"."0.0.0";
  by-version."tty-browserify"."0.0.0" = self.buildNodePackage {
    name = "tty-browserify-0.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/tty-browserify/-/tty-browserify-0.0.0.tgz";
      name = "tty-browserify-0.0.0.tgz";
      sha1 = "a157ba402da24e9bf957f9aa69d524eed42901a6";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."tunnel-agent"."~0.4.0" =
    self.by-version."tunnel-agent"."0.4.0";
  by-version."tunnel-agent"."0.4.0" = self.buildNodePackage {
    name = "tunnel-agent-0.4.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/tunnel-agent/-/tunnel-agent-0.4.0.tgz";
      name = "tunnel-agent-0.4.0.tgz";
      sha1 = "b1184e312ffbcf70b3b4c78e8c219de7ebb1c550";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."type-detect"."0.1.1" =
    self.by-version."type-detect"."0.1.1";
  by-version."type-detect"."0.1.1" = self.buildNodePackage {
    name = "type-detect-0.1.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/type-detect/-/type-detect-0.1.1.tgz";
      name = "type-detect-0.1.1.tgz";
      sha1 = "0ba5ec2a885640e470ea4e8505971900dac58822";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."type-is"."~1.5.1" =
    self.by-version."type-is"."1.5.6";
  by-version."type-is"."1.5.6" = self.buildNodePackage {
    name = "type-is-1.5.6";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/type-is/-/type-is-1.5.6.tgz";
      name = "type-is-1.5.6.tgz";
      sha1 = "5be39670ac699b4d0f59df84264cb05be1c9998b";
    };
    deps = {
      "media-typer-0.3.0" = self.by-version."media-typer"."0.3.0";
      "mime-types-2.0.8" = self.by-version."mime-types"."2.0.8";
    };
    peerDependencies = [];
  };
  by-spec."type-is"."~1.5.2" =
    self.by-version."type-is"."1.5.6";
  by-spec."typedarray"."~0.0.5" =
    self.by-version."typedarray"."0.0.6";
  by-version."typedarray"."0.0.6" = self.buildNodePackage {
    name = "typedarray-0.0.6";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/typedarray/-/typedarray-0.0.6.tgz";
      name = "typedarray-0.0.6.tgz";
      sha1 = "867ac74e3864187b1d3d47d996a78ec5c8830777";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."uglify-js"."1.2.5" =
    self.by-version."uglify-js"."1.2.5";
  by-version."uglify-js"."1.2.5" = self.buildNodePackage {
    name = "uglify-js-1.2.5";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/uglify-js/-/uglify-js-1.2.5.tgz";
      name = "uglify-js-1.2.5.tgz";
      sha1 = "b542c2c76f78efb34b200b20177634330ff702b6";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."uglify-js"."~2.2" =
    self.by-version."uglify-js"."2.2.5";
  by-version."uglify-js"."2.2.5" = self.buildNodePackage {
    name = "uglify-js-2.2.5";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/uglify-js/-/uglify-js-2.2.5.tgz";
      name = "uglify-js-2.2.5.tgz";
      sha1 = "a6e02a70d839792b9780488b7b8b184c095c99c7";
    };
    deps = {
      "source-map-0.1.43" = self.by-version."source-map"."0.1.43";
      "optimist-0.3.7" = self.by-version."optimist"."0.3.7";
    };
    peerDependencies = [];
  };
  by-spec."uglify-js"."~2.3" =
    self.by-version."uglify-js"."2.3.6";
  by-version."uglify-js"."2.3.6" = self.buildNodePackage {
    name = "uglify-js-2.3.6";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/uglify-js/-/uglify-js-2.3.6.tgz";
      name = "uglify-js-2.3.6.tgz";
      sha1 = "fa0984770b428b7a9b2a8058f46355d14fef211a";
    };
    deps = {
      "async-0.2.10" = self.by-version."async"."0.2.10";
      "source-map-0.1.43" = self.by-version."source-map"."0.1.43";
      "optimist-0.3.7" = self.by-version."optimist"."0.3.7";
    };
    peerDependencies = [];
  };
  by-spec."uglify-js"."~2.4.0" =
    self.by-version."uglify-js"."2.4.16";
  by-version."uglify-js"."2.4.16" = self.buildNodePackage {
    name = "uglify-js-2.4.16";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/uglify-js/-/uglify-js-2.4.16.tgz";
      name = "uglify-js-2.4.16.tgz";
      sha1 = "84143487eb480efd7d0789c7ecfbd48a695839f9";
    };
    deps = {
      "async-0.2.10" = self.by-version."async"."0.2.10";
      "source-map-0.1.34" = self.by-version."source-map"."0.1.34";
      "optimist-0.3.7" = self.by-version."optimist"."0.3.7";
      "uglify-to-browserify-1.0.2" = self.by-version."uglify-to-browserify"."1.0.2";
    };
    peerDependencies = [];
  };
  by-spec."uglify-to-browserify"."~1.0.0" =
    self.by-version."uglify-to-browserify"."1.0.2";
  by-version."uglify-to-browserify"."1.0.2" = self.buildNodePackage {
    name = "uglify-to-browserify-1.0.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/uglify-to-browserify/-/uglify-to-browserify-1.0.2.tgz";
      name = "uglify-to-browserify-1.0.2.tgz";
      sha1 = "6e0924d6bda6b5afe349e39a6d632850a0f882b7";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."uid-number"."0.0.5" =
    self.by-version."uid-number"."0.0.5";
  by-version."uid-number"."0.0.5" = self.buildNodePackage {
    name = "uid-number-0.0.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/uid-number/-/uid-number-0.0.5.tgz";
      name = "uid-number-0.0.5.tgz";
      sha1 = "5a3db23ef5dbd55b81fce0ec9a2ac6fccdebb81e";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."uid-number"."0.0.6" =
    self.by-version."uid-number"."0.0.6";
  by-version."uid-number"."0.0.6" = self.buildNodePackage {
    name = "uid-number-0.0.6";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/uid-number/-/uid-number-0.0.6.tgz";
      name = "uid-number-0.0.6.tgz";
      sha1 = "0ea10e8035e8eb5b8e4449f06da1c730663baa81";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."uid-safe"."1.0.1" =
    self.by-version."uid-safe"."1.0.1";
  by-version."uid-safe"."1.0.1" = self.buildNodePackage {
    name = "uid-safe-1.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/uid-safe/-/uid-safe-1.0.1.tgz";
      name = "uid-safe-1.0.1.tgz";
      sha1 = "5bd148460a2e84f54f193fd20352c8c3d7de6ac8";
    };
    deps = {
      "mz-1.2.1" = self.by-version."mz"."1.2.1";
      "base64-url-1.2.1" = self.by-version."base64-url"."1.2.1";
    };
    peerDependencies = [];
  };
  by-spec."uid-safe"."~1.0.3" =
    self.by-version."uid-safe"."1.0.3";
  by-version."uid-safe"."1.0.3" = self.buildNodePackage {
    name = "uid-safe-1.0.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/uid-safe/-/uid-safe-1.0.3.tgz";
      name = "uid-safe-1.0.3.tgz";
      sha1 = "290afe3ec6d0d28c41b0768e8de72af22515d1c7";
    };
    deps = {
      "base64-url-1.2.0" = self.by-version."base64-url"."1.2.0";
      "native-or-bluebird-1.1.2" = self.by-version."native-or-bluebird"."1.1.2";
    };
    peerDependencies = [];
  };
  by-spec."umask"."~1.1.0" =
    self.by-version."umask"."1.1.0";
  by-version."umask"."1.1.0" = self.buildNodePackage {
    name = "umask-1.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/umask/-/umask-1.1.0.tgz";
      name = "umask-1.1.0.tgz";
      sha1 = "f29cebf01df517912bb58ff9c4e50fde8e33320d";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."umd"."~2.0.0" =
    self.by-version."umd"."2.0.0";
  by-version."umd"."2.0.0" = self.buildNodePackage {
    name = "umd-2.0.0";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/umd/-/umd-2.0.0.tgz";
      name = "umd-2.0.0.tgz";
      sha1 = "749683b0d514728ae0e1b6195f5774afc0ad4f8f";
    };
    deps = {
      "rfile-1.0.0" = self.by-version."rfile"."1.0.0";
      "ruglify-1.0.0" = self.by-version."ruglify"."1.0.0";
      "through-2.3.6" = self.by-version."through"."2.3.6";
      "uglify-js-2.4.16" = self.by-version."uglify-js"."2.4.16";
    };
    peerDependencies = [];
  };
  by-spec."umd"."~2.1.0" =
    self.by-version."umd"."2.1.0";
  by-version."umd"."2.1.0" = self.buildNodePackage {
    name = "umd-2.1.0";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/umd/-/umd-2.1.0.tgz";
      name = "umd-2.1.0.tgz";
      sha1 = "4a6307b762f17f02d201b5fa154e673396c263cf";
    };
    deps = {
      "rfile-1.0.0" = self.by-version."rfile"."1.0.0";
      "ruglify-1.0.0" = self.by-version."ruglify"."1.0.0";
      "through-2.3.6" = self.by-version."through"."2.3.6";
      "uglify-js-2.4.16" = self.by-version."uglify-js"."2.4.16";
    };
    peerDependencies = [];
  };
  by-spec."underscore"."1.4.x" =
    self.by-version."underscore"."1.4.4";
  by-version."underscore"."1.4.4" = self.buildNodePackage {
    name = "underscore-1.4.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/underscore/-/underscore-1.4.4.tgz";
      name = "underscore-1.4.4.tgz";
      sha1 = "61a6a32010622afa07963bf325203cf12239d604";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."underscore"."^1.6.0" =
    self.by-version."underscore"."1.7.0";
  by-version."underscore"."1.7.0" = self.buildNodePackage {
    name = "underscore-1.7.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/underscore/-/underscore-1.7.0.tgz";
      name = "underscore-1.7.0.tgz";
      sha1 = "6bbaf0877500d36be34ecaa584e0db9fef035209";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."underscore"."~1.7.0" =
    self.by-version."underscore"."1.7.0";
  by-spec."underscore.string"."^2.3.3" =
    self.by-version."underscore.string"."2.4.0";
  by-version."underscore.string"."2.4.0" = self.buildNodePackage {
    name = "underscore.string-2.4.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/underscore.string/-/underscore.string-2.4.0.tgz";
      name = "underscore.string-2.4.0.tgz";
      sha1 = "8cdd8fbac4e2d2ea1e7e2e8097c42f442280f85b";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."underscore.string"."~2.2.1" =
    self.by-version."underscore.string"."2.2.1";
  by-version."underscore.string"."2.2.1" = self.buildNodePackage {
    name = "underscore.string-2.2.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/underscore.string/-/underscore.string-2.2.1.tgz";
      name = "underscore.string-2.2.1.tgz";
      sha1 = "d7c0fa2af5d5a1a67f4253daee98132e733f0f19";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."underscore.string"."~2.3.3" =
    self.by-version."underscore.string"."2.3.3";
  by-version."underscore.string"."2.3.3" = self.buildNodePackage {
    name = "underscore.string-2.3.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/underscore.string/-/underscore.string-2.3.3.tgz";
      name = "underscore.string-2.3.3.tgz";
      sha1 = "71c08bf6b428b1133f37e78fa3a21c82f7329b0d";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."underscore.string"."~2.4.0" =
    self.by-version."underscore.string"."2.4.0";
  by-spec."unique-random"."^0.1.1" =
    self.by-version."unique-random"."0.1.1";
  by-version."unique-random"."0.1.1" = self.buildNodePackage {
    name = "unique-random-0.1.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/unique-random/-/unique-random-0.1.1.tgz";
      name = "unique-random-0.1.1.tgz";
      sha1 = "c4ccaabedaab8534e0f54daf5f10743ee5c692ad";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."unique-random"."^1.0.0" =
    self.by-version."unique-random"."1.0.0";
  by-version."unique-random"."1.0.0" = self.buildNodePackage {
    name = "unique-random-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/unique-random/-/unique-random-1.0.0.tgz";
      name = "unique-random-1.0.0.tgz";
      sha1 = "ce3e224c8242cd33a0e77b0d7180d77e6b62d0c4";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."unique-random-array"."^1.0.0" =
    self.by-version."unique-random-array"."1.0.0";
  by-version."unique-random-array"."1.0.0" = self.buildNodePackage {
    name = "unique-random-array-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/unique-random-array/-/unique-random-array-1.0.0.tgz";
      name = "unique-random-array-1.0.0.tgz";
      sha1 = "42b3721c579388d8b667c93c2dbde3d5d81a9136";
    };
    deps = {
      "unique-random-1.0.0" = self.by-version."unique-random"."1.0.0";
    };
    peerDependencies = [];
  };
  by-spec."update-notifier"."^0.2.0" =
    self.by-version."update-notifier"."0.2.2";
  by-version."update-notifier"."0.2.2" = self.buildNodePackage {
    name = "update-notifier-0.2.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/update-notifier/-/update-notifier-0.2.2.tgz";
      name = "update-notifier-0.2.2.tgz";
      sha1 = "e69b3a784b4e686a2acd98f5e66944591996e187";
    };
    deps = {
      "chalk-0.5.1" = self.by-version."chalk"."0.5.1";
      "configstore-0.3.2" = self.by-version."configstore"."0.3.2";
      "is-npm-1.0.0" = self.by-version."is-npm"."1.0.0";
      "latest-version-1.0.0" = self.by-version."latest-version"."1.0.0";
      "semver-diff-2.0.0" = self.by-version."semver-diff"."2.0.0";
      "string-length-1.0.0" = self.by-version."string-length"."1.0.0";
    };
    peerDependencies = [];
  };
  by-spec."url"."~0.10.1" =
    self.by-version."url"."0.10.2";
  by-version."url"."0.10.2" = self.buildNodePackage {
    name = "url-0.10.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/url/-/url-0.10.2.tgz";
      name = "url-0.10.2.tgz";
      sha1 = "68621d6929ea1cad344ebf135d82fcf7eb1a7469";
    };
    deps = {
      "punycode-1.3.2" = self.by-version."punycode"."1.3.2";
    };
    peerDependencies = [];
  };
  by-spec."user-home"."^1.0.0" =
    self.by-version."user-home"."1.1.1";
  by-version."user-home"."1.1.1" = self.buildNodePackage {
    name = "user-home-1.1.1";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/user-home/-/user-home-1.1.1.tgz";
      name = "user-home-1.1.1.tgz";
      sha1 = "2b5be23a32b63a7c9deb8d0f28d485724a3df190";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."useragent"."~2.0.4" =
    self.by-version."useragent"."2.0.10";
  by-version."useragent"."2.0.10" = self.buildNodePackage {
    name = "useragent-2.0.10";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/useragent/-/useragent-2.0.10.tgz";
      name = "useragent-2.0.10.tgz";
      sha1 = "af2c1cc641159361e4d830866eb716ba4679de33";
    };
    deps = {
      "lru-cache-2.2.4" = self.by-version."lru-cache"."2.2.4";
    };
    peerDependencies = [];
  };
  by-spec."util"."0.10.3" =
    self.by-version."util"."0.10.3";
  by-version."util"."0.10.3" = self.buildNodePackage {
    name = "util-0.10.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/util/-/util-0.10.3.tgz";
      name = "util-0.10.3.tgz";
      sha1 = "7afb1afe50805246489e3db7fe0ed379336ac0f9";
    };
    deps = {
      "inherits-2.0.1" = self.by-version."inherits"."2.0.1";
    };
    peerDependencies = [];
  };
  by-spec."util"."~0.10.1" =
    self.by-version."util"."0.10.3";
  by-spec."util-extend"."^1.0.1" =
    self.by-version."util-extend"."1.0.1";
  by-version."util-extend"."1.0.1" = self.buildNodePackage {
    name = "util-extend-1.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/util-extend/-/util-extend-1.0.1.tgz";
      name = "util-extend-1.0.1.tgz";
      sha1 = "bb703b79480293ddcdcfb3c6a9fea20f483415bc";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."utile"."0.2.x" =
    self.by-version."utile"."0.2.1";
  by-version."utile"."0.2.1" = self.buildNodePackage {
    name = "utile-0.2.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/utile/-/utile-0.2.1.tgz";
      name = "utile-0.2.1.tgz";
      sha1 = "930c88e99098d6220834c356cbd9a770522d90d7";
    };
    deps = {
      "async-0.2.10" = self.by-version."async"."0.2.10";
      "deep-equal-0.2.1" = self.by-version."deep-equal"."0.2.1";
      "i-0.3.2" = self.by-version."i"."0.3.2";
      "mkdirp-0.5.0" = self.by-version."mkdirp"."0.5.0";
      "ncp-0.4.2" = self.by-version."ncp"."0.4.2";
      "rimraf-2.2.8" = self.by-version."rimraf"."2.2.8";
    };
    peerDependencies = [];
  };
  by-spec."utile"."~0.2.1" =
    self.by-version."utile"."0.2.1";
  by-spec."utils-merge"."1.0.0" =
    self.by-version."utils-merge"."1.0.0";
  by-version."utils-merge"."1.0.0" = self.buildNodePackage {
    name = "utils-merge-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/utils-merge/-/utils-merge-1.0.0.tgz";
      name = "utils-merge-1.0.0.tgz";
      sha1 = "0294fb922bb9375153541c4f7096231f287c8af8";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."uuid"."^2.0.1" =
    self.by-version."uuid"."2.0.1";
  by-version."uuid"."2.0.1" = self.buildNodePackage {
    name = "uuid-2.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/uuid/-/uuid-2.0.1.tgz";
      name = "uuid-2.0.1.tgz";
      sha1 = "c2a30dedb3e535d72ccf82e343941a50ba8533ac";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."uuid"."~1.4.0" =
    self.by-version."uuid"."1.4.2";
  by-version."uuid"."1.4.2" = self.buildNodePackage {
    name = "uuid-1.4.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/uuid/-/uuid-1.4.2.tgz";
      name = "uuid-1.4.2.tgz";
      sha1 = "453019f686966a6df83cdc5244e7c990ecc332fc";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."vary"."~1.0.0" =
    self.by-version."vary"."1.0.0";
  by-version."vary"."1.0.0" = self.buildNodePackage {
    name = "vary-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/vary/-/vary-1.0.0.tgz";
      name = "vary-1.0.0.tgz";
      sha1 = "c5e76cec20d3820d8f2a96e7bee38731c34da1e7";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."vhost"."~3.0.0" =
    self.by-version."vhost"."3.0.0";
  by-version."vhost"."3.0.0" = self.buildNodePackage {
    name = "vhost-3.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/vhost/-/vhost-3.0.0.tgz";
      name = "vhost-3.0.0.tgz";
      sha1 = "2d0ec59a3e012278b65adbe17c1717a5a5023045";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."vm-browserify"."~0.0.1" =
    self.by-version."vm-browserify"."0.0.4";
  by-version."vm-browserify"."0.0.4" = self.buildNodePackage {
    name = "vm-browserify-0.0.4";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/vm-browserify/-/vm-browserify-0.0.4.tgz";
      name = "vm-browserify-0.0.4.tgz";
      sha1 = "5d7ea45bbef9e4a6ff65f95438e0a87c357d5a73";
    };
    deps = {
      "indexof-0.0.1" = self.by-version."indexof"."0.0.1";
    };
    peerDependencies = [];
  };
  by-spec."watchify"."^0.10" =
    self.by-version."watchify"."0.10.2";
  by-version."watchify"."0.10.2" = self.buildNodePackage {
    name = "watchify-0.10.2";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/watchify/-/watchify-0.10.2.tgz";
      name = "watchify-0.10.2.tgz";
      sha1 = "63c9f0b5a68ad73365c743880c19163610d8eac3";
    };
    deps = {
      "browserify-4.2.3" = self.by-version."browserify"."4.2.3";
      "optimist-0.5.2" = self.by-version."optimist"."0.5.2";
      "shallow-copy-0.0.1" = self.by-version."shallow-copy"."0.0.1";
      "through-2.3.6" = self.by-version."through"."2.3.6";
      "chokidar-0.8.4" = self.by-version."chokidar"."0.8.4";
    };
    peerDependencies = [];
  };
  by-spec."watchify"."~0.6" =
    self.by-version."watchify"."0.6.4";
  by-version."watchify"."0.6.4" = self.buildNodePackage {
    name = "watchify-0.6.4";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/watchify/-/watchify-0.6.4.tgz";
      name = "watchify-0.6.4.tgz";
      sha1 = "4139f11475f53e90d64b5e998a1f42bbf351524f";
    };
    deps = {
      "browserify-3.46.1" = self.by-version."browserify"."3.46.1";
      "optimist-0.5.2" = self.by-version."optimist"."0.5.2";
      "shallow-copy-0.0.1" = self.by-version."shallow-copy"."0.0.1";
      "through-2.3.6" = self.by-version."through"."2.3.6";
      "chokidar-0.8.4" = self.by-version."chokidar"."0.8.4";
    };
    peerDependencies = [];
  };
  by-spec."wcwidth"."^1.0.0" =
    self.by-version."wcwidth"."1.0.0";
  by-version."wcwidth"."1.0.0" = self.buildNodePackage {
    name = "wcwidth-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/wcwidth/-/wcwidth-1.0.0.tgz";
      name = "wcwidth-1.0.0.tgz";
      sha1 = "02d059ff7a8fc741e0f6b5da1e69b2b40daeca6f";
    };
    deps = {
      "defaults-1.0.0" = self.by-version."defaults"."1.0.0";
    };
    peerDependencies = [];
  };
  by-spec."which"."1" =
    self.by-version."which"."1.0.8";
  by-version."which"."1.0.8" = self.buildNodePackage {
    name = "which-1.0.8";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/which/-/which-1.0.8.tgz";
      name = "which-1.0.8.tgz";
      sha1 = "c2ff319534ac4a1fa45df2221b56c36279903ded";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."which"."1.0.x" =
    self.by-version."which"."1.0.8";
  by-spec."which"."^1.0.5" =
    self.by-version."which"."1.0.8";
  by-spec."which"."~1.0.5" =
    self.by-version."which"."1.0.8";
  by-spec."which"."~1.0.8" =
    self.by-version."which"."1.0.8";
  by-spec."win-release"."^1.0.0" =
    self.by-version."win-release"."1.0.0";
  by-version."win-release"."1.0.0" = self.buildNodePackage {
    name = "win-release-1.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/win-release/-/win-release-1.0.0.tgz";
      name = "win-release-1.0.0.tgz";
      sha1 = "8993308dedbd8d30ad5594b6b7382a8c1d96ae5a";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."winston"."0.8.x" =
    self.by-version."winston"."0.8.3";
  by-version."winston"."0.8.3" = self.buildNodePackage {
    name = "winston-0.8.3";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/winston/-/winston-0.8.3.tgz";
      name = "winston-0.8.3.tgz";
      sha1 = "64b6abf4cd01adcaefd5009393b1d8e8bec19db0";
    };
    deps = {
      "async-0.2.10" = self.by-version."async"."0.2.10";
      "colors-0.6.2" = self.by-version."colors"."0.6.2";
      "cycle-1.0.3" = self.by-version."cycle"."1.0.3";
      "eyes-0.1.8" = self.by-version."eyes"."0.1.8";
      "isstream-0.1.1" = self.by-version."isstream"."0.1.1";
      "pkginfo-0.3.0" = self.by-version."pkginfo"."0.3.0";
      "stack-trace-0.0.9" = self.by-version."stack-trace"."0.0.9";
    };
    peerDependencies = [];
  };
  by-spec."wordwrap"."0.0.x" =
    self.by-version."wordwrap"."0.0.2";
  by-version."wordwrap"."0.0.2" = self.buildNodePackage {
    name = "wordwrap-0.0.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/wordwrap/-/wordwrap-0.0.2.tgz";
      name = "wordwrap-0.0.2.tgz";
      sha1 = "b79669bb42ecb409f83d583cad52ca17eaa1643f";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."wordwrap"."~0.0.2" =
    self.by-version."wordwrap"."0.0.2";
  by-spec."wrappy"."1" =
    self.by-version."wrappy"."1.0.1";
  by-version."wrappy"."1.0.1" = self.buildNodePackage {
    name = "wrappy-1.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/wrappy/-/wrappy-1.0.1.tgz";
      name = "wrappy-1.0.1.tgz";
      sha1 = "1e65969965ccbc2db4548c6b84a6f2c5aedd4739";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."wrappy"."~1.0.1" =
    self.by-version."wrappy"."1.0.1";
  by-spec."write-file-atomic"."~1.1.0" =
    self.by-version."write-file-atomic"."1.1.0";
  by-version."write-file-atomic"."1.1.0" = self.buildNodePackage {
    name = "write-file-atomic-1.1.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/write-file-atomic/-/write-file-atomic-1.1.0.tgz";
      name = "write-file-atomic-1.1.0.tgz";
      sha1 = "e114cfb8f82188353f98217c5945451c9b4dc060";
    };
    deps = {
      "graceful-fs-3.0.5" = self.by-version."graceful-fs"."3.0.5";
      "slide-1.1.6" = self.by-version."slide"."1.1.6";
    };
    peerDependencies = [];
  };
  by-spec."ws"."0.4.x" =
    self.by-version."ws"."0.4.32";
  by-version."ws"."0.4.32" = self.buildNodePackage {
    name = "ws-0.4.32";
    bin = true;
    src = fetchurl {
      url = "http://registry.npmjs.org/ws/-/ws-0.4.32.tgz";
      name = "ws-0.4.32.tgz";
      sha1 = "787a6154414f3c99ed83c5772153b20feb0cec32";
    };
    deps = {
      "commander-2.1.0" = self.by-version."commander"."2.1.0";
      "nan-1.0.0" = self.by-version."nan"."1.0.0";
      "tinycolor-0.0.1" = self.by-version."tinycolor"."0.0.1";
      "options-0.0.6" = self.by-version."options"."0.0.6";
    };
    peerDependencies = [];
  };
  by-spec."xdg-basedir"."^1.0.0" =
    self.by-version."xdg-basedir"."1.0.1";
  by-version."xdg-basedir"."1.0.1" = self.buildNodePackage {
    name = "xdg-basedir-1.0.1";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/xdg-basedir/-/xdg-basedir-1.0.1.tgz";
      name = "xdg-basedir-1.0.1.tgz";
      sha1 = "14ff8f63a4fdbcb05d5b6eea22b36f3033b9f04e";
    };
    deps = {
      "user-home-1.1.1" = self.by-version."user-home"."1.1.1";
    };
    peerDependencies = [];
  };
  by-spec."xmlhttprequest"."1.4.2" =
    self.by-version."xmlhttprequest"."1.4.2";
  by-version."xmlhttprequest"."1.4.2" = self.buildNodePackage {
    name = "xmlhttprequest-1.4.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/xmlhttprequest/-/xmlhttprequest-1.4.2.tgz";
      name = "xmlhttprequest-1.4.2.tgz";
      sha1 = "01453a1d9bed1e8f172f6495bbf4c8c426321500";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."xtend".">=4.0.0 <4.1.0-0" =
    self.by-version."xtend"."4.0.0";
  by-version."xtend"."4.0.0" = self.buildNodePackage {
    name = "xtend-4.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/xtend/-/xtend-4.0.0.tgz";
      name = "xtend-4.0.0.tgz";
      sha1 = "8bc36ff87aedbe7ce9eaf0bca36b2354a743840f";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."xtend"."^3.0.0" =
    self.by-version."xtend"."3.0.0";
  by-version."xtend"."3.0.0" = self.buildNodePackage {
    name = "xtend-3.0.0";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/xtend/-/xtend-3.0.0.tgz";
      name = "xtend-3.0.0.tgz";
      sha1 = "5cce7407baf642cba7becda568111c493f59665a";
    };
    deps = {
    };
    peerDependencies = [];
  };
  by-spec."xtend"."~2.1.1" =
    self.by-version."xtend"."2.1.2";
  by-version."xtend"."2.1.2" = self.buildNodePackage {
    name = "xtend-2.1.2";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/xtend/-/xtend-2.1.2.tgz";
      name = "xtend-2.1.2.tgz";
      sha1 = "6efecc2a4dad8e6962c4901b337ce7ba87b5d28b";
    };
    deps = {
      "object-keys-0.4.0" = self.by-version."object-keys"."0.4.0";
    };
    peerDependencies = [];
  };
  by-spec."zeparser"."0.0.5" =
    self.by-version."zeparser"."0.0.5";
  by-version."zeparser"."0.0.5" = self.buildNodePackage {
    name = "zeparser-0.0.5";
    bin = false;
    src = fetchurl {
      url = "http://registry.npmjs.org/zeparser/-/zeparser-0.0.5.tgz";
      name = "zeparser-0.0.5.tgz";
      sha1 = "03726561bc268f2e5444f54c665b7fd4a8c029e2";
    };
    deps = {
    };
    peerDependencies = [];
  };
}
