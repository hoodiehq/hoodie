## Contribuindo com o Hoodie

Por favor, reserve um momento para revisar este documento a fim de tornar o processo de contribuição fácil e eficaz para todos os envolvidos.

Seguir estas diretrizes ajuda a comunicar que você respeita o tempo dos desenvolvedores que gerenciam e desenvolvem este projeto de código aberto. Em troca, eles devem retribuir esse respeito ao abordar seu problema, avaliar alterações e ajudá-lo a finalizar seus pull requests.

Como tudo o mais no projeto, as contribuições para o Hoodie são regidas pelo nosso [Código de Conduta](http://hood.ie/code-of-conduct/).

## Usando o issue-tracker

Primeiro o mais importante: NÃO reporte vulnerabilidades de segurança em problemas leves públicos! Por favor, divulgue de forma responsável informando [a equipe do Hoodie](mailto:team@thehoodiefirm.com?subject=Security) antecipadamente. Avaliaremos o problema o mais rápido possível, com o melhor esforço possível, e daremos uma estimativa de quando teremos uma correção e um lançamento disponíveis para uma eventual divulgação pública.

O rastreador de problemas leves é o canal preferencial para [relatórios de bugs](#bugs), [solicitações de recursos](#features) e [envio de pull requests](#pull-requests), mas por favor respeite as seguintes restrições:

 Por favor, não use o rastreador de problemas leves para solicitações de suporte pessoal. Use o [Chat do Hoodie](http://hood.ie/chat/).

 Por favor, não atrapalhe ou faça problemas leves enganosos.
Mantenha a discussão no tópico e respeite as opiniões dos outros.

## Relatando bugs

Um bug é um problema demonstrável causado pelo código no repositório.  
Bons relatórios de bugs são extremamente úteis - obrigado!

Diretrizes para relatórios de bugs:

1. Use a busca de problemas leves do GitHub — verifique se o problema já foi relatado.

2. Verifique se o problema já foi corrigido — tente reproduzi-lo usando o branch `master` ou `next` mais recente no repositório.

3. Isole o problema — idealmente, crie um caso de teste reduzido.

Um bom relatório de bug não deve deixar os outros precisando caçá-lo por mais informações. Por favor, tente ser o mais detalhado possível em seu relatório. Qual é o seu ambiente? Quais passos reproduzem o problema? Qual SO experimenta o problema? Qual seria o resultado esperado? Todos esses detalhes ajudarão as pessoas a corrigir possíveis bugs.

Exemplo:

> Título curto e descritivo do relatório de bug  
>  
> Um resumo do problema e do ambiente do navegador/SO em que ocorre. Se adequado, inclua os passos necessários para reproduzir o bug.  
>  
> 1. Este é o primeiro passo  
> 2. Este é o segundo passo  
> 3. Passos adicionais, etc.  
>  
> `<url>` - um link para o caso de teste reduzido  
>  
> Qualquer outra informação que você queira compartilhar que seja relevante para o problema sendo relatado. Isso pode incluir as linhas de código que você identificou como causando o bug e possíveis soluções (e suas opiniões sobre seus méritos).

## Solicitações de recursos

Solicitações de recursos são bem-vindas. Mas reserve um momento para descobrir se sua ideia se encaixa no escopo e nos objetivos do projeto. Cabe a você apresentar um argumento sólido para convencer os desenvolvedores do projeto sobre os méritos desse recurso. Por favor, forneça o máximo de detalhes e contexto possível.

## Pull requests

Bons pull requests - atualizações, melhorias, novos recursos - são uma ajuda fantástica. Eles devem permanecer focados no escopo e evitar conter commits não relacionados.

Por favor, pergunte primeiro antes de embarcar em qualquer pull request significativo (por exemplo, implementar recursos, refatorar código), caso contrário você corre o risco de gastar muito tempo trabalhando em algo que os desenvolvedores do projeto possam não querer mesclar no projeto.

## Para novos colaboradores

Se você nunca criou um pull request antes, bem-vindo 🎉😄 [Aqui está um ótimo tutorial](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github) sobre como criar um pull request.

1. [Faça um fork](http://help.github.com/fork-a-repo/) do projeto, clone seu fork e configure os remotes:

   ```bash
   # Clone seu fork do repositório no diretório atual
   git clone https://github.com/<seu-nome-de-usuario>/<nome-do-repositorio>
   # Navegue até o diretório recém-clonado
   cd <nome-do-repositorio>
   # Atribua o repositório original a um remote chamado "upstream"
   git remote add upstream https://github.com/hoodiehq/<nome-do-repositorio>
   ```

2. Se você clonou há algum tempo, obtenha as alterações mais recentes do upstream:

   ```bash
   git checkout master
   git pull upstream master
   ```

3. Crie um novo branch de tópico (a partir do branch principal de desenvolvimento do projeto) para conter seu recurso, alteração ou correção:

   ```bash
   git checkout -b <nome-do-branch-de-topico>
   ```

4. Certifique-se de atualizar ou adicionar aos testes quando apropriado. Patches e recursos não serão aceitos sem testes. Execute `npm test` para verificar se todos os testes passam após suas alterações. Procure por uma seção `Testing` no README do projeto para mais informações.

5. Se você adicionou ou alterou um recurso, certifique-se de documentá-lo adequadamente no arquivo `README.md`.

6. Envie seu branch de tópico para o seu fork:

   ```bash
   git push origin <nome-do-branch-de-topico>
   ```

7. [Abra um Pull Request](https://help.github.com/articles/using-pull-requests/) com um título e descrição claros.

## Para membros da equipe hoodie

1. Clone o repositório e crie um branch

   ```bash
   git clone https://github.com/hoodiehq/<nome-do-repositorio>
   cd <nome-do-repositorio>
   git checkout -b <nome-do-branch-de-topico>
   ```

2. Certifique-se de atualizar ou adicionar aos testes quando apropriado. Patches e recursos não serão aceitos sem testes. Execute `npm test` para verificar se todos os testes passam após suas alterações. Procure por uma seção `Testing` no README do projeto para mais informações.

3. Se você adicionou ou alterou um recurso, certifique-se de documentá-lo adequadamente no arquivo `README.md`.

4. Envie seu branch de tópico para o nosso repositório

   ```bash
   git push origin <nome-do-branch-de-topico>
   ```

5. Abra um Pull Request usando seu branch com um título e descrição claros.

Opcionalmente, você pode nos ajudar com estas coisas. Mas não se preocupe se forem muito complicadas, podemos ajudá-lo e ensiná-lo à medida que avançamos :)

1. Atualize seu branch com as alterações mais recentes no branch master do upstream. Você pode fazer isso localmente com

   ```bash
   git pull --rebase upstream master
   ```

   Depois, force o push de suas alterações para o seu branch de recurso remoto.

2. Assim que um pull request estiver pronto, você pode organizar suas mensagens de commit usando o [rebase interativo](https://help.github.com/articles/interactive-rebase) do Git.  
   Por favor, siga nossas convenções de mensagem de commit mostradas abaixo, pois elas são usadas pelo [semantic-release](https://github.com/semantic-release/semantic-release) para determinar automaticamente a nova versão e lançar no npm. Em resumo:

## Convenções de mensagens de commits

- Commits de arquivos de teste com prefixo `test: ...` ou `test(escopo): ...`
   - Correções de bugs com prefixo `fix: ...` ou `fix(escopo): ...`
   - Novos recursos com prefixo `feat: ...` ou `feat(escopo): ...`
   - Alterações que quebram a compatibilidade adicionando `BREAKING CHANGE: ` no corpo do commit (não na linha de assunto)
   - Alterações em `package.json`, `.gitignore` e outros arquivos meta com `chore(nomedoarquivosemextensao): ...`
   - Alterações em arquivos README ou comentários com `docs: ...`
   - Alterações de estilo de código com `style: standard`

**IMPORTANTE**: Ao enviar um patch, você concorda em licenciar seu trabalho sob a mesma licença usada pelo projeto.

## Processos de triagem

Existe um [processo definido](docs/developers/TRIAGING.rst) para gerenciar problemas leves, pois isso ajuda a acelerar os lançamentos e minimiza a dor do usuário.  
O triaging é uma ótima forma de contribuir para o Hoodie sem precisar escrever código.  
Se você estiver interessado, por favor [deixe um comentário aqui](https://github.com/hoodiehq/discussion/issues/50) pedindo para se juntar à equipe de triaging.

## Mantenedores

Se você tem acesso de commit, por favor siga este processo para mesclar patches e criar novos lançamentos.

Revisando alterações

1. Verifique se a alteração está dentro do escopo e da filosofia do componente.  
2. Verifique se a alteração tem os testes necessários.  
3. Verifique se a alteração tem a documentação necessária.  
4. Se houver algo de que você não goste, deixe um comentário abaixo das respectivas linhas e envie uma revisão de "Request changes". Repita até que tudo tenha sido resolvido.  
5. Se você não tiver certeza sobre algo, mencione `@hoodie/maintainers` ou pessoas específicas para obter ajuda em um comentário.  
6. Se houver apenas uma pequena alteração restante antes de você poder mesclar e achar melhor corrigir você mesmo, pode commitar diretamente no fork do autor. Deixe um comentário sobre isso para que o autor e outros saibam.  
7. Assim que tudo estiver bom, adicione uma revisão de "Approve". Não se esqueça de dizer algo legal 👏🐶💖✨  
8. Se as mensagens de commit seguirem [nossas convenções](https://conventionalcommits.org)

   1. Se houver uma alteração que quebra a compatibilidade, certifique-se de que `BREAKING CHANGE:` com exatamente essa grafia (incluindo o ":") esteja no corpo da respectiva mensagem de commit. Isso é muito importante, melhor olhar duas vezes :)  
   2. Certifique-se de que haja commits `fix: ...` ou `feat: ...` dependendo se um bug foi corrigido ou um recurso foi adicionado. Atenção: procure por espaços antes dos prefixos de ` fix:` e ` feat:`, estes são ignorados pelo semantic-release.  
   3. Use o botão "Rebase and merge" para mesclar o pull request.  
   4. Pronto! Você é incrível! Muito obrigado pela sua ajuda 🤗

9. Se as mensagens de commit não seguirem nossas convenções

   1. Use o botão "squash and merge" para limpar os commits e mesclar ao mesmo tempo: ✨🎩  
   2. Há uma alteração que quebra a compatibilidade? Descreva-a no corpo do commit. Comece com exatamente `BREAKING CHANGE:` seguido de uma linha em branco. Para o assunto do commit:  
   3. Foi adicionado um novo recurso? Use o prefixo `feat: ...` no assunto do commit  
   4. Foi corrigido um bug? Use `fix: ...` no assunto do commit

Às vezes pode haver um bom motivo para mesclar alterações localmente. O processo é o seguinte:

Revisando e mesclando alterações localmente

```
git checkout master # ou o branch principal configurado no github
git pull # obter as alterações mais recentes
git checkout feature-branch # substitua o nome pelo seu branch
git rebase master
git checkout master
git merge feature-branch # substitua o nome pelo seu branch
git push
```

Ao mesclar PRs de repositórios forked, recomendamos que você instale as [ferramentas de linha de comando hub](https://github.com/github/hub).

Isso permite que você faça:

```
hub checkout link-to-pull-request
```

O que significa que você automaticamente fará o checkout do branch do pull request, sem precisar de nenhum outro passo como configurar git upstreams! ✨
