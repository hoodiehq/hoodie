// Store API
// =========
// 
// how should the hoodie.store API look like to feel 
// as natural as possible?

// Current state
// ---------------

hoodie.store.create('task', {title: 'call ma'})
hoodie.store.find('task', 'id345')
hoodie.store.findAll('task')
hoodie.store.update('task', 'id345', {title: 'visit ma'})
hoodie.store.updateAll('task', {done: true})
hoodie.store.destroy('task', 'id345')
hoodie.store.destroyAll('task')

// Suggestion I
// --------------
hoodie.store.add('task', {title: 'call ma'})
hoodie.store.find('task', 'id345')
hoodie.store.findAll('task')
hoodie.store.update('task', 'id345', {title: 'visit ma'})
hoodie.store.updateAll('task', {done: true})
hoodie.store.remove('task', 'id345')
hoodie.store.removeAll('task')