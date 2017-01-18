## Installation

Install the Raspberry Pi Pre-requisites first, then:

```bash
git https://github.com/drweaver/heating-control.git
cd heating-control
npm install
```

## Configuration

Modify the following files with your specifics:

* `etc/schedule.json`
* `etc/pubnub.json`
* `etc/gpio.json`

## Electronics

TODO

### Raspberry Pi Pre-requisites

#### Node

```bash
wget https://nodejs.org/dist/v6.9.4/node-v6.9.4-linux-armv6l.tar.xz
tar xf node-v6.9.4-linux-armv6l.tar.xz
sudo mkdir /opt/node
sudo cp -r node-v6.9.4-linux-armv6l/* /opt/node
rm -rf node-v6.9.4-linux-armv6l.tar.xz*
sudo nano /etc/profile
```
paste in:
```
NODE_JS_HOME="/opt/node"
PATH="$PATH:$NODE_JS_HOME/bin"
export PATH
```

Log out and back in and try node -v, it should give v6.9.4.

## Wiring-Pi & gpio command

```bash
sudo apt-get install wiringpi
```


