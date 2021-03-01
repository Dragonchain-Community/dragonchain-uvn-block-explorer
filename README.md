# dragonchain-uvn-block-explorer

Stub:

### Note: do not install on same server as your dragonchain verification node

1. Install nodejs
  - On Windows
    - https://nodejs.org/en/download/
  - On Linux

    ```sudo apt-get install npm```


2. ```git clone``` or download and unzip the block explorer files
3. In git bash or Windows command prompt, navigate to the folder (Example: "cd c/blockexplorer" if you unzipped the file to c:\blockexplorer) with a file named ```server.js```
4. Run ```npm install```
5. Run ```node generate-config.js``` (once)
6. Run ```npm i moment```
7. Run ```node server.js``` (or ```npm start``` for development: will restart the server on every file change)
8. Go to 127.0.0.1:3000 in your browser

Press CTRL+C in the Git Bash or Command Prompt window to end the server process.

## Note for Windows NodeJS users

The processes started by running our server can end up hanging. You can force Windows to kill the process with the following command:

```taskkill /IM node.exe /F``` in a Windows command prompt or

```taskkill -IM node.exe -F``` in Git Bash
