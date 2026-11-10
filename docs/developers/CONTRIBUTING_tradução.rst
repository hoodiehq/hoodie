Contribuindo
======================
Reserve um momento para analisar este documento, a fim de tornar o processo de contribuição simples e eficaz para todos os envolvidos. Seguir estas diretrizes demonstra que você respeita o tempo dos desenvolvedores que gerenciam e trabalham neste projeto de código aberto. Em contrapartida, espera-se que eles retribuam esse respeito ao tratar sua questão, avaliar alterações e auxiliar na finalização de seus *pull requests*. Assim como todos os outros aspectos do projeto, as contribuições para o Hoodie são regidas pelo nosso `Código de Conduta <http://hood.ie/code-of-conduct/>`__.

issue tracker
-----------------------

Antes de tudo: **NÃO relate vulnerabilidades de segurança em issues públicas!** Por favor, faça uma divulgação responsável informando a `equipe do Hoodie <mailto:team@thehoodiefirm.com?subject=Security>`__ com antecedência. Analisaremos o problema o mais breve possível — dentro de nossas possibilidades — e forneceremos uma estimativa de quando teremos uma correção e uma nova versão disponíveis para uma eventual divulgação pública. O sistema de rastreamento de issues (issue tracker) é o canal preferencial para `relatos de bugs <#bugs>`__, `solicitações de funcionalidades <#features>`__ e `envio de pull requests <#pull-requests>`__. No entanto, pedimos que observe as seguintes restrições: - Por favor, **não** utilize o sistema de rastreamento de issues para pedidos de suporte pessoal. Para isso, utilize o `Hoodie Chat <http://hood.ie/chat/>`__. - Por favor, **não** desvie o foco das discussões nem pratique *trolling* nas issues. Mantenha a conversa dentro do tópico e respeite a opinião dos outros.

Reportando bugs
-----------

Um *bug* é um problema comprovável, causado pelo código presente no repositório. Relatórios de *bug* bem elaborados são extremamente úteis — obrigado! Diretrizes para relatar *bugs*: 1. **Use a busca de *issues* do GitHub** — verifique se o problema já foi relatado. 2. **Verifique se o problema já foi corrigido** — tente reproduzi-lo utilizando a versão mais recente das *branches* `master` ou `next` do repositório. 3. **Isole o problema** — o ideal é criar um caso de teste simplificado (*reduced test case*). Um bom relatório de *bug* não deve exigir que outras pessoas precisem entrar em contato com você solicitando mais informações. Por favor, tente ser o mais detalhado possível em seu relato. Qual é o seu ambiente? Quais passos levam à reprodução do problema? Em qual sistema operacional o problema ocorre? Qual seria o resultado esperado? Todos esses detalhes ajudarão a corrigir eventuais *bugs*. Exemplo: Título do relatório de *bug* (curto e descritivo) Um resumo do problema e o ambiente (navegador/sistema operacional) em que ele ocorre. Se apropriado, inclua os passos necessários para reproduzir o *bug*. 1. Este é o primeiro passo 2. Este é o segundo passo 3. Passos adicionais, etc. ``<url>`` — um link para o caso de teste simplificado Qualquer outra informação relevante para o problema relatado. Isso pode incluir as linhas de código que você identificou como a causa do *bug*, bem como possíveis soluções (e sua opinião sobre elas).

Feature requests
----------------

Sugestões de novas funcionalidades são bem-vindas. No entanto, verifique se a sua ideia está alinhada ao escopo e aos objetivos do projeto. Cabe a *você* apresentar bons argumentos para convencer os desenvolvedores do projeto sobre o mérito dessa funcionalidade. Por favor, forneça o máximo de detalhes e contexto possível.

Pull requests
-------------

Pull requests de qualidade — correções, melhorias, novas funcionalidades — são de grande ajuda. Eles devem manter um escopo bem definido e não incluir commits sem relação com o objetivo principal. **Por favor, consulte a equipe antes** de iniciar um pull request de maior porte (como a implementação de novas funcionalidades ou a refatoração de código); caso contrário, você corre o risco de dedicar muito tempo a um trabalho que os desenvolvedores do projeto talvez não queiram incorporar ao código-fonte.

Para novos contribuidores
~~~~~~~~~~~~~~~~~~~~

