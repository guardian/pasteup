#!/usr/bin/env python

# build_docs.py - Builds individual Pasteup module files into one HTML page.

import os
import sys

try:
    from jinja2 import Environment, FileSystemLoader
except ImportError:
    print "Cannot find jinja2 templating. Install with pip install jinja2."
    sys.exit()

# Assumes we're running in /build. We'll bail out somewhere if not.
TEMPLATE_DIR = 'templates'
MODULE_DIR = '../content/module/'
MODULE_LIB = '../docs/modules.html'
MODULE_PAGES_DIR = '../docs/modules/'

def build_module_library():

    try:
        env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))
        base_template = env.get_template('library.html')
    except:
        print "Cannot find template. Are you running script from /build?"

    modules = []
    for file in os.listdir(MODULE_DIR):
        f = open(MODULE_DIR + file, 'r')
        modules.append({
            'name': file,
            'code': ''.join(f.readlines())
        })
        f.close()

    output = base_template.render(modules=modules)

    mod_file = open(MODULE_LIB, 'w')
    mod_file.write(output)
    mod_file.close()

def build_module_pages():

    try:
        env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))
        module_template = env.get_template('module.html')
    except:
        print "Cannot find template. Are you running script from /build?"

    for file in os.listdir(MODULE_DIR):
        f = open(MODULE_DIR + file, 'r')
        module = {
            'name': file,
            'code': ''.join(f.readlines())
        }
        output = module_template.render(module=module)
        mod_file = open(MODULE_PAGES_DIR + file, 'w')
        mod_file.write(output)
        mod_file.close()


if __name__ == '__main__': 
    # TODO: Add command line option to build individual files as well.
    build_module_library()
    #build_module_pages()
