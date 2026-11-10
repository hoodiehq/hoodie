Architecture
============

Após instalar o Hoodie, o comando `npm start` executa o arquivo `cli/index.js`, que lê as
configurações de diversas fontes utilizando o pacote `rc` e, em seguida, as repassa como
opções para o `server/index.js` — o principal plugin do hoodie.
No arquivo `server/index.js`, as opções fornecidas são mescladas com as configurações
padrão e processadas para formar a configuração do servidor Hapi. Essa configuração é
então repassada ao `hoodie-server`, que integra os módulos principais do servidor. O
sistema também encaminha o cliente Hoodie na primeira requisição para `/hoodie/client.js`,
passando a configuração necessária para o cliente. Além disso, disponibiliza a pasta pública
da aplicação na rota raiz (`/`) e as interfaces principais (Core UIs) do Hoodie nos caminhos
`/hoodie/admin`, `/hoodie/account` e `/hoodie/store`.
O Hoodie utiliza o CouchDB para persistência de dados. Caso `options.dbUrl` não esteja
definido, ele recorre ao PouchDB. Após a conclusão de todas as configurações, os plugins
internos são inicializados (consulte `server/plugins/index.js`). Definimos plugins simples do
Hapi para registro de logs e para servir os ativos públicos da aplicação e o cliente do
Hoodie. Uma vez concluída a configuração, o servidor é iniciado ao final de `cli/start.js`, e a
URL onde o Hoodie está em execução é exibida no terminal.

Módulos
============

O Hoodie é um servidor construído sobre o hapi, com APIs de frontend para tarefas
relacionadas a contas e lojas. Ele é dividido em vários módulos pequenos, com o objetivo
de reduzir a barreira de entrada para novos colaboradores de código e compartilhar as
responsabilidades de manutenção.
1.Servidor: https://github.com/hoodiehq/hoodie-server#readme
https://david-dm.org/hoodiehq/hoodie-server
A lógica central do servidor do Hoodie como um plugin do hapi. Ela integra os módulos
principais do servidor do Hoodie:
https://github.com/hoodiehq/hoodie-account-server
i.Servidor-conta
https://github.com/hoodiehq/hoodie-account-server#readme
https://travis-ci.org/hoodiehq/hoodie-account-server
https://david-dm.org/hoodiehq/hoodie-account-server
Plugin Hapi que implementa as rotas da API JSON da conta e expõe uma API
correspondente em:
server.plugins.account.api.*.
ii.Store-server
https://github.com/hoodiehq/hoodie-store-server#readme
https://david-dm.org/hoodiehq/hoodie-store-server
Plugin para Hapi que implementa a API de Documentos do CouchDB. Compatível com CouchDB e
PouchDB para persistência.
2. cliente |repositório do cliente| |status de build do cliente| |status de cobertura de testes do cliente|
|status de dependências do cliente| Cliente front-end do Hoodie para o navegador. Ele integra os
módulos principais do cliente Hoodie:
`account-client <https://github.com/hoodiehq/hoodie-account-client>`__, `store-client <https://github.com/hoodiehq/hoodie-store-client>`__,
`connection-status <https://github.com/hoodiehq/hoodie-connection-status>`__
log <https://github.com/hoodiehq/hoodie-log>`__
1. account-client |repositório account-client| |status de build do account-client| |status de cobertura do
account-client| |status de dependência do account-client|
Cliente para o JSON da conta
API <http://docs.accountjsonapi.apiary.io>`__. Ela armazena informações de sessão no cliente e
disponibiliza APIs amigáveis para o front-end para tarefas como criar uma conta de usuário,confirmar,
redefinir senha, alterar informações de perfil ou encerrar a conta.
store-client |repositório store-client| |status de build do store-client | | status de cobertura do
store-client| |status de dependências do store-client|
Cliente de armazenamento para persistência de dados e sincronização offline.
3. status da conexão |status da conexão do repositório| |status da conexão do build| |status da
conexão da cobertura de testes| |status da conexão das dependências|
Biblioteca para navegador destinada a monitorar o status da conexão. Ela emite eventos
``disconnect`` e ``reconnect`` caso o status da solicitação mude e mantém o registro desse status no
cliente.
4. log |registrar repositório| |registrar status da compilação| |registrar status da cobertura| |registrar
status das dependências|
Biblioteca JavaScript para registro de mensagens no console do navegador. Se estiver disponível, ela
utiliza uma estilização CSS para logs do console.
outputs
<https://developer.mozilla.org/en-US/docs/Web/API/Console#Styling_console_output>`__.
5. admin |repositório admin| |status de build admin| |status de dependência admin|
Painel de Administração integrado do Hoodie, desenvolvido com `Ember.js
<http://emberjs.com>`__
1. admin-client |repositório admin-client| |status de build do admin-client| |status de cobertura do
admin-client| |status de dependências do admin-client|
Cliente de administração front-end do Hoodie para o navegador. Utilizado no Dashboard de
Administração, mas também pode ser usado de forma independente para Dashboards de
administração personalizados.

