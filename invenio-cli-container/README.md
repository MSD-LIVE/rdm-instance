# Invenio CLI Container
This repo provides a blank Linux canvas for being able to use invenio's cli to create a new custom RDM application.
You need this when creating an all new RDM instance or when upgrading to a new version of RDM. Its used to scaffold your rdm instance or for upgrading you use it to scaffold a vanilla instance to use for diff'ing the generated files with those from your app.

Use this container to generate the repository template, and then move the template to the
rdm-app folder.


## 0: Start up invenio-cli container (TODO: try doing this in wsl2 environment which has the cloned rdm-instance)

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
Once done, exit from the container

The below steps needs to be done from the machine that has cloned rdm-instance directory
1. For an all new RDM instance copy the cookie cutter app to the rdm-app folder
    ```bash
    cd <cloned rdm-instance dir>
    cd invenio-cli-container/data
    sudo cp -r rdm-app ../../

    ```
    and also copy these files/folders to the rdm-base-container folder that are used to build the base RDM image used in cloud deployments
    note the foldername should match the RDM version (i.e. 13.0)
    ```bash
    sudo chown -R <current user> rdm-app
    cd rdm-app
    sudo cp .invenio ../../../rdm-base-container/13.0/
    sudo cp .invenio.private ../../../rdm-base-container/13.0/
    sudo cp Pipfile ../../../rdm-base-container/13.0/
    sudo cp Pipfile.lock ../../../rdm-base-container/13.0/
    sudo cp -r docker/uwsgi ../../../rdm-base-container/13.0/
    sudo cp -r site ../../../rdm-base-container/13.0/
    ```
    Last, copy the uwsgi ini that we created to point to the invenio_app to the uwsgi folder:
    ```bash
    cd rdm-base-container
    sudo cp uwsgi.ini ../../../rdm-base-container/13.0/docker/uwsgi/
    ```
   
1. Edit <rdm-instance clonedir>/rdm-app/docker-compose.yml file:
    Add volumes to section db and section search
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
    ```
    Add a new "volumes" at the same level as services
    ```yml
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
1. Edit the <rdm-instance clonedir>/rdm-app/docker-services.yml and find/replace all `restart: "unless-stopped"` lines with `restart: "no"`
1. For an existing RDM instance using the invenio-cli-container for upgrade purposes copy the files to a temp dir and then use a diff editor to compare it with your instance's code (using the older version of RDM) and merge as needed to perform the upgrade.


# Next Steps
Go back to the README.md at the root of this repo to continue following instructions for how to set up your local dev container environment.