Se você nunca criou um *pull request* antes, seja bem-vindo(a)! :tada: :smile: Aqui está um ótimo tutorial <https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github>`__ sobre como enviar um :) 1. Faça um *fork* <http://help.github.com/fork-a-repo/>`__ do projeto, clone o seu *fork* e configure os *remotes* (repositórios remotos) usando a linha de comando: :: # Clone o seu fork do repositório no diretório atual git clone https://github.com/<seu-nome-de-usuario>/<nome-do-repositorio> # Acesse o diretório recém-clonado cd <nome-do-repositorio> # Adicione o repositório original como um remote chamado "upstream" git remote add upstream https://github.com/hoodiehq/<nome-do-repositorio> 2. Se você fez o *clone* há algum tempo, obtenha as alterações mais recentes do *upstream*: :: git checkout master git pull upstream master 3. Crie uma nova *branch* (ramificação) a partir da *branch* principal de desenvolvimento do projeto para conter a sua funcionalidade, alteração ou correção: :: git checkout -b <nome-da-sua-branch> 4. Certifique-se de atualizar ou adicionar testes, quando apropriado. Correções e novas funcionalidades não serão aceitas sem testes. Execute ``npm test`` para verificar se todos os testes passam após as suas alterações. Consulte a seção ``Testing`` (Testes) no arquivo README do projeto para mais informações. 5. Se você adicionou ou alterou uma funcionalidade, certifique-se de documentá-la adequadamente no arquivo ``README.md``. 6. Envie (*push*) a sua *branch* para o seu *fork*: :: git push origin <nome-da-sua-branch> 8. Abra um *Pull Request* <https://help.github.com/articles/using-pull-requests/>`__ com um título e uma descrição claros.

Para membros da equipe de colaboradores do Hoodie ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 

1. Clone o repositório e crie uma branch :: git clone https://github.com/hoodiehq/<nome-do-repositorio> cd <nome-do-repositorio> git checkout -b <nome-da-branch> 2. Certifique-se de atualizar ou adicionar testes, conforme necessário. Correções e novas funcionalidades não serão aceitas sem testes. Execute ``npm test`` para verificar se todos os testes passam após as suas alterações. Consulte a seção ``Testing`` (Testes) no arquivo README do projeto para mais informações. 3. Se você adicionou ou alterou uma funcionalidade, certifique-se de documentá-la adequadamente no arquivo ``README.md``. 4. Envie (push) sua branch para o nosso repositório :: git push origin <nome-da-branch> 5. Abra um Pull Request utilizando a sua branch, incluindo um título e uma descrição claros. Opcionalmente, você pode nos ajudar com os itens abaixo. Mas não se preocupe se parecerem muito complicados; nós podemos te ajudar e ensinar durante o processo :) 1. Atualize sua branch com as alterações mais recentes da branch `master` do repositório original (upstream). Você pode fazer isso localmente com: :: git pull --rebase upstream master Em seguida, realize um *force push* das suas alterações para a sua branch remota. 2. Quando um Pull Request estiver pronto, você pode organizar suas mensagens de commit usando o `interactive rebase <https://help.github.com/articles/interactive-rebase>`__ do Git. Por favor, siga nossas convenções para mensagens de commit (apresentadas abaixo), pois elas são utilizadas pelo `semantic-release <https://github.com/semantic-release/semantic-release>`__ para determinar automaticamente a nova versão e realizar a publicação no npm. Em resumo:

Mensagens de commit
~~~~~~~~~~~~~~~~~~~~~~~~~~

- Envie commits de arquivos de teste com o prefixo ``test: ...`` ou ``test(scope): ...`` - Envie commits de correções de bugs com o prefixo ``fix: ...`` ou ``fix(scope): ...`` - Envie commits que introduzam mudanças incompatíveis (breaking changes) incluindo ``BREAKING CHANGE:`` no corpo do commit (não na linha de assunto) - Envie commits de alterações em ``package.json``, ``.gitignore`` e outros metarquivos utilizando ``chore(nome-do-arquivo-sem-extensao): ...`` - Envie commits de alterações em arquivos README ou comentários utilizando ``docs: ...`` - Envie commits de alterações de estilo de código utilizando ``style: standard`` **IMPORTANTE**: Ao enviar uma contribuição (patch), você concorda em licenciar seu trabalho sob a mesma licença utilizada pelo projeto.

