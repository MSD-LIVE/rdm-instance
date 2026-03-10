


## Run cookiecutter in dev container environment
  ```bash
  # Run cookiecutter
  invenio-cli init rdm -c v9.1 # <--- Change the version number to the version you are upgrading to

    Initializing RDM application...
    Running cookiecutter...
    project_name [My Site]: rdm-app
    project_shortname [rdm-app]:
    project_site [rdm-app.com]: data.msdlive.org
    github_repo [rdm-app/rdm-app]: MSD-LIVE/rdm-app
    description [rdm-app InvenioRDM Instance]:
    author_name [CERN]:
    author_email [info@data.msdlive.org]:
    year [2022]:
    Select python_version:
    1 - 3.8
    2 - 3.7
    3 - 3.9
    Choose from 1, 2, 3 [1]:
    Select database:
    1 - postgresql
    Choose from 1 [1]:
    Select elasticsearch:
    1 - 7
    Choose from 1 [1]:
    Select file_storage:
    1 - local
    2 - S3
    Choose from 1, 2 [1]: 2
    Select development_tools:
    1 - yes
    2 - no
    Choose from 1, 2 [1]:
    -------------------------------------------------------------------------------
    
    Generating SSL certificate and private key for testing....
    Generating a 4096 bit RSA private key
    ........++
    ..................................................................................................................................++
    writing new private key to 'docker/nginx/test.key'
    -----
    -------------------------------------------------------------------------------
    Writing invenio-invenio_cli config file...
    Creating logs directory...

  # Generate the Pipfile.lock file so we can diff it
  cd rdm-app  # <-- must be run from created project folder
  pipenv lock
  
  # Copy all the js and css assets from underlying python modules in site-packages
  # to the assets folder so we can diff them
  pipenv install --deploy --system --pre
  export FLASK_ENV=production  # <-- Make sure the environment is prod so 'invenio collect' won't create symlinks to files
  export INVENIO_INSTANCE_PATH=/opt/app-root/data/rdm-app
  invenio webpack create
  ```
* Copy over the Pipfile and Pipfile.lock files                                                                                                                                                                                                                                                                                          
* Compare generated cookiecutter repo with rdm-app.  Specifically comparing config files and container environment vars to make sure nothing changed.
  * Ignore .invenio and .invenio.private since any changes cookie cutter adds won’t be used
  * Need to compare all the files in assets to the corresponding repo tag in invenio source
  * Ignore static folder
  * Need to compare all the files in templates to the corresponding repo tag in invenio source
  * Ignore uwsgi
* Create a new branch with the same name as the rdm version (e.g., rdm-8.0) and push these changes