#!/usr/bin/env python3
"""Adds the lr_engine program to a Cycles source tree (src/app/CMakeLists.txt).

usage: patch_cycles.py <cycles source dir> <literender-engine repo dir>
Idempotent: running it twice changes nothing the second time."""
import os, shutil, sys

cycles, repo = sys.argv[1], sys.argv[2]
app = os.path.join(cycles, 'src', 'app')
shutil.copy(os.path.join(repo, 'src', 'lr_engine.cpp'), os.path.join(app, 'lr_engine.cpp'))
inc = os.path.join(repo, 'third_party').replace('\\', '/')
cm = os.path.join(app, 'CMakeLists.txt')
s = open(cm, encoding='utf-8').read()
marker = '# --- LiteRender engine ---'
if marker not in s:
    s += f'''
{marker}
if(WITH_CYCLES_STANDALONE)
  add_executable(lr_engine lr_engine.cpp)
  target_include_directories(lr_engine PRIVATE "{inc}")
  target_link_libraries(lr_engine PRIVATE ${{LIB}})
  if(DEFINED app_output_dir)
    set_target_properties(lr_engine PROPERTIES RUNTIME_OUTPUT_DIRECTORY "${{app_output_dir}}")
  endif()
  install(TARGETS lr_engine DESTINATION ${{app_install_dir}})
endif()
'''
    open(cm, 'w', encoding='utf-8').write(s)
print('patched', cm)
