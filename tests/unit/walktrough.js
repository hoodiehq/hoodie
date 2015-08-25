var Hoodie = global.Hoodie

module.exports = function (test) {
  test('hoodie store & account', function (t) {
    var hoodie = new Hoodie()

    hoodie.account.destroy({ignoreLocalChanges: true})

    .then(function () {
      t.ok(true, 'data cleaned up')

      return hoodie.store.add('test', {id: 'not-signed-in'})
    })

    .then(function (object) {
      t.is(object.id, 'not-signed-in', 'test object created')

      return hoodie.account.signUp('test', 'test')
    })

    .then(function (username) {
      t.is(username, 'test', 'signed up as "test"')

      return hoodie.store.find('test', 'not-signed-in')
    })

    .then(function (object) {
      t.is(object.id, 'not-signed-in', 'object exists after sign up')

      // TODO: signout currently fails because hoodie pushes the local changes to remote
      //       which fails
      return hoodie.account.signOut()
    })

    .then(function () {
      t.ok(true, 'signout successful')

      return hoodie.store.find('test', 'not-signed-in')
    }, t.fail)

    // .catch(function (error) {
    //   t.is(error.name, 'HoodieUnauthorizedError', 'object does not exist after sign out')
    // })

    .then(t.end.bind(t, null), t.end)
  })
}
