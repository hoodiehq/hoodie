Deploy
==========

Deploy em uma linha
~~~~~~~~~~~~~~~

Depois de criar seu aplicativo Hoodie, provavelmente você desejará colocá-lo online. É possível optar por publicar o aplicativo em modo somente leitura ou incluir também o banco de dados backend (CouchDB). Este `vídeo`_ e o texto abaixo descrevem como publicar seu aplicativo usando apenas uma linha de código. Alternativamente, você pode publicar seu aplicativo utilizando o Docker; consulte a seção sobre Docker.

.. _video: https://youtu.be/29Uclxq_1Vw

Deploy Now
~~~~~~~~~~~~~~~~
.. _command line tool: https://github.com/zeit/now-cli
.. _Hoodie Tracker demo: https://github.com/hoodiehq/hoodie-app-tracker

O `Now` permite que você faça o deploy de uma aplicação Node usando sua `ferramenta de linha de comando`. É 100% gratuito para projetos de código aberto (Open Source). Você pode realizar o deploy de uma aplicação a partir do seu computador ou diretamente de um repositório no GitHub. Por exemplo, para fazer o deploy da nossa aplicação de demonstração `Hoodie Tracker`, basta executar este comando:

.. code:: bash

    $ now hoodiehq/hoodie-app-tracker --npm -e NODE_ENV=production -e hoodie_inMemory=true

To describe this further:

- :code:`hoodiehq/hoodie-app-tracker` é o identificador (slug) do repositório no GitHub.

- :code:`--npm` instrui o :code:`now` a realizar o deploy utilizando o npm, visto que também existe um :code:`Dockerfile` no repositório. - :code:`-e NODE_ENV=production` define a variável de ambiente :code:`NODE_ENV` como :code:`production`, o que torna o deploy mais rápido, já que as :code:`devDependencies` não serão instaladas. 

- :code:`-e hoodie_inMemory=true` faz com que a aplicação Hoodie seja executada em modo *in-memory* (na memória); isso significa que nenhum dado é persistido e nenhum arquivo é gravado. Isso é importante porque o sistema de arquivos do :code:`now` é somente leitura (*read-only*). Consequentemente, todas as contas de usuário e dados serão perdidos no próximo deploy, mas essa configuração é excelente para testes rápidos ou demonstrações da sua aplicação. 

Alternativamente, adicione este script ao seu :code:`package.json` e pronto:

::

    "now-start": "hoodie --inMemory",

.. _Now: https://zeit.co/now

Armazenamento Cloudant
~~~~~~~~~~~~~~~~~~~~~~~~
.. _Cloudant: https://cloudant.com/

O `Cloudant`_ é um DBaaS (banco de dados como serviço). Ele oferece a maioria das APIs do CouchDB e pode ser utilizado como o banco de dados (backend) do Hoodie. Criar uma conta gratuita é rápido e simples. Após o cadastro, será necessário fazer um pequeno ajuste no comando de implantação (`now`) mencionado anteriormente. .. code:: bash $ now hoodiehq/hoodie-app-tracker -e NODE_ENV=production -e hoodie_inMemory=true -e hoodie_dbUrl=https://username:password@username.cloudant.com/ A variável de ambiente :code:`hoodie_inMemory` garante que o Hoodie não tente gravar arquivos, como a biblioteca `/hoodie/client.js` que vem integrada. A variável de ambiente :code:`hoodie_dbUrl` define o endereço e as credenciais de acesso ao seu CouchDB. Substitua `username` e `password` pelos dados que você utilizou no momento do cadastro.

Teste e ddefinição do alias ~~~~~~~~~~~~~~~~~~~~~~ 
Ao realizar a implantação (deploy) com o `now`, você receberá um subdomínio aleatório pelo qual poderá acessar sua aplicação. Ele terá um formato semelhante a `https://hoodie-app-tracker-randomxyz.now.sh/` e já foi copiado para a sua área de transferência durante o processo de implantação. Abra essa URL no seu navegador para testar. Quando tudo estiver funcionando corretamente, você poderá alterar o subdomínio conforme sua preferência, executando o seguinte comando:

.. code:: bash

    $ now alias set hoodie-app-tracker-randomxyz my-tracker-app

