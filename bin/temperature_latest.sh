#!/bin/bash

/usr/bin/tail -1 $1 | awk '{printf "%s",$2}'
