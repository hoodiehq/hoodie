module.exports = function () {

  'use strict';

  return {
    results:
    [
      {
        seq     : 2,
        id      : 'todo/abc3',
        changes : [{'rev': '2-123'}],
        doc     : {'_id': 'todo/abc3', '_rev': '2-123', '_deleted': true},
        deleted : true
      },
      {
        seq     : 3,
        id      : 'todo/abc2',
        changes : [{'rev': '1-123'}],
        doc     : {'_id': 'todo/abc2', '_rev': '1-123', 'content': 'remember the milk', 'done': false, 'order': 1, 'type': 'todo'}
      },
      {
        seq     : 4,
        id      : 'prefix/todo/abc4',
        changes : [{'rev': '4-123'}],
        doc     : {'_id': 'prefix/todo/abc4', '_rev': '4-123', 'content': 'I am prefixed yo.', 'done': false, 'order': 2, 'type': 'todo'}
      },
      {
        seq     : 5,
        id      : 'prefix/todo/abc5',
        changes : [{'rev': '5-123'}],
        doc     : {'_id': 'todo/abc5', '_rev': '5-123', 'content': 'deleted, but unknown', 'type': 'todo', '_deleted': true},
        deleted : true
      }
    ],
    last_seq: 20
  };
}
