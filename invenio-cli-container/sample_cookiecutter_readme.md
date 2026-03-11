## cookiecutter entries
  ```bash
  root@invenio-cli-test:/opt/app-root/data# invenio-cli init rdm
Initializing RDM application...
Running cookiecutter...
You've downloaded /root/.cookiecutters/cookiecutter-invenio-rdm before. Is it okay to delete and re-download it? [y/n] (y): y
  [1/13] project_name (My Site): Atlas
  [2/13] project_shortname (atlas): rdm-app
  [3/13] package_name (atlas): rdm-app
  [4/13] project_site (rdm-app.com): 
  [5/13] author_name (CERN): PNNL
  [6/13] author_email (info@rdm-app.com): zoe@pnnl.gov
  [7/13] year (2026): 
  [8/13] Select database
    1 - postgresql
    Choose from [1] (1): 
  [9/13] Select search
    1 - opensearch2
    Choose from [1] (1): 
  [10/13] Select file_storage
    1 - local
    2 - S3
    Choose from [1/2] (1): 2
  [11/13] Select development_tools
    1 - yes
    2 - no
    Choose from [1/2] (1): 1
  [12/13] Select site_code
    1 - yes
    2 - no
    Choose from [1/2] (1): 1
  [13/13] Select use_reduced_vocabs
    1 - no
    2 - yes
    Choose from [1/2] (1): 2
-------------------------------------------------------------------------------

Generating SSL certificate and private key for testing....
Generating a RSA private key
....................................................................................................................++++
................++++
writing new private key to 'docker/nginx/test.key'
-----
-------------------------------------------------------------------------------
Writing invenio-cli config files...
Creating logs directory...
root@invenio-cli-test:/opt/app-root/data# 
```

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