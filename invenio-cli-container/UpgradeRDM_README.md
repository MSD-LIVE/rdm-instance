
# STEPS TO UPGRADE RDM
# IMPORTANT!: Old docs alert!
From here down is old documentation that needs to be updated still. New RDM instances using this repo should ignore everything else in this readme.



## Upgrading to new version of RDM
TODO If you just used this container to upgrade RDM for an exising instance you'll need to follow other instructions to come

## 1. Create a new RDM base image
TODO review / finish these docs
1. cd to rdm-base-container repo and make a new folder for this version
    ```bash
    cd rdm-base-container
    mkdir 13.0  # <-- change this to match the version of RDM
    ```
1. Copy over the new Pipfile and Pipfile.lock files from invenio-cli-container to your new folder
1. Copy the 13.0/Dockerfile to your new folder.  You may need to edit the Dockerfile if new
  dependencies are required.
1. Build and push the new image
    ```bash
    cd rdm-base-container
    cd ./build.sh 13.0  # <-- change this to match the version of RDM
    ```
1. Follow it's README to publish a new base image



## 2. Clone invenio source repos to match versions of the latest release
  1. clone this repo: https://github.com/MSD-LIVE/clone-invenio.git
  1. from the container pip list all of the invenio modules
      ```bash
      (app-root) bash-4.2 pip list | grep invenio
      invenio-access              1.4.4
      invenio-accounts            2.0.0
      invenio-admin               1.3.2
      invenio-app                 1.3.4
      invenio-app-rdm             9.1.3
      ...
      ```
  1. copy that list and transform it to the expected json format in clone-invenio/version.json
  1. follow that repo's readme to clone all of invenio's source
## 4. Switch Invenio's react repos
  1. open data/assets/package.json and look at the version listed for each react-invenio-* dependency
  1. from the invenio-src folder created in the step 1 above switch the react-invenio-* repos to the matching major version but the latest minor version


## 5. Upgrade msdlive-rdm-app/assets and msdlive-rdm-app/templates:
  1. In the msdlive-rdm-app/assets, and msdlive-rdm-app/templates folders, find all of the changes marked with MSDLIVE CHANGE NOTES or MSDLIVE CHANGE BEGIN

  2. Determine what invenio repo the file came from by looking at the very top of the file where it should be noted like so:
      ```bash
      {#

      MSDLIVE CHANGE NOTES

      This file was copied and modified from invenio-theme\invenio_theme\templates\semantic-ui\invenio_theme\page.html
      #}
      ```
      Each change we made should be surrounded by start/end comments like so:
      ```bash

      MSDLIVE CHANGE BEGIN
      ...
      MSDLIVE CHANGE END

      ```

  3. Either use pycharm to dif the file in msdlive-rdm-app and the one in invenio's repo OR sometimes its easier to just dif the unchanged RDM newest version against the previous, pulling in changes from the latest version into ours.
## 6. Upgrade msdlive-rdm-app/overrides:
Compare each file in the overrides folder with the ones from the cloned/switched invenio repos and merge in updates


## 7. Upgrade forked repos (invenio-rdm-records and react-invenio-deposit)
see [this readme](/upgradeRdmRecords.md)


## 8. Upgrade msdlive-rdm-app by having it use the new base image
* Edit the Dockerfile to use the latest base image ```FROM ghcr.io/msd-live/rdm-base:9.0```
* Build the new container

```bash
./container.sh clean
./container.sh build
./container.sh start
```

* If there are errors, may need to update additional files and/or msdlive-rdm-contrib repo
https://inveniordm.docs.cern.ch/install/



## 10.  Follow RDM's upgrade instructions
* For example: https://inveniordm.docs.cern.ch/releases/upgrading/upgrade-v9.0/
* Note any commands that start with pipenv you will need to run without the pipenv run part
* You won't need to run any pip uninstall/install command as the newly built image will have all of the current and necessary libraries installed already.
* You won't run any invenio-cli commands as those also will be run in pipenv.  Instead you will have to find what the invenio-cli is doing (usually an 'invenio ' set of commands) and run those instead
* For the Data Migration section instead of running run pipenv run invenio shell do this:
  ```bash
  flask shell /opt/app-root/lib/python3.8/site-packages/invenio_app_rdm/upgrade_scripts/migrate_8_0_to_9_0.py
  ```
TODO: After the new msdlive-rdm-app has been tested locally and verified, then we need to build
a new tag of the dev and prod images, where the tag number should match the rdm version number.
