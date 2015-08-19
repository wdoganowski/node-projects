# node-projects

This is a Raspberry Pi based home automation software. It includes two main parts: 

* Interface to Nexwell Nexo home automation system (http://www.nexwell.eu/system-nexo/o-systemie)
* Javascript based home automation engine

The purpose of this project is to drive the Nexo system from JS on RPi instead of using Nexo's difficoult UI.

## Installation

1. Install Raspbian

```bsh
sudo dd bs=1m if=~/Downloads/2015-05-05-raspbian-wheezy.img of=/dev/rdisk5
```

2. Boot RPi

3. Resize the root partition

open the PI’s configuration screen (in the terminal window) by typing:
```bsh
sudo raspi-config
```
run the bottom option just to make sure you have the latest version of the configuration software:
```bsh
update
```
run the second option:
```
expand_rootfs
```
click:
```
Finish
```
select ‘YES‘ when it asks for a reboot

