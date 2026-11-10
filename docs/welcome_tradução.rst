Bem-vindo ao Hoodie!
=================

O Hoodie é um backend para aplicações web com uma API JavaScript para o seu frontend.
Se você adora criar aplicações com HTML, CSS e JavaScript — ou com um framework de
frontend — mas detesta o trabalho de backend, o Hoodie é para você.

A API de frontend do Hoodie confere superpoderes ao seu código, permitindo que você realize tarefas que, normalmente, apenas o backend conseguiria executar (contas de
usuário, e-mails, pagamentos, etc.).

Todo o Hoodie pode ser acessado por meio de um simples de script, assim como o jQuery
ou o lodash:

.. code:: html

   <script src="/hoodie/client.js"></script>

A partir desse ponto, as coisas ganham força muito rapidamente:

.. code:: javascript

    // In your front-end code:
    hoodie.ready.then(function () {
      hoodie.account.signUp({
        username: username,
        password: password
      })
    })

É simples assim cadastrar um novo usuário, por exemplo. Mas, enfim:

**O Hoodie é uma abstração de frontend para um serviço web de backend genérico**. Sendo
assim, ele é agnóstico em relação à sua escolha de framework de frontend. Por exemplo,
você pode usar jQuery na sua aplicação web e o Hoodie para a conexão com o backend,
em vez de usar o `jQuery.ajax` puro. Você também poderia usar React com o Hoodie como
armazenamento de dados — ou, na verdade, qualquer outro framework ou biblioteca de
frontend (é sério).

Open Source
~~~~~~~~~~~

O Hoodie é um projeto de código aberto; portanto, não somos seus proprietários, não
podemos vendê-lo e ele não desaparecerá repentinamente caso sejamos adquiridos. O
código-fonte do Hoodie está disponível no GitHub sob a Licença Apache 2.0.

Como proceder
~~~~~~~~~~~~~~

Você :doc:`pode ler sobre alguns dos conceitos ideológicos por trás do Hoodie
<about/hoodie-concepts>’, como noBackend e Offline First. Eles explicam por que o Hoodie
existe e por que ele tem essa aparência e funcionamento.
Se você tem mais interesse nos detalhes técnicos do Hoodie, confira :doc:`Como o Hoodie
Funciona <about/how-hoodie-works>`. Saiba como o Hoodie gerencia o armazenamento de
dados e a sincronização, e de onde vem o suporte para uso offline.
Quer colocar a mão na massa? Vá direto para o :doc:`guia de início rápido
</guides/quickstart>`!
