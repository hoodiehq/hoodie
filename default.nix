{ pkgs ? import <nixpkgs> {}
}:

let 

  inherit (pkgs) buildEnv;
  inherit (pkgs.lib) concatStringsSep;
  inherit (pkgs.stdenv) mkDerivation;

  nodePackages = {
    buildNodePackage = pkgs.nodePackages.buildNodePackage;
  } // import ./package.nix {
    inherit (pkgs) fetchurl fetchgit lib;
    self = nodePackages;
  };

  nodePackagesTopLevel = builtins.filter (x: !builtins.elem x [
    "buildNodePackage" "by-spec" "by-version" "nativeDeps" "patchLatest" "patchSource"
  ]) (builtins.attrNames nodePackages);

  nodePackagesPaths = map
    (x: nodePackages."${x}" + "/lib/node_modules/" + x) nodePackagesTopLevel;


in mkDerivation {
  name = "hoodie-js";
  buildInputs = [
    pkgs.nodejs
  ];
}
