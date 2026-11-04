Conceitos do Hoodie
=====================================================================

O Hoodie foi concebido com base em alguns princípios e conceitos fundamentais, que explicam grande parte das escolhas feitas no código e na sua funcionalidade. São eles:

-  `Dreamcode <#dreamcode>`__
-  `noBackend <#nobackend>`__
-  `Offline First <#offline-first>`__

Dreamcode
~~~~~~~~~
Ao projetar a API do Hoodie, percebemos que queríamos ir além de simplesmente expor código do servidor para o frontend. **Queríamos reduzir a complexidade, não apenas deslocá-la de um lugar para outro**. E, para criar algo simples e intuitivo, não se deve começar pela pilha tecnológica (tech stack), mas sim pelas pessoas que irão utilizá-la. Como seria a API dos sonhos delas? O conceito de "código dos sonhos" (*dreamcode*) é, essencialmente, um design centrado no usuário aplicado a APIs. Em termos diretos: **a API do Hoodie foi otimizada para ser incrível**. Para ser intuitiva e acessível. E foi otimizada para tornar a vida dos desenvolvedores frontend a melhor possível. Além disso, ela segue a filosofia *API-first*: é uma promessa — todo o resto pode mudar ou ser substituído. A API é o que realmente importa. Esqueça todas as limitações dos navegadores atuais. Em seguida, escreva o código dos seus sonhos para realizar todas as tarefas necessárias à construção do seu aplicativo. A implementação por trás da API não importa; ela pode ser simples ou extremamente complexa, mas, fundamentalmente: os usuários não precisam se preocupar com isso. Isso é o "código dos sonhos". **Tudo é difícil até que alguém torne fácil**. Nós estamos tornando o desenvolvimento de aplicações web algo simples. Aqui estão mais informações e links para exemplos de "código dos sonhos" (*dreamcode*).

Servidores são complexos. Bancos de dados são complexos. A interação entre cliente e servidor é complexa; há muitas partes móveis, muitas oportunidades para cometer erros curiosos e — na nossa visão — **a barreira de entrada para o desenvolvimento de aplicações web é desnecessariamente alta**. Você não deveria precisar ser um desenvolvedor *full stack* para criar um protótipo funcional, programar uma ferramenta simples para uso próprio ou da sua equipe, ou lançar um MVP básico. A criação de aplicações web já existe há bastante tempo, e suas operações fundamentais (cadastro, login, logout, armazenamento e recuperação de dados, etc.) certamente já foram implementadas inúmeras vezes. Essas tarefas não deveriam mais ser um desafio. Por isso, apresentamos o Hoodie como uma solução *noBackend*. Sim, um *backend* existe, mas você não precisa se preocupar com ele. Não é necessário planejar ou configurar nada. Para essas operações básicas, basta utilizar a API de *frontend* do Hoodie. É claro que, se desejar, você pode se aprofundar o quanto quiser, mas, para começar, isso não é necessário. O conceito *noBackend* permite que você foque nos problemas realmente complexos — aqueles aspectos da aplicação que são inerentemente difíceis e não podem ser abstraídos, como a interface e a experiência do usuário; enfim, os elementos que definem a essência do seu produto. Com o Hoodie, você estrutura sua aplicação usando: .. raw:: html <pre><code class="language-bash">$ hoodie new best-app-ever</code></pre> ...e pronto! Você já pode começar: cadastrar usuários, armazenar dados... tudo está disponível imediatamente. É um *backend* pronto para uso, que capacita desenvolvedores *frontend* a criar aplicações completas sem precisar se preocupar com o *backend*. Confira alguns exemplos de aplicações feitas com o Hoodie, caso queira ver o código.


Mais informações noBackend
''''''''''''''''''''''''''''''''

Veja nobackend.org, e @nobackend no
Twitter.

Offline First
~~~~~~~~~~~~~

Criamos sites e aplicativos para a web. O objetivo central é estar online, certo? Nós mesmos estamos online ao desenvolver esses produtos e, geralmente, partimos do pressuposto de que nossos usuários estão em um estado de conectividade permanente. Esse estado, no entanto, é um mito — e essa suposição acaba gerando todo tipo de problema. Com a ascensão meteórica da computação móvel, não podemos mais presumir nada sobre as conexões dos nossos usuários. Assim como tivemos que aprender a aceitar que as telas hoje apresentam os mais variados formatos e tamanhos, **precisamos entender que as conexões podem estar presentes ou ausentes, ser rápidas ou lentas, estáveis ​​ou intermitentes, gratuitas ou caras...** Respondemos ao desafio da imprevisibilidade dos tamanhos de tela com o *Design Responsivo* e a abordagem *Mobile First*; agora, responderemos ao desafio da imprevisibilidade das conexões com o *Offline First*. **O conceito *Offline First* significa: desenvolver aplicativos sem pressupor uma conectividade permanente.** Armazene dados e aplicativos localmente (em cache). Crie interfaces que lidem com o estado offline de forma elegante. Projete interações que não sejam interrompidas caso, por exemplo, o trem em que o usuário está entre em um túnel. Evite assustar os usuários com mensagens de erro de rede ou frustrá-los com dados inacessíveis. **Aplicativos desenvolvidos com a mentalidade *Offline First* são mais rápidos, mais robustos, mais agradáveis ​​de usar e, acima de tudo, mais úteis.**

Mais informações Offline First
''''''''''''''''''''''''''''''''''''

Visite offlinefirst.org, no GitHub

Agora você sabe o quê nos motiva!
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Esperamos que isso tenha te motivado também! Vamos continuar para system
requirements for Hoodie.
