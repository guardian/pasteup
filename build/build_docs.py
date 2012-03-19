#!/usr/bin/env python

import os

from jinja2 import Environment, FileSystemLoader

env = Environment(loader=FileSystemLoader('templates'))
base_template = env.get_template('base.html')

modules = []

for file in os.listdir('../content/module'):

	f = open('../content/module/' + file, 'r')
	module = {}
	module['name'] = file
	module['code'] = ''.join(f.readlines())
	f.close()

	modules.append(module)

output = base_template.render(modules=modules)

mod_file = open('../docs/modules.html', 'w')
mod_file.write(output)
mod_file.close()










