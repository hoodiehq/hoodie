Guia de coding style
==================

Ver `Contributing to Hoodie <CONTRIBUTING.html>`__ para mais detalhes.

O Hoodie usa o `Standard JavaScript coding style<https://github.com/feross/standard>`__.

Temos três sessões:

-  *Geral*: coding styles that are applicable to all JavaScript code.
-  *Cliente*: coding styles that are only applicable to in-browser code.
-  *Servidor*: coding styles that are only applicable in server code.

*Nota: Cliente e Servidor podem se contradizer, leia com cuidado*.

Geral
-------

Arquivo
~~~~~~~~~~~~~~

Um arquivo JavaScript típico tem esta aparência (sem os comentários). Organize alfabeticamente todos os módulos que você importa via ``require``, dentro de seus respectivos blocos.

.. code:: js

    // If your module exports something, put it on top
    module.exports = myMethod

    // require Node.js core modules in the 1st block (separaeted by empty line).
    // These are modules that come with Node.js and are not listed in package.json.
    // See https://nodejs.org/api/ for a list of Node.js core modules
    var EventEmitter = require('events').EventEmitter
    var util = require('util')

    // In the 2nd block, require all modules listed in package.json
    var async = require('async')
    var lodash = require('lodash')

    // in the 3rd block, require all modules using relative paths
    var helpers = require('./utils/helpers')
    var otherMethod = require('./other-method')

    function myMethod () {
      // code here
    }

Evite "isso" e codigos orientados a objetos.
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Prefira isso:

.. code:: js

    function MyApi (options) {
      var state = {
        foo: options.foo
      }
      return {
        doSomething: doSomething.bind(null, state)
      }
    }

    function doSomething (state) {
      return state.foo ? 'foo!' : 'bar'
    }

No lugar de:

.. code:: js

    function MyApi (options) {
      this.foo = options.foo
    }

    MyApi.prototype.doSomething = function () {
      return this.foo ? 'foo!' : 'bar'
    }

O `bind
method <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind>`__
admite `funções parcialmente aplicadas <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind#Partially_applied_functions_%28currying%29>`__,
Dessa forma, podemos transmitir o estado interno entre diferentes métodos sem expô-lo na API pública. Ao mesmo tempo, conseguimos testar facilmente os diferentes métodos de forma isolada, definindo o estado interno conforme o contexto que desejamos testar.

Pasta
~~~~~~~~~~~~~~~~

Na pasta root, nós temos:

-  ``package.json``
-  ``.gitignore`` (should at least list node\_modules)
-  ``README.md``
-  ``LICENSE`` (Apache License Version 2.0)

Na maioria dos casos, você terá um arquivo ``index.js``, que é indicado no arquivo ``package.json`` por meio da propriedade ``"main"``. Se desejar dividir a lógica em arquivos separados, mova-os para uma pasta chamada ``server/``. Coloque métodos auxiliares reutilizáveis ​​e sem estado (*stateless*) em ``server/utils/``. Para testes, crie uma pasta ``test/``. Caso seu módulo se torne um pouco mais complexo, separe os testes em ``test/unit/`` e ``test/integration/``. Todos os arquivos que contiverem testes devem terminar com o sufixo ``-test.js``.

Misc
~~~~

-  Prefira `lodash <https://lodash.com>`__ ao
   `underscore <http://underscorejs.org>`__.

Cliente
------

Testando
~~~~~~~

Os códigos devem ser testados usando:
`tape <https://www.npmjs.com/package/tape>`__. Nós usamos o tape pelo suporte para o
`browserify <https://www.npmjs.com/package/browserify>`__.

Bibliotecas com submódulos que podem ser requisitados individualmente, como o lodash.
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Para códigos JavaScript executados no lado do cliente, é importante limitar a quantidade de código baixada pelo cliente apenas ao que é realmente necessário. A biblioteca `lodash <https://lodash.com>`__ é uma coleção de utilitários que são úteis tanto individualmente quanto em conjunto. Por exemplo, se você quiser usar a função ``merge`` do lodash, importe-a da seguinte forma:

.. code:: javascript

    var merge = require('lodash/merge')

Se você quiser usar mais de uma função dentro de um mesmo módulo, ou se quiser combinar várias funções para uma única operação, importe o módulo lodash completo:

.. code:: javascript

    var _ = require('lodash')

Se vários módulos utilizarem a mesma função do lodash, nossa ferramenta de empacotamento para frontend (`browserify.org`) agirá da forma correta, incluindo esse código apenas uma vez.

Servidor
------

Testando
~~~~~~~

O código do servidor deve ser testado com:
`tap <https://www.npmjs.com/package/tap>`__.

Bibliotecas com submódulos que podem ser requisitados individualmente, como o lodash.
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Para código executado no servidor, é importante carregar a quantidade mínima de código na memória. No servidor, importe a biblioteca completa; por exemplo:

.. code:: javascript

    var _ = require('lodash')

    var c = _.merge(a, b)

Dessa forma, todo o nosso código de servidor carregará apenas uma única instância do lodash na memória.