.. |server repository| image:: https://assets-cdn.github.com/images/icons/emoji/octocat.png
   :target: https://github.com/hoodiehq/hoodie-server#readme
.. |server build status| image:: https://travis-ci.org/hoodiehq/hoodie-server.svg?branch=master
   :target: https://travis-ci.org/hoodiehq/hoodie-server
.. |server coverage status| image:: https://coveralls.io/repos/hoodiehq/hoodie-server/badge.svg?branch=master
   :target: https://coveralls.io/r/hoodiehq/hoodie-server?branch=master
.. |server dependency status| image:: https://david-dm.org/hoodiehq/hoodie-server.svg
   :target: https://david-dm.org/hoodiehq/hoodie-server
.. |account-server repository| image:: https://assets-cdn.github.com/images/icons/emoji/octocat.png
   :target: https://github.com/hoodiehq/hoodie-account-server#readme
.. |account-server build status| image:: https://api.travis-ci.org/hoodiehq/hoodie-account-server.svg?branch=master
   :target: https://travis-ci.org/hoodiehq/hoodie-account-server
.. |account-server coverage status| image:: https://coveralls.io/repos/hoodiehq/hoodie-account-server/badge.svg?branch=master
   :target: https://coveralls.io/r/hoodiehq/hoodie-account-server?branch=master
.. |account-server dependency status| image:: https://david-dm.org/hoodiehq/hoodie-account-server.svg
   :target: https://david-dm.org/hoodiehq/hoodie-account-server
.. |store-server repository| image:: https://assets-cdn.github.com/images/icons/emoji/octocat.png
   :target: https://github.com/hoodiehq/hoodie-store-server#readme
.. |store-server build status| image:: https://travis-ci.org/hoodiehq/hoodie-store-server.svg?branch=master
   :target: https://travis-ci.org/hoodiehq/hoodie-store-server
.. |store-server coverage status| image:: https://coveralls.io/repos/hoodiehq/hoodie-store-server/badge.svg?branch=master
   :target: https://coveralls.io/r/hoodiehq/hoodie-store-server?branch=master
.. |store-server dependency status| image:: https://david-dm.org/hoodiehq/hoodie-store-server.svg
   :target: https://david-dm.org/hoodiehq/hoodie-store-server
.. |client repository| image:: https://assets-cdn.github.com/images/icons/emoji/octocat.png
   :target: https://github.com/hoodiehq/hoodie-client#readme
.. |client build status| image:: https://travis-ci.org/hoodiehq/hoodie-client.svg?branch=master
   :target: https://travis-ci.org/hoodiehq/hoodie-client
.. |client coverage status| image:: https://coveralls.io/repos/hoodiehq/hoodie-client/badge.svg?branch=master
   :target: https://coveralls.io/r/hoodiehq/hoodie-client?branch=master
.. |client dependency status| image:: https://david-dm.org/hoodiehq/hoodie-client.svg
   :target: https://david-dm.org/hoodiehq/hoodie-client
.. |account-client repository| image:: https://assets-cdn.github.com/images/icons/emoji/octocat.png
   :target: https://github.com/hoodiehq/hoodie-account-client#readme
.. |account-client build status| image:: https://travis-ci.org/hoodiehq/hoodie-account-client.svg?branch=master
   :target: https://travis-ci.org/hoodiehq/hoodie-account-client
.. |account-client coverage status| image:: https://coveralls.io/repos/hoodiehq/hoodie-account-client/badge.svg?branch=master
   :target: https://coveralls.io/r/hoodiehq/hoodie-account-client?branch=master
.. |account-client dependency status| image:: https://david-dm.org/hoodiehq/hoodie-account-client.svg
   :target: https://david-dm.org/hoodiehq/hoodie-account-client
.. |store-client repository| image:: https://assets-cdn.github.com/images/icons/emoji/octocat.png
   :target: https://github.com/hoodiehq/hoodie-store-client#readme
.. |store-client build status| image:: https://travis-ci.org/hoodiehq/hoodie-store-client.svg?branch=master
   :target: https://travis-ci.org/hoodiehq/hoodie-store-client
.. |store-client coverage status| image:: https://coveralls.io/repos/hoodiehq/hoodie-store-client/badge.svg?branch=master
   :target: https://coveralls.io/r/hoodiehq/hoodie-store-client?branch=master
.. |store-client dependency status| image:: https://david-dm.org/hoodiehq/hoodie-store-client.svg
   :target: https://david-dm.org/hoodiehq/hoodie-store-client