Triagem
------------------ 

Existe um `processo definido <TRIAGING.html>`__ para gerenciar issues (problemas/tarefas), pois isso ajuda a acelerar os lançamentos e minimiza transtornos para os usuários. A triagem é uma excelente forma de contribuir com o Hoodie sem precisar escrever código. Se tiver interesse, por favor, `deixe um comentário aqui <https://github.com/hoodiehq/discussion/issues/50>`__ solicitando a inclusão na equipe de ttriagem.
Mantenedores
--------------------------

Se você possui permissão para realizar commits, siga este processo ao integrar contribuições (patches) e preparar novos lançamentos.

Revisando mudanças
~~~~~~~~~~~~~~~~~

1. Verifique se a alteração está dentro do escopo e da filosofia do componente. 2. Verifique se a alteração inclui os testes necessários. 3. Verifique se a alteração inclui a documentação necessária. 4. Se houver algo de que você não goste, deixe um comentário abaixo das linhas correspondentes e envie uma revisão do tipo "Solicitar alterações" (*Request changes*). Repita o processo até que tudo tenha sido resolvido. 5. Se tiver dúvidas sobre algo, mencione ``@hoodie/maintainers`` ou pessoas específicas em um comentário para obter ajuda. 6. Se restar apenas uma pequena alteração antes de realizar o *merge* e você achar melhor corrigi-la por conta própria, pode fazer um *commit* diretamente no *fork* do autor. Deixe um comentário a respeito para que o autor e outras pessoas fiquem sabendo. 7. Quando tudo estiver correto, envie uma revisão do tipo "Aprovar" (*Approve*). Não se esqueça de dizer algo gentil 👏🐶💖✨ 8. Verifique se as mensagens de *commit* seguem as nossas convenções <@commit-message-conventions>__

9. Se houver uma mudança que quebre a compatibilidade (*breaking change*), certifique-se de que o termo ``BREAKING CHANGE:`` — com *exatamente* essa grafia (incluindo os dois-pontos ":") — esteja presente no corpo da mensagem do commit correspondente. Isso é *muito importante*; é melhor conferir duas vezes! :) 
10. Certifique-se de que existam commits do tipo ``fix: ...`` ou ``feat: ...``, dependendo se um erro foi corrigido ou uma nova funcionalidade foi adicionada. **Atenção:** verifique se não há espaços antes dos prefixos ``fix:`` e ``feat:``; caso existam, eles serão ignorados pelo *semantic-release*. 
11. Utilize o botão "Rebase and merge" para realizar o *merge* do *pull request*. 
12. Pronto! Você é incrível! Muito obrigado pela sua ajuda! 🤗 
13. Caso as mensagens dos commits *não* sigam nossas convenções: 
14. Utilize o botão "Squash and merge" para organizar os commits e realizar o *merge* ao mesmo tempo: ✨🎩 
15. Existe uma mudança que quebra a compatibilidade (*breaking change*)? Descreva-a no corpo do commit. Comece com *exatamente* ``BREAKING CHANGE:``, seguido por uma linha em branco. Para o assunto do commit: 
16. Uma nova funcionalidade foi adicionada? Use o prefixo ``feat: ...`` no assunto do commit. 
17. Um erro foi corrigido? Use ``fix: ...`` no assunto do commit. Às vezes, pode haver um bom motivo para realizar o *merge* das alterações localmente. O processo funciona da seguinte forma:

Revisando e mudanças localmente
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

::

    git checkout master # ou a branch principal configurada no GitHub git pull # obtém as alterações mais recentes git checkout feature-branch # substitua pelo nome da sua branch git rebase master git checkout master git merge feature-branch # substitua pelo nome da sua branch git push Ao realizar o merge de pull requests (PRs) provenientes de repositórios bifurcados (forks), recomendamos a instalação das ferramentas de linha de comando `hub <https://github.com/github/hub>`__. Isso permite que você execute: :: hub checkout link-do-pull-request Dessa forma, a branch referente ao pull request será selecionada (checkout) automaticamente, sem a necessidade de etapas adicionais, como a configuração de upstreams no Git!
:sparkles:
