#!/bin/bash

echo "Installing nodejs and npm"
echo "==============================================="
sudo aptitude install nodejs
curl http://npmjs.org/install.sh > install_npm.sh
chmod 775 install_npm.sh
sudo ./install_npm.sh
rm install_npm.sh