.. |pouchdb-hoodie-api repository| image:: https://assets-cdn.github.com/images/icons/emoji/octocat.png
   :target: https://github.com/hoodiehq/pouchdb-hoodie-api#readme
.. |pouchdb-hoodie-api build status| image:: https://travis-ci.org/hoodiehq/pouchdb-hoodie-api.svg?branch=master
   :target: https://travis-ci.org/hoodiehq/pouchdb-hoodie-api
.. |pouchdb-hoodie-api coverage status| image:: https://coveralls.io/repos/hoodiehq/pouchdb-hoodie-api/badge.svg?branch=master
   :target: https://coveralls.io/r/hoodiehq/pouchdb-hoodie-api?branch=master
.. |pouchdb-hoodie-api dependency status| image:: https://david-dm.org/hoodiehq/pouchdb-hoodie-api.svg
   :target: https://david-dm.org/hoodiehq/pouchdb-hoodie-api
.. |pouchdb-hoodie-sync repository| image:: https://assets-cdn.github.com/images/icons/emoji/octocat.png
   :target: https://github.com/hoodiehq/pouchdb-hoodie-sync#readme
.. |pouchdb-hoodie-sync build status| image:: https://travis-ci.org/hoodiehq/pouchdb-hoodie-sync.svg?branch=master
   :target: https://travis-ci.org/hoodiehq/pouchdb-hoodie-sync
.. |pouchdb-hoodie-sync coverage status| image:: https://coveralls.io/repos/hoodiehq/pouchdb-hoodie-sync/badge.svg?branch=master
   :target: https://coveralls.io/r/hoodiehq/pouchdb-hoodie-sync?branch=master
.. |pouchdb-hoodie-sync dependency status| image:: https://david-dm.org/hoodiehq/pouchdb-hoodie-sync.svg
   :target: https://david-dm.org/hoodiehq/pouchdb-hoodie-sync
.. |connection-status repository| image:: https://assets-cdn.github.com/images/icons/emoji/octocat.png
   :target: https://github.com/hoodiehq/hoodie-connection-status#readme
.. |connection-status build status| image:: https://travis-ci.org/hoodiehq/hoodie-connection-status.svg?branch=master
   :target: https://travis-ci.org/hoodiehq/hoodie-connection-status
.. |connection-status coverage status| image:: https://coveralls.io/repos/hoodiehq/hoodie-connection-status/badge.svg?branch=master
   :target: https://coveralls.io/r/hoodiehq/hoodie-connection-status?branch=master
.. |connection-status dependency status| image:: https://david-dm.org/hoodiehq/hoodie-connection-status.svg
   :target: https://david-dm.org/hoodiehq/hoodie-connection-status
.. |log repository| image:: https://assets-cdn.github.com/images/icons/emoji/octocat.png
   :target: https://github.com/hoodiehq/hoodie-log#readme
.. |log build status| image:: https://travis-ci.org/hoodiehq/hoodie-log.svg?branch=master
   :target: https://travis-ci.org/hoodiehq/hoodie-log
.. |log coverage status| image:: https://coveralls.io/repos/hoodiehq/hoodie-log/badge.svg?branch=master
   :target: https://coveralls.io/r/hoodiehq/hoodie-log?branch=master
.. |log dependency status| image:: https://david-dm.org/hoodiehq/hoodie-log.svg
   :target: https://david-dm.org/hoodiehq/hoodie-log
.. |admin repository| image:: https://assets-cdn.github.com/images/icons/emoji/octocat.png
   :target: https://github.com/hoodiehq/hoodie-admin#readme
.. |admin build status| image:: https://travis-ci.org/hoodiehq/hoodie-admin.svg?branch=master
   :target: https://travis-ci.org/hoodiehq/hoodie-admin
.. |admin dependency status| image:: https://david-dm.org/hoodiehq/hoodie-admin.svg
   :target: https://david-dm.org/hoodiehq/hoodie-admin
.. |admin-client repository| image:: https://assets-cdn.github.com/images/icons/emoji/octocat.png
   :target: https://github.com/hoodiehq/hoodie-admin-client#readme
.. |admin-client build status| image:: https://travis-ci.org/hoodiehq/hoodie-admin-client.svg?branch=master
   :target: https://travis-ci.org/hoodiehq/hoodie-admin-client
.. |admin-client coverage status| image:: https://coveralls.io/repos/hoodiehq/hoodie-admin-client/badge.svg?branch=master
   :target: https://coveralls.io/r/hoodiehq/hoodie-admin-client?branch=master
.. |admin-client dependency status| image:: https://david-dm.org/hoodiehq/hoodie-admin-client.svg
   :target: https://david-dm.org/hoodiehq/hoodie-account-client
