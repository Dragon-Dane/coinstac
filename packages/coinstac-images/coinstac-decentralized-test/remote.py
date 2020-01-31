#!/usr/bin/python

import sys
import json

success = False
doc = json.loads(sys.stdin.read())
for site, output in doc['input'].items():
    doc['input'][site]['sum'] = doc['input'][site]['sum'] + 1;
    if doc['input'][site]['sum'] > 4:
        success = True


output = { "output": { "sums": doc['input'], "deadClients": doc['state']['deadClients'] }, "success": success }
sys.stdout.write(json.dumps(output))
