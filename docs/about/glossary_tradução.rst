Glossario
========

CouchDB
~~~~~~~

O `CouchDB`_ é um banco de dados não relacional baseado em documentos que oferece suporte à replicação; isso significa que ele é muito eficiente na sincronização de dados entre múltiplas instâncias de si mesmo. Todos os dados são armazenados no formato JSON, todos os índices (consultas) são escritos em JavaScript e ele utiliza o protocolo HTTP padrão como sua API.

PouchDB
~~~~~~~

O `PouchDB`_ é um armazenamento de dados no navegador inspirado no CouchDB. Ele permite que aplicações armazenem dados localmente enquanto estão offline e, posteriormente, os sincronizem com o CouchDB.

hapi
~~~~

O `hapi`_ é um framework robusto para a criação de aplicações e serviços, permitindo que os desenvolvedores foquem na escrita de lógica de aplicação reutilizável, sem perder tempo com a lógica de infraestrutura. É possível `carregar o hoodie como um plugin do hapi`_ para utilizá-lo em sua aplicação hapi já existente.

User
~~~~~

O Hoodie não é um CMS, mas sim um backend para aplicações web e, como tal, é fortemente voltado para o usuário. Todos os recursos de funcionamento offline e sincronização são específicos para os dados de cada usuário individual, sendo que, por padrão, os dados de um usuário permanecem isolados dos dados de todos os outros. Isso permite que o Hoodie saiba facilmente o que deve ser sincronizado entre os clientes de um usuário e o servidor: simplesmente todos os dados privados daquele usuário.

Private User Store
~~~~~~~~~~~~~~~~~~

Cada usuário cadastrado no seu aplicativo Hoodie possui seu próprio pequeno banco de dados privado. Tudo o que você realiza por meio dos métodos **hoodie.store** armazena dados nesse local.

.. _CouchDB: http://couchdb.apache.org/
.. _PouchDB: https://pouchdb.com/
.. _hapi: https://hapijs.com/
.. _load hoodie as a hapi plugin: https://github.com/hoodiehq/hoodie#hapi-plugin
