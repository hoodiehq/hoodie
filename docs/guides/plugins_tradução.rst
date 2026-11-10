Plugins
=======

Você pode estender seu app de duas maneiras:

1. plugins específicos
2. plugins de terceiros

plugins específicos
~~~~~~~~~~~~~~~~~~~~

Você pode estender o cliente do Hoodie criando o arquivo ``hoodie/client/index.js`` no repositório da sua aplicação; esse arquivo deve exportar um `plugin de cliente do Hoodie <http://docs.hood.ie/en/latest/api/client/hoodie.html#hoodie-plugin>`. Ele será incluído dinamicamente no seu cliente ``/hoodie/client.js``.


Exemplo

.. code:: js

    // /hoodie/client/index.js
    module.exports = function (hoodie) {
      hoodie.hello = function (what) {
        return Promise.resolve('Hello, ' + (what || 'world') + '!')
      }
    }

You can extend your Hoodie’s server routes Você pode estender as rotas de servidor e a API do seu Hoodie criando um arquivo ``hoodie/server/index.js`` no seu aplicativo; esse arquivo deve exportar um `plugin do hapi <https://hapijs.com/tutorials/plugins>`_. Todas as rotas de servidor definidas no plugin receberão o prefixo ``/hoodie/<nome-do-app>``, em que `<nome-do-app>` corresponde ao valor da chave "name" no seu arquivo `package.json`.

Exemplo

.. code:: js

    module.exports.register = register
    module.exports.register.attributes = {
      name: 'hoodie-app-plugin'
    }

    function register (server, options, next) {
      server.route({
        method: 'GET',
        path: '/api',
        handler: function (request, reply) {
          reply('Hello, world!')
        }
      })

      next()
    }

Teste em: http://localhost:8080/hoodie/<app name>/api

plugins de terceiros
~~~~~~~~~~~~~~~~~

Os plugins do Hoodie são `módulos npm <https://www.npmjs.com/search?q=hoodie-plugin->`. Recomendamos adicionar o prefixo ``hoodie-plugin-`` aos nomes dos seus plugins, mas isso não é obrigatório. A estrutura de pastas é a mesma utilizada para plugins específicos de uma aplicação:

.. code:: bash
    ├── package.json
    └── hoodie
        ├── client.js    # or: hoodie/client/index.js
        ├── server.js    # or: hoodie/server/index.js
        └── public
            └── index.html

O plugin de servidor deve poder ser carregado por meio de ``require('hoodie-plugin-foo/hoodie/server')``. Um plugin de servidor do Hoodie é um `plugin do hapi <http://hapijs.com/tutorials/plugins>`_. O plugin de cliente deve poder ser carregado por meio de ``require('hoodie-plugin-foo/hoodie/client')``. Um plugin de cliente do Hoodie pode ser uma função ou um objeto; ele será passado para `hoodie.plugin() <http://docs.hood.ie/en/latest/api/client/hoodie.html#hoodie-plugin>`.
Os plugins do Hoodie podem estender o cliente Hoodie, o servidor Hoodie e fornecer uma interface web (UI) em `/hoodie/<nome do plugin>`. Todos os pontos de extensão são opcionais. A pasta ``hoodie/public`` será disponibilizada em `/hoodie/<nome do plugin>` pelo servidor, caso ela exista. Todas as rotas do servidor terão o prefixo `/hoodie/<nome do plugin>`. 
``<nome do plugin>`` corresponde à propriedade `name` no seu arquivo ``package.json``, mas pode ser substituída pela propriedade ``hoodie.name``.
Após instalar e adicionar um plugin do Hoodie às dependências da sua aplicação, você também precisa ativá-lo, incluindo-o no array ``hoodie.plugins`` dentro do arquivo `package.json` da sua aplicação. Os nomes utilizados devem ser os nomes dos pacotes npm.

.. code:: json
    {
      "name": "my-app",
      ...
      "hoodie": {
        "plugins": ["hoodie-plugin-hello-world"]
      }
    }

A ordem em que os plugins do servidor/cliente são carregados é

1. módulos principais (conta, loja, tarefa) 2. plugins de terceiros (dependências npm)
3. plugins do aplicativo

Como exemplo, vamos dar uma olhada no plugin `"Hello, world!" <https://github.com/hoodiehq/hoodie-plugin-hello-world>`_.
