## Installation

Install the Raspberry Pi Pre-requisites first, then:

```bash
git https://github.com/drweaver/heating-control.git
cd heating-control
npm install
```

### Raspberry Pi Pre-requisites

#### Node

```bash
wget http://nodejs.org/dist/v0.10.28/node-v0.10.28-linux-arm-pi.tar.gz
tar xvf node-v0.10.28-linux-arm-pi.tar.gz
sudo mkdir /opt/node
sudo cp -r node-v0.10.28-linux-arm-pi/* /opt/node
rm -rf node-v0.10.28-linux-arm-pi*
sudo nano /etc/profile
```
paste in:
```
NODE_JS_HOME="/opt/node"
PATH="$PATH:$NODE_JS_HOME/bin"
export PATH
```

Log out and back in and try node -v, it should give v0.10.28.

## Wiring-Pi & gpio command

```bash
sudo apt-get install wiringpi
```


