Quickstart
==========

Neste guia, você aprenderá a criar um aplicativo de demonstração com o Hoodie, conhecerá a estrutura básica de um projeto Hoodie e suas pastas, os endpoints e as URLs do aplicativo, além de aprender a incluir e utilizar a biblioteca Hoodie em seu projeto.

|Remix on Glitch|

.. |Remix on Glitch| image:: https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg
   :target: https://glitch.com/edit/#!/remix/hoodie

Pré-requisitos 
~~~~~~~~~~~~~

For all operating systems, you’ll need Para todos os sistemas operacionais, você precisará ter o Node.js instalado. Você pode baixar o Node em `nodejs.org`_. Recomendamos a versão LTS (Suporte de Longo Prazo). 

Certifique-se de ter a versão 4 ou superior. Você pode verificar com

.. code:: bash

    $ node -v

Criando um novo backend 
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Primeiro, você precisa criar uma nova pasta; vamos chamá-la de **testapp**

.. code:: bash

    $ mkdir testapp

Acesse o diretório ``testapp``.

.. code:: bash

    $ cd testapp

Agora precisamos criar um arquivo **package.json**. Para isso, podemos usar o `npm`, que já vem incluído no Node por padrão. Ele fará algumas perguntas; você pode simplesmente pressionar Enter para manter os valores padrão.

.. code:: bash

    $ npm init -y

Agora podemos instalar o **hoodie** usando o npm

.. code:: bash

    $ npm install hoodie --save

O arquivo **package.json** resultante, na pasta atual, deve ser mais ou menos assim:

.. code:: json

    {
      "name": "testapp",
      "version": "1.0.0",
      "description": "",
      "main": "index.js",
      "scripts": {
        "start": "hoodie",
        "test": "echo \"Error: no test specified\" && exit 1"
      },
      "keywords": [],
      "author": "",
      "license": "ISC",
      "dependencies": {
        "hoodie": "^28.2.10"
      }
    }

Agora, você pode iniciar o hoodie com:

.. code:: bash

    $ npm start

Ótimo, seu backend do Hoodie iniciou e agora está mostrando o URL de acesso. Por padrão, é http://127.0.0.1:8080.

Parabéns, você acabou de criar seu primeiro backend do Hoodie :) Agora você pode carregar o cliente do Hoodie em qualquer site com

.. code:: html

    <script src="http://127.0.0.1:8080/hoodie/client.js"></script>

You can also create a arquivo :code:`public/index.html`, que será disponibilizado em http://127.0.0.1:8080 após você reiniciar o servidor. Todos os recursos na pasta :code:`public` — como imagens, arquivos CSS ou arquivos JavaScript — serão disponibilizados pelo seu Hoodie Backend em :code:`http://127.0.0.1:8080/<caminho/para/seu/arquivo.ext>`. 

Se você quiser apenas fazer um teste, pode copiar o conteúdo de https://raw.githubusercontent.com/gr2m/sweet.la/master/public/index.html para o seu arquivo :code:`index.html`. (Este código foi criado para apresentar o Hoodie em um evento; você pode conferir a apresentação em https://www.youtube.com/watch?v=TSDyxtVbbME&t=1272s)
Abra o console e tente:

.. code:: bash

    hoodie


Ou:

.. code:: bash

    hoodie.account.signUp({username: 'foo', password: 'secret'})


Agora, faça um teste utilizando-o offline e, em seguida, online. Você também pode abrir um segundo navegador (no modo anônimo) e observar as alterações sendo replicadas.



Nota para npm v2
---------------

Devido à forma como o npm v2 instala subdependências, o cliente do Hoodie não pode ser empacotado. Como solução alternativa, basta instalar o ``pouchdb-browser`` e o ``@hoodie/client`` como dependências da sua aplicação Hoodie.

.. code:: bash

    $ npm install --save pouchdb-browser @hoodie/client

E agora?
~~~~~~~~~~~~

Nosso `Hoodie Tracker App`_ é um excelente exemplo de como utilizar um backend Hoodie. Trata-se de uma aplicação propositalmente simples e bem comentada, desenvolvida apenas com HTML, JavaScript e CSS, sem o uso de qualquer biblioteca ou framework. Você pode conferi-la em funcionamento em https://hoodie-app-tracker.now.sh/

Algum problema?
~~~~~~~~~~~~~~~

Lamentamos que as coisas não tenham corrido bem para você. Venha `conversar com a gente`_ ou `faça uma pergunta no StackOverflow`_

.. _nodejs.org: https://nodejs.org/
.. _npm: https://www.npmjs.com/
.. _chat with us: http://hood.ie/chat/
.. _ask a question on StackOverflow: https://stackoverflow.com/questions/ask?tags=hoodie
.. _Hoodie Tracker App: https://github.com/hoodiehq/hoodie-app-tracker
