#!/bin/bash

echo "Installing nodejs, npm, and less"
echo "==============================================="
sudo aptitude install nodejs
curl http://npmjs.org/install.sh > install_npm.sh
chmod 775 install_npm.sh
sudo ./install_npm.sh
rm install_npm.sh
npm install less

echo "Installing python virutal environment for build"
echo "==============================================="
sudo aptitude install virtualenvwrapper
rm -rf ve
virtualenv ve

source ve/bin/activate
pip install jinja2 --upgrade