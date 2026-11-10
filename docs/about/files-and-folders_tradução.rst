Arquivos e pastas
===============

package.json
~~~~~~~~~~~~

package.json ~~~~~~~~~~~~ O arquivo ``package.json`` descreve seu projeto em `JSON
<http://www.json.org/>`_. Ele contém as dependências, os scripts necessários para
executar, utilizar ou desenvolver o projeto, e outras informações descritas na
`documentação do NPM para o package.json
<https://docs.npmjs.com/files/package.json>`_.
O arquivo é criado quando você executa isto:

.. code:: bash
npm init

O sistema solicitará detalhes sobre seus projetos, como nome, versão, descrição, suíte de
testes, autor e licença de software. Preencha essas informações ou deixe para depois; você
sempre poderá editar o arquivo diretamente.
O Hoodie modifica o seu `package.json` durante a instalação para adicionar um script "start"
que inicia o servidor executando `hoodie` sem opções.
Ao adicionar novas dependências, você pode salvar as informações de nome e versão no
``package.json`` usando a flag ``--save``, desta forma:

.. code:: bash
npm install --save <package name>

Isso torna muito fácil para outras pessoas colocarem seu projeto em funcionamento
rapidamente.


README.md
~~~~~~~~~

O arquivo ``README.md`` descreve seu projeto em `Markdown
<https://daringfireball.net/projects/markdown/syntax>`_. Ele se destina à leitura por
humanos e deve incluir informações sobre o que é ou o que faz o seu projeto, como
instalá-lo, usá-lo, testá-lo e contribuir para ele, se for o caso. Para ver um exemplo de
arquivo README, confira o utilizado pelo `Hoodie
<https://github.com/hoodiehq/hoodie/#hoodie>`_ :)

.hoodie/
~~~~~~~~

The ``.hoodie/`` folder contains compiled client assets and database records,
including query indexes. You should never need to modify these files directly.

hoodie/
~~~~~~~

A pasta `hoodie/` contém o código JavaScript que é executado no seu servidor e no
navegador do usuário, bem como o código compartilhado entre eles. O Hoodie utiliza dois
arquivos como pontos de integração (*hooks*) para empacotar o código destinado ao cliente
e ao servidor:
- ``hoodie/client/index.js`` é incluído como um plugin do Hoodie. usando `Browserify <http://browserify.org/>`_, para que possa utilizar ``require()`` para incluir
código de dependências ou de outras pastas. - ``hoodie/server/index.js`` é incluído no
servidor como um `plugin do Hapi <https://hapijs.com/tutorials/plugins>`_. Ele pode definir
novas rotas e outras lógicas do lado do servidor.
O Hoodie não cria uma pasta `hoodie/`, então você precisará criá-la:
.. code:: bash
mkdir hoodie
mkdir hoodie/{client,server}
touch hoodie/{client,server}/index.js
Embora o Hoodie não o trate de maneira especial, você pode usar uma pasta como
`hoodie/lib/` para armazenar código compartilhado entre o cliente e o servidor. Scripts do
cliente e do servidor podem importar (`require()`) código de outras pastas, como
`hoodie/lib/`.
O arquivo `hoodie/client/index.js` exporta um plugin do Hoodie. Um plugin do Hoodie
exporta uma função que aceita um objeto `hoodie` como seu único parâmetro. Esse objeto
contém as interfaces para as APIs de cliente do Hoodie
<http://docs.hood.ie/en/latest/api/client/hoodie.html>`_: `account`, `store`, `connectionStatus`
e `log`.
Você também pode adicionar novos métodos ao objeto 'hoodie', como o método 'hello' neste
exemplo do arquivo `hoodie/client/index.js`:
.. code:: javascript
module.exports = function (hoodie) {
hoodie.hello = function (what) {
return Promise.resolve('Hello, ' + (what || 'world') + '!')
}
}
O `hoodie/server/index.js` exporta um plugin do Hapi, assim:
.. code:: javascript
module.exports.register = function (server, options, next) {
server.route({
method: 'GET',
path: '/hello',
handler: function (request, reply) {
reply({ hello: 'world' })
}
})
next()
}
module.exports.register.attributes = {
name: '<app name>',
version: '<app version>'
} Neste exemplo, a função `register` é usada para adicionar uma rota ao servidor em
``/hoodie/<nome do app>/hello``, a qual responde com um objeto JSON como este: ``{
"hello": "world" }``. Todas as rotas de servidor do seu aplicativo recebem o prefixo
``/hoodie/<nome do app>/``.
O método `register` permite modificar o servidor adicionando rotas e outras lógicas de
servidor. Você pode ler mais sobre como fazer isso no `site do Hapi
<https://hapijs.com/tutorials/plugins>`_. Você pode acessar as bibliotecas do lado do
servidor do Hoodie <http://docs.hood.ie/en/latest/api/index.html#the-hoodie-server-api>`_
por meio de ``server.plugins``.

public/
~~~~~~~

Ao abrir seu aplicativo no navegador, você verá a página padrão do Hoodie informando que
seu aplicativo não possui uma pasta **public/**. Então, vamos criá-la.

.. code:: bash
mkdir public
touch public/index.html

Agora, edite o arquivo **public/index.html** e insira o seguinte conteúdo.

.. code:: html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>My Hoodie App</title>
</head>
<body>
<h1>My Hoodie App</h1>
<script src="/hoodie/client.js"></script>
</body>
</html>

Você precisa parar o servidor agora (**Ctrl** + **C**) e iniciá-lo novamente. Se você
recarregar o aplicativo no navegador, verá agora o seu arquivo HTML.
