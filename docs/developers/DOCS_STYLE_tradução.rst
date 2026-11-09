Estilo de Documentação
=========================

Este guia oferece orientações de estilo para a elaboração de documentação. Reserve um tempo para lê-lo antes de contribuir com uma alteração ou atualização significativa na documentação.

O estilo ajuda você e o leitor
-------------------------------
A escolha das palavras e o estilo de redação são decisões pessoais, e entendemos que elaborar documentação pode ser uma tarefa difícil. Estas recomendações foram criadas para ajudar você a escrever documentos claros e bem elaborados.

Testando
-------
O `guia de contribuição para a documentação <CONTRIBUTING_DOCS.html>`_ descreve o processo a ser seguido ao atualizar a documentação. Esse processo inclui testes automáticos. Os testes garantem que sua contribuição não contenha erros de digitação, links quebrados ou outros deslizes de estilo. Os testes não servem para criticar sua escrita; nós realmente valorizamos e apreciamos qualquer contribuição. Pedimos um pouco de paciência durante o processo de testes e revisão. Juntos, podemos manter a documentação do Hoodie excelente!

guia
--------------

Please see the helpful `guide <https://docs.openstack.org/contributor-guide/writing-style/general-writing-guidelines.html>`_, disponibilizado pela documentação do OpenStack. Este guia detalha as seguintes diretrizes de estilo:
- Utilize o português padrão 
- Escreva na voz ativa 
- Empregue o tempo verbal presente simples 
- Escreva na segunda pessoa 
- Utilize o modo verbal apropriado 
- Mantenha as frases curtas 
- Evite títulos ambíguos 
- Seja claro e conciso 
- Escreva de forma objetiva 
- Descreva primeiro o caso de uso mais comum - Não atribua características humanas a objetos inanimados 
- Escreva de maneira afirmativa 
- Evite preposições ao final das frases 
- Não utilize em excesso pronomes como *this*, *that*, *these* e *it* 
- Não separe verbos no infinitivo (evite a "cisão do infinitivo")
- Evite a personificação 
- Elimine formalidades desnecessárias 
- Utilize uma terminologia consistente 
- Empregue ferramentas de verificação ortográfica e gramatical


Teste automático
------------------

Os testes que executamos atualmente em pull requests, utilizando o serviço Travis Continuous Integration (CI):

+----------------------------------------------------------------+------------+-----------+------------+
| Style guide                                                    | Tested     | Test type | Package    |
+================================================================+============+===========+============+
| Keep sentences short, concise and readable                     |     ✔      | Warning   |`rousseau`_ |
+----------------------------------------------------------------+------------+-----------+------------+
| Write in the `active`_ voice                                   |     ✔      | Warning   |`rousseau`_ |
+----------------------------------------------------------------+------------+-----------+------------+
| Avoid "Lexical illusion's" – cases where a word is repeated    |     ✔      | Warning   |`rousseau`_ |
+----------------------------------------------------------------+------------+-----------+------------+
| Check for 'So' at the beginning of sentences                   |     ✔      | Warning   |`rousseau`_ |
+----------------------------------------------------------------+------------+-----------+------------+
| Avoid adverbs that can weaken meaning: really, very,           |            |           |            |
| extremely, etc                                                 |     ✔      | Warning   |`rousseau`_ |
+----------------------------------------------------------------+------------+-----------+------------+
| Use the most simple expressions                                |     ✔      | Warning   |`rousseau`_ |
+----------------------------------------------------------------+------------+-----------+------------+
| Avoid using "weasel words": quite, several, mostly etc         |     ✔      | Warning   |`rousseau`_ |
+----------------------------------------------------------------+------------+-----------+------------+
| Leave no space between a sentence and its                      |            |           |            |
| ending punctuation                                             |     ✔      | Warning   |`rousseau`_ |
+----------------------------------------------------------------+------------+-----------+------------+
| Spell checker - we test for common misspelling but please      |            |           |            |
| check technical words                                          |     ✔      | Error     |`common`_   |
+----------------------------------------------------------------+------------+-----------+------------+
| Broken or dead links (excluding redirects)                     |     ✔      | Error     |`awesome`_  |
+----------------------------------------------------------------+------------+-----------+------------+

  .. _active: https://docs.openstack.org/contributor-guide/writing-style/general-writing-guidelines.html#write-in-active-voice
  .. _rousseau: https://github.com/GitbookIO/rousseau
  .. _common: https://github.com/io-monad/textlint-rule-common-misspellings
  .. _awesome: https://github.com/dkhamsing/awesome_bot

- Remember, follow the `Code of Conduct <http://hood.ie/code-of-conduct/>`__

Bonus de estilo
~~~~~~~~~~~~~~~~~~
- Seja descontraído e amigável, desde que isso não distraia nem confunda o leitor. - Inclua vídeos ou GIFs para demonstrar uma funcionalidade. - Você pode usar humor, mas lembre-se de que o leitor está em busca de uma *resposta*, não de um esquete de comédia. - Referências culturais e trocadilhos nem sempre são bem compreendidos em outros idiomas; mantenha as brincadeiras leves. - Lembre-se de que, para muitos leitores, o inglês não é a língua materna; portanto, utilize uma linguagem simples sempre que possível.

.. _second: https://docs.openstack.org/contributor-guide/writing-style/general-writing-guidelines.html#write-in-second-person

Outras leituras
---------------
Esse guia é baseado em: `Open Stack <https://docs.openstack.org/contributor-guide/writing-style/general-writing-guidelines.html#use-standard-english>`_ style guide.
