Hoodie
============

Um backend genérico com uma API de cliente para aplicações Offline First.


O Hoodie permite criar aplicativos sem se preocupar com o backend e garante que eles funcionem perfeitamente, independentemente da conectividade.
Este é o repositório principal do Hoodie. Ele inicia um servidor e disponibiliza a API do cliente. Leia mais sobre como o servidor Hoodie funciona.
Um bom ponto de partida é o nosso Tracker App. Você pode experimentar as APIs do Hoodie no console do navegador e ver como tudo funciona em conjunto, com seu código simples em HTML e JavaScript.
Se você tiver alguma dúvida, venha dar um oi no nosso chat.
Configuração


Esta configuração funciona em todos os sistemas operacionais; foi testada no Windows 8, Windows 8.1, Windows 10, Mac e Linux.
O Hoodie é um pacote Node.js. Você precisa do Node versão 4 ou superior e do npm versão 2 ou superior; verifique a versão instalada com node -v e npm -v.
First, create a folder and a package.json file
Primeiro, crie uma pasta e um arquivo package.json.


mkdir my-app
cd my-app
npm init -y

Em seguida, instale o hoodie e salve-o como dependência. 
npm install --save hoodie

Agora, inicie o seu aplicativo Hoodie.
npm start

Você pode encontrar uma descrição mais detalhada em nosso Guia de Primeiros Passos.

Uso
O Hoodie pode ser utilizado de forma independente ou como um plugin do hapi. As opções são ligeiramente diferentes. Para o uso independente, consulte o guia de configuração do Hoodie. Para o uso como plugin do hapi, consulte o guia de utilização do plugin do hapi para o Hoodie.


Testes
============

Configuração local
git clone https://github.com/hoodiehq/hoodie.git
cd hoodie
npm install

A suíte de testes do Hoodie é executada com npm test. Você pode ler mais sobre como testar o Hoodie.
Você pode iniciar o próprio Hoodie usando npm start. Ele servirá o conteúdo da pasta pública.
Apoiadores
Torne-se um apoiador e mostre seu apoio ao Hoodie

Apoiadores oficiais
============
Mostre seu apoio ao Hoodie e Ajude-nos a manter nossa comunidade inclusiva. Agradecemos publicamente o seu apoio e teremos prazer em divulgar a sua mensagem, desde que esteja de acordo com os nossos princípios. Código de conduta.               
Licença
Apache 2.0
