# dragonchain-uvn-block-explorer

Stub:

### Note: do not install on same server as your dragonchain verification node

1. Install nodejs
  - On Windows
    - https://nodejs.org/en/download/
  - On Linux

    ```sudo apt-get install npm```
  
2. Create your credentials file
  - On Windows:
    1. Go to %LOCALAPPDATA% in File Explorer
    2. Create a ```dragonchain``` folder
    3. Create a file named ```credentials```    
*Go to the View tab, then make sure "File name extensions" is **checked** to be sure you can create the credentials file without an extension like ".txt"*
  - On Linux:
    1. ```mkdir ~/.dragonchain && nano ~/.dragonchain/credentials```    
3. In the credentials file, paste the following:
  ```
  [default]
  dragonchain_id = YOUR PUBLIC ID

  [YOUR PUBLIC ID]
  auth_key_id = YOUR HMAC_ID
  auth_key = YOUR HMAC_KEY
  endpoint = YOUR DRAGONCHAIN_ENDPOINT WITH PORT NUMBER (example: http://12.34.56.78:30000)
  ```
  
  - Replace the CAPITAL fields with your information
  
4. ```git clone``` or download and unzip
5. In Git Bash or a Windows command prompt, navigate to the folder (Example: "cd c/blockexplorer" if you unzipped the file to c:\blockexplorer) with a file named ```server.js```
6. Run ```npm install```
7. Run ```node server.js``` (or ```npm start``` for development: will restart the server on every file change)
8. Go to 127.0.0.1:3000 in your browser

Press CTRL+C in the Git Bash or Command Prompt window to end the server process.

## Note for Windows NodeJS users

The processes started by running our server can end up hanging. You can force Windows to kill the process with the following command:

```taskkill /IM node.exe /F``` in a Windows command prompt or

```taskkill -IM node.exe -F``` in Git Bash
