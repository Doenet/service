{ stdenv, yarn2nix }:
yarn2nix.mkYarnPackage rec {
    name = "doenet-service";
    src = ./.;
    packageJSON = ./package.json;
    yarnLock = ./yarn.lock;
    yarnNix = ./yarn.nix;
    postBuild = ''
      NODE_ENV=production yarn run build
    '';

    postInstall = ''
      mkdir $out/dist
      cp $src/src/iframe/iframe.js $out/dist
    '';

    meta = with stdenv.lib; {
      description = "Doenet web services";
      license = licenses.agpl3;
      homepage = "https://github.com/doenet/service";
      maintainers = with maintainers; [ kisonecat ];
      platforms = platforms.linux;
    };
}
