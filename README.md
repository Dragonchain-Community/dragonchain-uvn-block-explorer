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
5. Run ```node generate-config.js```
6. Run ```node server.js``` (or ```npm start``` for development: will restart the server on every file change)
7. Go to 127.0.0.1:3000 in your browser
