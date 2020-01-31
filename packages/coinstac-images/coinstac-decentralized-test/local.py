#!/usr/bin/python

import sys
import json
import time

doc = json.loads(sys.stdin.read())

if 'timeoutUser' in doc['input']:
    doc['cache']['timeoutUser'] = doc['input']['timeoutUser']

if ('timeoutUser' in doc['cache']
and doc['cache']['timeoutUser'] == doc['state']['clientId']
and doc['state']['iteration'] == 2):
    time.sleep(20)

if 'start' in doc['input']:
    sum = doc['input']['start']
else:
    sum = doc['input']['sums'][doc['state']['clientId']]['sum'] + 1

output = { 'output': { 'sum': sum }, 'cache': doc['cache'] }
sys.stdout.write(json.dumps(output))
