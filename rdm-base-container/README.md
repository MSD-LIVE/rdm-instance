# RDM Base Container

This repository contains the files to build a vanilla Invenio RDM image with just the Python dependencies installed and no application configured.

# Where these files came from
See the readme in rdm-instance/invenio-cli-container, search for 'rdm-base-container'

# Log into GitHub container registry (ghcr)

We are pushing the RDM base image to GitHub instead of DockerHub so that any member of the MSD-LIVE org will be able to run the build. You will need to follow these instructions to log into the container registry so that Docker commands will work.

See this link for full instructions: https://nikiforovall.github.io/docker/2020/09/19/publish-package-to-ghcr.html

1. Create a GitHub personal access token.

   You can get one from here: https://github.com/settings/tokens. Make sure that when creating the token, you check the boxes to enable permissions on the github packages, which is what gives you access to the container regitry:

   ```yaml
   write:packages Upload packages to GitHub Package Registry read:packages Download packages from GitHub Package Registry delete:packages Delete packages from GitHub Package Registry
   ```

   Note that you can only copy your access token one time when it is first created. If you can't remember it, you need to create a new one, so you might want to store it somewhere you won't forget it, like in an encrypted email.

1. Run this from your command line to log in:
   ```bash
   export CR_PAT=COPY_AND_PASTE_YOUR_PERSONAL_ACCESS_TOKEN_HERE
   echo $CR_PAT | docker login ghcr.io -u GITHUB_USERNAME --password-stdin
   ```

# Run the build

This repo contains folders for each version of RDM that we support. You just need the RDM version as a parameter. Run this from the same terminal where you logged into ghcr:

```bash
./build.sh VERSION

# for example
./build.sh 8.0
```
