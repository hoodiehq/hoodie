Contributing to Documentation
==========================================

This guide describes how to make changes to Hoodie documentation.  

Make small changes
--------------------

We love small contributions, if you spot small errors or additions please feel free to request a change. Every page on `Hoodie documentation <http://hoodie.readthedocs.io/>`_ has an "Edit on GitHub" button on the top right corner, please use this to make changes. 

Hoodie documentation uses the `reStructuredText <http://docutils.sourceforge.net/docs/ref/rst/restructuredtext.html>`_ format. This may be unfamiliar but provides advanced features which are useful for complex documentation.

The Github editor is very basic, if you need more editing tools try copying and pasting into this online `editor <http://rst.ninjs.org/>`_. You can then click 'commit' and create a 'pull request' on Github. The pull request will be automatically tested for grammar, style and common misspellings. Your changes will then be reviewed by a Hoodie Admin, who may suggest changes. Please read the `Documentation Style Guide <DOCS _STYLE.html>`__ for advice on writing and more info on testing. 

Make big changes
------------------

For big changes, follow the `Contributing to Hoodie guidelines for new contributors <CONTRIBUTING.html#for-new-contributors>`__. This allows you to build and test the documentation locally. For example, adding, moving or updating several documents. The index.rst file in the docs/ folder controls the order in which the documents are displayed on the docs webpages. Remember to update the index file if you have removed, added or want to reorder the documents. 

To build the docs locally, you will need to install `python 2.7+ <https://www.python.org/downloads/>`_

Then install two pip packages: `Sphinx <http://www.sphinx-doc.org/en/stable/>`_ and `sphinx_rtd_theme <https://pypi.python.org/pypi/sphinx_rtd_theme>`_.

 ``sudo pip install sphinx``

 ``sudo pip install sphinx_rtd_theme``

Change directory to ..hoodie/docs/

 ``make html``
|

If you are using windows powershell, note there is a little deviation.

 ``pip install sphinx``

 ``pip install sphinx_rtd_theme``

Before execute the ``make html`` command you have to install `make <http://gnuwin32.sourceforge.net/packages/make.htm>`_ in windows if you are not already done. 
You can also see this Stackoverflow `link <http://stackoverflow.com/questions/12881854/how-to-use-gnu-make-on-windows>`_ for a clear understanding.

Now change directory to ..hoodie/docs/

 ``make html``

|

After building, your updated documents are in the docs/_build/html subdirectory. Click on any .html document, this will open your web browser and the documents will be viewable.

`Get in touch <http://hood.ie/contact/>`_ if you have any questions or want to contribute to Hoodie documentation.





