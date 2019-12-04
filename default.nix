{ stdenv, yarn2nix }:
yarn2nix.mkYarnPackage rec {
    name = "doenet-lrs";
    src = ./.;
    packageJSON = ./package.json;
    yarnLock = ./yarn.lock;
    yarnNix = ./yarn.nix;
    postBuild = ''
      NODE_ENV=production yarn run build
    '';

    meta = with stdenv.lib; {
      description = "Learning record store for Doenet";
      license = licenses.agpl3;
      homepage = "https://github.com/doenet/lrs";
      maintainers = with maintainers; [ kisonecat ];
      platforms = platforms.linux;
    };
}
