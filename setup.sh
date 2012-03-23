echo "Installing GCC"
echo "==============================================="
sudo apt-get install gcc

echo "Installing nodejs"
echo "==============================================="
mkdir ~/node-install
cd ~/node-install
curl -O http://nodejs.org/dist/node-v0.6.13.tar.gz

tar xvf node-v0.6.13.tar.gz
cd node-v0.6.13

./configure
sudo make install

echo "Installing npm"
echo "==============================================="
curl http://npmjs.org/install.sh | sudo sh