Isso tornará seu aplicativo Hoodie Tracker, após a implantação, acessível em https://my-tracker-app.now.sh. Por exemplo, aqui está o aplicativo que eu mesmo implantei: https://hoodie-app-tracker.now.sh/

Docker
~~~~~~

Realizamos a implantação contínua do nosso `Hoodie Tracker App`_ utilizando Docker. Você pode conferir detalhes sobre nossa configuração de implantação contínua em `hoodie-app-tracker/deployment.md`_.

.. _Hoodie Tracker App: https://github.com/hoodiehq/hoodie-app-tracker
.. _hoodie-app-tracker/deployment.md: https://github.com/hoodiehq/hoodie-app-tracker/blob/master/deployment.md


Deploy no linux
~~~~~~~~~~~~~~~~~~~

Por enquanto, este guia é exclusivo para Linux. Tentei implantar o `Hoodie-App-Tracker <https://github.com/hoodiehq/hoodie-app-tracker>`__ como exemplo:

instalaveis
--------------------

1. `Instalar CouchDB <http://linoxide.com/linux-how-to/install-couchdb-futon-ubuntu-1604/>`__ 1.2.0 or later, 1.4.0 or later recommended for performance.
2. `Instalar NodeJS <https://nodejs.org/en/>`__ LTS version or later. This includes npm.
3. `Instalar git <https://www.digitalocean.com/community/tutorials/how-to-install-git-on-ubuntu-16-04>`__.

CouchDB
-------

We assume you set up CouchDB with your gerenciador de pacotes ou seguindo manualmente o `procedimento de instalação`_. Para verificar se o CouchDB está funcionando corretamente, basta executar o seguinte comando, que obterá as informações por meio do `curl`. .. code:: bash $ curl localhost:5984 Se você já utiliza o CouchDB para outras finalidades, recomendamos iniciar uma segunda instância do CouchDB, totalmente separada da original. Veja as instruções abaixo. Neste guia, pressupomos que o seu CouchDB esteja disponível na `porta 5984`_. Crie um usuário administrador no CouchDB chamado **admin**, definindo uma senha forte de sua preferência; para isso, clique em *Fix this* (Corrigir isso) no link `Apache CouchDB-Futon:Overview`_, localizado no canto inferior direito. Utilize **admin** como nome de usuário e lembre-se da senha escolhida. Em seguida, precisamos ajustar alguns pontos na configuração padrão do CouchDB. A maneira mais simples é acessar as configurações e alterar os campos a seguir (clique duas vezes em um valor para entrar no modo de edição):
::

   couchdb -> delayed_commits: false
   couchdb -> max_dbs_open: 1024

.. _installation procedure: http://linoxide.com/linux-how-to/install-couchdb-futon-ubuntu-1604/
.. _port 5984: http://127.0.0.1:5984/
.. _Apache CouchDB-Futon:Overview: http://127.0.0.1:5984/_utils/

Sistema
------

Adicione  :code:`/etc/security/limits.conf`:

::

    hoodie    soft    nofile    768
    hoodie    hard    nofile    1024

Hoodie
------

Criando um novo usuário:

.. code:: bash

    $ sudo useradd --system \
        -m \
        --home /home/hoodie \
        --shell /bin/bash \
        --no-user-group \
        -c "Hoodie Administrator" hoodie


Isso criará um novo usuário e seu diretório pessoal /home/hoodie. Mas, sem uma senha, não é possível ser um usuário. Para definir uma senha, execute:

.. code:: bash

    $ sudo passwd hoodie

Defina uma senha de sua preferência.

**cd** in to that directory.

Para mudar para **hoodie** user:

.. code:: bash

    $ sudo su hoodie

Como usuário hoodie, instale a aplicação:

.. code:: bash

    $ git clone <repo url>

make sure package.json has a valid `name` property.

**cd** into the directory.Run :

.. code:: bash

    $ cd <repo name>

Agora execute:

.. code:: bash

    $ npm install

To run Hoodie as the root:

.. code:: bash

    $ sudo su hoodie

To launch Hoodie now, as root :

.. code:: bash

    $ npm start -- --dbUrl=http://admin:yourpassword@localhost:5984/

Replace :code:`yourpassword` with the password you choose when you created the
admin user above.

That's it. The app should be running by now.
