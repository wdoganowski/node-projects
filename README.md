# node-projects

This is a Raspberry Pi based home automation software. It includes two main parts:

* Interface to Nexwell Nexo home automation system (http://www.nexwell.eu/system-nexo/o-systemie)
* Javascript based home automation engine

The purpose of this project is to drive the Nexo system from JS on RPi instead of using Nexo's difficoult UI.

I'm planning to create two node modules out of it... but in future ;-)

## Installation

### Install Raspbian

```
sudo dd bs=1m if=~/Downloads/2015-05-05-raspbian-wheezy.img of=/dev/rdisk5
```
Go for coffee.
Boot up RPi and ssh to it.

### Resize the root partition

Open the PI’s configuration screen (in the terminal window) by typing:
```bash
sudo raspi-config
```
Run the bottom option just to make sure you have the latest version of the configuration software:
**8 Advanced Options /  A0 Update**
Run the second option:
**1 Expand Filesystem**
Click:
**Finish**
On question _Would you like to reboot now?_ answer
**Yes**

### Update packages

```bash
sudo apt-get update
sudo apt-get upgrade --yes
```
Get another coffee.

### Install node.js and npm

This should work, but does not:

This is from http://conoroneill.net/download-compiled-version-of-nodejs-0120-stable-for-raspberry-pi-here to avoid compiling from source:

```bash
wget https://s3-eu-west-1.amazonaws.com/conoroneill.net/wp-content/uploads/2015/02/node-v0.12.0-linux-arm-pi.tar.gz
tar -zxvf node-v0.12.0-linux-arm-pi.tar.gz
cd node-v0.12.0-linux-arm-pi
sudo reboot
```

### Download packages

```bash
cd ~
mkdir git
cd git
git clone https://github.com/wdoganowski/node-projects.git
git clone https://github.com/wdoganowski/hommy_start_scripts.git
```

### Fix dependecies

As long as the packages are not prepared correctly it is partially manual process:

```bash
cd ~/git/node-projects/nexo_proxy
npm install
cd ~/git/node-projects/hommy
npm install
```

### Install startup scripts

```bash
cd ~/git/hommy_start_scripts
./install
```

## Verification

```bash
sudo /etc/init.d/nexod start
  starting nexo-proxy deamon /home/pi/git/node-projects/nexo_proxy/proxy.js
  nohup: redirecting stderr to stdout
  . ok
sudo /etc/init.d/nexod status
  root      2604     1  2604  4    1 20:38 pts/0    00:00:02 node /home/pi/git/node-projects/nexo_proxy/proxy.js
  root      2629  2626  2629  0    1 20:39 pts/0    00:00:00 grep 2604
  . ok
sudo /etc/init.d/hommyd start
  starting hommy deamon /home/pi/git/node-projects/hommy/hommy.js
  nohup: redirecting stderr to stdout
  . ok
sudo /etc/init.d/hommyd status
  root      2653     1  2653 20    5 20:41 pts/0    00:00:05 node /home/pi/git/node-projects/hommy/hommy.js
  root      2653     1  2672  0    5 20:41 pts/0    00:00:00 node /home/pi/git/node-projects/hommy/hommy.js
  root      2653     1  2673  0    5 20:41 pts/0    00:00:00 node /home/pi/git/node-projects/hommy/hommy.js
  root      2653     1  2674  0    5 20:41 pts/0    00:00:00 node /home/pi/git/node-projects/hommy/hommy.js
  root      2653     1  2675  0    5 20:41 pts/0    00:00:00 node /home/pi/git/node-projects/hommy/hommy.js
  root      2671  2653  2671  0    1 20:41 pts/0    00:00:00 ping -n 192.168.0.194
  root      2683  2679  2683  0    1 20:41 pts/0    00:00:00 grep 2653
  . ok
tail -f /var/log/hommy.log /var/log/nexo_proxy.log
```

## Notes

Push your updates to git. Remeber to set-up:
```bash
git config --global user.email "you@example.com"
git config --global user.name "Your Name"
```

Remeber, when adding packages use command:
```bash
npm install _package_ --save
```
This will update the package.json with proper dependencies
