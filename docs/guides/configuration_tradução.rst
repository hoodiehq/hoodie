Configuração
=============

O back-end do seu Hoodie pode ser configurado utilizando opções padrão que fazem parte do seu repositório, bem como por meio de arquivos ocultos, argumentos de linha de comando (CLI) e variáveis ​​de ambiente.

Opções
~~~~~~~

Aqui está uma lista de todas as opções:


+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Option          | Default value                    | CLI argument             | ENV variable             | description                                                                                                                                                     |
+=================+==================================+==========================+==========================+=================================================================================================================================================================+
| address         | ``'127.0.0.1'``                  | ``--address``            | ``hoodie_address``       | Address to which Hoodie binds                                                                                                                                   |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| data            | ``'.hoodie'``                    | ``--data``               | ``hoodie_data``          | Data path                                                                                                                                                       |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| dbUrl           | –                                | ``--dbUrl``              | ``hoodie_dbUrl``         | If provided, uses external CouchDB. Include credentials in `dbUrl`, or use `dbUrlUsername` and `dbUrlPassword`. Sets ``dbAdapter`` to ``pouchdb-adapter-http``  |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| dbUrlUsername   | –                                | ``dbUrlUsername``        | ``hoodie_dbUrlUsername`` | If ``dbUrl`` is set, you can use ``dbUrlUsername`` to set the username to use when making requests to CouchDB                                                   |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| dbUrlPassword   | –                                | ``dbUrlPassword``        | ``hoodie_dbUrlPassword`` | If ``dbUrl`` is set, you can use ``dbUrlPassword`` to set the password to use when making requests to CouchDB                                                   |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| dbAdapter       | ``'pouchdb-adapter-fs'``         | ``--dbAdapter``          | ``hoodie_dbAdapter``     | Sets default `PouchDB adapter <https://pouchdb.com/adapters.html>` unless ``inMemory`` or ``dbUrl`` set                                                         |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| loglevel        | ``'warn'``                       | ``--loglevel``           | ``hoodie_loglevel``      | One of: silent, error, warn, http, info, verbose, silly                                                                                                         |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| inMemory        | ``false``                        | ``-m``, ``--inMemory``   | ``hoodie_inMemory``      | Whether to start the PouchDB Server in memory. Sets ``dbAdapter`` to ``pouchdb-adapter-memory``                                                                 |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| port            | ``8080``                         | ``--port``               | ``hoodie_port``          | Port-number to run the Hoodie App on                                                                                                                            |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| public          | ``'public'``                     | ``--public``             | ``hoodie_public``        | path to static assets                                                                                                                                           |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| url             | -                                | ``--url``                | ``hoodie_url``           | Optional: external URL at which Hoodie Server is accessible (e.g. ``http://myhoodieapp.com``)                                                                   |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| adminPassword   | -                                | ``--adminPassword``      | ``hoodie_adminPassword`` | Password to login to Admin Dashboard. Login is not possible unless set                                                                                          |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| name            | ``package.json``'s name property | ``--name``               | ``hoodie_name``          | Name your application.                                                                                                                                          |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+

Default
--------

As opções padrão são definidas no arquivo ``package.json`` do seu aplicativo, utilizando a chave ``"hoodie"``. Abaixo, segue um exemplo com todas as opções disponíveis e seus respectivos valores padrão.

.. code:: json

    {
      "hoodie": {
        "address": "127.0.0.1",
        "port": 8080,
        "data": ".hoodie",
        "public": "public",
        "dbUrl": "",
        "dbAdapter": "pouchdb-adapter-fs",
        "inMemory": false,
        "loglevel": "warn",
        "url": "",
        "adminPassword": "",
        "name": "my-hoodie-app"
      }
    }

.hoodierc
~~~~~~~~~

O arquivo ``.hoodierc`` pode ser usado para definir configurações ao executar o seu backend do Hoodie nessa pasta. Ele não deve ser incluído no seu repositório (commit). O conteúdo pode estar no formato JSON ou INI. Consulte o pacote `rc no npm <https://www.npmjs.com/package/rc>`__ para mais informações. Argumentos de linha de comando e variáveis ​​de ambiente ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Para passar opções via linha de comando ao iniciar o Hoodie, é necessário separá-las usando ``--``; por exemplo: .. code:: bash $ npm start -- --port=8090 --inMemory Todas as variáveis ​​de ambiente possuem o prefixo ``hoodie_``. Portanto, para definir a porta como ``8090`` e iniciar o Hoodie no modo "em memória" (in-memory), você deve: - definir a variável de ambiente ``hoodie_port`` como ``8090`` - definir a variável de ambiente ``hoodie_inMemory`` como ``true`` A CLI do Hoodie utiliza o pacote `rc <https://www.npmjs.com/package/rc>`__ para o gerenciamento de configurações; assim, as mesmas opções podem ser definidas tanto por meio de variáveis ​​de ambiente quanto por arquivos de configuração. As variáveis ​​de ambiente utilizam o prefixo ``hoodie_``. Prioridade das configurações ~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 1. Argumentos de linha de comando 2. Variáveis ​​de ambiente 3. Arquivos ``.hoodierc`` 4. Configurações padrão da sua aplicação, definidas na chave ``"hoodie"`` dentro do arquivo ``"package.json"`` 5. Valores padrão do Hoodie, conforme apresentados na tabela acima
