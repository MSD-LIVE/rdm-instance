
## Getting started

1. Clone this repo
1. Change into the repo directory
1. Start up Visual Studio Code or PyCharm
1. ctrl+shift+p -> dev containers: open workspace in container ... then select rdm-app/rdm-dev.code-workspace. ignore 'workspace could fail because it contains absolute paths...' AND !IMPORTANT! be sure to NOT be on VPN or container will fail to build
1. Wait for the Docker image to build and start up, this could take a while if its the first time building the devcontainer. You can click on the 'show log' notification in the bottom right of VS Code to monitor progress. You might see an error message open at the bottom right, "default interpreter path '/root/.local/share/virtualenvs/rdm-venv/bin/python' could not be resolved: Could not resolve interpreter path '/root/.local/share/virtualenvs/rdm-venv/bin/python" but its because the workspace was opened before the venv got created. If you see this wait until the dev container completely finishes building then close and re-open it.
1. Go to the output view in VS code and select RDM Assets builder from the drop down.

## Developing

1. ctrl+shift+p -> dev containers: open workspace in container -> rdm-app/rdm-dev.code-workspace
1. Run the "RDM App Debugger (py and worker)" debug config from VS Code's debugger
1. Visit the running application at <https://127.0.0.1:5000>
1. Emails that are sent can be viewed via the mailhog web interface at: http://127.0.0.1:8025/ if configured (see Adding Email Services section below)
1. Go to the output view in VS code and select 'RDM Assets and overrides watch' from the drop down to make sure asset and js changes trigger RDM's build scripts. If you see an error that is not caused by your own bad code, try these 2 easy things first:
    - ctrl+shift+p -> 'restart asset watcher' command 
    - ctrl+shift+p -> dev containers: rebuild container

## Scripts/Commands you might need to run:

1. (old way) If a new file is placed in the assets folder they won't be symlinked like the others and you'll see 'not found' errors in the assets watcher proccess. To resolve this run `invenio-cli assets build`
1. (new way) This workspace comes pre-installed with a custom extension that watches for new assets and automatically runs the invenio-cli assets build command. You'll see when it runs in VS Code's output view. Neither chatgpt nor copilot had the right config for including a custom extension in the devcontainer using it's source (.vsix) but this article has extensive documentation about it we can use later if we get fancier with our extensions: https://www.kenmuse.com/blog/implementing-private-vs-code-extensions-for-dev-containers/

In order to create an admin account, run the following command:

```bash
pipenv run invenio users create username@example.com --password password --active --confirm
pipenv run invenio users create zoe@pnnl.gov --password password --active --confirm
pipenv run invenio users create noompy@pnnl.gov --password password --active --confirm
pipenv run invenio access allow administration-access user username@example.com
pipenv run invenio access allow superuser-access user username@example.com
```

To wipe RDM instance's data, cache, indexes, etc, delete the .invenio.private file before starting the dev container. Or, from a running devcontainer run:
invenio-cli services destroy

to wipe all data and rebootstrap:
invenio-cli services setup -N -f

if you want to completely wipe your dev container and all RDM data, from the dev container:

1. delete the .invenio.private file
2. compose down all of the rdm-app containers
3. delete all volumes
   4a. tested: close the dev container, look for a container named vsc-rdm-app with a volume mount that matches this workspace and delete it
   4b. should work the same as 4a: ctrl+shift+p dev containers: rebuild container

developers resources:
http://localhost:5601/ is opensearch dashboard. Haven't figured out how best to use that yet but http://localhost:5601/app/dev_tools will get you to the console to execute ES searches on

http://127.0.0.1:5050/ is pgadmin to use to browse RDM's database directly

To compare our branch against invenio's source of the same tag:
https://github.com/inveniosoftware/invenio-rdm-records/compare/v19.5.11...MSD-LIVE:invenio-rdm-records-v13:v19.5.11-branch

https://github.com/inveniosoftware/invenio-app-rdm/compare/v13.0.5...MSD-LIVE:invenio-app-rdm:v13.0.5-branch

TODO:
Had to do this to get prettier formatting hooked up to vs code:
cd /workspaces/rdm-instance/invenio-rdm-records-v13
npm install --save-dev @inveniosoftware/eslint-config-invenio

after editing a js file ctrl+shift+p format with prettier



## Adding Email Services
Edit the docker-compose.yaml in rdm-app to add the following and copy/paste .env.default to .env then restart your dev container to see emails that would be sent:
```bash
  # MSD-LIVE addition: Mailpit for email testing
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

## Re: VS Code extension
This workspace comes pre-installed with a custom VS Code extension that watches for new assets and automatically runs the invenio-cli assets build command. You'll see when it runs in VS Code's output view. Neither chatgpt nor copilot had the right config for including a custom extension in the devcontainer using it's source (.vsix) but this article has extensive documentation about it we can use later if we get fancier with our extensions: https://www.kenmuse.com/blog/implementing-private-vs-code-extensions-for-dev-containers/