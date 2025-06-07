# Project Title

Positiveo Backend

---

## Requirements

For development, you will only need Node.js and a node global package, Yarn, installed in your environement.

### Node

- #### Node installation on Windows

  Just go on [official Node.js website](https://nodejs.org/) and download the installer.
  Also, be sure to have `git` available in your PATH, `npm` might need it (You can find git [here](https://git-scm.com/)).

- #### Node installation on Ubuntu

  You can install nodejs and npm easily with apt install, just run the following commands.

      $ sudo apt install nodejs
      $ sudo apt install npm

- #### Other Operating Systems
  You can find more information about the installation on the [official Node.js website](https://nodejs.org/) and the [official NPM website](https://npmjs.org/).

If the installation was successful, you should be able to run the following command.

    $ node --version
    v14.15.4

    $ npm --version
    6.14.10

If you need to update `npm`, you can make it using `npm`! Cool right? After running the following command, just open again the command line and be happy.

    $ npm install npm -g

###

### Yarn installation

After installing node, this project will need yarn too, so just run the following command.

      $ npm install -g yarn

---

## Install

    $ git clone https://github.com/sparkplus-positiveo/positiveo-backend-main.git
    $ cd positiveo-backend-main
    $ yarn install

## Configure app

create a `/src/configs/envs/.env` file then edit it with your settings. You will need:
> NOTE: The filed is named depending on the environment you are running.
> if you are running the app in development mode, the file should be `/src/configs/envs/.env.development`.

```
PORT=
MONGO_URI=

V2_MONGO_URI=

AUTH0_CLIENTID=
AUTH0_AUDIENCE=
AUTH0_CLIENT_SECRET=
AUTH0_DOMAIN=
CLOUDINARY_URL=
SENDGRID_API_KEY=
AGORA_APP_ID=
AGORA_APP_CERTIFICATE=
VIDEOSDK_API_KEY=
VIDEOSDK_SECRET_KEY=
VIDEOSDK_API_BASE_URL=

JWT_SECRET=
JWT_EXPIRES_IN=
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=


GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
V2_GOOGLE_CALLBACK_URL=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

ADMIN_EMAIL=

SUPPORT_EMAIL=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_SERVICE_SID=
```


## Running the project for development

    $ yarn start:dev

## Running the project for staging

    $ yarn start:dev

## Simple build for production

    $ yarn start
> This is not meant to be run locally by devs

## Runnning the project using docker.

You will need to first download and install Docker Desktop

Fork/Clone the repo

`Run docker-compose up` to start three containers:

- the MongoDB database container
- the Node.js app container
- the NGINX proxy container
  Server is accessible at http://localhost:8080 if you have Docker Mac. Use http://localhost without specifying the port to hit the NGINX proxy.

# 🚀 Deployment
🔍 Important: Ensure to consult the migration/mongoshell.js file before proceeding with the deployment. This file contains crucial migration scripts that may need to be executed to ensure the consistency and integrity of the database schema and data.

If the instructions within are executed or are no longer needed, kindly update or remove this section to maintain the clarity and accuracy of the deployment documentation.
On Linux, you may need to hit the IP Address of the docker-machine rather than localhost (port rules are the same.)
