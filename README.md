# New RDM instances:

Brand new instances of RDM can use this repo to help them create:
1. A base/vanilla RDM Docker image to be extended for production use (MSD-LIVE uses as it's base image for deploying to AWS Fargate ECS service)
2. A cookie cutter RDM instance including (importantly) a Pipfile and Pipfile.lock: these are used in the base image when deploying to production environments as well as copied to developers environments to ensure package versions match.
2. A devcontainer that runs all RDM services locally and the RDM instance created from the cookie cutter

# Folder overview:

### invenio-cli-container
Contains a Dockerfile and docker-compose.yml used as a blank Linux canvas for being able to use invenio's cli to create a new custom RDM application. You will also need this when upgrading to a new version of RDM so that you can create a vanilla RDM app from cookiecutter and diff the generated files with those from your instance.

### rdm-app
Where the files created with the invenio-cli-container get copied to for new RDM instances. Later when using the invenio-cli-container for upgrading RDM the new upgraded RDM files will need to be copied to a temp dir and then diff'd with the ones in this folder.

Also contains all of the necessary devcontainer config and custom vs code extension code that is used when running RDM instances locally in order to develop custom code or test changes made to RDM's config.

### rdm-base-container
Where the files created with the invenio-cli-container get copied to that are needed for deployment to AWS.

### overrides
Included in the devcontainer and is how RDM (and other packages') code can be overwritten when RDM does not expose a config option and you do not wish to create a fork of the repo to apply the cusomizations to.

### forked-rdm-repos
After forking an rdm repo into your own org this is where it will reside as a git submodule. These repos will be included in the devcontainer and installed into RDM as editable modules.

# New RDM instances:
1. Create a repo that is a copy or fork of this one
2. Optional: rename 'rdm-app' to the name of your RDM app, i.e. rdm-app, but once you do be sure to find/replace all occurrences of rdm-app in this repo and in the docs.
3. cd into invenio-cli-container and follow the instructions in the invenio-cli-container's README.md to get a cookiecutter of an RDM app and the Pipfile and Pipfile.lock files generated
4. Follow the instructions in the DevContainerREADME.md to create a local environment to develop your RDM instance in.
5. Follow the instructions in the rdm-base-container's README.md to create a base Docker image that will be extended to build the image deployed to AWS as an ECS Fargate service.  CDK Code is in another repo: https://github.com/MSD-LIVE/deployment and the base image is used in the deployment's Dockerfile here: https://github.com/MSD-LIVE/deployment/blob/dev/rdm/docker/Dockerfile

## Customizing RDM via forking their repo:
1. In the running devcontainer pip list the invenio module you want to fork to get it's exact version
2. create a fork of that repo in your own org
3. clone the fork, switch to the tag matching the version from step 1
4. create a branch in your fork and name it {tag_name}-branch using the tag for the tag_name, push that to git
5. create a submodule of your forked repo and place it in forked-rdm-repos
Note: submodules only track commits from their source repos so you will make edits to the branch of your fork and push those edits via the submodule support from VS code
6. Add the forked repo as a folder in your vs code workspace file for your dev container. Edit rdm-app/rdm-dev.code-workspace. For example if you fork invenio-rdm-records make these edits:
```
 "folders": [
...
{
    // Have to have forked/submodule repos added to multi-root workspace in order for their .vscode/settings.json to be respected
    "path": "/workspaces/rdm-instance/forked-rdm-repos/invenio-rdm-records",
    "name": "invenio-rdm-records"
},
...
 ]
...
"settings": {
...
"python.analysis.extraPaths": [
    "/root/.local/share/virtualenvs/rdm-venv/lib/python3.12/site-packages",
    "/workspaces/rdm-instance/forked-rdm-repos/invenio-rdm-records",
],
...
}
...
```
7. Edit the dev containers setup-services.sh to include the forked repo as a safe.directory, and install it as an editable package. Find and uncomment out these lines in rdm-app/setup-services.sh, updating it with the repo you forked:
```bash
git config --global --add safe.directory /workspaces/rdm-instance/forked-rdm-repos/invenio-rdm-records
...
pipenv run invenio-cli packages install  /workspaces/rdm-instance/forked-rdm-repos/invenio-rdm-records
```



# Existing RDM instances:
Documentation TODO


# Upgrading RDM for Existing RDM instances:
Documentation TODO