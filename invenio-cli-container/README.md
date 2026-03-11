# Invenio CLI Container
This repo provides a blank Linux canvas for being able to use invenio's cli to create a new custom RDM application.
You need this when creating an all new RDM instance or when upgrading to a new version of RDM. Its used to scaffold your rdm instance or for upgrading you use it to scaffold a vanilla instance to use for diff'ing the generated files with those from your app.

Use this container to generate the repository template, and then move the template to the
rdm-app folder.



# Upgrading to new version of RDM
TODO - better docs here

## 0: Start up invenio-cli container

```bash
cd invenio-cli-container
docker compose up -d  # this will take a long time the first time because it is building the image

docker exec -it invenio-cli-test bash  #or right-click from vs code containers view and attach a shell
```
## 1. Generate updated assets and python modules
1.  Get the latest version of RDM's assets and python modules by installing a new RDM instance using their cookiecutter. 
    ```bash
    invenio-cli init rdm
    ...
    cd rdm-app 
    pipenv lock  # <-- This can take a long time!
    ```
1. For an all new RDM instance copy the cookie cutter app to the rdm-app folder
    ```bash
    cd invenio-cli-container
    cp -R ..
    ```
1. For local dev container environment, edit the generated docker-compose.yml file that you copied to rdm-app to add volume mounts for postgres and opensearch editing/replacing these sections:
    ```yml
    ...
      db:
        extends:
            file: docker-services.yml
            service: db
        volumes:
            - postgres_data:/var/lib/postgresql/data

    ...
      search:
        extends:
            file: docker-services.yml
            service: search
        volumes:
            - opensearch_data:/usr/share/opensearch/data
    ...
    volumes:
        data:
        postgres_data:
        opensearch_data:
    ```
1. (Optional) Add mailpit to docker-compose.yaml to see emails sent by RDM:
    ```yaml
      mailpit:
        image: axllent/mailpit
        restart: unless-stopped
        ports:
            - "${DOCKER_SERVICES_IP_BIND:-127.0.0.1}:8025:8025"
            - "${DOCKER_SERVICES_IP_BIND:-127.0.0.1}:1025:1025"
        environment:
            MP_MAX_MESSAGES: 5000
            MP_SMTP_AUTH_ACCEPT_ANY: 1
            MP_SMTP_AUTH_ALLOW_INSECURE: 1
    ```
1. Edit the docker-services.yml and find/replace all `restart: "unless-stopped"` lines with `restart: "no"`
1. For an existing RDM instance using the invenio-cli-container for upgrade purposes copy the files to a temp dir and then use a diff editor to compare it with your instance's code (using the older version of RDM) and merge as needed to perform the upgrade.



## 2. Create a new RDM base image
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



## 3. Clone invenio source repos to match versions of the latest release
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


