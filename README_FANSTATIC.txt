pyramid_fanstatic installation
==============================

To finalize your installation you'll need to follow those steps.

Add those line the ``app:main`` section of your development.ini::

    [app:main]

    fanstatic.bottom = true
    fanstatic.debug = true

Add some requirements to your setup.py::


    requires = ['pyramid', 'pyramid_debugtoolbar',
                'pyramid_fanstatic',
                # if you want to use lesscss
                #'js.lesscss'
                ]


Also add those entry points to the same file::

      # Fanstatic resource library
      [fanstatic.libraries]
      m4ed = m4ed.resources:library

      # A console script to serve the application and monitor static resources
      [console_scripts]
      pserve-fanstatic = m4ed.resources:pserve

You also need to add pyramid_fanstatic tween to your applition. Add the
following to your __init__.py file::

    config.include('pyramid_fanstatic')

Run ``python setup.py develop`` to get the ``pserve-fanstatic`` script
available.
